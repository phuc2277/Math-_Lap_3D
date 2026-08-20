import React, { useState, useMemo } from 'react';
import { ModelType, ModelParams, SectionPlaneParams } from '../../types/geometry';
import { createCuttingPlane, solveCrossSection, IntersectionResult } from './CrossSectionMath';
import { HelpCircle, CheckCircle2, XCircle, Sparkles, ArrowRight, Play, RefreshCw, X, Scissors, Compass } from 'lucide-react';
import { soundEffects } from '../../utils/audioEffects';

interface CrossSectionPredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelType: ModelType;
  params: ModelParams;
  sectionParams: SectionPlaneParams;
  onExecuteCut: () => void;
  onStartAnimation: () => void;
}

const ALL_SHAPE_OPTIONS = [
  { id: 'circle', name: 'Hình tròn' },
  { id: 'ellipse', name: 'Hình Elip' },
  { id: 'equilateral_triangle', name: 'Tam giác đều' },
  { id: 'isosceles_triangle', name: 'Tam giác cân' },
  { id: 'right_triangle', name: 'Tam giác vuông' },
  { id: 'scalene_triangle', name: 'Tam giác thường' },
  { id: 'square', name: 'Hình vuông' },
  { id: 'rectangle', name: 'Hình chữ nhật' },
  { id: 'trapezoid', name: 'Hình thang' },
  { id: 'parallelogram', name: 'Hình bình hành' },
  { id: 'pentagon', name: 'Hình ngũ giác (5 cạnh)' },
  { id: 'hexagon', name: 'Hình lục giác (6 cạnh)' },
];

export const CrossSectionPredictionModal: React.FC<CrossSectionPredictionModalProps> = ({
  isOpen,
  onClose,
  modelType,
  params,
  sectionParams,
  onExecuteCut,
  onStartAnimation,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Compute actual mathematical result
  const actualResult = useMemo<IntersectionResult | null>(() => {
    const {
      position = 0,
      orientation = 'horizontal',
      pitch = 0,
      yaw = 0,
      roll = 0,
    } = sectionParams;

    const h = params.h ?? (modelType === 'sphere' ? (params.r ?? 3) * 2 : 5);
    let p = pitch;
    let y = yaw;
    let r_deg = roll;
    let off = position * (h / 2);

    if (orientation === 'horizontal') {
      p = 0; y = 0; r_deg = 0; off = position * (h / 2);
    } else if (orientation === 'vertical') {
      p = 90; y = 0; r_deg = 0; off = position * ((params.r ?? (params.a ?? 4) / 2) * 0.8);
    } else if (orientation === 'diagonal_45') {
      p = 45; y = 0; r_deg = 0; off = position * (h / 2.5);
    }

    const { plane } = createCuttingPlane(p, y, r_deg, off);
    return solveCrossSection(modelType, params, plane);
  }, [modelType, params, sectionParams]);

  // Generate 4 multiple choice options including the correct one
  const options = useMemo(() => {
    const correctType = actualResult?.shapeType || 'rectangle';
    const correctName = actualResult?.shapeNameVi || 'Hình chữ nhật';

    // Distractors pool
    const distractors = ALL_SHAPE_OPTIONS.filter((opt) => opt.id !== correctType);
    // Shuffle distractors
    const shuffled = [...distractors].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [
      { id: correctType, name: correctName, isCorrect: true },
      ...shuffled.map((s) => ({ ...s, isCorrect: false })),
    ];
    // Shuffle combined 4 choices
    return combined.sort(() => 0.5 - Math.random());
  }, [actualResult]);

  if (!isOpen) return null;

  const isCorrect = selectedOption === actualResult?.shapeType;

  const handleConfirm = () => {
    if (!selectedOption) return;
    setHasSubmitted(true);
    if (isCorrect) {
      soundEffects.playSuccessChime();
    } else {
      soundEffects.playPopSound();
    }
  };

  const handleRunCut = () => {
    soundEffects.playSliceSound();
    onExecuteCut();
    onStartAnimation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/20 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-purple-400">
              Câu hỏi Tư duy Không gian
            </span>
            <h2 className="text-xl font-black text-white">🔮 Dự đoán hình dạng Mặt cắt</h2>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Mặt phẳng cắt <strong className="text-rose-400">(α)</strong> đang đi qua khối{' '}
            <strong className="text-sky-400 uppercase">
              {modelType === 'cuboid'
                ? 'Hình hộp chữ nhật'
                : modelType === 'cube'
                ? 'Hình lập phương'
                : modelType === 'cylinder'
                ? 'Hình trụ'
                : modelType === 'cone'
                ? 'Hình nón'
                : modelType === 'sphere'
                ? 'Hình cầu'
                : modelType === 'pyramid'
                ? 'Hình chóp tứ giác đều'
                : 'Hình khối không gian'}
            </strong>{' '}
            ở góc cắt hiện tại.
          </p>
          <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            <span>Theo em, thiết diện tạo thành bởi mặt phẳng và khối là hình gì?</span>
          </p>
        </div>

        {/* Options List */}
        {!hasSubmitted ? (
          <div className="grid grid-cols-2 gap-2.5">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOption(opt.id)}
                className={`p-3.5 rounded-2xl border text-left font-semibold text-sm transition-all flex items-center justify-between ${
                  selectedOption === opt.id
                    ? 'bg-purple-600/30 border-purple-400 text-white shadow-md shadow-purple-600/20 scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{opt.name}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedOption === opt.id
                      ? 'border-purple-400 bg-purple-500'
                      : 'border-slate-600'
                  }`}
                >
                  {selectedOption === opt.id && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* Result & Explanation View */
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isCorrect
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-base">
                  {isCorrect ? '🎉 Chính xác tuyệt đối!' : '💡 Chưa chính xác!'}
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  Kết quả thực tế: Thiết diện là{' '}
                  <strong className="text-white font-bold">{actualResult?.shapeNameVi}</strong>.
                </p>
              </div>
            </div>

            {/* Geometric Explanation */}
            {actualResult && (
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs space-y-1.5 text-slate-300">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Giải thích hình học:</span>
                </div>
                <p className="leading-relaxed">{actualResult.descriptionVi}</p>
                <div className="pt-1 text-[11px] font-mono text-emerald-400">
                  {actualResult.formulaVi}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!hasSubmitted ? (
            <button
              onClick={handleConfirm}
              disabled={!selectedOption}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
                selectedOption
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Kiểm tra dự đoán</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 w-full">
              <button
                onClick={() => {
                  setHasSubmitted(false);
                  setSelectedOption(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Dự đoán lại</span>
              </button>

              <button
                onClick={handleRunCut}
                className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                <span>Thực hiện cắt & Tách khối ngay</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
