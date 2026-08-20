import React from 'react';

interface SpinnerVisualProps {
  sectorsCount: number; // 2, 3, 4, 6, 8
  currentSector: number; // 1-indexed
  isSpinning: boolean;
  label?: string;
}

const SECTOR_COLORS = [
  '#f43f5e', // Red
  '#0284c7', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#eab308', // Yellow
];

export const SpinnerVisual: React.FC<SpinnerVisualProps> = ({
  sectorsCount = 4,
  currentSector = 1,
  isSpinning = false,
  label,
}) => {
  const rotationAngle = (currentSector - 1) * (360 / sectorsCount) + (isSpinning ? 1440 : 0);

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Top Pointer Arrow */}
        <div className="absolute -top-3 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />

        {/* Spinning Wheel SVG */}
        <div
          className="w-full h-full rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl transition-transform duration-700 ease-out"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {Array.from({ length: sectorsCount }).map((_, i) => {
              const startAngle = (i * 360) / sectorsCount;
              const endAngle = ((i + 1) * 360) / sectorsCount;

              const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);

              const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

              const largeArc = endAngle - startAngle > 180 ? 1 : 0;
              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;

              return (
                <g key={`sec-${i}`}>
                  <path d={pathData} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  <text
                    x={50 + 30 * Math.cos((Math.PI * (startAngle + endAngle) / 2) / 180)}
                    y={50 + 30 * Math.sin((Math.PI * (startAngle + endAngle) / 2) / 180)}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Center Pin */}
        <div className="absolute w-8 h-8 bg-slate-900 border-2 border-amber-400 rounded-full z-10 flex items-center justify-center shadow-lg text-[10px] font-bold text-amber-300">
          🎯
        </div>
      </div>

      {label && <span className="text-xs font-bold text-slate-300">{label}</span>}
    </div>
  );
};
