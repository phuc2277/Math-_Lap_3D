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
    isAnimating = false,
  } = sectionParams;

  if (!enabled) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-2 sm:p-2.5 rounded-2xl shadow-2xl pointer-events-auto max-w-[95vw] overflow-x-auto">
      {/* 1. Mặt phẳng */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onChange({ isCut: false, extractSection: false });
        }}
        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
          !isCut && !extractSection
            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
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
        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
          isCut
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 ring-1 ring-rose-400'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
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
        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
          separation > 0
            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
        title="Kéo 2 nửa khối tách xa nhau dọc theo pháp tuyến"
      >
        <Move className="w-3.5 h-3.5" />
        <span>{separation > 0 ? '✓ Đã Tách' : '↔️ Tách 2 phần'}</span>
      </button>

      {/* 4. 👁 Hiện mặt cắt */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onChange({ showSectionFace: !showSectionFace, showContour: !showSectionFace });
        }}
        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
          showSectionFace
            ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
        title="Làm nổi bật viền giao tuyến & diện tích thiết diện"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mặt cắt</span>
      </button>

      {/* 5. 🎯 Tách mặt cắt */}
      <button
        onClick={() => {
          soundEffects.playSeparateSound();
          onChange({ extractSection: !extractSection, extractRotation: 1 });
        }}
        className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shrink-0 ${
          extractSection
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-1 ring-purple-400'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
        title="Tách thiết diện phẳng và xoay trực diện vào mắt người quan sát"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>🎯 Tách mặt cắt</span>
      </button>

      {/* 6. 🔮 Dự đoán */}
      <button
        onClick={onOpenPrediction}
        className="px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/20 transition flex items-center gap-1.5 shrink-0"
        title="Dự đoán hình dạng thiết diện trước khi cắt"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span>🔮 Dự đoán</span>
      </button>

      {/* 7. 🎬 Hoạt họa */}
      <button
        onClick={onPlayAnimation}
        disabled={isAnimating}
        className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 shrink-0"
        title="Xem hoạt họa cắt khối 7 bước tự động"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span className="hidden md:inline">Hoạt họa</span>
      </button>

      {/* 8. Reset */}
      <button
        onClick={() => {
          soundEffects.playPopSound();
          onChange({
            isCut: false,
            separation: 0,
            extractSection: false,
            position: 0,
            pitch: 0,
            yaw: 0,
            roll: 0,
            orientation: 'horizontal',
          });
        }}
        className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition shrink-0"
        title="Khôi phục trạng thái ban đầu"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* 9. Toàn màn hình */}
      <button
        onClick={onToggleFullscreen}
        className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition shrink-0"
        title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình trình chiếu'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
