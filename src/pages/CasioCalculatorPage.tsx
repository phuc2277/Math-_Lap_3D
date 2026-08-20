import React, { useState } from 'react';
import { Casio580Calculator } from '../components/calculator/Casio580Calculator';
import {
  Calculator,
  Sparkles,
  BookOpen,
  HelpCircle,
  Brain,
  CheckCircle2,
  GraduationCap,
  Layers,
  Cpu,
} from 'lucide-react';
import { AIMathAssistantModal } from '../components/ai/AIMathAssistantModal';

export const CasioCalculatorPage: React.FC = () => {
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [customMathPrompt, setCustomMathPrompt] = useState('');

  const handleOpenAIExplanation = (problem: string) => {
    setCustomMathPrompt(problem);
    setAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-bold">
                <Calculator className="w-3.5 h-3.5" />
                <span>MÔ PHỎNG MÁY TÍNH KHOA HỌC CHUẨN</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Máy Tính Casio fx-580 VN X <span className="bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">CLASSWIZ</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
                Mô phỏng đầy đủ chức năng máy tính Casio fx-580: Giải phương trình bậc 2/3/4, hệ phương trình, tính đạo hàm, tích phân, bảng giá trị f(x), thống kê và liên kết trực tiếp với AI Gemini 3.1 Pro High Thinking.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleOpenAIExplanation('Hướng dẫn giải các bài toán trên máy tính Casio fx-580')}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Trợ lý AI Hướng Dẫn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Casio fx-580 Hardware Simulator Component */}
        <Casio580Calculator onOpenAIExplanation={handleOpenAIExplanation} />

        {/* Feature Guides and Educational Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Chế độ Giải PT Bậc 2/3/4 & Hệ PT</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Giải chính xác phương trình bậc 2 (ax²+bx+c=0), bậc 3 (ax³+bx²+cx+d=0), <strong>bậc 4 (ax⁴+bx³+cx²+dx+e=0)</strong> đầy đủ nghiệm thực, nghiệm phức (i), điểm cực đại/cực tiểu. Hỗ trợ hệ phương trình bậc nhất 2 ẩn và 3 ẩn.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Bảng Giá Trị & Thống Kê</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chế độ Table mode khảo sát hàm số theo dải giá trị [Start, End, Step] phục vụ vẽ đồ thị và tìm nghiệm gần đúng. Chế độ Statistics tính nhanh Trung bình cộng (x̄), Phương sai (σ²), Độ lệch chuẩn (σ) và Tứ phân vị Q1, Q3.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white">Tích hợp AI Gemini 3.1 Pro</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nút <strong>✨ AI Giải Thích</strong> cho phép gửi trực tiếp bài toán trên màn hình máy tính tới Gemini 3.1 Pro High Thinking để nhận lời giải chi tiết, chứng minh toán học và mẹo bấm máy Casio tương ứng.
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant Modal for Step-by-Step explanation */}
      <AIMathAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialTopic={customMathPrompt}
      />
    </div>
  );
};

export default CasioCalculatorPage;
