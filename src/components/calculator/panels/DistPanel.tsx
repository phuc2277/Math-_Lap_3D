import React, { useState } from 'react';
import { BarChart3, Play, Sparkles } from 'lucide-react';
import { CasioEngine } from '../casioEngine';

interface DistPanelProps {
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const DistPanel: React.FC<DistPanelProps> = ({ onAskAI, playClickSound }) => {
  const [distType, setDistType] = useState<'normPD' | 'normCD' | 'binPD' | 'binCD' | 'poisPD'>('normPD');
  const [params, setParams] = useState({
    x: 0,
    lower: -1.96,
    upper: 1.96,
    mean: 0,
    stdDev: 1,
    n: 10,
    p: 0.5,
    lambda: 3,
  });
  const [probResult, setProbResult] = useState<{ label: string; prob: number; formula: string } | null>(null);

  const handleCompute = () => {
    playClickSound?.();

    if (distType === 'normPD') {
      const val = CasioEngine.normalPD(params.x, params.mean, params.stdDev);
      setProbResult({
        label: `Normal PD (x = ${params.x}, μ = ${params.mean}, σ = ${params.stdDev})`,
        prob: Number(val.toFixed(6)),
        formula: 'f(x) = (1 / σ√(2π)) * e^(-(x-μ)² / 2σ²)',
      });
    } else if (distType === 'normCD') {
      const val = CasioEngine.normalCD(params.lower, params.upper, params.mean, params.stdDev);
      setProbResult({
        label: `P(${params.lower} ≤ X ≤ ${params.upper}) [Chuẩn hóa]`,
        prob: Number(val.toFixed(6)),
        formula: 'P(a ≤ X ≤ b) = ∫_a^b f(x) dx',
      });
    } else if (distType === 'binPD') {
      const val = CasioEngine.binomialPD(params.x, params.n, params.p);
      setProbResult({
        label: `Binomial PD: P(X = ${params.x}) với n = ${params.n}, p = ${params.p}`,
        prob: val,
        formula: 'P(X = x) = C(n, x) * p^x * (1-p)^(n-x)',
      });
    } else if (distType === 'binCD') {
      const val = CasioEngine.binomialCD(params.x, params.n, params.p);
      setProbResult({
        label: `Binomial CD: P(X ≤ ${params.x}) với n = ${params.n}, p = ${params.p}`,
        prob: val,
        formula: 'P(X ≤ x) = ∑_{k=0}^x P(X = k)',
      });
    } else if (distType === 'poisPD') {
      const val = CasioEngine.poissonPD(params.x, params.lambda);
      setProbResult({
        label: `Poisson PD: P(X = ${params.x}) với λ = ${params.lambda}`,
        prob: val,
        formula: 'P(X = x) = (e^(-λ) * λ^x) / x!',
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <h3 className="font-extrabold text-sm text-white">
            Phân Phối Xác Suất (Mode 7: DISTRIBUTION)
          </h3>
        </div>
        <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
          Casio fx-580 / 880
        </span>
      </div>

      {/* Select Type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {[
          { id: 'normPD', label: '1: Normal PD' },
          { id: 'normCD', label: '2: Normal CD' },
          { id: 'binPD', label: '3: Binomial PD' },
          { id: 'binCD', label: '4: Binomial CD' },
          { id: 'poisPD', label: '5: Poisson PD' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setDistType(tab.id as any);
              setProbResult(null);
            }}
            className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
              distType === tab.id
                ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input parameters based on distType */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
        {distType === 'normPD' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Giá trị x</label>
              <input
                type="number"
                value={params.x}
                onChange={(e) => setParams({ ...params, x: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Trung bình (μ)</label>
              <input
                type="number"
                value={params.mean}
                onChange={(e) => setParams({ ...params, mean: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Độ lệch (σ)</label>
              <input
                type="number"
                value={params.stdDev}
                onChange={(e) => setParams({ ...params, stdDev: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
          </div>
        )}

        {distType === 'normCD' && (
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Lower (Cận dưới)</label>
              <input
                type="number"
                value={params.lower}
                onChange={(e) => setParams({ ...params, lower: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Upper (Cận trên)</label>
              <input
                type="number"
                value={params.upper}
                onChange={(e) => setParams({ ...params, upper: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">μ (Trung bình)</label>
              <input
                type="number"
                value={params.mean}
                onChange={(e) => setParams({ ...params, mean: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">σ (Độ lệch)</label>
              <input
                type="number"
                value={params.stdDev}
                onChange={(e) => setParams({ ...params, stdDev: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
          </div>
        )}

        {(distType === 'binPD' || distType === 'binCD') && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số lần thành công (x)</label>
              <input
                type="number"
                value={params.x}
                onChange={(e) => setParams({ ...params, x: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số phép thử (n)</label>
              <input
                type="number"
                value={params.n}
                onChange={(e) => setParams({ ...params, n: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Xác suất thành công (p)</label>
              <input
                type="number"
                step="0.05"
                value={params.p}
                onChange={(e) => setParams({ ...params, p: parseFloat(e.target.value) || 0.5 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
          </div>
        )}

        {distType === 'poisPD' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số biến cố x</label>
              <input
                type="number"
                value={params.x}
                onChange={(e) => setParams({ ...params, x: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Kỳ vọng λ (Lambda)</label>
              <input
                type="number"
                value={params.lambda}
                onChange={(e) => setParams({ ...params, lambda: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleCompute}
          className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>TÍNH XÁC SUẤT (=)</span>
        </button>
      </div>

      {/* Probability Result */}
      {probResult && (
        <div className="p-4 bg-sky-950/40 border border-sky-500/40 rounded-2xl space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300">{probResult.label}</span>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(`Hãy giải thích chi tiết cách tính xác suất: ${probResult.label} = ${probResult.prob}`)
                }
                className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-lg font-bold hover:bg-sky-500/30 flex items-center gap-1 font-sans"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Giải Thích</span>
              </button>
            )}
          </div>

          <div className="text-xl font-black text-white">
            P = <span className="text-sky-400">{probResult.prob}</span>
            <span className="text-xs text-slate-400 font-sans ml-2">({(probResult.prob * 100).toFixed(3)}%)</span>
          </div>

          <div className="text-[11px] text-slate-400 font-sans">
            Công thức: {probResult.formula}
          </div>
        </div>
      )}
    </div>
  );
};
