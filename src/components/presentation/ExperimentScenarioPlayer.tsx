import React, { useState, useEffect } from 'react';
import { Experiment, ModelParams } from '../../types/geometry';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface ExperimentScenarioPlayerProps {
  experiment: Experiment;
  params: ModelParams;
  onApplyParams: (params: Partial<ModelParams>) => void;
  onClose: () => void;
}

export const ExperimentScenarioPlayer: React.FC<ExperimentScenarioPlayerProps> = ({
  experiment,
  params,
  onApplyParams,
  onClose,
}) => {
  const steps = experiment.steps;
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [showConclusion, setShowConclusion] = useState(false);
  const [userConclusionAns, setUserConclusionAns] = useState<number | null>(null);

  const currentStep = steps[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === steps.length - 1;

  // Apply suggested params on step change
  useEffect(() => {
    if (currentStep && currentStep.suggestedParams) {
      onApplyParams(currentStep.suggestedParams);
    }
  }, [currentStepIdx]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlayingAuto) return;

    const timer = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        setCurrentStepIdx((prev) => prev + 1);
      } else {
        setIsPlayingAuto(false);
        if (experiment.conclusionStep) {
          setShowConclusion(true);
        }
      }
    }, 7000); // 7s per step for auto-play

    return () => clearInterval(timer);
  }, [isPlayingAuto, currentStepIdx, steps.length, experiment.conclusionStep]);

  const handleNext = () => {
    if (!isLast) {
      setCurrentStepIdx((prev) => prev + 1);
    } else if (experiment.conclusionStep) {
      setShowConclusion(true);
    }
  };

  const handlePrev = () => {
    if (showConclusion) {
      setShowConclusion(false);
    } else if (!isFirst) {
      setCurrentStepIdx((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIdx(0);
    setShowConclusion(false);
    setUserConclusionAns(null);
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] bg-slate-900/95 border border-amber-500/50 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl text-white space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              ▶ Kịch bản trình chiếu thí nghiệm
            </h2>
            <h1 className="text-sm font-extrabold text-white">{experiment.title}</h1>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Thoát trình chiếu kịch bản"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Steps Timeline */}
      <div className="flex items-center justify-between gap-1 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
        {steps.map((st, idx) => (
          <button
            key={st.stepNumber}
            onClick={() => {
              setCurrentStepIdx(idx);
              setShowConclusion(false);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 ${
              idx === currentStepIdx && !showConclusion
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : idx < currentStepIdx
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>Bước {st.stepNumber}</span>
          </button>
        ))}
        {experiment.conclusionStep && (
          <button
            onClick={() => setShowConclusion(true)}
            className={`py-1.5 px-3 rounded-xl text-[11px] font-bold transition ${
              showConclusion
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-purple-400 hover:text-purple-300'
            }`}
          >
            Kết luận
          </button>
        )}
      </div>

      {/* Main Slide Content Body */}
      {!showConclusion ? (
        <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
            <span>{currentStep.title}</span>
            {currentStep.formulaHighlight && (
              <span className="font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md text-amber-300 text-[11px]">
                {currentStep.formulaHighlight}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            👉 {currentStep.instruction}
          </p>

          {currentStep.observationInsight && (
            <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 p-3 rounded-xl">
              <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-200 font-semibold mb-0.5">
                  Nhận xét trực quan:
                </strong>
                <span>{currentStep.observationInsight}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Conclusion Step */
        <div className="space-y-3 bg-purple-950/30 p-4 rounded-2xl border border-purple-800/50">
          <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>{experiment.conclusionStep?.title}</span>
          </h3>

          <div className="space-y-2">
            {experiment.conclusionStep?.options.map((opt, idx) => {
              const isSelected = userConclusionAns === idx;
              const isCorrect = idx === experiment.conclusionStep?.correctAnswerIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setUserConclusionAns(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                    isSelected
                      ? isCorrect
                        ? 'bg-emerald-950 text-emerald-200 border-emerald-500 font-bold'
                        : 'bg-rose-950 text-rose-200 border-rose-500 font-bold'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && (isCorrect ? '✅ ĐÚNG' : '❌ CHƯA ĐÚNG')}
                </button>
              );
            })}
          </div>

          {userConclusionAns !== null && (
            <p className="text-xs text-purple-200 bg-purple-900/40 p-2.5 rounded-xl border border-purple-700/50">
              💡 <strong>Tóm tắt:</strong> {experiment.conclusionStep?.summary}
            </p>
          )}
        </div>
      )}

      {/* Slide Navigation Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Tải lại từ bước 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlayingAuto(!isPlayingAuto)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isPlayingAuto
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            {isPlayingAuto ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingAuto ? 'Tạm dừng' : 'Tự động chạy'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={isFirst && !showConclusion}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
          >
            <SkipBack className="w-3.5 h-3.5" />
            <span>Trước</span>
          </button>

          <button
            onClick={handleNext}
            disabled={showConclusion}
            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-lg shadow-amber-500/20"
          >
            <span>{isLast ? 'Kết luận' : 'Tiếp theo'}</span>
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
