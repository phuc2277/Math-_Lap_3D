import React from 'react';
import { ExperimentState } from '../../../engine/PhysicsAnimationEngine';

interface Dice3DVisualProps {
  value: number; // 1..6
  isRolling: boolean;
  experimentState?: ExperimentState;
  label?: string;
  size?: number;
  diceIndex?: number;
}

export const Dice3DVisual: React.FC<Dice3DVisualProps> = ({
  value,
  isRolling,
  experimentState = 'IDLE',
  label,
  size = 76,
  diceIndex = 0,
}) => {
  // Map target face (1..6) to CSS 3D rotation angles
  const getAnglesForFace = (face: number) => {
    switch (face) {
      case 1:
        return { x: 0, y: 0 };
      case 2:
        return { x: 0, y: -90 };
      case 3:
        return { x: -90, y: 0 };
      case 4:
        return { x: 90, y: 0 };
      case 5:
        return { x: 0, y: 90 };
      case 6:
        return { x: 0, y: 180 };
      default:
        return { x: 0, y: 0 };
    }
  };

  const targetAngles = getAnglesForFace(value);

  const isTossingState = isRolling || ['TOSSING', 'FLYING', 'ROTATING', 'FALLING', 'SETTLING'].includes(experimentState);

  // Offset rotations for 2 dice so they roll with distinct trajectories
  const extraRotations = isTossingState ? 1080 + diceIndex * 360 : 0;
  const extraX = isTossingState ? 360 + diceIndex * 180 : 0;

  // Parabolic lift height according to phase
  const getLiftY = () => {
    if (experimentState === 'FLYING' || experimentState === 'ROTATING') return '-translate-y-16 scale-110';
    if (experimentState === 'FALLING') return '-translate-y-6 scale-105';
    if (experimentState === 'SETTLING') return '-translate-y-1 scale-100';
    if (isRolling) return '-translate-y-12 scale-105';
    return 'translate-y-0 scale-100';
  };

  const currentTransform = `rotateX(${targetAngles.x + extraRotations + extraX}deg) rotateY(${
    targetAngles.y + extraRotations
  }deg)`;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      {label && <span className="text-xs font-bold text-slate-300 mb-2 tracking-wide">{label}</span>}

      {/* 3D Scene Wrapper */}
      <div
        className={`relative flex items-center justify-center select-none transition-transform duration-500 ease-out ${getLiftY()}`}
        style={{
          width: size,
          height: size,
          perspective: 800,
        }}
      >
        {/* Die 3D Cube Container */}
        <div
          className="w-full h-full relative transition-transform duration-[1200ms]"
          style={{
            transformStyle: 'preserve-3d',
            transform: currentTransform,
            transitionTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Face 1 (Front) */}
          <DiceFace number={1} size={size} transform={`translateZ(${size / 2}px)`} />
          {/* Face 6 (Back) */}
          <DiceFace
            number={6}
            size={size}
            transform={`rotateY(180deg) translateZ(${size / 2}px)`}
          />
          {/* Face 2 (Right) */}
          <DiceFace
            number={2}
            size={size}
            transform={`rotateY(90deg) translateZ(${size / 2}px)`}
          />
          {/* Face 5 (Left) */}
          <DiceFace
            number={5}
            size={size}
            transform={`rotateY(-90deg) translateZ(${size / 2}px)`}
          />
          {/* Face 3 (Top) */}
          <DiceFace
            number={3}
            size={size}
            transform={`rotateX(90deg) translateZ(${size / 2}px)`}
          />
          {/* Face 4 (Bottom) */}
          <DiceFace
            number={4}
            size={size}
            transform={`rotateX(-90deg) translateZ(${size / 2}px)`}
          />
        </div>

        {/* Drop Shadow Effect on Table Surface */}
        <div
          className={`absolute -bottom-4 rounded-full bg-slate-950/90 blur-md transition-all duration-300 ${
            isTossingState ? 'w-8 h-1.5 opacity-20' : 'w-18 h-3 opacity-80'
          }`}
        />
      </div>

      {/* Numerical Outcome Badge under die */}
      <div className="mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5 shadow-inner">
        <span>🎲</span>
        <span>{isTossingState ? '...' : `Mặt ${value}`}</span>
      </div>
    </div>
  );
};

// Sub-component rendering face dots
interface DiceFaceProps {
  number: number;
  size: number;
  transform: string;
}

const DiceFace: React.FC<DiceFaceProps> = ({ number, size, transform }) => {
  const renderDots = () => {
    const dotClass = 'w-2.5 h-2.5 rounded-full bg-slate-950 shadow-inner';
    const centerRedDotClass = 'w-3.5 h-3.5 rounded-full bg-rose-600 shadow-inner';

    switch (number) {
      case 1:
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className={centerRedDotClass} />
          </div>
        );
      case 2:
        return (
          <div className="w-full h-full flex justify-between p-2">
            <div className={dotClass} />
            <div className={`self-end ${dotClass}`} />
          </div>
        );
      case 3:
        return (
          <div className="w-full h-full flex justify-between p-2">
            <div className={dotClass} />
            <div className={`self-center ${dotClass}`} />
            <div className={`self-end ${dotClass}`} />
          </div>
        );
      case 4:
        return (
          <div className="w-full h-full flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full h-full flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="flex justify-center">
              <div className={dotClass} />
            </div>
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="w-full h-full flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
            <div className="flex justify-between">
              <div className={dotClass} />
              <div className={dotClass} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="absolute top-0 left-0 bg-gradient-to-br from-white via-slate-100 to-slate-200 border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden flex items-center justify-center"
      style={{
        width: size,
        height: size,
        transform,
        backfaceVisibility: 'hidden',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.2)',
      }}
    >
      {renderDots()}
    </div>
  );
};
