import React from 'react';
import {
  RotateCcw,
  ZoomIn,
  Scissors,
  Ruler,
  Play,
  Maximize2,
  Minimize2,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react';

interface MinimalistProjectionBarProps {
  onResetView: () => void;
  onZoomFit: () => void;
  onToggleSectionCut: () => void;
  isSectionCutActive: boolean;
  onToggleMeasurement: () => void;
  isMeasurementActive: boolean;
  onStartScenario: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onOpenTeacherPanel?: () => void;
  showTeacherButton?: boolean;
}

export const MinimalistProjectionBar: React.FC<MinimalistProjectionBarProps> = ({
  onResetView,
  onZoomFit,
  onToggleSectionCut,
  isSectionCutActive,
  onToggleMeasurement,
  isMeasurementActive,
  onStartScenario,
  onToggleFullscreen,
  isFullscreen,
  onOpenTeacherPanel,
  showTeacherButton = true,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 px-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-xl text-white pointer-events-auto">
      {/* ↻ Reset view */}
      <button
        onClick={onResetView}
        className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
        title="Xoay lại góc nhìn ban đầu"
      >
        <RotateCcw className="w-4 h-4 text-sky-400" />
        <span className="hidden sm:inline">Đặt lại</span>
      </button>

      <div className="w-[1px] h-5 bg-slate-800" />

      {/* 🔍 Zoom fit */}
      <button
        onClick={onZoomFit}
        className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
        title="Tự động canh lề mô hình"
      >
        <ZoomIn className="w-4 h-4 text-emerald-400" />
        <span className="hidden sm:inline">Phóng to</span>
      </button>

      <div className="w-[1px] h-5 bg-slate-800" />

      {/* ✂ Section plane */}
      <button
        onClick={onToggleSectionCut}
        className={`p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
          isSectionCutActive
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md'
            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Bật/Tắt mặt phẳng cắt thiết diện"
      >
        <Scissors className="w-4 h-4 text-rose-400" />
        <span className="hidden sm:inline">{isSectionCutActive ? 'Tắt mặt cắt' : 'Bật mặt cắt'}</span>
      </button>

      <div className="w-[1px] h-5 bg-slate-800" />

      {/* 📏 Measure */}
      <button
        onClick={onToggleMeasurement}
        className={`p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
          isMeasurementActive
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title="Bật/Tắt đường kích thước đo đạc"
      >
        <Ruler className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Đo đạc</span>
      </button>

      <div className="w-[1px] h-5 bg-slate-800" />

      {/* ▶ Scenario Script */}
      <button
        onClick={onStartScenario}
        className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
        title="Bắt đầu trình chiếu kịch bản thí nghiệm"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>Kịch bản</span>
      </button>

      {/* ⚙ Teacher Panel */}
      {showTeacherButton && onOpenTeacherPanel && (
        <>
          <div className="w-[1px] h-5 bg-slate-800" />
          <button
            onClick={onOpenTeacherPanel}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-amber-400 transition flex items-center gap-1 text-xs font-semibold"
            title="Bảng điều khiển giáo viên"
          >
            <Settings className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="w-[1px] h-5 bg-slate-800" />

      {/* ⛶ Fullscreen */}
      <button
        onClick={onToggleFullscreen}
        className={`p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
          isFullscreen
            ? 'bg-amber-500 text-slate-950 shadow-md'
            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
        }`}
        title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình trình chiếu'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
