import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Brain,
  Lightbulb,
  Compass,
  Box,
  Layers,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { AIMathService, AIChatMessage } from '../../services/aiMathService';

interface AIMathAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const AIMathAssistantModal: React.FC<AIMathAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Xin chào! Tôi là **MATH LAB AI** (hỗ trợ bởi mô hình **Gemini 3.1 Pro High-Thinking**).\n\nTôi có thể giúp bạn:\n- 📐 **Giải & chứng minh hình học**: Phân tích bài toán hình học 2D/3D từng bước sư phạm rõ ràng.\n- 💡 **Dựng hình GSP & GeoGebra**: Hướng dẫn thao tác vẽ hình động, quỹ tích, phép biến hình.\n- 🧊 **Hình học không gian**: Tính thể tích, diện tích xung quanh, thiết diện, khoảng cách và góc.\n- 📝 **Tạo bài tập & câu hỏi trắc nghiệm**: Luyện tập tư duy Toán học THCS & THPT.\n\nBạn muốn khám phá hoặc giải bài toán nào hôm nay?',
      timestamp: Date.now(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    {
      title: '📐 Dựng tam giác & đường tròn ngoại tiếp',
      prompt: 'Hướng dẫn cách dựng tam giác nhọn ABC và đường tròn ngoại tiếp trên GSP Sketchpad và tính chất tâm đường tròn ngoại tiếp.',
    },
    {
      title: '🧊 Tính góc trong hình không gian',
      prompt: 'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với đáy, SA = a. Hãy hướng dẫn tính góc giữa đường thẳng SC và mặt phẳng (ABCD).',
    },
    {
      title: '💡 Chứng minh tam giác đồng dạng',
      prompt: 'Nêu các trường hợp đồng dạng của hai tam giác (c-c-c, c-g-c, g-g) và ví dụ bài toán thực tế ứng dụng đo chiều cao vật.',
    },
    {
      title: '📊 Khảo sát parabol y = ax²',
      prompt: 'Giải thích tính chất đối xứng và sự biến thiên của đồ thị hàm số y = ax² (a > 0 và a < 0), cách xác định tọa độ đỉnh và trục đối xứng.',
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: AIChatMessage = {
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await AIMathService.sendChatMessage({
        message: query,
        history: messages,
        context: {
          topic: initialTopic || 'Hình học và Toán học Math Lab',
        },
      });

      if (res.success && res.reply) {
        const assistantMsg: AIChatMessage = {
          role: 'assistant',
          content: res.reply,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau giây lát!',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Đã làm mới cuộc hội thoại. Hãy đặt câu hỏi bất kỳ về Toán học!',
        timestamp: Date.now(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-purple-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  MATH LAB AI • TRỢ LÝ TOÁN HỌC CAO CẤP
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <Brain className="w-3 h-3 text-amber-300" />
                  <span>Gemini 3.1 Pro • High Thinking</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Suy luận logic từng bước, giải toán hình học 2D/3D & hướng dẫn dựng hình tương tác
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Làm mới hội thoại"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/60">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {msg.content.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>

                  {!isUser && (
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span>High-Thinking Verified</span>
                      </span>
                      <button
                        onClick={() => handleCopyText(msg.content, idx)}
                        className="hover:text-white flex items-center gap-1 transition-colors"
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

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 font-bold text-xs">
                    Bạn
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 animate-pulse">
                <Brain className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl rounded-bl-none p-3.5 text-xs text-indigo-300 flex items-center gap-3 shadow-lg">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>
                  <strong>Gemini 3.1 Pro</strong> đang kích hoạt <em>High-Thinking Mode</em> để phân tích và suy luận toán học...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Gợi ý:</span>
          </span>
          {quickPrompts.map((item, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 hover:text-white shrink-0 transition-all font-medium flex items-center gap-1.5"
            >
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi hình học, định lý, bài toán cần giải hoặc cách dựng hình..."
              disabled={loading}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-40 transition-all flex items-center gap-2 shrink-0"
            >
              <span>Gửi</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIMathAssistantModal;
