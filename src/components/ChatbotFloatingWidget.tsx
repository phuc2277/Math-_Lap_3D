import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  RotateCcw,
  Copy,
  Check,
  Brain,
  MessageSquare,
  ChevronDown,
  Minimize2,
  Maximize2,
  Lightbulb,
} from 'lucide-react';
import { AIMathService, AIChatMessage } from '../services/aiMathService';

interface ChatbotFloatingWidgetProps {
  onOpenAIGenerator?: () => void;
}

export const ChatbotFloatingWidget: React.FC<ChatbotFloatingWidgetProps> = ({
  onOpenAIGenerator,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Gemini AI Math Assistant** 🧠.\n\nTôi có thể giải đáp bài toán hình học 2D/3D, chứng minh định lý, tính toán công thức, hướng dẫn dựng hình GeoGebra/GSP hoặc hỗ trợ tạo kịch bản thí nghiệm mới!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    '📐 Công thức thể tích hình nón & hình trụ?',
    '🔺 Chứng minh 2 tam giác đồng dạng',
    '🧊 Cách xác định góc giữa đường thẳng và mặt phẳng',
    '✨ Hướng dẫn tạo thí nghiệm 3D mới',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || loading) return;

    if (textToSend.includes('tạo thí nghiệm') && onOpenAIGenerator) {
      // If user asks about generating experiment, prompt and link
    }

    const userMsg: AIChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await AIMathService.sendChatMessage({
        message: textToSend,
        history: messages,
      });

      if (res.success && res.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply || 'Xin lỗi, không nhận được phản hồi từ AI. Vui lòng thử lại!',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Đã xảy ra lỗi kết nối AI. Vui lòng thử lại sau giây lát!',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span className="tracking-wide">AI Tutor Toán học</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-slate-900 border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
            isExpanded
              ? 'w-[90vw] sm:w-[600px] h-[80vh]'
              : 'w-[92vw] sm:w-[390px] h-[520px]'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">AI Tutor Toán Học</h3>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded">
                    OpenAI / Gemini
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Trợ lý Toán học & Thí nghiệm 3D</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() =>
                  setMessages([
                    {
                      role: 'assistant',
                      content: 'Đã làm mới hội thoại! Bạn cần giải đáp bài toán gì?',
                      timestamp: Date.now(),
                    },
                  ])
                }
                title="Làm mới hội thoại"
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng"
                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Nav to AI Experiment Generator */}
          {onOpenAIGenerator && (
            <div className="px-3.5 py-2 bg-purple-950/40 border-b border-purple-900/40 flex items-center justify-between text-xs">
              <span className="text-[11px] text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Trợ lý Tạo Thí Nghiệm AI:</span>
              </span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAIGenerator();
                }}
                className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all"
              >
                Mở Trình Tạo ➔
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-950/70">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans space-y-1.5">
                      {msg.content.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx}>{para}</p>
                      ))}
                    </div>

                    {!isUser && (
                      <div className="flex items-center justify-end pt-1.5 mt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500">
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2 justify-start items-center">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 animate-pulse">
                  <Brain className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                </div>
                <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl rounded-bl-none p-2.5 text-xs text-indigo-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Gemini đang suy luận...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white shrink-0 transition-colors font-medium border border-slate-700/60"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi Gemini về Toán học, hình học 3D..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shrink-0"
              title="Gửi câu hỏi"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
