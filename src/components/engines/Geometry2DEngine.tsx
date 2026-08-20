import React, { useState } from 'react';
import { ModelParams } from '../../types/geometry';
import { Layers, Move, Compass, EyeOff, Type, Palette } from 'lucide-react';

interface Geometry2DEngineProps {
  params: ModelParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
}

const PRESET_COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#6366f1'];

export const Geometry2DEngine: React.FC<Geometry2DEngineProps> = ({
  params,
  onParamChange,
}) => {
  const [scale, setScale] = useState<number>(40);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [selectedColor, setSelectedColor] = useState<string>('#38bdf8');

  const a = params.a ?? 5; // e.g. base length
  const b = params.b ?? 3; // e.g. height length

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none">
      <div className="bg-slate-900 border-b border-slate-800 p-3 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-sky-400">
          <Compass className="w-4 h-4" />
          <span>Mô phỏng Hình học Động 2D: Tam giác & Hình chữ nhật</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Palette Colors */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={`w-4 h-4 rounded-full transition-transform ${
                  selectedColor === c ? 'scale-125 ring-1 ring-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c }}
                title="Chọn màu hình 2D"
              />
            ))}
          </div>

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
              !showLabels
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title={showLabels ? 'Xóa/Ẩn các chữ trên hình' : 'Hiện lại chữ trên hình'}
          >
            {showLabels ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Xóa chữ</span>
              </>
            ) : (
              <>
                <Type className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hiện chữ</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative flex items-center justify-center p-6">
        <svg className="w-full h-full max-w-lg max-h-80 overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid2d" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2d)" />

          {/* 2D Shape SVG */}
          <polygon
            points={`100,220 ${100 + a * scale},220 ${100 + a * scale},${220 - b * scale} 100,${220 - b * scale}`}
            fill={`${selectedColor}33`}
            stroke={selectedColor}
            strokeWidth="3"
          />

          {/* Labels & Measurements */}
          {showLabels && (
            <>
              <text x={100 + (a * scale) / 2 - 15} y={240} className="fill-sky-300 font-mono text-xs font-bold">
                Cạnh a = {a} cm
              </text>

              <text x={100 + a * scale + 10} y={220 - (b * scale) / 2} className="fill-amber-300 font-mono text-xs font-bold">
                Cạnh b = {b} cm
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
