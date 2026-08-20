import React from 'react';
import { GEOMETRY_MODELS } from '../data/geometryModels';
import { ModelCard } from '../components/model-cards/ModelCard';
import {
  Box,
  Compass,
  ArrowRight,
  BookOpen,
  Calculator,
  Sparkles,
} from 'lucide-react';
import { soundEffects } from '../utils/audioEffects';

interface HomePageProps {
  onExploreLab: (labId: string) => void;
  onNavigateTab: (tab: '3d-geometry' | 'geogebra' | 'gsp' | 'calculator' | 'lessons' | 'assignments' | 'ai-generator') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onExploreLab,
  onNavigateTab,
}) => {
  return (
    <div className="space-y-8 pb-12">
      {/* Quick Action Navigation Bar */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quick Access Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('3d-geometry');
            }}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all flex items-center gap-2"
          >
            <Box className="w-4 h-4 text-slate-950" />
            <span>Khám Phá Mô Hình 3D</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('lessons');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Theo Bài Học SGK</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('ai-generator');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 border border-indigo-400/40 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Tạo Thí Nghiệm</span>
          </button>
        </div>

        {/* Right: Math Tool Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('geogebra');
            }}
            className="px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>GeoGebra</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('gsp');
            }}
            className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <span className="font-mono font-black text-[10px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded">GSP</span>
            <span>Sketchpad</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('calculator');
            }}
            className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span>Casio fx-580</span>
          </button>
        </div>
      </section>

      {/* Primary 3D Models Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Box className="w-4 h-4 text-sky-400" />
              <span>Thư viện mô hình không gian — Nguyễn Quang Phúc THCS Hưng Bình, Nghệ An</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">Các Khối Đa Diện & Tròn Xoay</h2>
          </div>

          <button
            onClick={() => {
              soundEffects.playPopSound();
              onNavigateTab('3d-geometry');
            }}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 group bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg border border-sky-500/20 transition-all"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GEOMETRY_MODELS.map((model) => (
            <ModelCard key={model.id} model={model} onExplore={onExploreLab} />
          ))}
        </div>
      </section>
    </div>
  );
};
