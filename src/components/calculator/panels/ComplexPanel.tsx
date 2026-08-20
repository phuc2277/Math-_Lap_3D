import React, { useState } from 'react';
import { Layers, Sparkles, RefreshCw } from 'lucide-react';
import { CasioEngine, ComplexNumber } from '../casioEngine';

interface ComplexPanelProps {
  angleMode: 'DEG' | 'RAD';
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const ComplexPanel: React.FC<ComplexPanelProps> = ({
  angleMode,
  onAskAI,
  playClickSound,
}) => {
  const [z1, setZ1] = useState<ComplexNumber>({ re: 3, im: 4 });
  const [z2, setZ2] = useState<ComplexNumber>({ re: 1, im: -2 });
  const [powerN, setPowerN] = useState<number>(3);
  const [cplxResult, setCplxResult] = useState<{
    label: string;
    algebraic?: string;
    polar?: string;
    modulus?: number;
    arg?: number;
  } | null>(null);

  const handleCompute = (op: 'add' | 'sub' | 'mul' | 'div' | 'mod1' | 'arg1' | 'conj1' | 'polar1' | 'pow1') => {
    playClickSound?.();
    let res: any = null;

    if (op === 'add') {
      const re = z1.re + z2.re;
      const im = z1.im + z2.im;
      res = {
        label: 'z₁ + z₂',
        algebraic: `${re} ${im >= 0 ? '+' : '-'} ${Math.abs(im)}i`,
        polar: CasioEngine.complexToPolar({ re, im }, angleMode).text,
      };
    } else if (op === 'sub') {
      const re = z1.re - z2.re;
      const im = z1.im - z2.im;
      res = {
        label: 'z₁ - z₂',
        algebraic: `${re} ${im >= 0 ? '+' : '-'} ${Math.abs(im)}i`,
        polar: CasioEngine.complexToPolar({ re, im }, angleMode).text,
      };
    } else if (op === 'mul') {
      const mul = CasioEngine._cMul(z1, z2);
      res = {
        label: 'z₁ × z₂',
        algebraic: `${mul.re} ${mul.im >= 0 ? '+' : '-'} ${Math.abs(mul.im)}i`,
        polar: CasioEngine.complexToPolar(mul, angleMode).text,
      };
    } else if (op === 'div') {
      const div = CasioEngine._cDiv(z1, z2);
      res = {
        label: 'z₁ ÷ z₂',
        algebraic: `${div.re.toFixed(4)} ${div.im >= 0 ? '+' : '-'} ${Math.abs(div.im).toFixed(4)}i`,
        polar: CasioEngine.complexToPolar(div, angleMode).text,
      };
    } else if (op === 'mod1') {
      const mod = CasioEngine.complexModulus(z1);
      res = {
        label: '|z₁| (Mô-đun)',
        algebraic: `${mod.toFixed(4)}`,
        modulus: mod,
      };
    } else if (op === 'arg1') {
      const arg = CasioEngine.complexArg(z1, angleMode);
      res = {
        label: `arg(z₁) (Góc pha ${angleMode})`,
        algebraic: `${arg}°`,
        arg,
      };
    } else if (op === 'conj1') {
      const conj = CasioEngine.complexConjugate(z1);
      res = {
        label: 'z̄₁ (Số phức liên hợp)',
        algebraic: `${conj.re} ${conj.im >= 0 ? '+' : '-'} ${Math.abs(conj.im)}i`,
      };
    } else if (op === 'polar1') {
      const pol = CasioEngine.complexToPolar(z1, angleMode);
      res = {
        label: 'Dạng lượng giác (r ∠ θ)',
        polar: pol.text,
        algebraic: `${pol.r} (cos(${pol.theta}°) + i sin(${pol.theta}°))`,
      };
    } else if (op === 'pow1') {
      const pow = CasioEngine.complexPower(z1, powerN);
      res = {
        label: `(z₁)^${powerN} (Moivre)`,
        algebraic: `${pow.re} ${pow.im >= 0 ? '+' : '-'} ${Math.abs(pow.im)}i`,
        polar: CasioEngine.complexToPolar(pow, angleMode).text,
      };
    }

    setCplxResult(res);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="font-extrabold text-sm text-white">
            Chế Độ Số Phức (Mode 2: COMPLEX)
          </h3>
        </div>
        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
          Casio fx-580 / 880
        </span>
      </div>

      {/* Input z1 and z2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">Số phức z₁ = a + bi</span>
            <span className="text-[10px] text-slate-500">Mô-đun: {Math.hypot(z1.re, z1.im).toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Phần thực (a)</label>
              <input
                type="number"
                value={z1.re}
                onChange={(e) => setZ1({ ...z1, re: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Phần ảo (b)</label>
              <input
                type="number"
                value={z1.im}
                onChange={(e) => setZ1({ ...z1, im: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Số phức z₂ = c + di</span>
            <span className="text-[10px] text-slate-500">Mô-đun: {Math.hypot(z2.re, z2.im).toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Phần thực (c)</label>
              <input
                type="number"
                value={z2.re}
                onChange={(e) => setZ2({ ...z2, re: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Phần ảo (d)</label>
              <input
                type="number"
                value={z2.im}
                onChange={(e) => setZ2({ ...z2, im: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-300">Phép toán & chuyển đổi số phức:</span>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {[
            { id: 'add', label: 'z₁ + z₂' },
            { id: 'sub', label: 'z₁ - z₂' },
            { id: 'mul', label: 'z₁ × z₂' },
            { id: 'div', label: 'z₁ ÷ z₂' },
            { id: 'mod1', label: 'Abs |z₁|' },
            { id: 'arg1', label: 'arg(z₁)' },
            { id: 'conj1', label: 'Conjg(z̄₁)' },
            { id: 'polar1', label: 'r ∠ θ' },
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => handleCompute(op.id as any)}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-xs font-bold text-slate-300 hover:text-white transition-all text-center"
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Power of z1 */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => handleCompute('pow1')}
            className="p-2 rounded-xl bg-cyan-600/30 border border-cyan-500/50 hover:bg-cyan-600/50 text-xs font-bold text-cyan-200 transition-all"
          >
            Lũy thừa (z₁)^n:
          </button>
          <input
            type="number"
            value={powerN}
            onChange={(e) => setPowerN(parseInt(e.target.value) || 2)}
            className="w-16 bg-slate-950 border border-slate-700 rounded-xl p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Result Display */}
      {cplxResult && (
        <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-2xl space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300">{cplxResult.label}</span>
            {onAskAI && (
              <button
                onClick={() =>
                  onAskAI(
                    `Giải thích chi tiết phép tính số phức: ${cplxResult.label} với z1 = ${z1.re} + ${z1.im}i, z2 = ${z2.re} + ${z2.im}i`
                  )
                }
                className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-lg font-bold hover:bg-cyan-500/30 flex items-center gap-1 font-sans"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI Giải Thích</span>
              </button>
            )}
          </div>
          {cplxResult.algebraic && (
            <div className="text-sm font-extrabold text-white">
              Đại số: <span className="text-cyan-300">{cplxResult.algebraic}</span>
            </div>
          )}
          {cplxResult.polar && (
            <div className="text-xs text-amber-300">
              Lượng giác / Cực: <span className="font-bold">{cplxResult.polar}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
