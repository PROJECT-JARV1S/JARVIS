import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Cpu, User } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
}

interface MCPMessageLogProps {
  messages: Message[];
  onClose: () => void;
}

import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export const MCPMessageLog = ({ messages, onClose }: MCPMessageLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      // Sits right above the prompt bar, full width up to max-5xl
      className="w-full max-w-5xl mb-4 bg-theme-surface-1 backdrop-blur-2xl border border-theme-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto"
      style={{ maxHeight: '400px' }} // "top is the limit" - restricts how tall it can grow
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20">
        <span className="text-[10px] font-mono text-theme-accent uppercase tracking-widest">Uplink_History</span>
        <button 
          onClick={onClose}
          className="text-secondary-txt hover:text-white transition-colors"
          title="Hide History"
        >
          <X size={14} />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id} 
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${msg.sender === 'user' ? 'bg-white/10 text-white' : 'bg-theme-accent/20 text-theme-accent'}`}>
              {msg.sender === 'user' ? <User size={12} /> : <Cpu size={12} />}
            </div>
            
            {/* Message Bubble */}
            <div className={`p-3 rounded-lg text-sm font-mono whitespace-pre-wrap ${
              msg.sender === 'user' 
                ? 'bg-white/5 text-primary-txt rounded-tr-none' 
                : 'bg-theme-accent/10 border border-theme-accent/20 text-theme-accent rounded-tl-none'
            }`}>
              <MarkdownRenderer content={msg.text} theme="online" />
            </div>
          </motion.div>
        ))}
        {/* Invisible div to scroll to */}
        <div ref={bottomRef} />
      </div>
    </motion.div>
  );
};