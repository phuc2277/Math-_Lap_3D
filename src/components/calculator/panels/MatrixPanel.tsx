import React, { useState } from 'react';
import { Grid3X3, Play, Sparkles } from 'lucide-react';
import { CasioEngine } from '../casioEngine';

interface MatrixPanelProps {
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const MatrixPanel: React.FC<MatrixPanelProps> = ({ onAskAI, playClickSound }) => {
  const [dim, setDim] = useState<2 | 3>(3);
  const [matA, setMatA] = useState<number[][]>([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0],
  ]);
  const [matB, setMatB] = useState<number[][]>([
    [2, 0, -1],
    [1, 3, 2],
    [0, -2, 1],
  ]);
  const [scalarK, setScalarK] = useState<number>(2);
  const [matrixResult, setMatrixResult] = useState<{
    label: string;
    matrix?: number[][];
    scalar?: number;
    text?: string;
  } | null>(null);

  const getSizedMatrix = (current: number[][], newDim: 2 | 3) => {
    return Array.from({ length: newDim }, (_, r) =>
      Array.from({ length: newDim }, (_, c) => current[r]?.[c] ?? (r === c ? 1 : 0))
    );
  };

  const handleDimChange = (d: 2 | 3) => {
    setDim(d);
    setMatA(getSizedMatrix(matA, d));
    setMatB(getSizedMatrix(matB, d));
    setMatrixResult(null);
  };

  const handleCompute = (op: 'add' | 'sub' | 'mul' | 'detA' | 'invA' | 'transA' | 'traceA' | 'scalarA' | 'sqA') => {
    playClickSound?.();

    if (op === 'add') {
      const res = CasioEngine.matrixAdd(matA, matB);
      setMatrixResult({ label: 'MatA + MatB', matrix: res });
    } else if (op === 'sub') {
      const res = CasioEngine.matrixSub(matA, matB);
      setMatrixResult({ label: 'MatA - MatB', matrix: res });
    } else if (op === 'mul') {
      const res = CasioEngine.matrixMul(matA, matB);
      setMatrixResult({ label: 'MatA × MatB', matrix: res });
    } else if (op === 'detA') {
      const det = CasioEngine.matrixDeterminant(matA);
      setMatrixResult({ label: 'det(MatA) (Định thức)', scalar: det });
    } else if (op === 'invA') {
      const inv = CasioEngine.matrixInverse(matA);
      if (inv) {
        setMatrixResult({ label: 'MatA⁻¹ (Ma trận nghịch đảo)', matrix: inv });
      } else {
        setMatrixResult({ label: 'MatA⁻¹', text: 'Không khả nghịch (det = 0)' });
      }
    } else if (op === 'transA') {
      const trn = CasioEngine.matrixTranspose(matA);
      setMatrixResult({ label: 'Trn(MatA) (Chuyển vị Aᵀ)', matrix: trn });
    } else if (op === 'traceA') {
      const tr = CasioEngine.matrixTrace(matA);
      setMatrixResult({ label: 'Trace(MatA) (Vết ma trận)', scalar: tr });
    } else if (op === 'scalarA') {
      const res = CasioEngine.matrixScalarMul(matA, scalarK);
      setMatrixResult({ label: `${scalarK} × MatA`, matrix: res });
    } else if (op === 'sqA') {
      const res = CasioEngine.matrixMul(matA, matA);
      setMatrixResult({ label: 'MatA² (Lũy thừa 2)', matrix: res });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-violet-400" />
          <h3 className="font-extrabold text-sm text-white">
            Tính Toán Ma Trận (Mode 4: MATRIX)
          </h3>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => handleDimChange(2)}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              dim === 2 ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            2 × 2
          </button>
          <button
            onClick={() => handleDimChange(3)}
            className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
              dim === 3 ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            3 × 3
          </button>
        </div>
      </div>

      {/* Matrix Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-violet-300">Ma trận MatA ({dim}×{dim}):</span>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}>
            {matA.slice(0, dim).map((row, r) =>
              row.slice(0, dim).map((val, c) => (
                <input
                  key={`a-${r}-${c}`}
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const next = matA.map((rowArr, ri) =>
                      rowArr.map((v, ci) => (ri === r && ci === c ? parseFloat(e.target.value) || 0 : v))
                    );
                    setMatA(next);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                />
              ))
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-violet-300">Ma trận MatB ({dim}×{dim}):</span>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))` }}>
            {matB.slice(0, dim).map((row, r) =>
              row.slice(0, dim).map((val, c) => (
                <input
                  key={`b-${r}-${c}`}
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const next = matB.map((rowArr, ri) =>
                      rowArr.map((v, ci) => (ri === r && ci === c ? parseFloat(e.target.value) || 0 : v))
                    );
                    setMatB(next);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300">Chọn phép toán ma trận:</span>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {[
            { id: 'add', label: 'MatA + MatB' },
            { id: 'sub', label: 'MatA - MatB' },
            { id: 'mul', label: 'MatA × MatB' },
            { id: 'detA', label: 'det(MatA)' },
            { id: 'invA', label: 'MatA⁻¹' },
            { id: 'transA', label: 'MatAᵀ (Trn)' },
            { id: 'traceA', label: 'Trace(MatA)' },
            { id: 'sqA', label: 'MatA²' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleCompute(btn.id as any)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-violet-500 text-xs font-bold text-slate-300 hover:text-white transition-all text-center"
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Scalar multiplication */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleCompute('scalarA')}
            className="p-2 rounded-xl bg-violet-600/30 border border-violet-500/50 hover:bg-violet-600/50 text-xs font-bold text-violet-200 transition-all"
          >
            Nhân vô hướng k × MatA:
          </button>
          <input
            type="number"
            value={scalarK}
            onChange={(e) => setScalarK(parseFloat(e.target.value) || 1)}
            className="w-16 bg-slate-950 border border-slate-700 rounded-xl p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Result Display */}
      {matrixResult && (
        <div className="p-4 bg-violet-950/40 border border-violet-500/40 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-300">{matrixResult.label}</span>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(`Giải thích chi tiết phép toán ma trận: ${matrixResult.label} với MatA và MatB.`)
                }
                className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg font-bold hover:bg-violet-500/30 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Giải Thích</span>
              </button>
            )}
          </div>

          {matrixResult.matrix && (
            <div
              className="grid gap-2 p-2 bg-slate-950 rounded-xl border border-violet-800/40 font-mono text-center font-bold text-white"
              style={{ gridTemplateColumns: `repeat(${matrixResult.matrix[0].length}, minmax(0, 1fr))` }}
            >
              {matrixResult.matrix.map((row, r) =>
                row.map((val, c) => (
                  <div key={`${r}-${c}`} className="p-1.5 bg-slate-900 rounded border border-slate-800 text-xs">
                    {val}
                  </div>
                ))
              )}
            </div>
          )}

          {matrixResult.scalar !== undefined && (
            <div className="text-base font-extrabold text-white font-mono bg-slate-950 p-2.5 rounded-xl">
              = {matrixResult.scalar}
            </div>
          )}

          {matrixResult.text && (
            <div className="text-xs font-bold text-amber-300">{matrixResult.text}</div>
          )}
        </div>
      )}
    </div>
  );
};
