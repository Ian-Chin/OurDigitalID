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
