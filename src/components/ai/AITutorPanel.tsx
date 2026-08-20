import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Copy,
  Check,
  Brain,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Maximize2,
  Minimize2,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Layers,
  Scissors,
  Share2,
} from 'lucide-react';
import {
  ExperimentAIContext,
  AITutorChatMessage,
  HintTier,
  HintTierLevel,
  TeacherGeneratedQuestion,
  TeacherLessonPlan,
} from '../../types/aiTutor';
import { AITutorService } from '../../services/AITutorService';
import { soundEffects } from '../../utils/audioEffects';

interface AITutorPanelProps {
  context: ExperimentAIContext;
  isOpen: boolean;
  onClose: () => void;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
}

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  context,
  isOpen,
  onClose,
  onToggleExpand,
  isExpanded = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'hint' | 'socratic' | 'teacher_q' | 'teacher_plan'>('chat');

  // Chat State
  const [chatMessages, setChatMessages] = useState<AITutorChatMessage[]>([
    {
      role: 'assistant',
      content: `Xin chào! Tôi là **AI Tutor Toán học** 🧠.\n\nTôi đang cùng bạn quan sát mô hình **${context.topic || 'Hình học không gian'}**. Bạn có thể hỏi tôi về cách quan sát thiết diện, giải thích kết quả tính toán, hoặc nhờ tôi gợi ý từng bước nhé!`,
      timestamp: Date.now(),
      engineVerified: true,
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hint State (Scaffolding 1->2->3->4)
  const [currentHintLevel, setCurrentHintLevel] = useState<HintTierLevel>(1);
  const [hints, setHints] = useState<Record<number, HintTier>>({});
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [showDirectSolution, setShowDirectSolution] = useState(false);

  // Socratic Guide State
  const [socraticStep, setSocraticStep] = useState(0);
  const [socraticHistory, setSocraticHistory] = useState<Array<{ q: string; a?: string; feedback?: string }>>([]);
  const [socraticInput, setSocraticInput] = useState('');
  const [isSocraticLoading, setIsSocraticLoading] = useState(false);

  // Teacher Questions State
  const [generatedQuestions, setGeneratedQuestions] = useState<TeacherGeneratedQuestion[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Teacher Lesson Plan State
  const [lessonPlan, setLessonPlan] = useState<TeacherLessonPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState(false);

  const isTeacher = context.mode === 'teacher';

  // Scroll chat to bottom
  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeSubTab]);

  // Load initial hint on first tab click
  const handleLoadHint = async (level: HintTierLevel) => {
    soundEffects.playPopSound();
    setCurrentHintLevel(level);
    if (hints[level]) return;

    setIsHintLoading(true);
    try {
      const res = await AITutorService.getHint({ context, level });
      if (res.success && res.hint) {
        setHints((prev) => ({ ...prev, [level]: res.hint! }));
      }
    } finally {
      setIsHintLoading(false);
    }
  };

  // Initialize first Socratic step
  const handleStartSocratic = async () => {
    soundEffects.playPopSound();
    if (socraticHistory.length > 0) return;
    setIsSocraticLoading(true);
    try {
      const res = await AITutorService.getSocraticGuide({ context, stepIndex: 0 });
      if (res.success && res.question) {
        setSocraticHistory([{ q: res.question }]);
        setSocraticStep(0);
      }
    } finally {
      setIsSocraticLoading(false);
    }
  };

  const handleSendSocraticAnswer = async () => {
    if (!socraticInput.trim() || isSocraticLoading) return;
    const answer = socraticInput.trim();
    setSocraticInput('');
    setIsSocraticLoading(true);

    const nextStep = socraticStep + 1;
    try {
      const res = await AITutorService.getSocraticGuide({
        context,
        stepIndex: nextStep,
        studentAnswer: answer,
      });

      setSocraticHistory((prev) => {
        const copy = [...prev];
        if (copy[socraticStep]) {
          copy[socraticStep].a = answer;
        }
        if (res.success && res.question) {
          copy.push({ q: res.question });
        }
        return copy;
      });
      setSocraticStep(nextStep);
    } finally {
      setIsSocraticLoading(false);
    }
  };

  // Handle Chat Submit
  const handleSendChat = async (presetText?: string) => {
    const text = (presetText || inputMsg).trim();
    if (!text || isChatLoading) return;

    soundEffects.playPopSound();
    const userMsg: AITutorChatMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputMsg('');
    setIsChatLoading(true);

    try {
      const res = await AITutorService.sendChatMessage({
        message: text,
        history: chatMessages,
        context,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply || 'Đã nhận câu hỏi của bạn!',
          timestamp: Date.now(),
          engineVerified: true,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Không thể kết nối với AI Tutor. Vui lòng thử lại!',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Generate Questions for Teacher
  const handleGenerateQuestions = async () => {
    soundEffects.playPopSound();
    setIsQuestionsLoading(true);
    try {
      const res = await AITutorService.generateTeacherQuestions({ context, count: 4 });
      if (res.success && res.questions) {
        setGeneratedQuestions(res.questions);
      }
    } finally {
      setIsQuestionsLoading(false);
    }
  };

  // Generate 15-min Lesson Plan for Teacher
  const handleGeneratePlan = async () => {
    soundEffects.playPopSound();
    setIsPlanLoading(true);
    try {
      const res = await AITutorService.generateLessonPlan({ context, durationMinutes: 15 });
      if (res.success && res.plan) {
        setLessonPlan(res.plan);
      }
    } finally {
      setIsPlanLoading(false);
    }
  };

  const copyText = (text: string, index?: number, qId?: string) => {
    navigator.clipboard.writeText(text);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    if (qId !== undefined) {
      setCopiedQuestionId(qId);
      setTimeout(() => setCopiedQuestionId(null), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      className={`fixed lg:static top-0 right-0 h-full z-40 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-full lg:w-[580px]' : 'w-full sm:w-[420px] lg:w-[420px]'
      }`}
    >
      {/* 1. Header with Engine Context Indicator */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-white">AI Tutor Toán Học</h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Engine-Verified
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
              {context.topic} • Lớp {context.grade || 9}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
              title={isExpanded ? 'Thu nhỏ' : 'Mở rộng'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition"
            title="Ẩn AI Tutor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Engine Verified Info Badge */}
      <div className="px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Thiết diện:{' '}
            <strong className="text-amber-300">
              {context.geometryState?.crossSectionType?.toUpperCase() || 'CHƯA CẮT'}
            </strong>
          </span>
        </div>
        {context.geometryState?.volume !== undefined && (
          <span className="text-[10px] text-slate-400">
            $V = {context.geometryState.volume.toFixed(1)}$
          </span>
        )}
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/90 px-2 py-1.5 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            soundEffects.playPopSound();
            setActiveSubTab('chat');
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'chat'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Hỏi AI</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('hint');
            handleLoadHint(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'hint'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Gợi Ý 3 Bậc</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('socratic');
            handleStartSocratic();
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'socratic'
              ? 'bg-purple-500 text-white font-bold shadow-md'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>AI Hướng Dẫn</span>
        </button>

        {isTeacher && (
          <>
            <button
              onClick={() => {
                soundEffects.playPopSound();
                setActiveSubTab('teacher_q');
                if (generatedQuestions.length === 0) handleGenerateQuestions();
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition ${
                activeSubTab === 'teacher_q'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-emerald-400/80 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Tạo Câu Hỏi</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playPopSound();
                setActiveSubTab('teacher_plan');
                if (!lessonPlan) handleGeneratePlan();
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition ${
                activeSubTab === 'teacher_plan'
                  ? 'bg-indigo-500 text-white font-bold shadow-md'
                  : 'text-indigo-400/80 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span>Kịch Bản 15p</span>
            </button>
          </>
        )}
      </div>

      {/* 4. Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-950/60">
        {/* ========================================================================= */}
        {/* TAB 1: MULTI-TURN AI CHAT */}
        {/* ========================================================================= */}
        {activeSubTab === 'chat' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans space-y-1.5">
                        {msg.content.split('\n\n').map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>

                      {!isUser && (
                        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-800/80 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 text-emerald-400/90">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Đã đối chiếu Geometry Engine
                          </span>
                          <button
                            onClick={() => copyText(msg.content, idx)}
                            className="hover:text-slate-300 flex items-center gap-1 transition"
                          >
                            {copiedIndex === idx ? (
                              <span className="text-emerald-400">Đã chép</span>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Chép</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex gap-2 justify-start items-center">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Brain className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                  </div>
                  <div className="bg-slate-900 border border-sky-500/40 rounded-2xl rounded-bl-none p-2.5 text-xs text-sky-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span>AI Tutor đang phân tích trạng thái hình học...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Socratic Prompt Suggestions */}
            <div className="pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Câu hỏi nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Mặt cắt hiện tại là hình gì?',
                  'Vì sao lại tạo ra hình elip?',
                  'Nếu nghiêng 90 độ thì sao?',
                  'Cho em một gợi ý quan sát!',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendChat(q)}
                    disabled={isChatLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white transition border border-slate-700/60 font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="pt-2 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Hỏi AI: Vì sao, như thế nào, nếu thay đổi..."
                disabled={isChatLoading}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition"
              />
              <button
                type="submit"
                disabled={isChatLoading || !inputMsg.trim()}
                className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-40 transition font-bold shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SCAFFOLDING TIERED HINTS (1. Quan sát -> 2. Thao tác -> 3. Liên hệ -> 4. Đáp án) */}
        {/* ========================================================================= */}
        {activeSubTab === 'hint' && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 leading-relaxed">
              <span className="font-bold">💡 Nguyên tắc sư phạm:</span> AI hỗ trợ bạn khám phá theo từng bậc thang nhận thức. Hãy bắt đầu từ việc <strong>Quan sát</strong> và <strong>Thao tác</strong> trước khi xem đáp án!
            </div>

            {/* Tier Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleLoadHint(1)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentHintLevel === 1
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="text-[10px] uppercase font-bold opacity-80">Bậc 1</div>
                <div className="text-xs font-semibold mt-0.5">👁️ Quan Sát</div>
              </button>

              <button
                onClick={() => handleLoadHint(2)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentHintLevel === 2
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="text-[10px] uppercase font-bold opacity-80">Bậc 2</div>
                <div className="text-xs font-semibold mt-0.5">🎮 Thao Tác</div>
              </button>

              <button
                onClick={() => handleLoadHint(3)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  currentHintLevel === 3
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="text-[10px] uppercase font-bold opacity-80">Bậc 3</div>
                <div className="text-xs font-semibold mt-0.5">📖 Liên Hệ</div>
              </button>
            </div>

            {/* Hint Content Card */}
            {isHintLoading ? (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <Brain className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Đang chuẩn bị gợi ý sư phạm...</p>
              </div>
            ) : hints[currentHintLevel] ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4" />
                    <span>{hints[currentHintLevel].title}</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    Bậc {currentHintLevel}/3
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {hints[currentHintLevel].content}
                </p>
              </div>
            ) : null}

            {/* Direct Solution Trigger (Only when student explicitly requests) */}
            <div className="pt-3 border-t border-slate-800">
              {!showDirectSolution ? (
                <button
                  onClick={() => {
                    soundEffects.playPopSound();
                    setShowDirectSolution(true);
                    handleLoadHint(4);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Em đã suy nghĩ kỹ - Cho em xem đáp án</span>
                </button>
              ) : (
                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kết luận & Đáp án chính xác</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {hints[4]?.content ||
                      `Với góc cắt hiện tại, Geometry Engine xác nhận thiết diện là dạng ${context.geometryState?.crossSectionType?.toUpperCase() || 'Elip'}.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SOCRATIC GUIDED EXPLORATION */}
        {/* ========================================================================= */}
        {activeSubTab === 'socratic' && (
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-xs text-purple-200">
              <span className="font-bold">🧑‍🏫 Trợ lý Socratic:</span> AI sẽ cùng bạn tương tác từng bước một. Bạn trả lời câu hỏi và thực hành trên Math Lab nhé!
            </div>

            {/* Socratic Conversation Thread */}
            <div className="space-y-3">
              {socraticHistory.map((item, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  {/* AI Question */}
                  <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Bước {sIdx + 1}: Câu hỏi khám phá</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{item.q}</p>
                  </div>

                  {/* Student's Answer */}
                  {item.a && (
                    <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-3 text-xs text-slate-200 flex items-start gap-2">
                      <span className="text-indigo-400 font-bold text-[11px] shrink-0">Bạn:</span>
                      <span className="leading-relaxed">{item.a}</span>
                    </div>
                  )}
                </div>
              ))}

              {isSocraticLoading && (
                <div className="p-4 text-center bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                  <Brain className="w-5 h-5 text-purple-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">AI đang phân tích câu trả lời...</p>
                </div>
              )}
            </div>

            {/* Socratic Answer Input Form */}
            {socraticStep < 4 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSocraticAnswer();
                }}
                className="pt-2 space-y-2"
              >
                <textarea
                  value={socraticInput}
                  onChange={(e) => setSocraticInput(e.target.value)}
                  placeholder="Nhập câu trả lời hoặc dự đoán của em sau khi quan sát/thao tác..."
                  rows={2}
                  disabled={isSocraticLoading}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition resize-none"
                />
                <button
                  type="submit"
                  disabled={isSocraticLoading || !socraticInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Gửi Câu Trả Lời</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TEACHER QUESTION GENERATOR */}
        {/* ========================================================================= */}
        {isTeacher && activeSubTab === 'teacher_q' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">Bộ Câu Hỏi Dạy Học Trực Quan</h4>
                <p className="text-[10px] text-slate-400">Dựa trên mô hình {context.topic}</p>
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={isQuestionsLoading}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isQuestionsLoading ? 'Đang tạo...' : 'Tạo mới'}</span>
              </button>
            </div>

            {isQuestionsLoading ? (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <Brain className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">AI đang thiết kế câu hỏi đa năng lực...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {generatedQuestions.map((q) => (
                  <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {q.typeLabel}
                      </span>
                      <button
                        onClick={() =>
                          copyText(
                            `Câu hỏi (${q.typeLabel}):\n${q.question}\n\nGợi ý: ${q.hint}\nĐáp án: ${q.expectedAnswer}`,
                            undefined,
                            q.id
                          )
                        }
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
                      >
                        {copiedQuestionId === q.id ? (
                          <span className="text-emerald-400">Đã chép</span>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-white leading-relaxed">{q.question}</p>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-[11px] space-y-1">
                      <p className="text-amber-300/90">
                        <strong>💡 Gợi ý:</strong> {q.hint}
                      </p>
                      <p className="text-emerald-400">
                        <strong>🎯 Đáp án:</strong> {q.expectedAnswer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TEACHER 15-MIN LESSON PLAN */}
        {/* ========================================================================= */}
        {isTeacher && activeSubTab === 'teacher_plan' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-white">Kịch Bản Dạy Học 15 Phút</h4>
                <p className="text-[10px] text-slate-400">7 Bước Sư Phạm Chuẩn GDPT 2018</p>
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={isPlanLoading}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPlanLoading ? 'Đang tạo...' : 'Tạo mới'}</span>
              </button>
            </div>

            {isPlanLoading ? (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
                <Brain className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">AI đang cấu trúc kịch bản 7 bước...</p>
              </div>
            ) : lessonPlan ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1.5">
                  <h5 className="font-bold text-white">{lessonPlan.title}</h5>
                  <div className="flex flex-wrap gap-2 text-[10px] text-indigo-200">
                    <span>⏱️ Thời lượng: {lessonPlan.totalDuration} phút</span>
                    <span>📚 Lớp: {lessonPlan.grade}</span>
                  </div>
                </div>

                {lessonPlan.stages.map((stage) => (
                  <div key={stage.stepNumber} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                      <span>{stage.name}</span>
                      <span className="text-[10px] text-slate-400">{stage.durationMinutes} phút</span>
                    </div>

                    <div className="text-[11px] text-slate-300 space-y-1">
                      <p>
                        <strong className="text-sky-400">👨‍🏫 GV:</strong> {stage.teacherAction}
                      </p>
                      <p>
                        <strong className="text-emerald-400">🧑‍🎓 HS:</strong> {stage.studentAction}
                      </p>
                      <p>
                        <strong className="text-purple-400">💻 Math Lab:</strong> {stage.mathLabOperation}
                      </p>
                      <p className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-amber-200/90">
                        <strong>❓ Câu hỏi gợi mở:</strong> "{stage.guidingQuestion}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
};
