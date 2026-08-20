import React, { useState } from 'react';
import { ArrowRightLeft, Sparkles, Compass } from 'lucide-react';
import { CasioEngine } from '../casioEngine';

interface VectorPanelProps {
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const VectorPanel: React.FC<VectorPanelProps> = ({ onAskAI, playClickSound }) => {
  const [dim, setDim] = useState<2 | 3>(3);
  const [vctA, setVctA] = useState<number[]>([1, 2, 3]);
  const [vctB, setVctB] = useState<number[]>([4, -1, 2]);
  const [vctResult, setVctResult] = useState<{
    label: string;
    vector?: number[];
    scalar?: number;
    text?: string;
  } | null>(null);

  const handleCompute = (op: 'add' | 'sub' | 'dot' | 'cross' | 'magA' | 'magB' | 'angle' | 'unitA' | 'area') => {
    playClickSound?.();

    if (op === 'add') {
      const res = vctA.map((v, i) => v + (vctB[i] || 0));
      setVctResult({ label: 'VctA + VctB', vector: res });
    } else if (op === 'sub') {
      const res = vctA.map((v, i) => v - (vctB[i] || 0));
      setVctResult({ label: 'VctA - VctB', vector: res });
    } else if (op === 'dot') {
      const dot = CasioEngine.vectorDot(vctA, vctB);
      setVctResult({ label: 'VctA • VctB (Tích vô hướng)', scalar: dot });
    } else if (op === 'cross') {
      if (dim === 2) {
        // 2D pseudo cross
        const cross2D = vctA[0] * vctB[1] - vctA[1] * vctB[0];
        setVctResult({ label: 'VctA × VctB (Tích có hướng 2D)', scalar: cross2D });
      } else {
        const cross = CasioEngine.vectorCross3D(vctA, vctB);
        setVctResult({ label: 'VctA × VctB (Tích có hướng 3D / Véc tơ pháp tuyến)', vector: cross });
      }
    } else if (op === 'magA') {
      const mag = CasioEngine.vectorMagnitude(vctA);
      setVctResult({ label: '|VctA| (Độ dài véctơ A)', scalar: Number(mag.toFixed(4)) });
    } else if (op === 'magB') {
      const mag = CasioEngine.vectorMagnitude(vctB);
      setVctResult({ label: '|VctB| (Độ dài véctơ B)', scalar: Number(mag.toFixed(4)) });
    } else if (op === 'angle') {
      const ang = CasioEngine.vectorAngle(vctA, vctB);
      setVctResult({
        label: '∠(VctA, VctB) (Góc giữa hai véctơ)',
        text: `${ang.deg}° (${ang.rad} rad)`,
      });
    } else if (op === 'unitA') {
      const u = CasioEngine.vectorUnit(vctA);
      setVctResult({ label: 'UnitV(VctA) (Véc tơ đơn vị)', vector: u });
    } else if (op === 'area') {
      const cross = CasioEngine.vectorCross3D(vctA, vctB);
      const magCross = CasioEngine.vectorMagnitude(cross);
      const s = Number((0.5 * magCross).toFixed(4));
      setVctResult({ label: 'S△ (Diện tích tam giác hình thành bởi A và B)', scalar: s });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <h3 className="font-extrabold text-sm text-white">
            Hình Học Véc Tơ Không Gian & Mặt Phẳng (Mode 5: VECTOR)
          </h3>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              setDim(2);
              setVctA([vctA[0] || 1, vctA[1] || 2]);
              setVctB([vctB[0] || 3, vctB[1] || 4]);
              setVctResult(null);
            }}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              dim === 2 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            2 Chiều (Oxy)
          </button>
          <button
            onClick={() => {
              setDim(3);
              setVctA([vctA[0] || 1, vctA[1] || 2, vctA[2] || 3]);
              setVctB([vctB[0] || 4, vctB[1] || -1, vctB[2] || 2]);
              setVctResult(null);
            }}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              dim === 3 ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            3 Chiều (Oxyz)
          </button>
        </div>
      </div>

      {/* Vector Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-amber-300">Véc tơ VctA ({dim}D):</span>
          <div className="grid grid-cols-3 gap-1.5">
            {['x', 'y', 'z'].slice(0, dim).map((axis, idx) => (
              <div key={`a-${axis}`}>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5 text-center">{axis}</label>
                <input
                  type="number"
                  value={vctA[idx] ?? 0}
                  onChange={(e) => {
                    const n = [...vctA];
                    n[idx] = parseFloat(e.target.value) || 0;
                    setVctA(n);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-amber-300">Véc tơ VctB ({dim}D):</span>
          <div className="grid grid-cols-3 gap-1.5">
            {['x', 'y', 'z'].slice(0, dim).map((axis, idx) => (
              <div key={`b-${axis}`}>
                <label className="text-[10px] text-slate-500 font-bold block mb-0.5 text-center">{axis}</label>
                <input
                  type="number"
                  value={vctB[idx] ?? 0}
                  onChange={(e) => {
                    const n = [...vctB];
                    n[idx] = parseFloat(e.target.value) || 0;
                    setVctB(n);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300">Phép toán véc tơ Casio:</span>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'add', label: 'VctA + VctB' },
            { id: 'sub', label: 'VctA - VctB' },
            { id: 'dot', label: 'VctA • VctB (Vô hướng)' },
            { id: 'cross', label: 'VctA × VctB (Có hướng)' },
            { id: 'angle', label: '∠(VctA, VctB) (Góc)' },
            { id: 'magA', label: 'Abs |VctA|' },
            { id: 'magB', label: 'Abs |VctB|' },
            { id: 'unitA', label: 'UnitV(VctA)' },
            { id: 'area', label: 'Diện tích S△' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleCompute(btn.id as any)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-xs font-bold text-slate-300 hover:text-white transition-all text-center"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {vctResult && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300">{vctResult.label}</span>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(
                    `Giải thích chi tiết phép toán véctơ Oxyz: ${vctResult.label} với VctA = (${vctA.join(', ')}), VctB = (${vctB.join(', ')})`
                  )
                }
                className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg font-bold hover:bg-amber-500/30 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Giải Thích</span>
              </button>
            )}
          </div>

          {vctResult.vector && (
            <div className="text-sm font-extrabold text-white font-mono bg-slate-950 p-2.5 rounded-xl">
              = ({vctResult.vector.join(', ')})
            </div>
          )}

          {vctResult.scalar !== undefined && (
            <div className="text-base font-extrabold text-white font-mono bg-slate-950 p-2.5 rounded-xl">
              = {vctResult.scalar}
            </div>
          )}

          {vctResult.text && (
            <div className="text-sm font-extrabold text-amber-300 font-mono bg-slate-950 p-2.5 rounded-xl">
              = {vctResult.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
