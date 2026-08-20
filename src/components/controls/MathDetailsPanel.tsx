import React, { useMemo, useState } from 'react';
import { GeometryModelConfig, ModelParams } from '../../types/geometry';
import { MathFormula } from '../math/MathFormula';
import { Calculator, Sparkles, BookOpen, ChevronRight, X } from 'lucide-react';

interface MathDetailsPanelProps {
  config: GeometryModelConfig;
  params: ModelParams;
  onClose?: () => void;
}

export const MathDetailsPanel: React.FC<MathDetailsPanelProps> = ({ config, params, onClose }) => {
  const { modelType, formulas, educationalNotes } = config;

  const [showCalculationDetail, setShowCalculationDetail] = useState(true);
  const [showEducationalNotes, setShowEducationalNotes] = useState(true);

  const a = params.a ?? 4;
  const b = params.b ?? 3;
  const h = params.h ?? 5;
  const r = params.r ?? 3;

  // Real-time calculations
  const calc = useMemo(() => {
    switch (modelType) {
      case 'cuboid': {
        const baseArea = a * b;
        const lateralArea = 2 * (a + b) * h;
        const totalArea = 2 * (a * b + a * h + b * h);
        const volume = a * b * h;
        return {
          baseAreaVal: baseArea.toFixed(2),
          lateralAreaVal: lateralArea.toFixed(2),
          totalAreaVal: totalArea.toFixed(2),
          volumeVal: volume.toFixed(2),
          baseAreaFormula: `S_{đáy} = ${a} \\times ${b} = ${baseArea}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = 2(${a} + ${b}) \\times ${h} = ${lateralArea}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = 2(${a}\\cdot${b} + ${a}\\cdot${h} + ${b}\\cdot${h}) = ${totalArea}\\text{ cm}^2`,
          volumeFormula: `V = ${a} \\times ${b} \\times ${h} = ${volume}\\text{ cm}^3`,
        };
      }
      case 'cube': {
        const baseArea = a * a;
        const lateralArea = 4 * a * a;
        const totalArea = 6 * a * a;
        const volume = Math.pow(a, 3);
        return {
          baseAreaVal: baseArea.toFixed(2),
          lateralAreaVal: lateralArea.toFixed(2),
          totalAreaVal: totalArea.toFixed(2),
          volumeVal: volume.toFixed(2),
          baseAreaFormula: `S_{đáy} = ${a}^2 = ${baseArea}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = 4 \\times ${a}^2 = ${lateralArea}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = 6 \\times ${a}^2 = ${totalArea}\\text{ cm}^2`,
          volumeFormula: `V = ${a}^3 = ${volume}\\text{ cm}^3`,
        };
      }
      case 'cylinder': {
        const baseAreaPi = r * r; // multiplier for pi
        const baseAreaNum = Math.PI * r * r;
        const lateralAreaPi = 2 * r * h;
        const lateralAreaNum = 2 * Math.PI * r * h;
        const totalAreaPi = lateralAreaPi + 2 * baseAreaPi;
        const totalAreaNum = totalAreaPi * Math.PI;
        const volumePi = r * r * h;
        const volumeNum = Math.PI * r * r * h;
        return {
          baseAreaVal: baseAreaNum.toFixed(2),
          lateralAreaVal: lateralAreaNum.toFixed(2),
          totalAreaVal: totalAreaNum.toFixed(2),
          volumeVal: volumeNum.toFixed(2),
          baseAreaFormula: `S_{đáy} = \\pi \\cdot ${r}^2 = ${baseAreaPi}\\pi \\approx ${baseAreaNum.toFixed(2)}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = 2\\pi \\cdot ${r} \\cdot ${h} = ${lateralAreaPi}\\pi \\approx ${lateralAreaNum.toFixed(2)}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = ${totalAreaPi}\\pi \\approx ${totalAreaNum.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = \\pi \\cdot ${r}^2 \\cdot ${h} = ${volumePi}\\pi \\approx ${volumeNum.toFixed(2)}\\text{ cm}^3`,
        };
      }
      case 'cone': {
        const l = Math.sqrt(r * r + h * h);
        const baseAreaPi = r * r;
        const baseAreaNum = Math.PI * baseAreaPi;
        const lateralAreaNum = Math.PI * r * l;
        const totalAreaNum = lateralAreaNum + baseAreaNum;
        const volumeFraction = (1 / 3) * r * r * h;
        const volumeNum = (1 / 3) * Math.PI * r * r * h;
        return {
          slantHeightVal: l.toFixed(2),
          baseAreaVal: baseAreaNum.toFixed(2),
          lateralAreaVal: lateralAreaNum.toFixed(2),
          totalAreaVal: totalAreaNum.toFixed(2),
          volumeVal: volumeNum.toFixed(2),
          slantHeightFormula: `l = \\sqrt{${r}^2 + ${h}^2} = \\sqrt{${r * r + h * h}} \\approx ${l.toFixed(2)}\\text{ cm}`,
          baseAreaFormula: `S_{đáy} = \\pi \\cdot ${r}^2 = ${baseAreaPi}\\pi \\approx ${baseAreaNum.toFixed(2)}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = \\pi \\cdot ${r} \\cdot ${l.toFixed(2)} \\approx ${lateralAreaNum.toFixed(2)}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = S_{xq} + S_{đáy} \\approx ${totalAreaNum.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = \\frac{1}{3}\\pi \\cdot ${r}^2 \\cdot ${h} = ${volumeFraction.toFixed(2)}\\pi \\approx ${volumeNum.toFixed(2)}\\text{ cm}^3`,
        };
      }
      case 'sphere': {
        const areaNum = 4 * Math.PI * r * r;
        const areaPi = 4 * r * r;
        const volumeNum = (4 / 3) * Math.PI * Math.pow(r, 3);
        const volumePiFraction = (4 / 3) * Math.pow(r, 3);
        return {
          totalAreaVal: areaNum.toFixed(2),
          volumeVal: volumeNum.toFixed(2),
          totalAreaFormula: `S = 4\\pi \\cdot ${r}^2 = ${areaPi}\\pi \\approx ${areaNum.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = \\frac{4}{3}\\pi \\cdot ${r}^3 = ${volumePiFraction.toFixed(2)}\\pi \\approx ${volumeNum.toFixed(2)}\\text{ cm}^3`,
        };
      }
      case 'prism': {
        const baseArea = 0.5 * a * b;
        const lateralArea = (a + a + Math.sqrt(a * a + b * b)) * h;
        const totalArea = lateralArea + 2 * baseArea;
        const volume = baseArea * h;
        return {
          baseAreaVal: baseArea.toFixed(2),
          lateralAreaVal: lateralArea.toFixed(2),
          totalAreaVal: totalArea.toFixed(2),
          volumeVal: volume.toFixed(2),
          baseAreaFormula: `S_{đáy} = \\frac{1}{2} \\times ${a} \\times ${b} = ${baseArea.toFixed(2)}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = C_{đáy} \\times ${h} \\approx ${lateralArea.toFixed(2)}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = S_{xq} + 2S_{đáy} \\approx ${totalArea.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = S_{đáy} \\times ${h} = ${volume.toFixed(2)}\\text{ cm}^3`,
        };
      }
      case 'prism_quad': {
        const bigA = a;
        const smallB = Math.min(b, bigA - 0.1);
        const distD = params.d ?? 4;
        const c = Math.sqrt(Math.pow((bigA - smallB) / 2, 2) + distD * distD);
        const baseArea = ((bigA + smallB) * distD) / 2;
        const perimeterBase = bigA + smallB + 2 * c;
        const lateralArea = perimeterBase * h;
        const totalArea = lateralArea + 2 * baseArea;
        const volume = baseArea * h;
        return {
          baseAreaVal: baseArea.toFixed(2),
          lateralAreaVal: lateralArea.toFixed(2),
          totalAreaVal: totalArea.toFixed(2),
          volumeVal: volume.toFixed(2),
          baseAreaFormula: `S_{đáy} = \\frac{(${bigA} + ${smallB}) \\times ${distD}}{2} = ${baseArea.toFixed(2)}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = C_{đáy} \\times ${h} = (${bigA} + ${smallB} + 2 \\times ${c.toFixed(2)}) \\times ${h} = ${lateralArea.toFixed(2)}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = S_{xq} + 2S_{đáy} = ${totalArea.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = S_{đáy} \\times ${h} = ${baseArea.toFixed(2)} \\times ${h} = ${volume.toFixed(2)}\\text{ cm}^3`,
        };
      }
      case 'pyramid': {
        const baseArea = a * b;
        const slantH = Math.sqrt(h * h + (a / 2) * (a / 2));
        const lateralArea = 2 * a * slantH;
        const totalArea = baseArea + lateralArea;
        const volume = (1 / 3) * baseArea * h;
        return {
          baseAreaVal: baseArea.toFixed(2),
          lateralAreaVal: lateralArea.toFixed(2),
          totalAreaVal: totalArea.toFixed(2),
          volumeVal: volume.toFixed(2),
          baseAreaFormula: `S_{đáy} = ${a} \\times ${b} = ${baseArea.toFixed(2)}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = 2 \\times ${a} \\times ${slantH.toFixed(2)} \\approx ${lateralArea.toFixed(2)}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = S_{đáy} + S_{xq} \\approx ${totalArea.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = \\frac{1}{3} \\times ${baseArea} \\times ${h} = ${volume.toFixed(2)}\\text{ cm}^3`,
        };
      }
      case 'pyramid_triangular': {
        const baseArea = (a * a * Math.sqrt(3)) / 4;
        const rIn = a / (2 * Math.sqrt(3));
        const slantH = Math.sqrt(h * h + rIn * rIn);
        const lateralArea = 1.5 * a * slantH;
        const totalArea = baseArea + lateralArea;
        const volume = (1 / 3) * baseArea * h;
        return {
          baseAreaVal: baseArea.toFixed(2),
          lateralAreaVal: lateralArea.toFixed(2),
          totalAreaVal: totalArea.toFixed(2),
          volumeVal: volume.toFixed(2),
          baseAreaFormula: `S_{đáy} = \\frac{${a}^2 \\sqrt{3}}{4} \\approx ${baseArea.toFixed(2)}\\text{ cm}^2`,
          lateralAreaFormula: `S_{xq} = 3 \\times \\frac{1}{2} \\times ${a} \\times ${slantH.toFixed(2)} \\approx ${lateralArea.toFixed(2)}\\text{ cm}^2`,
          totalAreaFormula: `S_{tp} = S_{đáy} + S_{xq} \\approx ${totalArea.toFixed(2)}\\text{ cm}^2`,
          volumeFormula: `V = \\frac{1}{3} \\times S_{đáy} \\times ${h} \\approx ${volume.toFixed(2)}\\text{ cm}^3`,
        };
      }
      default:
        return {};
    }
  }, [modelType, a, b, h, r]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
            CÔNG THỨC & PHÉP TÍNH THỜI GIAN THỰC
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            Live Update
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              title="Tắt ô Công thức & Phép tính"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Results Display Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {calc.volumeVal && (
          <div className="bg-gradient-to-br from-sky-950/80 to-slate-950 p-3.5 rounded-xl border border-sky-800/60 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-medium text-sky-300 uppercase tracking-wider">
              Thể tích (V)
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {calc.volumeVal} <span className="text-xs font-normal text-sky-400">cm³</span>
            </div>
            <div className="text-[11px] text-sky-300/80 mt-1 font-mono">
              <MathFormula formula={config.formulas.volume} />
            </div>
          </div>
        )}

        {calc.totalAreaVal && (
          <div className="bg-gradient-to-br from-indigo-950/80 to-slate-950 p-3.5 rounded-xl border border-indigo-800/60 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-medium text-indigo-300 uppercase tracking-wider">
              Diện tích toàn phần (S_{`tp`})
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {calc.totalAreaVal} <span className="text-xs font-normal text-indigo-400">cm²</span>
            </div>
            <div className="text-[11px] text-indigo-300/80 mt-1 font-mono">
              <MathFormula formula={config.formulas.totalArea || ''} />
            </div>
          </div>
        )}

        {calc.lateralAreaVal && (
          <div className="bg-gradient-to-br from-purple-950/80 to-slate-950 p-3.5 rounded-xl border border-purple-800/60 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-medium text-purple-300 uppercase tracking-wider">
              Diện tích xung quanh (S_{`xq`})
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {calc.lateralAreaVal} <span className="text-xs font-normal text-purple-400">cm²</span>
            </div>
            <div className="text-[11px] text-purple-300/80 mt-1 font-mono">
              <MathFormula formula={config.formulas.lateralArea || ''} />
            </div>
          </div>
        )}

        {calc.baseAreaVal && (
          <div className="bg-gradient-to-br from-emerald-950/80 to-slate-950 p-3.5 rounded-xl border border-emerald-800/60 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">
              Diện tích đáy (S_{`đáy`})
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {calc.baseAreaVal} <span className="text-xs font-normal text-emerald-400">cm²</span>
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1 font-mono">
              <MathFormula formula={config.formulas.baseArea || ''} />
            </div>
          </div>
        )}

        {calc.slantHeightVal && (
          <div className="bg-gradient-to-br from-amber-950/80 to-slate-950 p-3.5 rounded-xl border border-amber-800/60 flex flex-col justify-between shadow-md">
            <span className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">
              Đường sinh (l)
            </span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {calc.slantHeightVal} <span className="text-xs font-normal text-amber-400">cm</span>
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1 font-mono">
              <MathFormula formula={config.formulas.slantHeight || ''} />
            </div>
          </div>
        )}
      </div>

      {/* Step by step Calculation Detail */}
      {showCalculationDetail && (
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-xl p-4 space-y-2 font-mono text-xs text-slate-300 relative group">
          <div className="flex items-center justify-between text-slate-400 font-sans font-medium text-xs mb-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>Chi tiết phép thay số:</span>
            </div>
            <button
              onClick={() => setShowCalculationDetail(false)}
              className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition"
              title="Tắt ô chi tiết phép thay số"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {calc.slantHeightFormula && (
            <div className="flex items-center gap-2 py-1 border-b border-slate-800/50">
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <MathFormula formula={calc.slantHeightFormula} />
            </div>
          )}

          {calc.baseAreaFormula && (
            <div className="flex items-center gap-2 py-1 border-b border-slate-800/50">
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <MathFormula formula={calc.baseAreaFormula} />
            </div>
          )}

          {calc.lateralAreaFormula && (
            <div className="flex items-center gap-2 py-1 border-b border-slate-800/50">
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
              <MathFormula formula={calc.lateralAreaFormula} />
            </div>
          )}

          {calc.totalAreaFormula && (
            <div className="flex items-center gap-2 py-1 border-b border-slate-800/50">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <MathFormula formula={calc.totalAreaFormula} />
            </div>
          )}

          {calc.volumeFormula && (
            <div className="flex items-center gap-2 py-1">
              <ChevronRight className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <MathFormula formula={calc.volumeFormula} />
            </div>
          )}
        </div>
      )}

      {/* Educational Insight Notes */}
      {educationalNotes.length > 0 && showEducationalNotes && (
        <div className="bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-slate-950 p-4 rounded-xl border border-sky-900/40 space-y-2 relative group">
          <div className="flex items-center justify-between text-sky-300 font-medium text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Ghi chú khám phá Toán học:</span>
            </div>
            <button
              onClick={() => setShowEducationalNotes(false)}
              className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition"
              title="Tắt ô ghi chú khám phá"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300 pl-6 list-disc marker:text-sky-400">
            {educationalNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {(!showCalculationDetail || !showEducationalNotes) && (
        <div className="flex items-center gap-2 pt-1">
          {!showCalculationDetail && (
            <button
              onClick={() => setShowCalculationDetail(true)}
              className="text-[11px] text-sky-400 hover:underline bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              + Hiện chi tiết phép thay số
            </button>
          )}
          {!showEducationalNotes && (
            <button
              onClick={() => setShowEducationalNotes(true)}
              className="text-[11px] text-sky-400 hover:underline bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
            >
              + Hiện ghi chú khám phá
            </button>
          )}
        </div>
      )}
    </div>
  );
};
