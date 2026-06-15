import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import api from '../api/axios';

const AIPanel = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your NovaSync Mentor. I can see your tasks and routines. What should we focus on today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMessage,
        history: messages
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I ran into an issue connecting to the servers." }]);
      }
    } catch (error) {
      console.error("AI Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error while reaching out to your mentor. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile (optional, but good for focus) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm md:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-[110] w-[90%] md:w-[400px] h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-soft flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-soft bg-gradient-to-r from-[#4eb7b3]/10 to-[#3b8ea0]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4eb7b3] to-[#3b8ea0] flex items-center justify-center text-white shadow-sm">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">NovaSync Mentor</h3>
                  <p className="text-xs text-[#3b8ea0] font-medium">Context-Aware AI</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-[#d0f6e3] text-[#3b8ea0]'
                  }`}>
                    {msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 border border-soft text-slate-700 dark:text-slate-200 rounded-tl-sm whitespace-pre-wrap'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#d0f6e3] text-[#3b8ea0]">
                    <Bot size={16} />
                  </div>
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-soft rounded-tl-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3b8ea0] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#3b8ea0] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#3b8ea0] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-soft bg-white dark:bg-slate-900">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask for advice, topics, motivation..."
                  className="w-full py-3 pl-4 pr-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-[#4eb7b3]/50 focus:ring-2 focus:ring-[#4eb7b3]/20 outline-none transition-all text-sm"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 rounded-lg bg-[#4eb7b3] text-white hover:bg-[#3b8ea0] disabled:opacity-50 disabled:hover:bg-[#4eb7b3] transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AIPanel;
