import React from 'react';
import { ExperimentState } from '../../../engine/PhysicsAnimationEngine';

interface Coin3DVisualProps {
  value: 'head' | 'tail';
  isFlipping: boolean;
  experimentState?: ExperimentState;
  label?: string;
  size?: number;
  coinIndex?: number;
}

export const Coin3DVisual: React.FC<Coin3DVisualProps> = ({
  value,
  isFlipping,
  experimentState = 'IDLE',
  label,
  size = 88,
  coinIndex = 0,
}) => {
  // Target rotation angle: Head -> 0deg, Tail -> 180deg
  const targetX = value === 'head' ? 0 : 180;

  // Add distinct multi-axis spinning depending on state
  const isTossingState = isFlipping || ['TOSSING', 'FLYING', 'ROTATING', 'FALLING', 'SETTLING'].includes(experimentState);

  // Offset initial spin angle slightly for 2 coins so they don't look cloned
  const spinOffset = coinIndex * 45;
  const extraRotationsX = isTossingState ? 1800 + coinIndex * 360 : 0;
  const extraRotationsY = isTossingState ? 720 + spinOffset : 0;

  // Parabolic lift height according to phase
  const getLiftY = () => {
    if (experimentState === 'FLYING' || experimentState === 'ROTATING') return '-translate-y-16 scale-110';
    if (experimentState === 'FALLING') return '-translate-y-6 scale-105';
    if (experimentState === 'SETTLING') return '-translate-y-1 scale-100';
    if (isFlipping) return '-translate-y-12 scale-105';
    return 'translate-y-0 scale-100';
  };

  const transformStyle = `rotateX(${targetX + extraRotationsX}deg) rotateY(${extraRotationsY}deg)`;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      {label && <span className="text-xs font-bold text-slate-300 mb-2 tracking-wide">{label}</span>}

      {/* 3D Scene Wrapper with Perspective */}
      <div
        className={`relative flex items-center justify-center select-none transition-transform duration-500 ease-out ${getLiftY()}`}
        style={{
          width: size,
          height: size,
          perspective: 1000,
        }}
      >
        {/* Coin 3D Container */}
        <div
          className="w-full h-full relative transition-transform duration-[1400ms]"
          style={{
            transformStyle: 'preserve-3d',
            transform: transformStyle,
            transitionTimingFunction: 'cubic-bezier(0.18, 0.89, 0.32, 1.15)',
          }}
        >
          {/* Front Face: NGỬA (Heads) */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center text-amber-950 font-bold p-2"
            style={{
              backfaceVisibility: 'hidden',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="w-9 h-9 rounded-full border-2 border-amber-700/80 flex items-center justify-center bg-amber-300/60 shadow-inner mb-0.5">
              <span className="text-lg drop-shadow">★</span>
            </div>
            <span className="text-[10px] tracking-wider uppercase font-black drop-shadow-sm">NGỬA</span>
          </div>

          {/* Realistic Coin Rim / Thickness Edge Layers */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-amber-700 pointer-events-none"
            style={{
              transform: 'translateZ(-2px)',
              backfaceVisibility: 'hidden',
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-amber-600 pointer-events-none"
            style={{
              transform: 'translateZ(2px)',
              backfaceVisibility: 'hidden',
            }}
          />

          {/* Back Face: SẤP (Tails) */}
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-600 via-slate-300 to-slate-100 border-4 border-slate-300 shadow-2xl flex flex-col items-center justify-center text-slate-900 font-bold p-2"
            style={{
              transform: 'rotateX(180deg)',
              backfaceVisibility: 'hidden',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.5)',
            }}
          >
            <div className="w-9 h-9 rounded-full border-2 border-slate-700/80 flex items-center justify-center bg-slate-200/70 shadow-inner mb-0.5">
              <span className="text-xs font-mono font-black drop-shadow-sm">100</span>
            </div>
            <span className="text-[10px] tracking-wider uppercase font-black drop-shadow-sm">SẤP</span>
          </div>
        </div>

        {/* Dynamic Table Floor Drop Shadow */}
        <div
          className={`absolute -bottom-4 rounded-full bg-slate-950/90 blur-md transition-all duration-300 ${
            isTossingState ? 'w-8 h-1.5 opacity-20' : 'w-20 h-3 opacity-80'
          }`}
        />
      </div>

      {/* Numerical Outcome Badge */}
      <div className="mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 shadow-inner">
        <span>🪙</span>
        <span>
          {isTossingState ? 'Đang xoay...' : value === 'head' ? 'NGỬA' : 'SẤP'}
        </span>
      </div>
    </div>
  );
};
