import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { TranscriptPayload } from "@/types/tauri";

/**
 * Starts the transcription engine in the backend.
 */
export const startVoiceListener = async (): Promise<boolean> => {
  return await invoke<boolean>("start_voice_listener");
};

/**
 * Stops the current transcription session.
 */
export const stopVoiceListener = async (): Promise<boolean> => {
  return await invoke<boolean>("stop_voice_listener");
};

/**
 * Checks if the transcription engine is active.
 */
export const getVoiceStatus = async (): Promise<boolean> => {
  return await invoke<boolean>("get_voice_status");
};

/**
 * Listens for transcription results from the backend.
 * @param callback Function to call when a transcript is received.
 * @returns An unlisten function to stop listening.
 */
export const onTranscriptReceived = async (
  callback: (transcript: string) => void
): Promise<UnlistenFn> => {
  return await listen<TranscriptPayload>("voice-transcript-received", (event) => {
    callback(event.payload.transcript);
  });
};
