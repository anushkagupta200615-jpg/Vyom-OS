import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, MessageSquare, Send, Languages } from 'lucide-react';
import axios from 'axios';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const SolarChatbot: React.FC<{ currentFluxContext: any }> = ({ currentFluxContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am VyomOS Space Weather Expert. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const suggestions = [
    "What was the strongest flare in 2024?",
    "How does an X-class flare affect GPS?",
    "What ISRO satellites are most at risk now?",
    "Explain the Carrington Event"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const langInstruction = language === 'HI'
      ? 'IMPORTANT: Respond ONLY in formal Hindi (Devanagari script). Preserve technical terms like "X-class flare", "NavIC", "TEC" in English within your Hindi response.'
      : 'Respond in English.';

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat`, {
        message: `${langInstruction}\n\nUser Query: ${text}`,
        current_flux_context: currentFluxContext
      });
      setMessages([...newMessages, { role: 'ai', content: response.data.response }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'ai', content: 'Sorry, I am currently unable to reach mission control.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-transform hover:scale-110 z-50 flex items-center justify-center"
      >
        <AlertCircle className="w-6 h-6 animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-900/90 backdrop-blur-xl border-l border-gray-700 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-400" />
                <h3 className="font-semibold text-white">Solar Weather AI</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Language toggle */}
                <button
                  onClick={() => setLanguage(l => l === 'EN' ? 'HI' : 'EN')}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                    language === 'HI'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'
                  }`}
                >
                  <Languages className="w-3 h-3" />
                  {language === 'EN' ? 'EN → HI' : 'HI ✓'}
                </button>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {language === 'HI' && (
              <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/30 text-xs text-orange-400">
                🇮🇳 हिन्दी मोड सक्रिय — AI अब हिंदी में जवाब देगा
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((m, i) => {
                const renderMessageContent = (content: string) => {
                  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
                  if (thinkingMatch) {
                    const thinkingContent = thinkingMatch[1].trim();
                    const restContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
                    return (
                      <div className="flex flex-col gap-2">
                        <details className="bg-gray-900/50 rounded-lg border border-gray-700/50 overflow-hidden">
                          <summary className="text-xs text-orange-400 font-mono p-2 cursor-pointer hover:bg-gray-800 transition-colors">
                             ⚙️ Spatial Analysis Reasoning (CoT)
                          </summary>
                          <div className="p-3 text-[11px] text-gray-400 font-mono whitespace-pre-wrap border-t border-gray-700/50 bg-black/40">
                            {thinkingContent}
                          </div>
                        </details>
                        <div>{restContent}</div>
                      </div>
                    );
                  }
                  return <div>{content}</div>;
                };

                return (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                    }`}>
                      {renderMessageContent(m.content)}
                      {m.role === 'ai' && i > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700 flex gap-1 flex-wrap">
                          <span className="text-[9px] bg-gray-900 px-1 py-0.5 rounded text-gray-400">[NASA DONKI]</span>
                          <span className="text-[9px] bg-gray-900 px-1 py-0.5 rounded text-gray-400">[ISRO RAG Context]</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 text-gray-400 rounded-xl rounded-bl-none p-3 border border-gray-700 text-sm flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800/50">
              <div className="flex flex-wrap gap-2 mb-3">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(s)}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded-full transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                  placeholder={language === 'HI' ? 'सौर मौसम के बारे में पूछें...' : 'Ask about solar weather...'}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => handleSend(input)}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SolarChatbot;
