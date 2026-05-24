import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, X, Mic, Terminal } from 'lucide-react';
import { MCPMessageLog, Message } from './MCPMessageLog'; 
import { useVoice } from '@/context/VoiceContext'; 
import { NeuralCore } from '@/features/mcp/components/NeuralCore';
import { sendPrompt, createSession } from '@/services/chatService';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';

// ─── Voice Waveform Visualizer (Online Theme Matcher) ──────────────────────
const VoiceWaveform = ({ volume }: { volume: number }) => {
  const barCount = 16;
  const normalizedVol = Math.min(100, Math.max(0, volume));

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.8 }}
      className="flex items-center gap-[2px] h-8 px-2"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Create a wave pattern that's taller in the center
        const centerWeight = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
        const randomFactor = 0.4 + Math.random() * 0.6;
        const height = Math.max(3, (normalizedVol / 100) * 24 * centerWeight * randomFactor);

        return (
          <motion.div
            key={i}
            animate={{ height }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className="w-[2px] rounded-full bg-theme-accent/80"
          />
        );
      })}
    </motion.div>
  );
};

export const MCPTerminal = () => {
  const { status, transcript, startListening, stopListening, setStatus } = useVoice(); 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use a ref to track if we've already sent the current transcript
  const lastProcessedTranscript = useRef('');

  // 🏛️ 1. AUTOMATIC SEND LOGIC
  // When the transcriber finishes (transcript arrives), if we're open, send it.
  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript.current) {
      setInput(transcript);
      lastProcessedTranscript.current = transcript;
      handleSend(transcript);
    }
  }, [transcript]);

  // 🏛️ 2. VOICE ACTIVATION TRIGGER
  useEffect(() => {
    if (status === 'LISTENING') {
      setIsOpen(true);
    }
  }, [status]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend) return;
    
    // Add User Message
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: textToSend }]);
    
    // RESET INPUT
    setInput('');
    setShowHistory(true);
    setStatus('THINKING');
    
    // Ensure voice is stopped
    if (status === 'LISTENING') stopListening();

    try {
      // Ensure we have a session, create one on-the-fly if needed
      let sid = sessionId;
      if (!sid) {
        sid = await createSession("MCP Terminal");
        setSessionId(sid);
      }
      const response = await sendPrompt(sid, textToSend);
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'jarvis', 
        text: response.message 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'jarvis', 
        text: `Error: ${err}` 
      }]);
    } finally {
      setStatus('IDLE');
    }
  };

  const frequency = useNeuralFrequency(status === 'LISTENING');
  const scale = 1 + (frequency / 100) * 0.6; // Scale factor for voice rings

  return (
    <>
      <div className="fixed bottom-12 left-0 right-0 z-[100] flex flex-col items-center justify-end px-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div 
              key="prompt-wrapper" 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-5xl flex flex-col items-center pointer-events-none"
            >
              
              <AnimatePresence>
                {showHistory && messages.length > 0 && (
                  <MCPMessageLog messages={messages} onClose={() => setShowHistory(false)} />
                )}
              </AnimatePresence>

              <div className="w-full flex flex-col items-center pointer-events-auto">
                <div className={`w-full transition-all duration-500 bg-theme-surface-1 backdrop-blur-3xl border rounded-full p-2 flex items-center
                  ${status === 'LISTENING' ? 'border-theme-accent shadow-[0_0_30px_rgba(var(--theme-accent-rgb),0.2)]' : 
                    status === 'THINKING' ? 'border-success-green animate-pulse shadow-[0_0_20px_rgba(0,255,102,0.1)]' :
                    'border-theme-border'}
                `}>
                  
                  {/* MINIMIZE */}
                  <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary-txt ml-1">
                    <ChevronLeft size={20} />
                  </button>

                  <span className={`${status === 'THINKING' ? 'text-success-green' : 'text-theme-accent'} font-mono font-bold mx-3`}>{'>'}</span>
                  
                  <AnimatePresence mode="wait">
                    {status === 'LISTENING' ? (
                      <motion.div
                        key="listening-waveform"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 flex items-center gap-3 h-10"
                      >
                        <span className="text-[11px] font-mono text-theme-accent uppercase tracking-[0.2em] animate-pulse">
                          Listening
                        </span>
                        <VoiceWaveform volume={frequency} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="input-box"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex-1"
                      >
                        <input
                          autoFocus
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder={
                            status === 'THINKING' ? "JARVIS is thinking..." : 
                            "Initialize command..."
                          }
                          disabled={status === 'THINKING'}
                          className="w-full bg-transparent border-none focus:outline-none text-primary-txt font-mono text-sm placeholder:text-primary-txt/20 disabled:opacity-50"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* VOICE TOGGLE & SEND */}
                  <div className="flex items-center gap-2 pr-1">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          if (status === 'IDLE') startListening();
                          else stopListening();
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative z-[120]
                          ${status !== 'IDLE' ? 'bg-theme-accent text-black shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.4)]' : 'hover:bg-white/10 text-secondary-txt'}
                        `}
                      >
                        {status !== 'IDLE' ? <X size={18} /> : <Mic size={18} />}
                      </button>

                      {status === 'LISTENING' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[110]">
                          <motion.div
                            animate={{ scale: scale, opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 0.1 }}
                            className="absolute w-12 h-12 rounded-full border border-theme-accent/60 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.3)]"
                          />
                          <motion.div
                            animate={{ scale: scale * 1.35, rotate: 360 }}
                            transition={{ rotate: { repeat: Infinity, duration: 12, ease: "linear" }, scale: { duration: 0.1 } }}
                            className="absolute w-12 h-12 rounded-full border border-dashed border-theme-accent/40"
                          />
                          <motion.div
                            animate={{ scale: scale * 1.7, opacity: [0.15, 0.3, 0.15] }}
                            transition={{ duration: 0.1 }}
                            className="absolute w-12 h-12 rounded-full border border-dotted border-theme-accent/20"
                          />
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleSend()}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-theme-accent/10 border border-theme-accent/30 text-theme-accent hover:bg-theme-accent hover:text-black transition-all"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* TRIGGER */
            <div className="w-full flex justify-end pointer-events-none">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-theme-surface-1 backdrop-blur-xl border border-theme-accent/50 text-theme-accent shadow-lg relative pointer-events-auto"
              >
                {status === 'IDLE' ? <Terminal size={22} /> : <div className="scale-50"><NeuralCore /></div>}
                <div className="absolute inset-0 rounded-full border border-theme-accent animate-ping opacity-30" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};