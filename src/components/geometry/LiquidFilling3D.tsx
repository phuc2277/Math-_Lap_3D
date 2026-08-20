import React, { useState } from 'react';
import { ModelParams, DisplayOptions } from '../../types/geometry';
import { Play, RotateCcw, Droplet, CheckCircle2, Sparkles } from 'lucide-react';
import * as THREE from 'three';

interface LiquidFilling3DProps {
  params: ModelParams;
  displayOptions: DisplayOptions;
}

export const LiquidFilling3D: React.FC<LiquidFilling3DProps> = ({ params }) => {
  const r = params.r ?? 3;
  const h = params.h ?? 5;

  // Pouring state: 0 to 3 scoops of cone water into cylinder
  const [scoopsPoured, setScoopsPoured] = useState<number>(0);
  const [isPouring, setIsPouring] = useState<boolean>(false);

  // Cylinder liquid level fraction: 0, 1/3, 2/3, 1
  const cylinderWaterLevel = (scoopsPoured / 3) * h;
  const coneVolume = ((1 / 3) * Math.PI * r * r * h).toFixed(2);
  const cylinderVolume = (Math.PI * r * r * h).toFixed(2);

  const pourScoop = () => {
    if (scoopsPoured >= 3 || isPouring) return;
    setIsPouring(true);
    setTimeout(() => {
      setScoopsPoured((prev) => Math.min(3, prev + 1));
      setIsPouring(false);
    }, 800);
  };

  const resetExperiment = () => {
    setScoopsPoured(0);
    setIsPouring(false);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-100">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-sky-400" />
          <h2 className="text-sm font-bold text-white">Thí nghiệm Đổ nước: Nón vs Trụ</h2>
        </div>
        <span className="text-xs font-mono text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800">
          r = {r} cm • h = {h} cm
        </span>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 items-center justify-center">
        {/* Left: Cone Scoop Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between space-y-3 relative">
          <span className="text-xs font-bold text-amber-300">
            🍦 Ca Đổ Hình Nón (V = 1/3 • π • r² • h)
          </span>

          {/* Cone Visual Representation */}
          <div className="relative w-36 h-36 border border-slate-800 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full p-2" viewBox="0 0 100 100">
              {/* Cone outline */}
              <polygon points="50,90 10,20 90,20" fill="rgba(56, 189, 248, 0.1)" stroke="#0284c7" strokeWidth="2" />
              <ellipse cx="50" cy="20" rx="40" ry="8" fill="rgba(56, 189, 248, 0.2)" stroke="#0284c7" strokeWidth="1.5" />

              {/* Water inside cone */}
              <polygon points="50,90 10,20 90,20" fill="rgba(14, 165, 233, 0.65)" />
            </svg>
          </div>

          <div className="text-center space-y-1 text-xs">
            <p className="text-slate-300 font-mono">
              Thể tích 1 Ca Nón = <strong className="text-sky-300">{coneVolume} cm³</strong>
            </p>
            <p className="text-[11px] text-slate-400">
              Mỗi lần đổ sẽ chắt đúng 1 ca đầy vào Hình Trụ
            </p>
          </div>

          <button
            disabled={scoopsPoured >= 3 || isPouring}
            onClick={pourScoop}
            className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow transition flex items-center justify-center gap-2 ${
              scoopsPoured >= 3
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-sky-600 hover:bg-sky-500 active:scale-95 shadow-sky-950'
            }`}
          >
            <Droplet className="w-4 h-4 fill-current" />
            <span>
              {isPouring
                ? '🌊 Đang rót nước...'
                : scoopsPoured >= 3
                ? 'Đã đầy Hình Trụ (3 Ca)'
                : `Rót ca thứ ${scoopsPoured + 1} vào Hình Trụ`}
            </span>
          </button>
        </div>

        {/* Right: Target Cylinder Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between space-y-3 relative">
          <span className="text-xs font-bold text-emerald-300">
            🛢️ Hình Trụ Nhận Nước (V = π • r² • h)
          </span>

          {/* Cylinder Visual Representation */}
          <div className="relative w-36 h-36 border border-slate-800 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full p-2" viewBox="0 0 100 100">
              {/* Cylinder outline */}
              <rect x="20" y="15" width="60" height="70" fill="rgba(16, 185, 129, 0.05)" stroke="#059669" strokeWidth="2" rx="2" />
              <ellipse cx="50" cy="15" rx="30" ry="6" fill="none" stroke="#059669" strokeWidth="1.5" />
              <ellipse cx="50" cy="85" rx="30" ry="6" fill="rgba(16, 185, 129, 0.2)" stroke="#059669" strokeWidth="1.5" />

              {/* Water level height inside cylinder */}
              {scoopsPoured > 0 && (
                <g>
                  {/* Water body */}
                  <rect
                    x="20"
                    y={85 - (scoopsPoured / 3) * 70}
                    width="60"
                    height={(scoopsPoured / 3) * 70}
                    fill="rgba(14, 165, 233, 0.75)"
                  />
                  {/* Top liquid ellipse */}
                  <ellipse
                    cx="50"
                    cy={85 - (scoopsPoured / 3) * 70}
                    rx="30"
                    ry="6"
                    fill="rgba(56, 189, 248, 0.9)"
                  />
                </g>
              )}

              {/* Fraction Level Markers */}
              <line x1="15" y1="61.6" x2="85" y2="61.6" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <text x="87" y="64" fill="#f59e0b" fontSize="6" fontWeight="bold">1/3</text>

              <line x1="15" y1="38.3" x2="85" y2="38.3" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <text x="87" y="41" fill="#f59e0b" fontSize="6" fontWeight="bold">2/3</text>

              <line x1="15" y1="15" x2="85" y2="15" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
              <text x="87" y="18" fill="#10b981" fontSize="6" fontWeight="bold">3/3</text>
            </svg>
          </div>

          <div className="text-center space-y-1 text-xs">
            <p className="text-slate-300 font-mono">
              Mức nước hiện tại: <strong className="text-emerald-300">{scoopsPoured}/3 chiều cao h</strong>
            </p>
            <p className="text-slate-300 font-mono">
              Thể tích nước: <strong className="text-sky-300">{((scoopsPoured / 3) * Number(cylinderVolume)).toFixed(2)} cm³</strong> / {cylinderVolume} cm³
            </p>
          </div>

          <button
            onClick={resetExperiment}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Xả nước (Làm lại)</span>
          </button>
        </div>
      </div>

      {/* Educational Insight Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
        <span className="font-bold text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          💡 Kết Luận Thí Nghiệm Trực Quan:
        </span>
        <p className="text-slate-300 leading-relaxed">
          Cần đúng <strong className="text-emerald-300 font-mono">3 ca nước hình nón đầy</strong> để lấp đầy 1 hình trụ có cùng bán kính đáy <strong className="text-sky-300">r</strong> và chiều cao <strong className="text-sky-300">h</strong>.
        </p>
        <p className="text-sky-400 font-mono font-bold text-[13px] pt-1">
          ⇒ V_nón = 1/3 • V_trụ = 1/3 • π • r² • h
        </p>
      </div>
    </div>
  );
};
