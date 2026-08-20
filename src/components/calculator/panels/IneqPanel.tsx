import React, { useState } from 'react';
import { ShieldAlert, Play, Sparkles } from 'lucide-react';
import { CasioEngine, InequalityResult } from '../casioEngine';

interface IneqPanelProps {
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const IneqPanel: React.FC<IneqPanelProps> = ({ onAskAI, playClickSound }) => {
  const [degree, setDegree] = useState<2 | 3 | 4>(2);
  const [operator, setOperator] = useState<'>' | '>=' | '<' | '<='>('>');
  const [coeffs, setCoeffs] = useState<number[]>([1, -5, 6, 0, 0]);
  const [solution, setSolution] = useState<InequalityResult | null>(null);

  const handleSolve = () => {
    playClickSound?.();
    const res = CasioEngine.solveInequality(degree, coeffs, operator);
    setSolution(res);
  };

  const handleAI = () => {
    let expr = '';
    if (degree === 2) expr = `${coeffs[0]}x² + ${coeffs[1]}x + ${coeffs[2]} ${operator} 0`;
    else if (degree === 3) expr = `${coeffs[0]}x³ + ${coeffs[1]}x² + ${coeffs[2]}x + ${coeffs[3]} ${operator} 0`;
    else expr = `${coeffs[0]}x⁴ + ${coeffs[1]}x³ + ${coeffs[2]}x² + ${coeffs[3]}x + ${coeffs[4]} ${operator} 0`;

    onAskAI?.(`Hãy lập bảng xét dấu và giải chi tiết từng bước bất phương trình: ${expr}`);
  };

  const coeffLabels =
    degree === 2
      ? ['a (x²)', 'b (x)', 'c']
      : degree === 3
      ? ['a (x³)', 'b (x²)', 'c (x)', 'd']
      : ['a (x⁴)', 'b (x³)', 'c (x²)', 'd (x)', 'e'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <h3 className="font-extrabold text-sm text-white">
            Giải Bất Phương Trình Bậc 2, 3, 4 (Mode A: INEQ)
          </h3>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
          Casio fx-580 / 880
        </span>
      </div>

      {/* Select Degree */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300">Chọn bậc của bất phương trình:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { d: 2, label: 'Bậc 2 (ax²+bx+c)' },
            { d: 3, label: 'Bậc 3 (ax³+bx²+cx+d)' },
            { d: 4, label: 'Bậc 4 (ax⁴+...+e)' },
          ].map((item) => (
            <button
              key={item.d}
              onClick={() => {
                setDegree(item.d as any);
                setSolution(null);
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                degree === item.d
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Select Operator */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300">Chọn dấu bất đẳng thức:</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { op: '>', label: 'f(x) > 0' },
            { op: '>=', label: 'f(x) ≥ 0' },
            { op: '<', label: 'f(x) < 0' },
            { op: '<=', label: 'f(x) ≤ 0' },
          ].map((item) => (
            <button
              key={item.op}
              onClick={() => {
                setOperator(item.op as any);
                setSolution(null);
              }}
              className={`p-2 rounded-xl text-xs font-bold border font-mono transition-all ${
                operator === item.op
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs for Coeffs */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
        <span className="text-xs font-bold text-slate-300">Nhập các hệ số:</span>
        <div className={`grid gap-2 ${degree === 2 ? 'grid-cols-3' : degree === 3 ? 'grid-cols-4' : 'grid-cols-5'}`}>
          {coeffLabels.map((lbl, idx) => (
            <div key={idx}>
              <label className="text-[10px] text-slate-400 font-bold block mb-1 text-center truncate">{lbl}</label>
              <input
                type="number"
                value={coeffs[idx] ?? (idx === 0 ? 1 : 0)}
                onChange={(e) => {
                  const n = [...coeffs];
                  n[idx] = parseFloat(e.target.value) || 0;
                  setCoeffs(n);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSolve}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>GIẢI BẤT PHƯƠNG TRÌNH (=)</span>
        </button>
      </div>

      {/* Solution */}
      {solution && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300">Tập nghiệm bất phương trình:</span>
            {onAskAI && (
              <button
                onClick={handleAI}
                className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg font-bold hover:bg-emerald-500/30 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Lập Bảng Xét Dấu</span>
              </button>
            )}
          </div>

          <div className="text-sm font-extrabold text-white font-mono bg-slate-950/80 p-3 rounded-xl border border-emerald-800/40">
            {solution.solutionText}
          </div>

          {solution.roots.length > 0 && (
            <div className="text-xs text-slate-400 font-mono">
              Nghiệm của đa thức: {solution.roots.map((r, i) => `x${i + 1} = ${r}`).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
