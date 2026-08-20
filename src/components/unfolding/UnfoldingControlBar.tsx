import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Sliders, X } from 'lucide-react';
import { UnfoldingState } from '../../types/geometry';

interface UnfoldingControlBarProps {
  state: UnfoldingState;
  onChange: (updates: Partial<UnfoldingState>) => void;
  title?: string;
  faceDescription?: string;
  onClose?: () => void;
}

export const UnfoldingControlBar: React.FC<UnfoldingControlBarProps> = ({
  state,
  onChange,
  title = 'Khai triển mô hình 3D thành hình trải phẳng 2D',
  faceDescription,
  onClose,
}) => {
  const percentage = Math.round(state.progress * 100);

  const togglePlay = () => {
    if (state.progress >= 1 && !state.isPlaying) {
      onChange({ progress: 0, isPlaying: true });
    } else {
      onChange({ isPlaying: !state.isPlaying });
    }
  };

  const handleReset = () => {
    onChange({ progress: 0, isPlaying: false });
  };

  const handleFold = () => {
    onChange({ progress: 1, isPlaying: false });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-800 rounded-md">
              {percentage}%
            </span>
          </div>
          {faceDescription && (
            <p className="text-xs text-slate-400 mt-1">{faceDescription}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md ${
              state.isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {state.isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{state.progress >= 1 ? 'Xem lại' : 'Khai triển'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
            title="Thu lại dạng 3D"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={handleFold}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1"
            title="Trải phẳng 100%"
          >
            <FastForward className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Trải phẳng</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-[11px]">
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                onClick={() => onChange({ speed: sp })}
                className={`px-1.5 py-0.5 rounded-md font-mono transition ${
                  state.speed === sp
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
              title="Tắt ô Khai triển"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>📦 Mô hình 3D (0%)</span>
          <span className="flex items-center gap-1 text-purple-300 font-semibold">
            <Sliders className="w-3 h-3" />
            Trạng thái mở: {percentage}%
          </span>
          <span>📐 Trải phẳng 2D (100%)</span>
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={state.progress}
          onChange={(e) =>
            onChange({ progress: parseFloat(e.target.value), isPlaying: false })
          }
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>
    </div>
  );
};
