import { useState, useEffect, useCallback } from 'react';
import * as chatService from '@/services/chatService';
import { ChatResponse } from '@/types/tauri';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: number;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const list = await chatService.getChatProviders();
        setProviders(list);
        if (list.length > 0) setActiveProvider(list[0]);
      } catch (err) {
        console.error("Failed to load chat providers:", err);
      }
    };
    loadProviders();
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response: ChatResponse = await chatService.sendPrompt(content);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        provider: response.provider,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProvider = useCallback(async (provider: string) => {
    try {
      await chatService.setChatProvider(provider);
      setActiveProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    providers,
    activeProvider,
    isLoading,
    error,
    sendMessage,
    updateProvider,
    clearHistory
  };
};
