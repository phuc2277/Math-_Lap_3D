import React, { useState } from 'react';
import { ExperimentQuestion } from '../../models/LabActivitySession';
import { CheckCircle2, XCircle, HelpCircle, Send } from 'lucide-react';

interface StudentQuestionCardProps {
  question: ExperimentQuestion;
  savedAnswer?: string | number;
  onSaveAnswer: (answer: string | number) => void;
  showFeedback?: boolean;
}

export const StudentQuestionCard: React.FC<StudentQuestionCardProps> = ({
  question,
  savedAnswer,
  onSaveAnswer,
  showFeedback = false,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>(savedAnswer ?? '');
  const [submitted, setSubmitted] = useState<boolean>(savedAnswer !== undefined && savedAnswer !== '');

  const handleSubmit = (ans: string | number) => {
    setSelectedAnswer(ans);
    setSubmitted(true);
    onSaveAnswer(ans);
  };

  return (
    <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 space-y-3 my-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
            Câu hỏi bước {question.stepNumber}
          </span>
          <span className="text-xs text-slate-400 font-semibold">
            ({question.points || 1} điểm)
          </span>
        </div>
      </div>

      <p className="text-sm font-semibold text-slate-100">{question.questionText}</p>

      {/* Single Choice Options */}
      {question.type === 'single_choice' && question.options && (
        <div className="space-y-2 pt-1">
          {question.options.map((opt, idx) => {
            const isSelected = String(selectedAnswer) === String(opt);
            return (
              <button
                key={idx}
                onClick={() => handleSubmit(opt)}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between border ${
                  isSelected
                    ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500 font-bold shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                }`}
              >
                <span>{opt}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Numeric Input Question */}
      {question.type === 'numeric' && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="number"
            step="any"
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Nhập giá trị số..."
            className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
          />
          <button
            onClick={() => handleSubmit(selectedAnswer)}
            disabled={!selectedAnswer}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </div>
      )}

      {/* Observation Text Input */}
      {question.type === 'observation' && (
        <div className="space-y-2 pt-1">
          <textarea
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Nhập nhận xét quan sát của em qua mô hình 3D..."
            rows={3}
            className="w-full p-2.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <button
            onClick={() => handleSubmit(selectedAnswer)}
            disabled={!selectedAnswer}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition ml-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Lưu nhận xét</span>
          </button>
        </div>
      )}

      {/* Optional Feedback */}
      {showFeedback && submitted && question.explanation && (
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-amber-300 flex items-start gap-2 mt-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{question.explanation}</span>
        </div>
      )}
    </div>
  );
};
