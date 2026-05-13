import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";

export type CameraViewType = any;

type Permission = { granted: boolean; status: "granted" | "denied" | "undetermined"; canAskAgain: boolean } | null;

type CameraHandle = {
  takePictureAsync: (options?: {
    quality?: number;
    base64?: boolean;
  }) => Promise<{ uri: string; width: number; height: number; base64?: string }>;
};

type CameraViewProps = {
  style?: any;
  facing?: "back" | "front";
  children?: React.ReactNode;
  barcodeScannerSettings?: { barcodeTypes?: string[] };
  onBarcodeScanned?: (result: { data: string; type?: string }) => void;
};

export const CameraView = forwardRef<CameraHandle, CameraViewProps>(
  function CameraView(props, ref) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      async function start() {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
          setError("Camera API not available in this browser.");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: props.facing === "front" ? "user" : { ideal: "environment" },
            },
            audio: false,
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play().catch(() => {});
          }
        } catch (e: any) {
          setError(e?.message || "Unable to access camera.");
        }
      }
      start();
      return () => {
        cancelled = true;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };
    }, [props.facing]);

    // QR scanning on web via BarcodeDetector (Chromium-based browsers). Falls
    // back to a jsQR-style lazy-loaded scan via the global if BarcodeDetector
    // is unavailable.
    const onBarcodeScanned = props.onBarcodeScanned;
    const wantsQR =
      !!onBarcodeScanned &&
      (props.barcodeScannerSettings?.barcodeTypes ?? ["qr"]).some(
        (t) => t.toLowerCase() === "qr" || t.toLowerCase() === "qr_code",
      );

    useEffect(() => {
      if (!wantsQR || !onBarcodeScanned) return;
      let cancelled = false;
      let rafId: number | null = null;
      let timerId: number | null = null;
      let detector: any = null;
      let jsQR: any = null;
      const fired = { current: false };

      async function setup() {
        const w: any = typeof window !== "undefined" ? window : {};
        if (w.BarcodeDetector) {
          try {
            detector = new w.BarcodeDetector({ formats: ["qr_code"] });
          } catch {
            detector = null;
          }
        }
        if (!detector) {
          // Lazy-load jsQR from CDN as a fallback. No bundler change required.
          try {
            if (!w.jsQR) {
              await new Promise<void>((resolve, reject) => {
                const tag = document.createElement("script");
                tag.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
                tag.async = true;
                tag.onload = () => resolve();
                tag.onerror = () => reject(new Error("Failed to load QR decoder"));
                document.head.appendChild(tag);
              });
            }
            jsQR = w.jsQR;
          } catch {
            // Give up — no scanning available.
            return;
          }
        }
        tick();
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      async function scanFrame() {
        const video = videoRef.current;
        if (!video || !video.videoWidth || fired.current) return;
        if (detector) {
          try {
            const codes = await detector.detect(video);
            if (codes && codes.length > 0 && !fired.current) {
              fired.current = true;
              onBarcodeScanned?.({ data: codes[0].rawValue, type: "qr" });
            }
          } catch {
            // ignore frame errors
          }
        } else if (jsQR && ctx) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const img = ctx.getImageData(0, 0, w, h);
          const code = jsQR(img.data, w, h);
          if (code && code.data && !fired.current) {
            fired.current = true;
            onBarcodeScanned?.({ data: code.data, type: "qr" });
          }
        }
      }

      function tick() {
        if (cancelled) return;
        scanFrame();
        // ~6 fps is plenty for QR detection and keeps the main thread free.
        timerId = window.setTimeout(() => {
          rafId = window.requestAnimationFrame(tick);
        }, 160);
      }

      setup();

      return () => {
        cancelled = true;
        if (rafId != null) cancelAnimationFrame(rafId);
        if (timerId != null) clearTimeout(timerId);
      };
    }, [wantsQR, onBarcodeScanned]);

    useImperativeHandle(ref, () => ({
      async takePictureAsync(options) {
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
          throw new Error("Camera is not ready.");
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable.");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const quality = Math.max(0, Math.min(1, options?.quality ?? 0.8));
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1] ?? "";
        return {
          uri: dataUrl,
          width: canvas.width,
          height: canvas.height,
          base64: options?.base64 ? base64 : undefined,
        };
      },
    }));

    return (
      <View style={[styles.container, props.style]}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            background: "#000",
          }}
        />
        {error ? (
          <div style={errorOverlay}>
            <div>{error}</div>
          </div>
        ) : null}
        {props.children ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {props.children}
          </View>
        ) : null}
      </View>
    );
  },
);

const errorOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#f9fafb",
  background: "rgba(17,24,39,0.8)",
  padding: 16,
  textAlign: "center",
  fontSize: 14,
};

export function useCameraPermissions(): [
  Permission,
  () => Promise<Permission>,
] {
  const [permission, setPermission] = useState<Permission>(null);

  const check = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      const denied: Permission = { granted: false, status: "denied", canAskAgain: false };
      setPermission(denied);
      return denied;
    }
    // Try the Permissions API first when available
    try {
      // @ts-ignore — camera permission name may not be in lib.dom types
      const result = await navigator.permissions?.query({ name: "camera" });
      if (result) {
        const status =
          result.state === "granted"
            ? "granted"
            : result.state === "denied"
              ? "denied"
              : "undetermined";
        const next: Permission = {
          granted: status === "granted",
          status,
          canAskAgain: status !== "denied",
        };
        setPermission(next);
        if (status !== "undetermined") return next;
      }
    } catch {
      // Ignore — fall through to getUserMedia probe
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      const granted: Permission = { granted: true, status: "granted", canAskAgain: true };
      setPermission(granted);
      return granted;
    } catch {
      const denied: Permission = { granted: false, status: "denied", canAskAgain: true };
      setPermission(denied);
      return denied;
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return [permission, check];
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
});
