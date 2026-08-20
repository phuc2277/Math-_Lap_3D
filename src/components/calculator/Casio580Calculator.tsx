import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  History,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Brain,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sliders,
  CheckCircle2,
  QrCode,
  Layers,
  Compass,
  Grid3X3,
  Dices,
  BarChart3,
  Binary,
  ShieldAlert,
} from 'lucide-react';
import { CasioEngine, EquationResult, StatResult } from './casioEngine';
import { AIMathService } from '../../services/aiMathService';
import { IneqPanel } from './panels/IneqPanel';
import { ComplexPanel } from './panels/ComplexPanel';
import { MatrixPanel } from './panels/MatrixPanel';
import { VectorPanel } from './panels/VectorPanel';
import { MathBoxPanel } from './panels/MathBoxPanel';
import { DistPanel } from './panels/DistPanel';
import { BaseNPanel } from './panels/BaseNPanel';
import { CasioQrModal } from './panels/CasioQrModal';

export type CasioMode =
  | 'COMP'
  | 'COMPLEX'
  | 'STAT'
  | 'BASE_N'
  | 'MATRIX'
  | 'VECTOR'
  | 'TABLE'
  | 'EQUATION'
  | 'INEQ'
  | 'DISTRIBUTION'
  | 'MATH_BOX';

interface HistoryItem {
  expression: string;
  result: string;
  timestamp: number;
}

interface Casio580CalculatorProps {
  isModal?: boolean;
  onClose?: () => void;
  onOpenAIExplanation?: (mathProblem: string) => void;
}

export const Casio580Calculator: React.FC<Casio580CalculatorProps> = ({
  isModal = false,
  onClose,
  onOpenAIExplanation,
}) => {
  // Calculator Core State
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('0');
  const [exactResult, setExactResult] = useState<string | null>(null);
  const [showExact, setShowExact] = useState<boolean>(false);
  const [ans, setAns] = useState<number>(0);
  const [preAns, setPreAns] = useState<number>(0);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [variables, setVariables] = useState<Record<string, number>>({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
    x: 0,
    y: 0,
    M: 0,
  });

  // Calculator Modes & Modifiers
  const [currentMode, setCurrentMode] = useState<CasioMode>('COMP');
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [isAlphaActive, setIsAlphaActive] = useState<boolean>(false);
  const [showMenuGrid, setShowMenuGrid] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // EQUATION / SOLVER Sub-States
  const [eqSubtype, setEqSubtype] = useState<'poly2' | 'poly3' | 'poly4' | 'system2' | 'system3'>('poly2');
  const [eqCoeffs, setEqCoeffs] = useState<number[]>([1, -5, 6, 0, 0]);
  const [eqSolution, setEqSolution] = useState<EquationResult | null>(null);

  // TABLE Sub-States
  const [tableFunc, setTableFunc] = useState<string>('x^2 - 2*x - 3');
  const [tableRange, setTableRange] = useState<{ start: number; end: number; step: number }>({
    start: -3,
    end: 5,
    step: 1,
  });
  const [tableData, setTableData] = useState<Array<{ x: number; fx: number; exact?: string }>>([]);

  // STAT Sub-States
  const [statInput, setStatInput] = useState<string>('6.5, 7.0, 8.5, 9.0, 7.5, 8.0, 10, 6.0');
  const [statResults, setStatResults] = useState<StatResult | null>(null);

  // Audio Click Feedback
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickSound = (freq = 600, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      // Audio context might be restricted
    }
  };

  // Append character/symbol to expression
  const handleKeyInput = (text: string) => {
    playClickSound(750);
    setExpression((prev) => prev + text);
    setIsShiftActive(false);
    setIsAlphaActive(false);
  };

  // Delete last character
  const handleDelete = () => {
    playClickSound(450);
    setExpression((prev) => prev.slice(0, -1));
    setIsShiftActive(false);
    setIsAlphaActive(false);
  };

  // Clear All (AC)
  const handleAllClear = () => {
    playClickSound(380);
    setExpression('');
    setResult('0');
    setExactResult(null);
    setShowExact(false);
    setIsShiftActive(false);
    setIsAlphaActive(false);
    setShowMenuGrid(false);
  };

  // Toggle S<=>D (Exact Fraction to Decimal)
  const toggleFractionDecimal = () => {
    playClickSound(700);
    if (exactResult) {
      setShowExact((prev) => !prev);
    }
  };

  // Calculate (= key)
  const handleCalculate = () => {
    playClickSound(900, 'triangle');
    if (!expression.trim()) return;

    try {
      // If expression contains '=' (ALPHA = key), solve numerical equation (SOLVE)
      if (expression.includes('=')) {
        let solveExpr = expression.replace(/Ans/g, `${ans}`).replace(/PreAns/g, `${preAns}`);
        const solveRes = CasioEngine.solveNumericalEquation(solveExpr, variables.x || 0, angleMode);
        if (solveRes) {
          const resStr = `x = ${solveRes.x}  [L - R = ${solveRes.lMinusR}]`;
          setResult(resStr);
          setExactResult(null);
          setShowExact(false);
          setVariables((prev) => ({ ...prev, x: solveRes.x }));
          setHistory((prev) => [
            { expression, result: resStr, timestamp: Date.now() },
            ...prev.slice(0, 19),
          ]);
          return;
        } else {
          setResult("Can't Solve");
          setExactResult(null);
          return;
        }
      }

      let calcExpr = expression;
      calcExpr = calcExpr.replace(/Ans/g, `${ans}`);
      calcExpr = calcExpr.replace(/PreAns/g, `${preAns}`);

      const evalRes = CasioEngine.evaluateExpression(calcExpr, angleMode, variables);

      if (evalRes.error) {
        setResult(evalRes.error);
        setExactResult(null);
      } else {
        const val = evalRes.value;
        const formatted = Number.isInteger(val)
          ? `${val}`
          : Math.abs(val) < 1e-6 || Math.abs(val) > 1e10
          ? val.toExponential(6)
          : `${Number(val.toFixed(8))}`;

        setResult(formatted);
        setExactResult(evalRes.displayExact || null);
        setShowExact(Boolean(evalRes.displayExact));
        setPreAns(ans);
        setAns(val);

        // Add to history
        setHistory((prev) => [
          { expression, result: formatted, timestamp: Date.now() },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err: any) {
      setResult('Syntax ERROR');
      setExactResult(null);
    }
  };

  // SHIFT + CALC (SOLVE)
  const handleSolve = () => {
    playClickSound(950, 'square');
    setIsShiftActive(false);
    setIsAlphaActive(false);

    if (!expression.trim()) {
      setResult('Solve ERROR');
      return;
    }

    try {
      let solveExpr = expression.replace(/Ans/g, `${ans}`).replace(/PreAns/g, `${preAns}`);
      const solveRes = CasioEngine.solveNumericalEquation(solveExpr, variables.x || 0, angleMode);
      if (solveRes) {
        const resStr = `x = ${solveRes.x}  [L - R = ${solveRes.lMinusR}]`;
        setResult(resStr);
        setExactResult(null);
        setShowExact(false);
        setVariables((prev) => ({ ...prev, x: solveRes.x }));
        setHistory((prev) => [
          { expression: `SOLVE: ${expression}`, result: resStr, timestamp: Date.now() },
          ...prev.slice(0, 19),
        ]);
      } else {
        setResult("Can't Solve");
      }
    } catch (err) {
      setResult('Solve ERROR');
    }
  };

  // Solve Equation mode calculation
  const handleSolveEquation = () => {
    playClickSound(850);
    if (eqSubtype === 'poly2') {
      const res = CasioEngine.solveQuadratic(eqCoeffs[0] || 0, eqCoeffs[1] || 0, eqCoeffs[2] || 0);
      setEqSolution(res);
    } else if (eqSubtype === 'poly3') {
      const res = CasioEngine.solveCubic(
        eqCoeffs[0] || 0,
        eqCoeffs[1] || 0,
        eqCoeffs[2] || 0,
        eqCoeffs[3] || 0
      );
      setEqSolution(res);
    } else if (eqSubtype === 'poly4') {
      const res = CasioEngine.solveQuartic(
        eqCoeffs[0] || 0,
        eqCoeffs[1] || 0,
        eqCoeffs[2] || 0,
        eqCoeffs[3] || 0,
        eqCoeffs[4] || 0
      );
      setEqSolution(res);
    } else if (eqSubtype === 'system2') {
      const res = CasioEngine.solveLinear2x2(
        eqCoeffs[0] || 0,
        eqCoeffs[1] || 0,
        eqCoeffs[2] || 0,
        eqCoeffs[3] || 0,
        eqCoeffs[4] || 0,
        eqCoeffs[5] || 0
      );
      setEqSolution(res);
    } else if (eqSubtype === 'system3') {
      const m = [
        [eqCoeffs[0] || 0, eqCoeffs[1] || 0, eqCoeffs[2] || 0, eqCoeffs[3] || 0],
        [eqCoeffs[4] || 0, eqCoeffs[5] || 0, eqCoeffs[6] || 0, eqCoeffs[7] || 0],
        [eqCoeffs[8] || 0, eqCoeffs[9] || 0, eqCoeffs[10] || 0, eqCoeffs[11] || 0],
      ];
      const res = CasioEngine.solveLinear3x3(m);
      setEqSolution(res);
    }
  };

  // Generate Table
  const handleGenerateTable = () => {
    playClickSound(850);
    const rows = CasioEngine.generateTable(
      tableFunc,
      tableRange.start,
      tableRange.end,
      tableRange.step
    );
    setTableData(rows);
  };

  // Compute Statistics
  const handleComputeStat = () => {
    playClickSound(850);
    const rawVals = statInput
      .split(/[,;\s]+/)
      .map((v) => parseFloat(v.trim()))
      .filter((v) => !isNaN(v));

    if (rawVals.length > 0) {
      const stats = CasioEngine.calculateStatistics(rawVals);
      setStatResults(stats);
    }
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleKeyInput(e.key);
      } else if (e.key === '+') {
        handleKeyInput('+');
      } else if (e.key === '-') {
        handleKeyInput('-');
      } else if (e.key === '*') {
        handleKeyInput('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleKeyInput('÷');
      } else if (e.key === '.') {
        handleKeyInput('.');
      } else if (e.key === '(' || e.key === ')') {
        handleKeyInput(e.key);
      } else if (e.key === '^') {
        handleKeyInput('^');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleAllClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, ans, angleMode, variables]);

  // Copy result to clipboard
  const handleCopyResult = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Send to AI for math explanation
  const handleAskAIExplanation = () => {
    let prompt = `Hãy giải thích chi tiết phép tính trên máy tính Casio: "${expression} = ${result}"`;
    if (currentMode === 'EQUATION' && eqSolution) {
      if (eqSubtype === 'poly2') {
        prompt = `Hãy giải thích chi tiết từng bước giải phương trình bậc 2: ${eqCoeffs[0]}x² + ${eqCoeffs[1]}x + ${eqCoeffs[2]} = 0`;
      } else if (eqSubtype === 'poly3') {
        prompt = `Hãy giải thích chi tiết từng bước giải phương trình bậc 3: ${eqCoeffs[0]}x³ + ${eqCoeffs[1]}x² + ${eqCoeffs[2]}x + ${eqCoeffs[3]} = 0`;
      } else if (eqSubtype === 'poly4') {
        prompt = `Hãy giải thích chi tiết từng bước giải phương trình bậc 4: ${eqCoeffs[0]}x⁴ + ${eqCoeffs[1]}x³ + ${eqCoeffs[2]}x² + ${eqCoeffs[3]}x + ${eqCoeffs[4]} = 0`;
      } else if (eqSubtype === 'system2') {
        prompt = `Hãy giải thích chi tiết từng bước giải hệ phương trình 2 ẩn: { ${eqCoeffs[0]}x + ${eqCoeffs[1]}y = ${eqCoeffs[2]}; ${eqCoeffs[3]}x + ${eqCoeffs[4]}y = ${eqCoeffs[5]} }`;
      } else if (eqSubtype === 'system3') {
        prompt = `Hãy giải thích chi tiết từng bước giải hệ 3 phương trình bậc nhất 3 ẩn bằng định thức Cramer hoặc phương pháp khử Gauss.`;
      }
    }
    if (onOpenAIExplanation) {
      onOpenAIExplanation(prompt);
    }
  };

  // Pre-load exam presets
  const applyPreset = (title: string, expr: string) => {
    playClickSound(800);
    setCurrentMode('COMP');
    setExpression(expr);
    setIsShiftActive(false);
    setIsAlphaActive(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 p-2 sm:p-4 max-w-6xl mx-auto select-none">
      {/* ========================================================================= */}
      {/* CASIO FX-580 VN X CLASSWIZ HARDWARE EMULATOR */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[420px] bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-[36px] p-4 sm:p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.15)] border-2 border-slate-800 relative text-white">
        {/* Top Metallic Branding Bar & Solar Panel */}
        <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800/80">
          <div className="flex flex-col">
            <span className="font-extrabold tracking-wider text-sm sm:text-base text-slate-200 font-sans">
              CASIO
            </span>
            <span className="text-[11px] font-black text-amber-400 tracking-widest uppercase">
              fx-580VN X <span className="text-[9px] text-slate-400 font-medium">CLASSWIZ</span>
            </span>
          </div>

          {/* Solar Cell Accent */}
          <div className="w-20 h-6 bg-gradient-to-r from-amber-950/80 via-yellow-900/60 to-amber-950/80 rounded border border-amber-600/40 grid grid-cols-4 gap-0.5 p-0.5 shadow-inner">
            <div className="bg-amber-900/40 rounded-xs"></div>
            <div className="bg-amber-900/40 rounded-xs"></div>
            <div className="bg-amber-900/40 rounded-xs"></div>
            <div className="bg-amber-900/40 rounded-xs"></div>
          </div>

          {/* Audio, QR & History Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                playClickSound(750);
                setShowQrModal(true);
              }}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
              title="Mã QR Casio ClassWiz (Xem đồ thị & kết quả)"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Bật/Tắt âm thanh phím bấm"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-lg transition-colors ${
                showHistory
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Lịch sử tính toán"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LCD NATURAL TEXTBOOK DISPLAY (HIGH CONTRAST DOT MATRIX LOOK) */}
        {/* ========================================================================= */}
        <div className="my-3 bg-[#e2ecdf] dark:bg-[#b9cbb4] text-[#1e2a22] rounded-2xl p-3.5 shadow-[inset_0_3px_10px_rgba(0,0,0,0.4)] border-4 border-slate-800 font-mono relative overflow-hidden h-[128px] flex flex-col justify-between">
          {/* LCD Status Indicators */}
          <div className="flex items-center justify-between text-[10px] font-bold border-b border-[#a3b89d] pb-1">
            <div className="flex items-center gap-1.5">
              {isShiftActive && (
                <span className="px-1 bg-[#1e2a22] text-[#b9cbb4] rounded font-black text-[9px]">
                  S
                </span>
              )}
              {isAlphaActive && (
                <span className="px-1 bg-[#b91c1c] text-white rounded font-black text-[9px]">
                  A
                </span>
              )}
              <span className="font-bold text-[9px] uppercase tracking-wider text-[#2e4033]">
                {currentMode}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
                className="hover:underline font-extrabold text-[9px]"
              >
                [{angleMode}]
              </button>
              <span className="text-[9px] font-bold text-[#2e4033]">MATH</span>
              {showExact && exactResult && (
                <span className="text-[9px] font-black bg-[#2e4033] text-[#b9cbb4] px-1 rounded">
                  a/b
                </span>
              )}
            </div>
          </div>

          {/* Mode Display or Expression Area */}
          {showMenuGrid ? (
            <div className="grid grid-cols-3 gap-1 py-1 text-[11px] font-sans font-bold overflow-y-auto max-h-[85px]">
              {[
                { id: 'COMP', label: '1: Tính toán' },
                { id: 'COMPLEX', label: '2: Số phức' },
                { id: 'STAT', label: '3: Thống kê' },
                { id: 'BASE_N', label: '4: Hệ đếm' },
                { id: 'MATRIX', label: '5: Ma trận' },
                { id: 'VECTOR', label: '6: Véc tơ' },
                { id: 'TABLE', label: '7: Bảng f(x)' },
                { id: 'EQUATION', label: '8: Giải PT' },
                { id: 'INEQ', label: '9: Bất PT' },
                { id: 'DISTRIBUTION', label: 'A: Phân phối' },
                { id: 'MATH_BOX', label: 'B: Math Box' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setCurrentMode(m.id as CasioMode);
                    setShowMenuGrid(false);
                  }}
                  className="p-1 bg-[#a9be9f] hover:bg-[#8ea883] rounded text-left text-[10px] truncate"
                >
                  {m.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Expression Row */}
              <div className="text-left text-sm sm:text-base font-semibold tracking-wide overflow-x-auto whitespace-nowrap scrollbar-none text-[#131b15] h-7 flex items-center">
                {expression || '0'}
                <span className="animate-pulse ml-0.5 inline-block w-1.5 h-4 bg-[#131b15]"></span>
              </div>

              {/* Result Row */}
              <div className="text-right font-extrabold text-lg sm:text-xl tracking-wider text-[#0e1610] overflow-x-auto whitespace-nowrap scrollbar-none flex items-center justify-end gap-2">
                {showExact && exactResult ? (
                  <span className="text-sm font-bold bg-[#9bb094] px-1.5 py-0.5 rounded">
                    = {exactResult}
                  </span>
                ) : null}
                <span>{result}</span>
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TOP NAVIGATION & FUNCTION CONTROL ROW */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-5 gap-2 items-center mb-3">
          {/* SHIFT KEY */}
          <button
            onClick={() => {
              playClickSound(650);
              setIsShiftActive(!isShiftActive);
              setIsAlphaActive(false);
            }}
            className={`flex flex-col items-center justify-center h-10 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
              isShiftActive
                ? 'bg-amber-400 text-black ring-2 ring-amber-300'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 text-amber-300 hover:from-slate-600 hover:to-slate-700'
            }`}
          >
            <span className="text-[10px] font-black uppercase">SHIFT</span>
          </button>

          {/* ALPHA KEY */}
          <button
            onClick={() => {
              playClickSound(650);
              setIsAlphaActive(!isAlphaActive);
              setIsShiftActive(false);
            }}
            className={`flex flex-col items-center justify-center h-10 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
              isAlphaActive
                ? 'bg-rose-500 text-white ring-2 ring-rose-400'
                : 'bg-gradient-to-b from-slate-700 to-slate-800 text-rose-400 hover:from-slate-600 hover:to-slate-700'
            }`}
          >
            <span className="text-[10px] font-black uppercase">ALPHA</span>
          </button>

          {/* REPLAY NAVIGATION D-PAD (CENTER) */}
          <div className="col-span-1 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 p-1 flex flex-col items-center justify-between shadow-lg">
              <button
                onClick={() => playClickSound(700)}
                className="w-full flex justify-center text-slate-400 hover:text-white"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <div className="flex w-full justify-between items-center px-1">
                <button
                  onClick={() => playClickSound(700)}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => playClickSound(700)}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => playClickSound(700)}
                className="w-full flex justify-center text-slate-400 hover:text-white"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* MENU / SETUP */}
          <button
            onClick={() => {
              playClickSound(650);
              setShowMenuGrid(!showMenuGrid);
            }}
            className="flex flex-col items-center justify-center h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 font-bold text-xs shadow-md active:scale-95"
          >
            <span className="text-[9px] text-amber-300 font-bold">SETUP</span>
            <span className="text-[10px]">MENU</span>
          </button>

          {/* ON / RESET */}
          <button
            onClick={handleAllClear}
            className="flex flex-col items-center justify-center h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-200 font-bold text-xs shadow-md active:scale-95"
          >
            <span className="text-[10px]">ON</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SCIENTIFIC FUNCTION KEYPAD ROWS */}
        {/* ========================================================================= */}
        <div className="space-y-2 mb-3">
          {/* ROW 1: OPTN, CALC, d/dx, ∫, √, x² */}
          <div className="grid grid-cols-6 gap-1.5">
            {[
              {
                main: 'OPTN',
                shift: 'QR',
                alpha: '',
                action: () => {
                  if (isShiftActive) {
                    setShowQrModal(true);
                    setIsShiftActive(false);
                  } else {
                    setShowMenuGrid(!showMenuGrid);
                  }
                },
              },
              {
                main: 'CALC',
                shift: 'SOLVE',
                alpha: '=',
                action: () => {
                  if (isShiftActive) {
                    handleSolve();
                  } else if (isAlphaActive) {
                    handleKeyInput('=');
                  } else {
                    handleCalculate();
                  }
                },
              },
              {
                main: '∫dx',
                shift: 'd/dx',
                alpha: ':',
                action: () => {
                  if (isShiftActive) handleKeyInput('d/dx(');
                  else if (isAlphaActive) handleKeyInput(' : ');
                  else handleKeyInput('∫(');
                },
              },
              {
                main: 'x²',
                shift: 'x³',
                alpha: '',
                action: () => handleKeyInput(isShiftActive ? '³' : '²'),
              },
              {
                main: 'x^■',
                shift: '■√■',
                alpha: '',
                action: () => handleKeyInput('^'),
              },
              {
                main: 'log',
                shift: '10^x',
                alpha: 'e^■',
                action: () => {
                  if (isShiftActive) handleKeyInput('10^(');
                  else if (isAlphaActive) handleKeyInput('e^(');
                  else handleKeyInput('log(');
                },
              },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className={`flex flex-col items-center justify-between py-1 px-0.5 h-10 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow active:scale-95 transition-all ${
                  (isAlphaActive && btn.alpha) ? 'ring-1 ring-rose-500/80 bg-rose-950/30' : ''
                } ${
                  (isShiftActive && btn.shift) ? 'ring-1 ring-amber-400/80 bg-amber-950/30' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full px-1 leading-none">
                  <span className={`text-[8px] font-bold ${isShiftActive && btn.shift ? 'text-amber-300 font-black scale-105' : 'text-amber-400/80'}`}>
                    {btn.shift || ''}
                  </span>
                  <span className={`text-[8px] font-bold ${isAlphaActive && btn.alpha ? 'text-rose-400 font-black scale-105 animate-pulse' : 'text-rose-400/80'}`}>
                    {btn.alpha || ''}
                  </span>
                </div>
                <span className="text-[11px] leading-tight font-medium">{btn.main}</span>
              </button>
            ))}
          </div>

          {/* ROW 2: a/b, √, x⁻¹, sin, cos, tan */}
          <div className="grid grid-cols-6 gap-1.5">
            {[
              {
                main: '■/□',
                shift: 'd/c',
                alpha: '',
                action: () => handleKeyInput('÷'),
              },
              {
                main: '√■',
                shift: '∛■',
                alpha: '',
                action: () => handleKeyInput(isShiftActive ? '∛(' : '√('),
              },
              {
                main: 'x⁻¹',
                shift: 'x!',
                alpha: 'C',
                action: () => {
                  if (isShiftActive) handleKeyInput('!');
                  else if (isAlphaActive) handleKeyInput('C');
                  else handleKeyInput('^(-1)');
                },
              },
              {
                main: 'sin',
                shift: 'sin⁻¹',
                alpha: 'D',
                action: () => {
                  if (isShiftActive) handleKeyInput('sin⁻¹(');
                  else if (isAlphaActive) handleKeyInput('D');
                  else handleKeyInput('sin(');
                },
              },
              {
                main: 'cos',
                shift: 'cos⁻¹',
                alpha: 'E',
                action: () => {
                  if (isShiftActive) handleKeyInput('cos⁻¹(');
                  else if (isAlphaActive) handleKeyInput('E');
                  else handleKeyInput('cos(');
                },
              },
              {
                main: 'tan',
                shift: 'tan⁻¹',
                alpha: 'F',
                action: () => {
                  if (isShiftActive) handleKeyInput('tan⁻¹(');
                  else if (isAlphaActive) handleKeyInput('F');
                  else handleKeyInput('tan(');
                },
              },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className={`flex flex-col items-center justify-between py-1 px-0.5 h-10 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow active:scale-95 transition-all ${
                  (isAlphaActive && btn.alpha) ? 'ring-1 ring-rose-500/80 bg-rose-950/30' : ''
                } ${
                  (isShiftActive && btn.shift) ? 'ring-1 ring-amber-400/80 bg-amber-950/30' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full px-1 leading-none">
                  <span className={`text-[8px] font-bold ${isShiftActive && btn.shift ? 'text-amber-300 font-black scale-105' : 'text-amber-400/80'}`}>
                    {btn.shift || ''}
                  </span>
                  <span className={`text-[8px] font-bold ${isAlphaActive && btn.alpha ? 'text-rose-400 font-black scale-105 animate-pulse' : 'text-rose-400/80'}`}>
                    {btn.alpha || ''}
                  </span>
                </div>
                <span className="text-[11px] leading-tight font-medium">{btn.main}</span>
              </button>
            ))}
          </div>

          {/* ROW 3: ln, (, ), S<=>D, M+, (-) */}
          <div className="grid grid-cols-6 gap-1.5">
            {[
              {
                main: 'ln',
                shift: 'e^x',
                alpha: '',
                action: () => handleKeyInput(isShiftActive ? 'e^(' : 'ln('),
              },
              {
                main: '(',
                shift: '%',
                alpha: 'x',
                action: () => {
                  if (isShiftActive) handleKeyInput('%');
                  else if (isAlphaActive) handleKeyInput('x');
                  else handleKeyInput('(');
                },
              },
              {
                main: ')',
                shift: ',',
                alpha: 'y',
                action: () => {
                  if (isShiftActive) handleKeyInput(',');
                  else if (isAlphaActive) handleKeyInput('y');
                  else handleKeyInput(')');
                },
              },
              {
                main: 'S<=>D',
                shift: 'a b/c',
                alpha: '',
                action: toggleFractionDecimal,
              },
              {
                main: 'M+',
                shift: 'M-',
                alpha: 'M',
                action: () => {
                  if (isAlphaActive) handleKeyInput('M');
                  else if (isShiftActive) handleKeyInput('-');
                  else handleKeyInput('+');
                },
              },
              {
                main: '(-)',
                shift: 'FACT',
                alpha: 'A',
                action: () => {
                  if (isShiftActive) {
                    const num = parseFloat(result) || ans;
                    if (num > 0) {
                      setResult(CasioEngine.primeFactorization(num));
                      setIsShiftActive(false);
                    }
                  } else if (isAlphaActive) {
                    handleKeyInput('A');
                  } else {
                    handleKeyInput('(-');
                  }
                },
              },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                className={`flex flex-col items-center justify-between py-1 px-0.5 h-10 rounded-lg bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow active:scale-95 transition-all ${
                  (isAlphaActive && btn.alpha) ? 'ring-1 ring-rose-500/80 bg-rose-950/30' : ''
                } ${
                  (isShiftActive && btn.shift) ? 'ring-1 ring-amber-400/80 bg-amber-950/30' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full px-1 leading-none">
                  <span className={`text-[8px] font-bold ${isShiftActive && btn.shift ? 'text-amber-300 font-black scale-105' : 'text-amber-400/80'}`}>
                    {btn.shift || ''}
                  </span>
                  <span className={`text-[8px] font-bold ${isAlphaActive && btn.alpha ? 'text-rose-400 font-black scale-105 animate-pulse' : 'text-rose-400/80'}`}>
                    {btn.alpha || ''}
                  </span>
                </div>
                <span className="text-[11px] leading-tight font-medium">{btn.main}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NUMERIC & ARITHMETIC KEYPAD (AUTHENTIC CASIO LAYOUT WITH ALPHA & SHIFT) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-5 gap-2">
          {/* ROW 1: 7, 8, 9, DEL, AC */}
          {[
            {
              main: '7',
              shift: 'CONST',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => handleKeyInput('7'),
            },
            {
              main: '8',
              shift: 'CONV',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => handleKeyInput('8'),
            },
            {
              main: '9',
              shift: 'RESET',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => handleKeyInput('9'),
            },
            {
              main: 'DEL',
              shift: 'INS',
              alpha: '',
              style: 'bg-gradient-to-b from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-extrabold text-xs tracking-wider',
              action: handleDelete,
            },
            {
              main: 'AC',
              shift: 'OFF',
              alpha: '',
              style: 'bg-gradient-to-b from-rose-700 to-rose-900 hover:from-rose-600 hover:to-rose-800 text-white font-extrabold text-xs tracking-wider',
              action: handleAllClear,
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className={`h-11 rounded-xl font-bold text-base shadow active:scale-95 flex flex-col items-center justify-between py-1 transition-all ${btn.style}`}
            >
              <div className="flex items-center justify-between w-full px-1.5 leading-none">
                <span className="text-[7.5px] text-amber-300/90 font-bold">{btn.shift || ''}</span>
                <span className="text-[7.5px] text-rose-400 font-bold">{btn.alpha || ''}</span>
              </div>
              <span className="text-sm font-black">{btn.main}</span>
            </button>
          ))}

          {/* ROW 2: 4, 5, 6, × (GCD), ÷ (LCM) */}
          {[
            {
              main: '4',
              shift: 'MATRIX',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isShiftActive) {
                  setCurrentMode('MATRIX');
                  setIsShiftActive(false);
                } else {
                  handleKeyInput('4');
                }
              },
            },
            {
              main: '5',
              shift: 'VECTOR',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isShiftActive) {
                  setCurrentMode('VECTOR');
                  setIsShiftActive(false);
                } else {
                  handleKeyInput('5');
                }
              },
            },
            {
              main: '6',
              shift: '',
              alpha: 'B',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isAlphaActive) handleKeyInput('B');
                else handleKeyInput('6');
              },
            },
            {
              main: '×',
              shift: 'nPr',
              alpha: 'GCD',
              style: 'bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-lg',
              action: () => {
                if (isAlphaActive) handleKeyInput('GCD(');
                else if (isShiftActive) handleKeyInput(' P ');
                else handleKeyInput('×');
              },
            },
            {
              main: '÷',
              shift: 'nCr',
              alpha: 'LCM',
              style: 'bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-lg',
              action: () => {
                if (isAlphaActive) handleKeyInput('LCM(');
                else if (isShiftActive) handleKeyInput(' C ');
                else handleKeyInput('÷');
              },
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className={`h-11 rounded-xl font-bold shadow active:scale-95 flex flex-col items-center justify-between py-1 transition-all ${btn.style} ${
                (isAlphaActive && btn.alpha) ? 'ring-1 ring-rose-500 bg-rose-950/40' : ''
              } ${
                (isShiftActive && btn.shift) ? 'ring-1 ring-amber-400 bg-amber-950/40' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full px-1.5 leading-none">
                <span className={`text-[7.5px] font-bold ${isShiftActive && btn.shift ? 'text-amber-300 font-black' : 'text-amber-300/90'}`}>{btn.shift || ''}</span>
                <span className={`text-[7.5px] font-bold ${isAlphaActive && btn.alpha ? 'text-rose-400 font-black animate-pulse' : 'text-rose-400'}`}>{btn.alpha || ''}</span>
              </div>
              <span className="text-sm font-black">{btn.main}</span>
            </button>
          ))}

          {/* ROW 3: 1, 2, 3, + (Pol / Int), - (Rec / Intg) */}
          {[
            {
              main: '1',
              shift: 'STAT',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isShiftActive) {
                  setCurrentMode('STAT');
                  setIsShiftActive(false);
                } else {
                  handleKeyInput('1');
                }
              },
            },
            {
              main: '2',
              shift: 'CPLX',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isShiftActive) {
                  setCurrentMode('COMPLEX');
                  setIsShiftActive(false);
                } else {
                  handleKeyInput('2');
                }
              },
            },
            {
              main: '3',
              shift: 'BASE',
              alpha: '',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isShiftActive) {
                  setCurrentMode('BASE_N');
                  setIsShiftActive(false);
                } else {
                  handleKeyInput('3');
                }
              },
            },
            {
              main: '+',
              shift: 'Pol',
              alpha: 'Int',
              style: 'bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-lg',
              action: () => {
                if (isAlphaActive) handleKeyInput('Int(');
                else if (isShiftActive) handleKeyInput('Pol(');
                else handleKeyInput('+');
              },
            },
            {
              main: '-',
              shift: 'Rec',
              alpha: 'Intg',
              style: 'bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-lg',
              action: () => {
                if (isAlphaActive) handleKeyInput('Intg(');
                else if (isShiftActive) handleKeyInput('Rec(');
                else handleKeyInput('-');
              },
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className={`h-11 rounded-xl font-bold shadow active:scale-95 flex flex-col items-center justify-between py-1 transition-all ${btn.style} ${
                (isAlphaActive && btn.alpha) ? 'ring-1 ring-rose-500 bg-rose-950/40' : ''
              } ${
                (isShiftActive && btn.shift) ? 'ring-1 ring-amber-400 bg-amber-950/40' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full px-1.5 leading-none">
                <span className={`text-[7.5px] font-bold ${isShiftActive && btn.shift ? 'text-amber-300 font-black' : 'text-amber-300/90'}`}>{btn.shift || ''}</span>
                <span className={`text-[7.5px] font-bold ${isAlphaActive && btn.alpha ? 'text-rose-400 font-black animate-pulse' : 'text-rose-400'}`}>{btn.alpha || ''}</span>
              </div>
              <span className="text-sm font-black">{btn.main}</span>
            </button>
          ))}

          {/* ROW 4: 0 (RanInt#), . (Ran#), ×10ˣ (e), Ans (PreAns), = */}
          {[
            {
              main: '0',
              shift: 'Rnd',
              alpha: 'RanInt#',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isAlphaActive) handleKeyInput('RanInt#(');
                else handleKeyInput('0');
              },
            },
            {
              main: '.',
              shift: 'Ran#',
              alpha: 'Ran#',
              style: 'bg-slate-800 hover:bg-slate-700 text-white',
              action: () => {
                if (isAlphaActive || isShiftActive) handleKeyInput('Ran#');
                else handleKeyInput('.');
              },
            },
            {
              main: '×10ˣ',
              shift: 'π',
              alpha: 'e',
              style: 'bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs',
              action: () => {
                if (isAlphaActive) handleKeyInput('e');
                else if (isShiftActive) handleKeyInput('π');
                else handleKeyInput('*10^');
              },
            },
            {
              main: 'Ans',
              shift: '%',
              alpha: 'PreAns',
              style: 'bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold text-xs',
              action: () => {
                if (isAlphaActive) handleKeyInput('PreAns');
                else if (isShiftActive) handleKeyInput('%');
                else handleKeyInput('Ans');
              },
            },
            {
              main: '=',
              shift: '≈',
              alpha: '',
              style: 'bg-gradient-to-b from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white font-black text-xl shadow-lg shadow-sky-500/20',
              action: handleCalculate,
            },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              className={`h-11 rounded-xl font-bold shadow active:scale-95 flex flex-col items-center justify-between py-1 transition-all ${btn.style} ${
                (isAlphaActive && btn.alpha) ? 'ring-1 ring-rose-500 bg-rose-950/40' : ''
              } ${
                (isShiftActive && btn.shift) ? 'ring-1 ring-amber-400 bg-amber-950/40' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full px-1.5 leading-none">
                <span className={`text-[7.5px] font-bold ${isShiftActive && btn.shift ? 'text-amber-300 font-black' : 'text-amber-300/90'}`}>{btn.shift || ''}</span>
                <span className={`text-[7.5px] font-bold ${isAlphaActive && btn.alpha ? 'text-rose-400 font-black animate-pulse' : 'text-rose-400'}`}>{btn.alpha || ''}</span>
              </div>
              <span className="text-sm font-black">{btn.main}</span>
            </button>
          ))}
        </div>

        {/* Bottom AI Assistant Trigger Button on Hardware Frame */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyResult}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          <button
            onClick={handleAskAIExplanation}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-bold shadow-md flex items-center gap-1.5 transition-all"
            title="Nhờ AI Gemini 3.1 Pro giải thích chi tiết bước tính"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>✨ AI Giải Thích</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SIDEBAR PANELS: EXAM PRESETS, SOLVER, TABLE, STAT & HISTORY */}
      {/* ========================================================================= */}
      <div className="w-full max-w-xl space-y-4 text-slate-200">
        {/* Mode Switcher Tabs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {[
            { id: 'COMP', label: '1. Tính toán (COMP)' },
            { id: 'EQUATION', label: '8. Giải PT / Hệ PT' },
            { id: 'INEQ', label: '9. Bất PT (Bậc 2-4)' },
            { id: 'COMPLEX', label: '2. Số phức (CPLX)' },
            { id: 'MATRIX', label: '5. Ma trận (Matrix)' },
            { id: 'VECTOR', label: '6. Véc tơ (Vector)' },
            { id: 'MATH_BOX', label: '🎲 Math Box (880BTG)' },
            { id: 'TABLE', label: '7. Bảng f(x)' },
            { id: 'STAT', label: '3. Thống kê (Stat)' },
            { id: 'DISTRIBUTION', label: 'A. Phân phối (Dist)' },
            { id: 'BASE_N', label: '4. Hệ đếm & Tỉ lệ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound(550);
                setCurrentMode(tab.id as CasioMode);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                currentMode === tab.id
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. COMP MODE: Quick Presets */}
        {currentMode === 'COMP' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Ví dụ & Mẫu tính toán THCS / THPT</span>
              </h3>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-bold">
                Casio fx-580
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  label: '📐 Pitago: c = √(3² + 4²)',
                  expr: '√(3² + 4²)',
                },
                {
                  label: '⭕ Diện tích hình tròn: π × 5²',
                  expr: 'π × 5²',
                },
                {
                  label: '📈 Lượng giác: sin(30) + cos(60)',
                  expr: 'sin(30) + cos(60)',
                },
                {
                  label: '🎲 Tổ hợp: 10 C 3 (Chọn 3 từ 10)',
                  expr: '10 C 3',
                },
                {
                  label: '⚡ Tích phân: ∫ (x²) dx từ 0 đến 3',
                  expr: '9',
                },
                {
                  label: '🔍 Căn lồng: √(7 + 4√3)',
                  expr: '√(7 + 4*√(3))',
                },
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p.label, p.expr)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-sky-500 text-left text-xs space-y-1 transition-all group"
                >
                  <div className="font-bold text-slate-300 group-hover:text-white">{p.label}</div>
                  <div className="font-mono text-[11px] text-sky-400">{p.expr}</div>
                </button>
              ))}
            </div>

            {/* Quick Math Shortcuts Guide */}
            <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300">💡 Hướng dẫn thao tác nhanh:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Nhấn phím số và phép tính trên bàn phím máy tính trực tiếp.</li>
                <li>Phím <kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">Enter</kbd> để tính bằng (=), <kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">Backspace</kbd> để xóa (DEL), <kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">Esc</kbd> để xóa hết (AC).</li>
                <li>Nhấn nút <strong className="text-sky-300">S⇔D</strong> để chuyển đổi giữa Phân số tối giản và Số thập phân.</li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. EQUATION MODE: Solver Panel */}
        {currentMode === 'EQUATION' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Giải Phương Trình & Hệ Phương Trình (Mode 9 / 8)</span>
              </h3>
            </div>

            {/* Sub-mode selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'poly2', label: 'Bậc 2 (ax²+bx+c=0)' },
                { id: 'poly3', label: 'Bậc 3 (ax³+bx²+cx+d=0)' },
                { id: 'poly4', label: 'Bậc 4 (ax⁴+bx³+cx²+dx+e=0)' },
                { id: 'system2', label: 'Hệ 2 ẩn' },
                { id: 'system3', label: 'Hệ 3 ẩn' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    setEqSubtype(sub.id as any);
                    setEqSolution(null);
                  }}
                  className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    eqSubtype === sub.id
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Inputs based on subtype */}
            <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Nhập các hệ số:</span>
                {eqSubtype === 'poly4' && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    ax⁴ + bx³ + cx² + dx + e = 0
                  </span>
                )}
              </div>

              {eqSubtype === 'poly2' && (
                <div className="grid grid-cols-3 gap-2">
                  {['a', 'b', 'c'].map((lbl, idx) => (
                    <div key={lbl}>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">{lbl}</label>
                      <input
                        type="number"
                        value={eqCoeffs[idx] ?? 0}
                        onChange={(e) => {
                          const n = [...eqCoeffs];
                          n[idx] = parseFloat(e.target.value) || 0;
                          setEqCoeffs(n);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {eqSubtype === 'poly3' && (
                <div className="grid grid-cols-4 gap-2">
                  {['a', 'b', 'c', 'd'].map((lbl, idx) => (
                    <div key={lbl}>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">{lbl}</label>
                      <input
                        type="number"
                        value={eqCoeffs[idx] ?? 0}
                        onChange={(e) => {
                          const n = [...eqCoeffs];
                          n[idx] = parseFloat(e.target.value) || 0;
                          setEqCoeffs(n);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {eqSubtype === 'poly4' && (
                <div className="grid grid-cols-5 gap-2">
                  {['a (x⁴)', 'b (x³)', 'c (x²)', 'd (x)', 'e (hằng số)'].map((lbl, idx) => (
                    <div key={lbl}>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1 text-center truncate" title={lbl}>
                        {lbl}
                      </label>
                      <input
                        type="number"
                        value={eqCoeffs[idx] ?? (idx === 0 ? 1 : 0)}
                        onChange={(e) => {
                          const n = [...eqCoeffs];
                          n[idx] = parseFloat(e.target.value) || 0;
                          setEqCoeffs(n);
                        }}
                        className="w-full bg-slate-900 border border-purple-500/40 rounded-xl p-2 text-center text-sm font-bold text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  ))}
                </div>
              )}

              {eqSubtype === 'system2' && (
                <div className="grid grid-cols-3 gap-2">
                  {['a1', 'b1', 'c1 (vế phải)', 'a2', 'b2', 'c2 (vế phải)'].map((lbl, idx) => (
                    <div key={lbl}>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">{lbl}</label>
                      <input
                        type="number"
                        value={eqCoeffs[idx] ?? 0}
                        onChange={(e) => {
                          const n = [...eqCoeffs];
                          n[idx] = parseFloat(e.target.value) || 0;
                          setEqCoeffs(n);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              {eqSubtype === 'system3' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-400 font-medium">Hệ 3 phương trình: a·x + b·y + c·z = d</div>
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="grid grid-cols-4 gap-2">
                      {['a', 'b', 'c', 'd'].map((col, cIdx) => {
                        const idx = row * 4 + cIdx;
                        return (
                          <div key={col}>
                            <label className="text-[9px] text-slate-500 font-bold block mb-0.5">
                              {col}{row + 1}
                            </label>
                            <input
                              type="number"
                              value={eqCoeffs[idx] ?? 0}
                              onChange={(e) => {
                                const n = [...eqCoeffs];
                                n[idx] = parseFloat(e.target.value) || 0;
                                setEqCoeffs(n);
                              }}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSolveEquation}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-extrabold text-xs text-white shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>TÍNH NGHIỆM (=)</span>
              </button>
            </div>

            {/* Solution Display */}
            {eqSolution && (
              <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-2">
                <span className="font-bold text-xs text-purple-300">Kết quả giải phương trình:</span>
                {eqSolution.message && (
                  <div className="font-bold text-amber-300 text-sm">{eqSolution.message}</div>
                )}
                <div className="space-y-1 font-mono text-sm">
                  {eqSolution.roots.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-white">
                      <span className="font-bold text-purple-300">{r.label} =</span>
                      <span className="font-extrabold">
                        {r.exact || r.real.toFixed(4)}
                        {r.imag ? ` + ${r.imag.toFixed(4)}i` : ''}
                      </span>
                    </div>
                  ))}

                  {eqSolution.extrema &&
                    eqSolution.extrema.map((ex, idx) => (
                      <div key={idx} className="pt-2 border-t border-purple-800/60 text-xs text-amber-300 flex justify-between">
                        <span>{ex.label}:</span>
                        <span>x = {ex.x.toFixed(4)}, y = {ex.y.toFixed(4)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. TABLE MODE: Value Table Panel */}
        {currentMode === 'TABLE' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                Bảng Giá Trị Hàm Số f(x) (Table Mode)
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Hàm số f(x):
                </label>
                <input
                  type="text"
                  value={tableFunc}
                  onChange={(e) => setTableFunc(e.target.value)}
                  placeholder="VD: x^2 - 2*x - 3"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Start (Bắt đầu)</label>
                  <input
                    type="number"
                    value={tableRange.start}
                    onChange={(e) =>
                      setTableRange({ ...tableRange, start: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">End (Kết thúc)</label>
                  <input
                    type="number"
                    value={tableRange.end}
                    onChange={(e) =>
                      setTableRange({ ...tableRange, end: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">Step (Bước nhảy)</label>
                  <input
                    type="number"
                    value={tableRange.step}
                    onChange={(e) =>
                      setTableRange({ ...tableRange, step: parseFloat(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-center text-sm font-bold text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateTable}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 font-extrabold text-xs text-white shadow-lg shadow-sky-500/30 transition-all"
              >
                TẠO BẢNG GIÁ TRỊ (=)
              </button>
            </div>

            {/* Generated Table View */}
            {tableData.length > 0 && (
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">STT</th>
                      <th className="p-2">x</th>
                      <th className="p-2">f(x)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="border-t border-slate-900 hover:bg-slate-900/50">
                        <td className="p-2 text-slate-500">{idx + 1}</td>
                        <td className="p-2 font-bold text-sky-400">{row.x}</td>
                        <td className="p-2 font-extrabold text-white">
                          {row.exact || row.fx}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. STAT MODE: Statistics Panel */}
        {currentMode === 'STAT' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white">
                Thống Kê 1 Biến (1-Variable Statistics)
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nhập mẫu số liệu (cách nhau bởi dấu phẩy hoặc khoảng trắng):
                </label>
                <textarea
                  rows={3}
                  value={statInput}
                  onChange={(e) => setStatInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <button
                onClick={handleComputeStat}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-extrabold text-xs text-white shadow-lg transition-all"
              >
                TÍNH THỐNG KÊ (=)
              </button>

              {statResults && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Cỡ mẫu (n):</span>
                    <span className="text-sm font-bold text-white">{statResults.n}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Trung bình (x̄):</span>
                    <span className="text-sm font-bold text-sky-400">
                      {statResults.mean.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Độ lệch chuẩn (σ):</span>
                    <span className="text-sm font-bold text-amber-400">
                      {statResults.stdDev.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Trung vị (Med):</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {statResults.median}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Tứ phân vị (Q1 / Q3):</span>
                    <span className="text-xs font-bold text-white">
                      {statResults.q1} / {statResults.q3}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">Min / Max:</span>
                    <span className="text-xs font-bold text-white">
                      {statResults.min} - {statResults.max}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. INEQ MODE (Bất phương trình) */}
        {currentMode === 'INEQ' && (
          <IneqPanel onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* 6. COMPLEX MODE (Số phức) */}
        {currentMode === 'COMPLEX' && (
          <ComplexPanel angleMode={angleMode} onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* 7. MATRIX MODE (Ma trận) */}
        {currentMode === 'MATRIX' && (
          <MatrixPanel onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* 8. VECTOR MODE (Véc tơ) */}
        {currentMode === 'VECTOR' && (
          <VectorPanel onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* 9. MATH BOX MODE (fx-880BTG) */}
        {currentMode === 'MATH_BOX' && (
          <MathBoxPanel onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* 10. DISTRIBUTION MODE (Phân phối xác suất) */}
        {currentMode === 'DISTRIBUTION' && (
          <DistPanel onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* 11. BASE-N & RATIO MODE */}
        {currentMode === 'BASE_N' && (
          <BaseNPanel onAskAI={onOpenAIExplanation} playClickSound={playClickSound} />
        )}

        {/* Calculation History Drawer */}
        {showHistory && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-xs text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-400" />
                <span>Lịch sử các phép tính gần đây</span>
              </h3>
              <button
                onClick={() => setHistory([])}
                className="text-[10px] text-rose-400 hover:underline"
              >
                Xóa lịch sử
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">Chưa có phép tính nào</div>
              ) : (
                history.map((h, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setExpression(h.expression);
                      setResult(h.result);
                    }}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer text-xs flex items-center justify-between font-mono"
                  >
                    <span className="text-slate-400 truncate max-w-[200px]">{h.expression}</span>
                    <span className="font-bold text-sky-400">= {h.result}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Casio ClassWiz QR Modal */}
      <CasioQrModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        expression={expression}
        result={result}
        mode={currentMode}
      />
    </div>
  );
};

export default Casio580Calculator;
