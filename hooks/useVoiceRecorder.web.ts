import { useCallback, useRef, useState } from "react";

export type RecordedAudio = { base64: string; mimeType: string };

function pickSupportedMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "audio/webm";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeRef = useRef<string>("audio/webm");
  const stopResolverRef = useRef<((v: RecordedAudio | null) => void) | null>(
    null,
  );

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const requestPermission = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Microphone API not available in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const mime = pickSupportedMime();
    mimeRef.current = mime;
    const rec = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current });
      const resolver = stopResolverRef.current;
      stopResolverRef.current = null;
      cleanup();
      if (!resolver) return;
      try {
        const base64 = await blobToBase64(blob);
        // Normalize to "audio/webm" or "audio/mp4" without the codecs suffix for the backend
        const normalizedMime = mimeRef.current.split(";")[0];
        resolver({ base64, mimeType: normalizedMime });
      } catch (err) {
        console.error("Failed to encode recording:", err);
        resolver(null);
      }
    };
    recorderRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, []);

  const stop = useCallback((): Promise<RecordedAudio | null> => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") {
      cleanup();
      setIsRecording(false);
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      stopResolverRef.current = resolve;
      try {
        rec.stop();
      } catch {
        cleanup();
        resolve(null);
      }
      setIsRecording(false);
    });
  }, []);

  return { isRecording, requestPermission, start, stop };
}
