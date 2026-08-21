import React from 'react';
import { GeometryModelConfig } from '../../types/geometry';
import { MathFormula } from '../math/MathFormula';
import { ArrowRight, Box, Compass, Disc, CircleDot, Layers } from 'lucide-react';
import { soundEffects } from '../../utils/audioEffects';

interface ModelCardProps {
  model: GeometryModelConfig;
  onExplore: (labId: string) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onExplore }) => {
  const getIcon = () => {
    switch (model.modelType) {
      case 'cuboid':
        return <Box className="w-6 h-6 text-sky-400" />;
      case 'cube':
        return <Layers className="w-6 h-6 text-indigo-400" />;
      case 'cylinder':
        return <Disc className="w-6 h-6 text-amber-400" />;
      case 'cone':
        return <Compass className="w-6 h-6 text-purple-400" />;
      case 'sphere':
        return <CircleDot className="w-6 h-6 text-rose-400" />;
      default:
        return <Box className="w-6 h-6 text-sky-400" />;
    }
  };

  const handleExplore = () => {
    soundEffects.playPopSound();
    onExplore(model.id);
  };

  return (
    <div
      onClick={handleExplore}
      className="group bg-slate-900/80 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col justify-between relative overflow-hidden cursor-pointer"
    >
      {/* Decorative Gradient Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/15 transition-all pointer-events-none" />

      <div>
        {/* Top Header & Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform">
            {getIcon()}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-300 bg-sky-950/80 border border-sky-800 rounded-md">
              Lớp {model.grade}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 rounded-md">
              {model.id}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
          {model.title}
        </h3>
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {model.shortDescription}
        </p>

        {/* Primary Formula Preview */}
        <div className="mt-4 p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-300 font-mono">
          <span className="text-[10px] text-slate-400">
            {model.formulas.volume ? 'Công thức V:' : model.formulas.equation ? 'Công thức:' : 'Công thức:'}
          </span>
          <MathFormula formula={model.formulas.volume || model.formulas.equation || model.formulas.totalArea || ''} />
        </div>

        {/* Feature Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 rounded-md flex items-center gap-1">
            <span>✂️ Mặt cắt 3D</span>
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/60 rounded-md">
            Trải phẳng
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-md">
            Thí nghiệm
          </span>
        </div>
      </div>

      {/* Explore Button */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">
          3D Interactive Model
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleExplore();
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-500/20 group-hover:translate-x-0.5"
        >
          <span>Khám phá</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
