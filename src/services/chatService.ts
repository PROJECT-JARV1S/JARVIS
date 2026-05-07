import { invoke } from "@tauri-apps/api/core";
import { ChatResponse } from "@/types/tauri";

/**
 * Sends a prompt to the JARVIS chat backend.
 */
export const sendPrompt = async (input: string): Promise<ChatResponse> => {
  return await invoke<ChatResponse>("prompt", { input });
};

/**
 * Gets the list of available LLM providers.
 */
export const getChatProviders = async (): Promise<string[]> => {
  return await invoke<string[]>("get_chat_providers");
};

/**
 * Sets the active LLM provider.
 */
export const setChatProvider = async (provider: string): Promise<void> => {
  return await invoke("set_chat_provider", { provider });
};
