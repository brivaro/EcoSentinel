import React, { useState, useRef, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { getAiResponse } from '../services/geminiService';
import { calculateDewPoint, calculateHeatIndex, getComfortStatus } from '../utils/physics';
import ReactMarkdown from 'react-markdown';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const { state } = useDevice();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: "Hello! I'm **EcoSentinel AI**. I have full access to your Shelly H&T's live telemetry. How can I help you optimize your environment?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    // Prepare enriched context
    const temp = state.temperature || 0;
    const hum = state.humidity || 0;
    const dp = calculateDewPoint(temp, hum);
    const hi = calculateHeatIndex(temp, hum);
    
    const context = {
      telemetry: state,
      derivedMetrics: {
        dewPoint: dp,
        heatIndex: hi,
        comfort: getComfortStatus(temp, hi, dp)
      },
      systemTime: new Date().toISOString()
    };

    const response = await getAiResponse(userMsg, context);

    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <h3 className="font-bold text-lg">EcoSentinel AI</h3>
          </div>
          <button onClick={onClose} className="hover:bg-brand-700 p-1 rounded transition">✕</button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                m.role === 'user' 
                  ? 'bg-brand-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
              }`}>
                <ReactMarkdown 
                  components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                    code: ({node, ...props}) => <code className="bg-black/10 px-1 py-0.5 rounded font-mono text-xs" {...props} />,
                  }}
                >
                  {m.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your device or environment..."
              className="flex-1 bg-white text-slate-800 placeholder-slate-400 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input}
              className="bg-brand-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 transition shadow-md"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChatModal;