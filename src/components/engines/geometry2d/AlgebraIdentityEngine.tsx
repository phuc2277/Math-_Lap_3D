import React, { useState, useRef, useEffect } from 'react';
import { ModelParams, DisplayOptions } from '../../../types/geometry';
import { Calculator, CheckCircle2, Eye, EyeOff, Sparkles, Sliders, Info, Mouse } from 'lucide-react';

interface AlgebraIdentityEngineProps {
  params: ModelParams;
  displayOptions?: DisplayOptions;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
}

type ModeTab = 'monomial' | 'sq_sum' | 'poly_mult';

export const AlgebraIdentityEngine: React.FC<AlgebraIdentityEngineProps> = ({
  params,
  displayOptions,
  onParamChange,
}) => {
  const [activeTab, setActiveTab] = useState<ModeTab>('monomial');
  const [step, setStep] = useState<number>(1);
  // Default to general algebraic mode (a, b, c) as requested. Concrete values can be toggled on/off.
  const [showConcreteValues, setShowConcreteValues] = useState<boolean>(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [wheelToast, setWheelToast] = useState<{ message: string; key: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showLabels = displayOptions?.showLabels ?? true;

  // Parameters
  const a = params.a ?? 4;
  const b = params.b ?? 5;
  const c = params.c ?? 8;
  const d = params.d ?? 0; // Optional 3rd term for polynomial a(b + c + d)

  const handleParamChange = (key: keyof ModelParams, val: number) => {
    if (onParamChange) onParamChange(key, val);
  };

  const showToast = (message: string, key: string) => {
    setWheelToast({ message, key });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setWheelToast(null);
    }, 1400);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Mouse Scroll Wheel handler
  const handleWheel = (
    e: React.WheelEvent,
    targetKey: 'a' | 'b' | 'c' | 'd' | 'auto' = 'auto'
  ) => {
    e.stopPropagation();
    const isUp = e.deltaY < 0;
    const delta = isUp ? 0.5 : -0.5;

    let keyToChange: 'a' | 'b' | 'c' | 'd' = 'a';

    if (targetKey !== 'auto') {
      keyToChange = targetKey;
    } else {
      // Determine by hoveredRegion or active tab
      if (hoveredRegion === 'a' || hoveredRegion === 'left_a') {
        keyToChange = 'a';
      } else if (hoveredRegion === 'b' || hoveredRegion === 'ab' || hoveredRegion === 'bc') {
        keyToChange = 'b';
      } else if (hoveredRegion === 'c' || hoveredRegion === 'ac') {
        keyToChange = 'c';
      } else if (hoveredRegion === 'd' || hoveredRegion === 'ad' || hoveredRegion === 'bd') {
        keyToChange = 'd';
      } else if (hoveredRegion === 'a2') {
        keyToChange = 'a';
      } else if (hoveredRegion === 'b2') {
        keyToChange = 'b';
      } else {
        // Default on general canvas
        if (activeTab === 'monomial') keyToChange = 'a';
        else if (activeTab === 'sq_sum') keyToChange = 'a';
        else keyToChange = 'a';
      }
    }

    let min = 1;
    let max = 10;
    let currentVal = a;

    if (keyToChange === 'a') {
      min = 1;
      max = 10;
      currentVal = a;
    } else if (keyToChange === 'b') {
      min = 1;
      max = 10;
      currentVal = b;
    } else if (keyToChange === 'c') {
      min = 1;
      max = 10;
      currentVal = c;
    } else if (keyToChange === 'd') {
      min = 0;
      max = 8;
      currentVal = d;
    }

    const newVal = Math.max(min, Math.min(max, Math.round((currentVal + delta) * 10) / 10));
    if (newVal !== currentVal) {
      handleParamChange(keyToChange, newVal);
      const symbol = keyToChange;
      const changeText = isUp ? '+0.5' : '-0.5';
      showToast(
        `Cạnh ${symbol} = ${newVal} cm (${changeText})`,
        keyToChange
      );
    }
  };

  // Calculations for Monomial x Polynomial: a(b + c + d)
  const ab = a * b;
  const ac = a * c;
  const ad = a * d;
  const totalWidthMonomial = b + c + d;
  const totalAreaMonomial = a * totalWidthMonomial;

  // Calculations for Square of Sum: (a + b)^2
  const a2 = a * a;
  const b2 = b * b;
  const totalSideSquare = a + b;
  const totalAreaSquare = totalSideSquare * totalSideSquare;

  // Calculations for Poly x Poly: (a + b)(c + d)
  const polyC = c > 0 ? c : 4;
  const polyD = d > 0 ? d : 3;
  const polyArea_ac = a * polyC;
  const polyArea_ad = a * polyD;
  const polyArea_bc = b * polyC;
  const polyArea_bd = b * polyD;
  const totalPolyHeight = a + b;
  const totalPolyWidth = polyC + polyD;
  const totalAreaPoly = totalPolyHeight * totalPolyWidth;

  // SVG Dimensioning
  const svgWidth = 500;
  const svgHeight = 360;
  const paddingX = 75;
  const paddingY = 60;

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 font-extrabold text-amber-400">
          <Calculator className="w-5 h-5 text-amber-300 flex-shrink-0" />
          <span className="tracking-wide">MÔ HÌNH DIỆN TÍCH ĐẠI SỐ</span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('monomial'); setStep(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'monomial'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            a(b + c) = ab + ac
          </button>
          <button
            onClick={() => { setActiveTab('sq_sum'); setStep(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'sq_sum'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            (a + b)²
          </button>
          <button
            onClick={() => { setActiveTab('poly_mult'); setStep(1); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'poly_mult'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            (a + b)(c + d)
          </button>
        </div>
      </div>

      {/* Main Interactive Content */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-between p-4 sm:p-5 gap-5 overflow-auto">
        {/* Left Column: Visual Canvas Stage */}
        <div 
          className="flex-1 flex flex-col items-center justify-center bg-slate-900/90 p-4 sm:p-6 rounded-2xl border border-slate-800/80 w-full min-h-[380px] relative"
          onWheel={(e) => handleWheel(e, 'auto')}
        >
          {/* Wheel Feedback Floating Toast */}
          {wheelToast && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-amber-500/95 text-slate-950 px-3.5 py-1.5 rounded-full font-mono font-extrabold text-xs shadow-xl shadow-amber-500/30 border border-amber-300 animate-bounce">
              <Mouse className="w-3.5 h-3.5" />
              <span>{wheelToast.message}</span>
            </div>
          )}
          
          {/* Top Controls on Canvas: Explicit General vs Concrete Toggle */}
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3 text-xs">
            {/* General vs Concrete Mode Toggle & Scroll Hint */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setShowConcreteValues(false)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                    !showConcreteValues
                      ? 'bg-sky-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Hiển thị độ dài mang tính tổng quát (a, b, c)"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tổng quát: a, b, c</span>
                </button>

                <button
                  onClick={() => setShowConcreteValues(true)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                    showConcreteValues
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Bật hiển thị số đo độ dài cụ thể (ví dụ: a = 4cm, b = 5cm, c = 8cm)"
                >
                  {showConcreteValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>Số đo cụ thể (cm)</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] text-amber-300/80 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Mouse className="w-3 h-3 text-amber-400" />
                <span>Lăn chuột 🖱️ để chỉnh kích thước</span>
              </div>
            </div>

            {/* Step Wizard Buttons */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-end sm:self-auto">
              <span className="text-[10px] text-slate-400 px-1 font-bold">Bước {step}/4</span>
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-all ${
                    step === s
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* SVG RENDERER FOR MONOMIAL MULTIPLICATION: a(b + c) = ab + ac */}
          {activeTab === 'monomial' && (() => {
            const maxW = totalWidthMonomial;
            const maxH = a;
            const scaleX = (svgWidth - paddingX * 2) / Math.max(8, maxW);
            const scaleY = (svgHeight - paddingY * 2) / Math.max(6, maxH);
            const scale = Math.min(scaleX, scaleY);

            const wB = b * scale;
            const wC = c * scale;
            const wD = d * scale;
            const hA = a * scale;

            const startX = paddingX + ((svgWidth - paddingX * 2) - (wB + wC + wD)) / 2;
            const startY = paddingY + ((svgHeight - paddingY * 2) - hA) / 2;

            return (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full max-w-[500px] max-h-[380px] overflow-visible"
              >
                {/* Outline rectangle for total area a(b + c) */}
                <rect
                  x={startX}
                  y={startY}
                  width={wB + wC + wD}
                  height={hA}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  onWheel={(e) => handleWheel(e, 'a')}
                  className="cursor-ns-resize"
                />

                {/* Region 1: ab (Sky Rectangle) */}
                <rect
                  x={startX}
                  y={startY}
                  width={wB}
                  height={hA}
                  onMouseEnter={() => setHoveredRegion('ab')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onWheel={(e) => handleWheel(e, 'b')}
                  className={`transition-all duration-300 stroke-sky-400 cursor-pointer ${
                    hoveredRegion === 'ab' ? 'fill-sky-400/50 stroke-sky-300 stroke-[3]' : 'fill-sky-500/30'
                  }`}
                  strokeWidth="2.5"
                />
                {showLabels && (
                  <text
                    x={startX + wB / 2}
                    y={startY + hA / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-sky-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none drop-shadow-md"
                  >
                    {step === 1 ? '' : showConcreteValues ? `ab = ${ab} cm²` : 'ab'}
                  </text>
                )}

                {/* Region 2: ac (Amber Rectangle) */}
                <rect
                  x={startX + wB}
                  y={startY}
                  width={wC}
                  height={hA}
                  onMouseEnter={() => setHoveredRegion('ac')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onWheel={(e) => handleWheel(e, 'c')}
                  className={`transition-all duration-300 stroke-amber-400 cursor-pointer ${
                    hoveredRegion === 'ac' ? 'fill-amber-400/50 stroke-amber-300 stroke-[3]' : 'fill-amber-500/30'
                  }`}
                  strokeWidth="2.5"
                />
                {showLabels && (
                  <text
                    x={startX + wB + wC / 2}
                    y={startY + hA / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none drop-shadow-md"
                  >
                    {step === 1 ? '' : showConcreteValues ? `ac = ${ac} cm²` : 'ac'}
                  </text>
                )}

                {/* Optional Region 3: ad (Emerald Rectangle if d > 0) */}
                {d > 0 && (
                  <>
                    <rect
                      x={startX + wB + wC}
                      y={startY}
                      width={wD}
                      height={hA}
                      onMouseEnter={() => setHoveredRegion('ad')}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onWheel={(e) => handleWheel(e, 'd')}
                      className={`transition-all duration-300 stroke-emerald-400 cursor-pointer ${
                        hoveredRegion === 'ad' ? 'fill-emerald-400/50 stroke-emerald-300 stroke-[3]' : 'fill-emerald-500/30'
                      }`}
                      strokeWidth="2.5"
                    />
                    {showLabels && (
                      <text
                        x={startX + wB + wC + wD / 2}
                        y={startY + hA / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-emerald-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none drop-shadow-md"
                      >
                        {step === 1 ? '' : showConcreteValues ? `ad = ${ad} cm²` : 'ad'}
                      </text>
                    )}
                  </>
                )}

                {/* Top Labels (Width dimensions b, c, d) */}
                {showLabels && (
                  <>
                    {/* Segment b */}
                    <g onWheel={(e) => handleWheel(e, 'b')} className="cursor-ew-resize">
                      <text
                        x={startX + wB / 2}
                        y={startY - 14}
                        textAnchor="middle"
                        className="fill-sky-300 font-mono font-bold text-xs sm:text-sm hover:fill-white transition-colors"
                      >
                        {showConcreteValues ? `b = ${b} cm` : 'b'}
                      </text>
                      <line
                        x1={startX + 2}
                        y1={startY - 8}
                        x2={startX + wB - 2}
                        y2={startY - 8}
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                      />
                    </g>

                    {/* Segment c */}
                    <g onWheel={(e) => handleWheel(e, 'c')} className="cursor-ew-resize">
                      <text
                        x={startX + wB + wC / 2}
                        y={startY - 14}
                        textAnchor="middle"
                        className="fill-amber-300 font-mono font-bold text-xs sm:text-sm hover:fill-white transition-colors"
                      >
                        {showConcreteValues ? `c = ${c} cm` : 'c'}
                      </text>
                      <line
                        x1={startX + wB + 2}
                        y1={startY - 8}
                        x2={startX + wB + wC - 2}
                        y2={startY - 8}
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                      />
                    </g>

                    {/* Optional Segment d */}
                    {d > 0 && (
                      <g onWheel={(e) => handleWheel(e, 'd')} className="cursor-ew-resize">
                        <text
                          x={startX + wB + wC + wD / 2}
                          y={startY - 14}
                          textAnchor="middle"
                          className="fill-emerald-300 font-mono font-bold text-xs sm:text-sm hover:fill-white transition-colors"
                        >
                          {showConcreteValues ? `d = ${d} cm` : 'd'}
                        </text>
                        <line
                          x1={startX + wB + wC + 2}
                          y1={startY - 8}
                          x2={startX + wB + wC + wD - 2}
                          y2={startY - 8}
                          stroke="#10b981"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}

                    {/* Total Width Indicator on Top */}
                    <line
                      x1={startX}
                      y1={startY - 32}
                      x2={startX + wB + wC + wD}
                      y2={startY - 32}
                      stroke="#facc15"
                      strokeWidth="1.5"
                    />
                    <text
                      x={startX + (wB + wC + wD) / 2}
                      y={startY - 38}
                      textAnchor="middle"
                      className="fill-amber-300 font-mono font-extrabold text-xs sm:text-sm"
                    >
                      {showConcreteValues
                        ? `Tổng đáy (b + c${d > 0 ? ' + d' : ''}) = ${totalWidthMonomial} cm`
                        : `b + c${d > 0 ? ' + d' : ''}`}
                    </text>
                  </>
                )}

                {/* Left Label (Monomial Height a) */}
                {showLabels && (
                  <g onWheel={(e) => handleWheel(e, 'a')} className="cursor-ns-resize">
                    <text
                      x={startX - 18}
                      y={startY + hA / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-sky-300 font-mono font-extrabold text-sm sm:text-base hover:fill-white transition-colors"
                    >
                      {showConcreteValues ? `a = ${a} cm` : 'a'}
                    </text>
                    <line
                      x1={startX - 10}
                      y1={startY}
                      x2={startX - 10}
                      y2={startY + hA}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>
            );
          })()}

          {/* SVG RENDERER FOR SQUARE OF SUM: (a + b)^2 */}
          {activeTab === 'sq_sum' && (() => {
            const side = totalSideSquare;
            const scale = (svgWidth - paddingX * 2) / Math.max(8, side);
            const wA = a * scale;
            const wB = b * scale;

            const startX = paddingX + ((svgWidth - paddingX * 2) - (wA + wB)) / 2;
            const startY = paddingY + ((svgHeight - paddingY * 2) - (wA + wB)) / 2;

            return (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full max-w-[500px] max-h-[380px] overflow-visible"
              >
                {/* Total Outline */}
                <rect
                  x={startX}
                  y={startY}
                  width={wA + wB}
                  height={wA + wB}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />

                {/* Region 1: a^2 */}
                <rect
                  x={startX}
                  y={startY}
                  width={wA}
                  height={wA}
                  onMouseEnter={() => setHoveredRegion('a2')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onWheel={(e) => handleWheel(e, 'a')}
                  className="fill-sky-500/35 stroke-sky-400 stroke-[2.5] hover:fill-sky-500/50 cursor-pointer transition-all"
                />
                {showLabels && (
                  <text
                    x={startX + wA / 2}
                    y={startY + wA / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-sky-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none"
                  >
                    {showConcreteValues ? `a² = ${a2} cm²` : 'a²'}
                  </text>
                )}

                {/* Region 2: ab top-right */}
                <rect
                  x={startX + wA}
                  y={startY}
                  width={wB}
                  height={wA}
                  onMouseEnter={() => setHoveredRegion('ab')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onWheel={(e) => handleWheel(e, 'b')}
                  className="fill-amber-500/35 stroke-amber-400 stroke-[2.5] hover:fill-amber-500/50 cursor-pointer transition-all"
                />
                {showLabels && (
                  <text
                    x={startX + wA + wB / 2}
                    y={startY + wA / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none"
                  >
                    {showConcreteValues ? `ab = ${a * b} cm²` : 'ab'}
                  </text>
                )}

                {/* Region 3: ab bottom-left */}
                <rect
                  x={startX}
                  y={startY + wA}
                  width={wA}
                  height={wB}
                  onMouseEnter={() => setHoveredRegion('ab')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onWheel={(e) => handleWheel(e, 'a')}
                  className="fill-amber-500/35 stroke-amber-400 stroke-[2.5] hover:fill-amber-500/50 cursor-pointer transition-all"
                />
                {showLabels && (
                  <text
                    x={startX + wA / 2}
                    y={startY + wA + wB / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none"
                  >
                    {showConcreteValues ? `ab = ${a * b} cm²` : 'ab'}
                  </text>
                )}

                {/* Region 4: b^2 */}
                <rect
                  x={startX + wA}
                  y={startY + wA}
                  width={wB}
                  height={wB}
                  onMouseEnter={() => setHoveredRegion('b2')}
                  onMouseLeave={() => setHoveredRegion(null)}
                  onWheel={(e) => handleWheel(e, 'b')}
                  className="fill-emerald-500/35 stroke-emerald-400 stroke-[2.5] hover:fill-emerald-500/50 cursor-pointer transition-all"
                />
                {showLabels && (
                  <text
                    x={startX + wA + wB / 2}
                    y={startY + wA + wB / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-emerald-100 font-mono font-extrabold text-sm sm:text-base pointer-events-none"
                  >
                    {showConcreteValues ? `b² = ${b2} cm²` : 'b²'}
                  </text>
                )}

                {/* Side Labels */}
                {showLabels && (
                  <>
                    <g onWheel={(e) => handleWheel(e, 'a')} className="cursor-ew-resize">
                      <text x={startX + wA / 2} y={startY - 14} textAnchor="middle" className="fill-sky-300 font-mono text-xs sm:text-sm font-bold hover:fill-white">
                        {showConcreteValues ? `a = ${a} cm` : 'a'}
                      </text>
                    </g>
                    <g onWheel={(e) => handleWheel(e, 'b')} className="cursor-ew-resize">
                      <text x={startX + wA + wB / 2} y={startY - 14} textAnchor="middle" className="fill-amber-300 font-mono text-xs sm:text-sm font-bold hover:fill-white">
                        {showConcreteValues ? `b = ${b} cm` : 'b'}
                      </text>
                    </g>

                    {/* Total top indicator */}
                    <line x1={startX} y1={startY - 28} x2={startX + wA + wB} y2={startY - 28} stroke="#facc15" strokeWidth="1.5" />
                    <text x={startX + (wA + wB) / 2} y={startY - 34} textAnchor="middle" className="fill-amber-300 font-mono font-extrabold text-xs">
                      {showConcreteValues ? `Cạnh (a + b) = ${totalSideSquare} cm` : 'a + b'}
                    </text>

                    {/* Left labels */}
                    <g onWheel={(e) => handleWheel(e, 'a')} className="cursor-ns-resize">
                      <text x={startX - 16} y={startY + wA / 2} textAnchor="end" dominantBaseline="middle" className="fill-sky-300 font-mono text-xs sm:text-sm font-bold hover:fill-white">
                        {showConcreteValues ? `a = ${a} cm` : 'a'}
                      </text>
                    </g>
                    <g onWheel={(e) => handleWheel(e, 'b')} className="cursor-ns-resize">
                      <text x={startX - 16} y={startY + wA + wB / 2} textAnchor="end" dominantBaseline="middle" className="fill-amber-300 font-mono text-xs sm:text-sm font-bold hover:fill-white">
                        {showConcreteValues ? `b = ${b} cm` : 'b'}
                      </text>
                    </g>
                  </>
                )}
              </svg>
            );
          })()}

          {/* SVG RENDERER FOR POLY X POLY: (a + b)(c + d) */}
          {activeTab === 'poly_mult' && (() => {
            const scaleX = (svgWidth - paddingX * 2) / Math.max(8, totalPolyWidth);
            const scaleY = (svgHeight - paddingY * 2) / Math.max(8, totalPolyHeight);
            const scale = Math.min(scaleX, scaleY);

            const wC = polyC * scale;
            const wD = polyD * scale;
            const hA = a * scale;
            const hB = b * scale;

            const startX = paddingX + ((svgWidth - paddingX * 2) - (wC + wD)) / 2;
            const startY = paddingY + ((svgHeight - paddingY * 2) - (hA + hB)) / 2;

            return (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full max-w-[500px] max-h-[380px] overflow-visible"
              >
                {/* Region ac */}
                <rect 
                  x={startX} y={startY} width={wC} height={hA} 
                  onWheel={(e) => handleWheel(e, 'a')}
                  className="fill-sky-500/35 stroke-sky-400 stroke-[2.5] hover:fill-sky-500/50 cursor-pointer transition-all" 
                />
                {showLabels && <text x={startX + wC / 2} y={startY + hA / 2} textAnchor="middle" dominantBaseline="middle" className="fill-sky-100 font-mono font-extrabold text-sm pointer-events-none">{showConcreteValues ? `ac = ${polyArea_ac} cm²` : 'ac'}</text>}

                {/* Region ad */}
                <rect 
                  x={startX + wC} y={startY} width={wD} height={hA} 
                  onWheel={(e) => handleWheel(e, 'd')}
                  className="fill-amber-500/35 stroke-amber-400 stroke-[2.5] hover:fill-amber-500/50 cursor-pointer transition-all" 
                />
                {showLabels && <text x={startX + wC + wD / 2} y={startY + hA / 2} textAnchor="middle" dominantBaseline="middle" className="fill-amber-100 font-mono font-extrabold text-sm pointer-events-none">{showConcreteValues ? `ad = ${polyArea_ad} cm²` : 'ad'}</text>}

                {/* Region bc */}
                <rect 
                  x={startX} y={startY + hA} width={wC} height={hB} 
                  onWheel={(e) => handleWheel(e, 'b')}
                  className="fill-rose-500/35 stroke-rose-400 stroke-[2.5] hover:fill-rose-500/50 cursor-pointer transition-all" 
                />
                {showLabels && <text x={startX + wC / 2} y={startY + hA + hB / 2} textAnchor="middle" dominantBaseline="middle" className="fill-rose-100 font-mono font-extrabold text-sm pointer-events-none">{showConcreteValues ? `bc = ${polyArea_bc} cm²` : 'bc'}</text>}

                {/* Region bd */}
                <rect 
                  x={startX + wC} y={startY + hA} width={wD} height={hB} 
                  onWheel={(e) => handleWheel(e, 'd')}
                  className="fill-emerald-500/35 stroke-emerald-400 stroke-[2.5] hover:fill-emerald-500/50 cursor-pointer transition-all" 
                />
                {showLabels && <text x={startX + wC + wD / 2} y={startY + hA + hB / 2} textAnchor="middle" dominantBaseline="middle" className="fill-emerald-100 font-mono font-extrabold text-sm pointer-events-none">{showConcreteValues ? `bd = ${polyArea_bd} cm²` : 'bd'}</text>}

                {/* Outer Labels */}
                {showLabels && (
                  <>
                    <g onWheel={(e) => handleWheel(e, 'c')} className="cursor-ew-resize">
                      <text x={startX + wC / 2} y={startY - 14} textAnchor="middle" className="fill-sky-300 font-mono font-bold text-xs sm:text-sm hover:fill-white">{showConcreteValues ? `c = ${polyC} cm` : 'c'}</text>
                    </g>
                    <g onWheel={(e) => handleWheel(e, 'd')} className="cursor-ew-resize">
                      <text x={startX + wC + wD / 2} y={startY - 14} textAnchor="middle" className="fill-amber-300 font-mono font-bold text-xs sm:text-sm hover:fill-white">{showConcreteValues ? `d = ${polyD} cm` : 'd'}</text>
                    </g>
                    <g onWheel={(e) => handleWheel(e, 'a')} className="cursor-ns-resize">
                      <text x={startX - 16} y={startY + hA / 2} textAnchor="end" dominantBaseline="middle" className="fill-sky-300 font-mono font-bold text-xs sm:text-sm hover:fill-white">{showConcreteValues ? `a = ${a} cm` : 'a'}</text>
                    </g>
                    <g onWheel={(e) => handleWheel(e, 'b')} className="cursor-ns-resize">
                      <text x={startX - 16} y={startY + hA + hB / 2} textAnchor="end" dominantBaseline="middle" className="fill-rose-300 font-mono font-bold text-xs sm:text-sm hover:fill-white">{showConcreteValues ? `b = ${b} cm` : 'b'}</text>
                    </g>
                  </>
                )}
              </svg>
            );
          })()}

          {/* Interactive Step-by-Step Description Banner */}
          <div className="w-full mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-200">
            {activeTab === 'monomial' && (
              <p className="text-center font-medium">
                {step === 1 && (
                  <span>
                    <strong>Bước 1:</strong> Xét hình chữ nhật tổng kích thước cạnh chiều cao <span className="text-sky-300 font-mono font-bold">{showConcreteValues ? `a = ${a} cm` : 'a'}</span> và độ dài đáy <span className="text-amber-300 font-mono font-bold">{showConcreteValues ? `(b + c${d > 0 ? ' + d' : ''}) = ${totalWidthMonomial} cm` : `b + c${d > 0 ? ' + d' : ''}`}</span> có diện tích tổng <strong className="text-amber-400 font-mono">{showConcreteValues ? `S = a(b + c) = ${totalAreaMonomial} cm²` : 'S = a(b + c)'}</strong>.
                  </span>
                )}
                {step === 2 && (
                  <span>
                    <strong>Bước 2:</strong> Chia cạnh đáy thành các đoạn <span className="text-sky-300 font-mono font-bold">{showConcreteValues ? `b = ${b} cm` : 'b'}</span>, <span className="text-amber-300 font-mono font-bold">{showConcreteValues ? `c = ${c} cm` : 'c'}</span>{d > 0 ? `, ${showConcreteValues ? `d = ${d} cm` : 'd'}` : ''}.
                  </span>
                )}
                {step === 3 && (
                  <span>
                    <strong>Bước 3:</strong> Cắt hình chữ nhật thành các mảnh tương ứng: <span className="text-sky-300 font-mono font-bold">S₁ = {showConcreteValues ? `ab = ${ab} cm²` : 'ab'}</span>, <span className="text-amber-300 font-mono font-bold">S₂ = {showConcreteValues ? `ac = ${ac} cm²` : 'ac'}</span>{d > 0 ? `, S₃ = ${showConcreteValues ? `ad = ${ad} cm²` : 'ad'}` : ''}.
                  </span>
                )}
                {step === 4 && (
                  <span className="text-amber-300 font-extrabold font-mono">
                    Bước 4 Kết luận: a(b + c{d > 0 ? ' + d' : ''}) = ab + ac{d > 0 ? ' + ad' : ''}
                    {showConcreteValues && ` ⇔ ${a}(${b} + ${c}${d > 0 ? ` + ${d}` : ''}) = ${ab} + ${ac}${d > 0 ? ` + ${ad}` : ''} = ${totalAreaMonomial} cm²`}
                  </span>
                )}
              </p>
            )}

            {activeTab === 'sq_sum' && (
              <p className="text-center font-medium">
                Hình vuông lớn cạnh <strong className="text-amber-400 font-mono">{showConcreteValues ? `(a + b) = ${totalSideSquare} cm` : '(a + b)'}</strong> được phân chia thành 4 hình: 1 hình vuông <strong className="text-sky-300 font-mono">{showConcreteValues ? `a² = ${a2} cm²` : 'a²'}</strong>, 2 hình chữ nhật <strong className="text-amber-300 font-mono">{showConcreteValues ? `2ab = ${2 * a * b} cm²` : '2ab'}</strong>, và 1 hình vuông <strong className="text-emerald-300 font-mono">{showConcreteValues ? `b² = ${b2} cm²` : 'b²'}</strong>.
              </p>
            )}

            {activeTab === 'poly_mult' && (
              <p className="text-center font-medium">
                Nhân đa thức với đa thức <strong className="text-amber-300 font-mono">(a + b)(c + d) = ac + ad + bc + bd</strong>
                {showConcreteValues && ` = ${polyArea_ac} + ${polyArea_ad} + ${polyArea_bc} + ${polyArea_bd} = ${totalAreaPoly} cm²`}.
              </p>
            )}
          </div>
        </div>

        {/* Right Controls and Parameter Sliders Panel */}
        <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between gap-4 flex-shrink-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Sliders className="w-4 h-4" />
                THÔNG SỐ & ĐỘ DÀI
              </span>
              <button
                onClick={() => setShowConcreteValues(!showConcreteValues)}
                className="text-[11px] font-mono px-2 py-0.5 rounded border border-amber-500/40 text-amber-300 hover:bg-amber-950/60 transition-all flex items-center gap-1"
                title="Bật/Tắt hiển thị số đo cụ thể"
              >
                {showConcreteValues ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
                <span>{showConcreteValues ? 'Hiện số đo' : 'Ẩn số đo'}</span>
              </button>
            </div>

            {/* MONOMIAL TAB SLIDERS */}
            {activeTab === 'monomial' && (
              <div className="space-y-3.5">
                {/* Monomial Height Slider (a) */}
                <div className="space-y-1" onWheel={(e) => handleWheel(e, 'a')}>
                  <div className="flex justify-between text-xs">
                    <span className="text-sky-300 font-bold">Cạnh đơn thức (a):</span>
                    <span className="font-mono font-bold text-sky-200 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                      {showConcreteValues ? `a = ${a} cm` : `a (${a})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={a}
                    onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* First Term Slider (b) */}
                <div className="space-y-1" onWheel={(e) => handleWheel(e, 'b')}>
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-300 font-bold">Cạnh hạng tử 1 (b):</span>
                    <span className="font-mono font-bold text-amber-200 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      {showConcreteValues ? `b = ${b} cm` : `b (${b})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={b}
                    onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Second Term Slider (c) */}
                <div className="space-y-1" onWheel={(e) => handleWheel(e, 'c')}>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-300 font-bold">Cạnh hạng tử 2 (c):</span>
                    <span className="font-mono font-bold text-emerald-200 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      {showConcreteValues ? `c = ${c} cm` : `c (${c})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={c}
                    onChange={(e) => handleParamChange('c', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                {/* Optional Third Term Slider (d) */}
                <div className="space-y-1 pt-1 border-t border-slate-800" onWheel={(e) => handleWheel(e, 'd')}>
                  <div className="flex justify-between text-xs">
                    <span className="text-rose-300 font-bold">Cạnh hạng tử 3 (d - tùy chọn):</span>
                    <span className="font-mono font-bold text-rose-200 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                      {showConcreteValues ? `d = ${d} cm` : `d (${d})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={8}
                    step={0.5}
                    value={d}
                    onChange={(e) => handleParamChange('d', parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* SQUARE OF SUM SLIDERS */}
            {activeTab === 'sq_sum' && (
              <div className="space-y-3.5">
                <div className="space-y-1" onWheel={(e) => handleWheel(e, 'a')}>
                  <div className="flex justify-between text-xs">
                    <span className="text-sky-300 font-bold">Cạnh a:</span>
                    <span className="font-mono font-bold text-sky-200 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                      {showConcreteValues ? `a = ${a} cm` : `a (${a})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={a}
                    onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1" onWheel={(e) => handleWheel(e, 'b')}>
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-300 font-bold">Cạnh b:</span>
                    <span className="font-mono font-bold text-amber-200 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      {showConcreteValues ? `b = ${b} cm` : `b (${b})`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={b}
                    onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* POLY X POLY SLIDERS */}
            {activeTab === 'poly_mult' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1" onWheel={(e) => handleWheel(e, 'a')}>
                    <span className="text-sky-300 text-[11px] font-bold">Cạnh a:</span>
                    <input
                      type="range" min={1} max={8} step={0.5} value={a}
                      onChange={(e) => handleParamChange('a', parseFloat(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                  <div className="space-y-1" onWheel={(e) => handleWheel(e, 'b')}>
                    <span className="text-rose-300 text-[11px] font-bold">Cạnh b:</span>
                    <input
                      type="range" min={1} max={8} step={0.5} value={b}
                      onChange={(e) => handleParamChange('b', parseFloat(e.target.value))}
                      className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1" onWheel={(e) => handleWheel(e, 'c')}>
                    <span className="text-sky-300 text-[11px] font-bold">Cạnh c:</span>
                    <input
                      type="range" min={1} max={8} step={0.5} value={c}
                      onChange={(e) => handleParamChange('c', parseFloat(e.target.value))}
                      className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                  <div className="space-y-1" onWheel={(e) => handleWheel(e, 'd')}>
                    <span className="text-amber-300 text-[11px] font-bold">Cạnh d:</span>
                    <input
                      type="range" min={1} max={8} step={0.5} value={d || 3}
                      onChange={(e) => handleParamChange('d', parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* REALTIME AREA BREAKDOWN */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                Phân tích diện tích:
              </div>

              {activeTab === 'monomial' && (
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-sky-300">
                    <span>1. Mảnh S₁ (ab):</span>
                    <span className="font-bold">{showConcreteValues ? `${a} × ${b} = ${ab} cm²` : 'a × b'}</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>2. Mảnh S₂ (ac):</span>
                    <span className="font-bold">{showConcreteValues ? `${a} × ${c} = ${ac} cm²` : 'a × c'}</span>
                  </div>
                  {d > 0 && (
                    <div className="flex justify-between text-emerald-300">
                      <span>3. Mảnh S₃ (ad):</span>
                      <span className="font-bold">{showConcreteValues ? `${a} × ${d} = ${ad} cm²` : 'a × d'}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-amber-400 text-xs">
                    <span>Tổng diện tích S:</span>
                    <span>{showConcreteValues ? `${totalAreaMonomial} cm²` : `a(b + c${d > 0 ? ' + d' : ''})`}</span>
                  </div>
                </div>
              )}

              {activeTab === 'sq_sum' && (
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-sky-300"><span>1. Hình vuông a²:</span><span>{showConcreteValues ? `${a2} cm²` : 'a²'}</span></div>
                  <div className="flex justify-between text-amber-300"><span>2. Hai HCN 2ab:</span><span>{showConcreteValues ? `2 × (${a} × ${b}) = ${2 * a * b} cm²` : '2ab'}</span></div>
                  <div className="flex justify-between text-emerald-300"><span>3. Hình vuông b²:</span><span>{showConcreteValues ? `${b2} cm²` : 'b²'}</span></div>
                  <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-amber-400">
                    <span>Tổng S = (a + b)²:</span><span>{showConcreteValues ? `${totalAreaSquare} cm²` : '(a + b)²'}</span>
                  </div>
                </div>
              )}

              {activeTab === 'poly_mult' && (
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-sky-300"><span>S₁ (ac):</span><span>{showConcreteValues ? `${polyArea_ac} cm²` : 'ac'}</span></div>
                  <div className="flex justify-between text-amber-300"><span>S₂ (ad):</span><span>{showConcreteValues ? `${polyArea_ad} cm²` : 'ad'}</span></div>
                  <div className="flex justify-between text-rose-300"><span>S₃ (bc):</span><span>{showConcreteValues ? `${polyArea_bc} cm²` : 'bc'}</span></div>
                  <div className="flex justify-between text-emerald-300"><span>S₄ (bd):</span><span>{showConcreteValues ? `${polyArea_bd} cm²` : 'bd'}</span></div>
                  <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-amber-400">
                    <span>Tổng S:</span><span>{showConcreteValues ? `${totalAreaPoly} cm²` : '(a+b)(c+d)'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FORMULA PROOF BOX */}
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Đẳng thức đại số:</span>
            </div>
            {activeTab === 'monomial' && (
              <div className="space-y-1">
                <p className="font-mono text-center text-xs font-extrabold text-amber-300 bg-slate-950/80 py-1.5 px-2 rounded-lg border border-amber-500/30">
                  a(b + c{d > 0 ? ' + d' : ''}) = ab + ac{d > 0 ? ' + ad' : ''}
                </p>
                {showConcreteValues && (
                  <p className="font-mono text-center text-[11px] text-slate-300 bg-slate-900/80 py-1 px-2 rounded border border-slate-800">
                    {a}({b} + {c}{d > 0 ? ` + ${d}` : ''}) = {ab} + {ac}{d > 0 ? ` + ${ad}` : ''} = {totalAreaMonomial} cm²
                  </p>
                )}
              </div>
            )}
            {activeTab === 'sq_sum' && (
              <div className="space-y-1">
                <p className="font-mono text-center text-xs font-extrabold text-amber-300 bg-slate-950/80 py-1.5 px-2 rounded-lg border border-amber-500/30">
                  (a + b)² = a² + 2ab + b²
                </p>
                {showConcreteValues && (
                  <p className="font-mono text-center text-[11px] text-slate-300 bg-slate-900/80 py-1 px-2 rounded border border-slate-800">
                    ({a} + {b})² = {a2} + {2 * a * b} + {b2} = {totalAreaSquare} cm²
                  </p>
                )}
              </div>
            )}
            {activeTab === 'poly_mult' && (
              <div className="space-y-1">
                <p className="font-mono text-center text-xs font-extrabold text-amber-300 bg-slate-950/80 py-1.5 px-2 rounded-lg border border-amber-500/30">
                  (a + b)(c + d) = ac + ad + bc + bd
                </p>
                {showConcreteValues && (
                  <p className="font-mono text-center text-[11px] text-slate-300 bg-slate-900/80 py-1 px-2 rounded border border-slate-800">
                    ({a}+{b})({polyC}+{polyD}) = {polyArea_ac}+{polyArea_ad}+{polyArea_bc}+{polyArea_bd} = {totalAreaPoly} cm²
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


