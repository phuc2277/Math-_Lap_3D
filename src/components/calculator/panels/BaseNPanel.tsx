import React, { useState } from 'react';
import { Binary, Play, Sparkles, Scale } from 'lucide-react';
import { CasioEngine } from '../casioEngine';

interface BaseNPanelProps {
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const BaseNPanel: React.FC<BaseNPanelProps> = ({ onAskAI, playClickSound }) => {
  const [subMode, setSubMode] = useState<'baseN' | 'ratio'>('baseN');

  // Base-N states
  const [baseInput, setBaseInput] = useState<string>('255');
  const [fromBase, setFromBase] = useState<2 | 8 | 10 | 16>(10);
  const [baseValB, setBaseValB] = useState<string>('15');
  const [logicOp, setLogicOp] = useState<'convert' | 'AND' | 'OR' | 'XOR' | 'NOT' | 'XNOR'>('convert');
  const [baseResult, setBaseResult] = useState<any | null>(() => CasioEngine.convertBase('255', 10));

  // Ratio states
  const [ratioType, setRatioType] = useState<'AXD' | 'ABCX'>('AXD');
  const [ratioA, setRatioA] = useState<number>(3);
  const [ratioB, setRatioB] = useState<number>(4);
  const [ratioKnown, setRatioKnown] = useState<number>(12);
  const [ratioX, setRatioX] = useState<number | null>(null);

  const handleComputeBase = () => {
    playClickSound?.();
    const parsedA = parseInt(baseInput, fromBase) || 0;
    const parsedB = parseInt(baseValB, fromBase) || 0;

    if (logicOp === 'convert') {
      const conv = CasioEngine.convertBase(baseInput, fromBase);
      setBaseResult({ type: 'convert', ...conv });
    } else {
      const bitRes = CasioEngine.bitwiseOp(parsedA, parsedB, logicOp as any);
      const conv = CasioEngine.convertBase(bitRes.toString(10), 10);
      setBaseResult({
        type: 'logic',
        opLabel: `${baseInput} ${logicOp} ${baseValB}`,
        resDec: bitRes,
        ...conv,
      });
    }
  };

  const handleComputeRatio = () => {
    playClickSound?.();
    const x = CasioEngine.solveRatio(ratioType, ratioA, ratioB, ratioKnown);
    setRatioX(x);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {subMode === 'baseN' ? (
            <Binary className="w-4 h-4 text-emerald-400" />
          ) : (
            <Scale className="w-4 h-4 text-amber-400" />
          )}
          <h3 className="font-extrabold text-sm text-white">
            {subMode === 'baseN' ? 'Hệ Đếm & Phép Toán Logic (Mode 3: BASE-N)' : 'Tỉ Lệ Thức (Mode B: RATIO)'}
          </h3>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setSubMode('baseN');
              playClickSound?.();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              subMode === 'baseN' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Hệ đếm (Base-N)
          </button>
          <button
            onClick={() => {
              setSubMode('ratio');
              playClickSound?.();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              subMode === 'ratio' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Tỉ lệ thức (Ratio)
          </button>
        </div>
      </div>

      {/* BASE-N MODE */}
      {subMode === 'baseN' && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { b: 10, label: 'DEC (Thập phân)' },
              { b: 16, label: 'HEX (Thập lục)' },
              { b: 2, label: 'BIN (Nhị phân)' },
              { b: 8, label: 'OCT (Bát phân)' },
            ].map((item) => (
              <button
                key={item.b}
                onClick={() => setFromBase(item.b as any)}
                className={`p-2 rounded-xl text-xs font-bold border ${
                  fromBase === item.b
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">Nhập giá trị đầu vào:</label>
            <input
              type="text"
              value={baseInput}
              onChange={(e) => setBaseInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm font-mono font-bold text-emerald-400 uppercase"
            />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {[
              { id: 'convert', label: 'Chuyển Đổi' },
              { id: 'AND', label: 'AND' },
              { id: 'OR', label: 'OR' },
              { id: 'XOR', label: 'XOR' },
              { id: 'NOT', label: 'NOT' },
              { id: 'XNOR', label: 'XNOR' },
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  setLogicOp(op.id as any);
                }}
                className={`p-2 rounded-xl text-xs font-bold border font-mono ${
                  logicOp === op.id
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>

          {logicOp !== 'convert' && logicOp !== 'NOT' && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <label className="text-[10px] text-slate-400 font-bold block">Nhập toán hạng thứ hai (B):</label>
              <input
                type="text"
                value={baseValB}
                onChange={(e) => setBaseValB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm font-mono font-bold text-white uppercase"
              />
            </div>
          )}

          <button
            onClick={handleComputeBase}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>TÍNH TOÁN HỆ ĐẾM (=)</span>
          </button>

          {baseResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs">
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-bold">DEC (Hệ 10)</span>
                <span className="text-sm font-extrabold text-white">{baseResult.dec}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-bold">HEX (Hệ 16)</span>
                <span className="text-sm font-extrabold text-amber-400">{baseResult.hex}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-500 text-[10px] block font-bold">BIN (Hệ 2)</span>
                <span className="text-xs font-extrabold text-emerald-400 truncate block">{baseResult.bin}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-xl">
                <span className="text-slate-500 text-[10px] block font-bold">OCT (Hệ 8)</span>
                <span className="text-sm font-extrabold text-sky-400">{baseResult.oct}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RATIO MODE */}
      {subMode === 'ratio' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRatioType('AXD')}
              className={`p-2.5 rounded-xl text-xs font-bold border ${
                ratioType === 'AXD'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              1: A : B = X : D
            </button>
            <button
              onClick={() => setRatioType('ABCX')}
              className={`p-2.5 rounded-xl text-xs font-bold border ${
                ratioType === 'ABCX'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              2: A : B = C : X
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300">
              Nhập các thành phần của tỉ lệ thức:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">A</label>
                <input
                  type="number"
                  value={ratioA}
                  onChange={(e) => setRatioA(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">B</label>
                <input
                  type="number"
                  value={ratioB}
                  onChange={(e) => setRatioB(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  {ratioType === 'AXD' ? 'D' : 'C'}
                </label>
                <input
                  type="number"
                  value={ratioKnown}
                  onChange={(e) => setRatioKnown(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white"
                />
              </div>
            </div>

            <button
              onClick={handleComputeRatio}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>TÌM X (=)</span>
            </button>
          </div>

          {ratioX !== null && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl space-y-1 font-mono text-center">
              <span className="text-xs text-amber-300 font-bold">Giá trị nghiệm X:</span>
              <div className="text-2xl font-black text-white">X = {ratioX}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
