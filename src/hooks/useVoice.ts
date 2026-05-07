import { useState, useEffect, useCallback } from 'react';
import * as voiceService from '@/services/voiceService';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state with backend on mount
  useEffect(() => {
    const syncStatus = async () => {
      try {
        const active = await voiceService.getVoiceStatus();
        setIsListening(active);
      } catch (err) {
        console.error("Failed to sync voice status:", err);
      }
    };
    syncStatus();
  }, []);

  // Set up event listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await voiceService.onTranscriptReceived((text) => {
          setTranscript(text);
          setIsListening(false); // Backend stops after completion usually
        });
      } catch (err) {
        console.error("Failed to setup transcript listener:", err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript(null);
    try {
      const success = await voiceService.startVoiceListener();
      if (success) {
        setIsListening(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await voiceService.stopVoiceListener();
      setIsListening(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening
  };
};
