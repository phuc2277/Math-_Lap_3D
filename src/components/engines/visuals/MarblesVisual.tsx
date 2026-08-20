import React from 'react';

interface MarblesVisualProps {
  redCount: number;
  blueCount: number;
  yellowCount: number;
  lastDrawnColor: 'red' | 'blue' | 'yellow' | null;
  isDrawing: boolean;
}

export const MarblesVisual: React.FC<MarblesVisualProps> = ({
  redCount = 4,
  blueCount = 3,
  yellowCount = 3,
  lastDrawnColor,
  isDrawing = false,
}) => {
  const total = redCount + blueCount + yellowCount;

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Urn Container */}
      <div className="relative w-40 h-44 bg-slate-900/90 border-2 border-slate-700 rounded-b-3xl rounded-t-lg p-3 flex flex-col justify-end overflow-hidden shadow-2xl">
        {/* Urn Rim */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-slate-800 border-b border-slate-700 rounded-t-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
          Hộp Bi (Tổng: {total})
        </div>

        {/* Marbles inside Urn */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-6 pb-2">
          {Array.from({ length: redCount }).map((_, i) => (
            <div
              key={`r-${i}`}
              className="w-5 h-5 rounded-full bg-rose-500 shadow-md border border-rose-300 animate-pulse"
            />
          ))}
          {Array.from({ length: blueCount }).map((_, i) => (
            <div
              key={`b-${i}`}
              className="w-5 h-5 rounded-full bg-sky-500 shadow-md border border-sky-300 animate-pulse"
            />
          ))}
          {Array.from({ length: yellowCount }).map((_, i) => (
            <div
              key={`y-${i}`}
              className="w-5 h-5 rounded-full bg-amber-400 shadow-md border border-amber-200 animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Drawn Result Display */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <span>Viên bi vừa rút:</span>
        {isDrawing ? (
          <span className="text-amber-400 animate-bounce">🔮 Đang rút...</span>
        ) : lastDrawnColor === 'red' ? (
          <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-700 rounded-lg flex items-center gap-1">
            🔴 Bi Đỏ
          </span>
        ) : lastDrawnColor === 'blue' ? (
          <span className="px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-700 rounded-lg flex items-center gap-1">
            🔵 Bi Xanh
          </span>
        ) : lastDrawnColor === 'yellow' ? (
          <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-700 rounded-lg flex items-center gap-1">
            🟡 Bi Vàng
          </span>
        ) : (
          <span className="text-slate-500">Chưa rút</span>
        )}
      </div>
    </div>
  );
};
