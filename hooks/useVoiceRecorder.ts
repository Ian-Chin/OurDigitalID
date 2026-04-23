import { useCallback, useState } from "react";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

export type RecordedAudio = { base64: string; mimeType: string };

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const requestPermission = useCallback(async () => {
    const perm = await AudioModule.requestRecordingPermissionsAsync();
    return perm.granted;
  }, []);

  const start = useCallback(async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  }, [recorder]);

  const stop = useCallback(async (): Promise<RecordedAudio | null> => {
    try {
      await recorder.stop();
    } catch (err) {
      console.warn("Failed to stop recorder:", err);
    }
    setIsRecording(false);
    const uri = recorder.uri;
    if (!uri) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { base64, mimeType: "audio/mp4" };
  }, [recorder]);

  return { isRecording, requestPermission, start, stop };
}
