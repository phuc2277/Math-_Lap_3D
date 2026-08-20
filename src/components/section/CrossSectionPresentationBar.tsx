import React from 'react';
import {
  Scissors,
  Layers,
  Eye,
  Move,
  Sparkles,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  HelpCircle,
  X,
} from 'lucide-react';
import { SectionPlaneParams, ModelType } from '../../types/geometry';
import { soundEffects } from '../../utils/audioEffects';

interface CrossSectionPresentationBarProps {
  sectionParams: SectionPlaneParams;
  onChange: (updates: Partial<SectionPlaneParams>) => void;
  onOpenPrediction: () => void;
  onPlayAnimation: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  modelType: ModelType;
}

export const CrossSectionPresentationBar: React.FC<CrossSectionPresentationBarProps> = ({
  sectionParams,
  onChange,
  onOpenPrediction,
  onPlayAnimation,
  isFullscreen,
  onToggleFullscreen,
  modelType,
}) => {
  const {
    enabled = false,
    isCut = false,
    separation = 0,
    showSectionFace = true,
    extractSection = false,
  } = sectionParams;

  if (!enabled) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-1.5 sm:p-2 rounded-2xl shadow-2xl pointer-events-auto max-w-[94vw] overflow-x-auto no-scrollbar">
      {/* 1. Mặt phẳng */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onChange({ isCut: false, extractSection: false });
        }}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
          !isCut && !extractSection
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white'
        }`}
        title="Hiển thị mặt phẳng cắt bán trong suốt"
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mặt phẳng</span>
      </button>

      {/* 2. ✂️ Cắt khối */}
      <button
        onClick={() => {
          soundEffects.playSliceSound();
          onChange({ isCut: !isCut, showSectionFace: true, showContour: true });
        }}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
          isCut
            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-1 ring-rose-400'
            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white'
        }`}
        title="Cắt hình học thực khối 3D thành 2 phần"
      >
        <Scissors className="w-3.5 h-3.5" />
        <span>{isCut ? '✓ Đã Cắt' : '✂️ Cắt khối'}</span>
      </button>

      {/* 3. ↔️ Tách hai phần */}
      <button
        onClick={() => {
          soundEffects.playSeparateSound();
          if (!isCut) onChange({ isCut: true, separation: 1.5 });
          else onChange({ separation: separation > 0 ? 0 : 1.5 });
        }}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
          separation > 0
            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white'
        }`}
        title="Kéo 2 nửa khối tách xa nhau dọc theo pháp tuyến"
      >
        <Move className="w-3.5 h-3.5" />
        <span>{separation > 0 ? '✓ Đã Tách' : '↔️ Tách 2 phần'}</span>
      </button>

      {/* 4. 👁️ Mặt cắt (Fill / Contour) */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onChange({ showSectionFace: !showSectionFace });
        }}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
          showSectionFace
            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
            : 'bg-slate-800/90 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
        }`}
        title="Tô màu tiết diện mặt phẳng giao tuyến"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mặt cắt</span>
      </button>

      {/* 5. 🎯 Tách rời miếng mặt cắt */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onChange({ extractSection: !extractSection });
        }}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
          extractSection
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-1 ring-purple-400'
            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white'
        }`}
        title="Tách riêng lát cắt 2D bay ra ngoài để dễ quan sát"
      >
        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
        <span className="hidden sm:inline">Tách mặt cắt</span>
      </button>

      {/* 6. Dự đoán thiết diện */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onOpenPrediction();
        }}
        className="p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition shrink-0"
        title="Thử thách: Dự đoán hình dạng thiết diện"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
};
