export interface ChatResponse {
  message: string;
  provider: string;
}

export interface TranscriptPayload {
  transcript: string;
}

export interface VoiceStatus {
  isActive: boolean;
}
