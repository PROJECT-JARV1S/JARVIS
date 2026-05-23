import { invoke } from "@tauri-apps/api/core";
import { ChatResponse, Session, RigMessage } from "@/types/tauri";

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

// Simulated mock responses for web browser testing
const MOCK_ANSWERS = [
  "Core uplink established. All diagnostics report nominal status.",
  "Understood. Initiating telemetry sweeps on connected nodes...",
  "Acknowledged. Routing command through active gateway.",
  "Grid sync protocols established. Waiting for additional instructions.",
  "Diagnostics complete. Thermal output is within optimal thresholds (34°C).",
];

// ─── Chat Prompt ────────────────────────────────────────────────────────────

export const sendPrompt = async (sessionId: string, input: string): Promise<ChatResponse> => {
  if (!isTauri()) {
    console.info("[chatService] Non-Tauri environment, using simulated response.");
    await new Promise(r => setTimeout(r, 800)); // Simulate thinking latency
    const randomAnswer = MOCK_ANSWERS[Math.floor(Math.random() * MOCK_ANSWERS.length)];
    return {
      message: `[SIMULATOR] ${randomAnswer}`,
      provider: "simulator"
    };
  }
  return await invoke<ChatResponse>("prompt", { sessionId, input });
};

// ─── Session Management ─────────────────────────────────────────────────────

export const createSession = async (title?: string): Promise<string> => {
  if (!isTauri()) {
    return "session-simulated-" + Math.random().toString(36).substring(2, 9);
  }
  return await invoke<string>("create_session", { title: title ?? null });
};

export const listSessions = async (): Promise<Session[]> => {
  if (!isTauri()) {
    return [
      { id: "session-1", title: "Simulation Session", created_at: Date.now(), updated_at: Date.now() }
    ];
  }
  return await invoke<Session[]>("list_sessions");
};

export const getHistory = async (sessionId: string): Promise<RigMessage[]> => {
  if (!isTauri()) {
    return [];
  }
  return await invoke<RigMessage[]>("get_history", { sessionId });
};

// ─── Provider Management ────────────────────────────────────────────────────

export const getChatProviders = async (): Promise<string[]> => {
  if (!isTauri()) {
    return ["OpenAI", "Anthropic", "Ollama (Local)"];
  }
  return await invoke<string[]>("get_chat_providers");
};

export const setChatProvider = async (provider: string): Promise<void> => {
  if (!isTauri()) {
    console.log("[chatService] Set provider simulation to:", provider);
    return;
  }
  return await invoke("set_chat_provider", { provider });
};
