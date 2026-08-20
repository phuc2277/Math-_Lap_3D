import React from 'react';
import { LabActivityResult } from '../../models/LabActivitySession';
import { Award, CheckCircle2, Clock, RotateCcw, ArrowLeft, Check, X, HelpCircle } from 'lucide-react';

interface StudentResultViewProps {
  result: LabActivityResult;
  onReview: () => void;
  onBackToLessons: () => void;
  onRetake?: () => void;
  canRetake?: boolean;
}

export const StudentResultView: React.FC<StudentResultViewProps> = ({
  result,
  onReview,
  onBackToLessons,
  onRetake,
  canRetake = false,
}) => {
  const isPass = result.score.possible > 0 ? result.score.earned / result.score.possible >= 0.5 : true;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-2xl mx-auto my-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-amber-400 mb-1">
          <Award className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-white">🎉 Hoàn thành bài thí nghiệm</h2>
        <p className="text-xs text-slate-400">
          Kết quả học tập đã được ghi nhận và tự động đồng bộ về hệ thống chính.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Tiến trình</span>
          <span className="text-lg font-extrabold text-emerald-400">{result.progressPercentage}%</span>
          <span className="text-[10px] text-slate-500 block">
            {result.completedStepsCount}/{result.totalStepsCount} bước
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Điểm số</span>
          <span
            className={`text-lg font-extrabold ${
              isPass ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {result.score.earned} / {result.score.possible}
          </span>
          <span className="text-[10px] text-slate-500 block">Thang điểm {result.score.possible || 10}</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Thời gian</span>
          <span className="text-lg font-extrabold text-sky-400 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s
          </span>
          <span className="text-[10px] text-slate-500 block">Lượt {result.attemptNumber}</span>
        </div>
      </div>

      {/* Questions Breakdown */}
      {result.questionResults.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Chi tiết câu hỏi thí nghiệm:
          </h3>
          <div className="space-y-2">
            {result.questionResults.map((q, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-200">
                    Bước {q.stepNumber}: {q.questionText}
                  </span>
                  <div className="shrink-0">
                    {q.requiresTeacherReview ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800">
                        Chờ GV nhận xét
                      </span>
                    ) : q.isCorrect ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đúng (+{q.score}đ)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <X className="w-3 h-3" /> Chưa chính xác (0đ)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4">
                  <span>
                    Câu trả lời của em: <strong className="text-indigo-300">{String(q.studentAnswer)}</strong>
                  </span>
                  {q.expectedAnswer !== undefined && !q.isCorrect && (
                    <span>
                      Đáp án gợi ý: <strong className="text-amber-300">{String(q.expectedAnswer)}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={onBackToLessons}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bài tập</span>
        </button>

        <div className="flex items-center gap-2">
          {canRetake && onRetake && (
            <button
              onClick={onRetake}
              className="px-4 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại bài</span>
            </button>
          )}

          <button
            onClick={onReview}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xem lại mô hình 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
