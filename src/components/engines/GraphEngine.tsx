import React, { useState, useRef, useEffect } from 'react';
import { ModelParams } from '../../types/geometry';
import { MathEngine, LinearIntersection, ParabolaLineIntersection } from '../../engine/MathEngine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Table as TableIcon,
  Activity,
  Grid,
  Eye,
  Maximize2,
  Minimize2,
  Sliders,
  Layers,
  Sparkles,
  Move,
  Info,
  Play,
  Pause,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface GraphEngineProps {
  params: ModelParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
  graphConfig?: {
    mode?:
      | 'linear_slope'
      | 'parallel_lines'
      | 'perpendicular_lines'
      | 'linear_intersection'
      | 'slope_triangle'
      | 'parabola_basic'
      | 'parabola_line'
      | 'parabola_shift';
  };
}

export const GraphEngine: React.FC<GraphEngineProps> = ({
  params,
  onParamChange,
  graphConfig,
}) => {
  const mode = graphConfig?.mode || 'linear_slope';

  // Fullscreen mode state
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && wrapperRef.current) {
      if (wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(!isFullscreen);
        });
      } else {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Local parameter overrides for instant UI reactivity
  const [localParams, setLocalParams] = useState<Record<string, number>>({});

  const handleUpdateParam = (key: keyof ModelParams, value: number) => {
    const rounded = Math.round(value * 10) / 10;
    setLocalParams((prev) => ({ ...prev, [key]: rounded }));
    if (onParamChange) {
      onParamChange(key, rounded);
    }
  };

  // Effective Parameters
  const effA = localParams.a ?? params.a ?? 1;
  const effB = localParams.b ?? params.b ?? 0;
  const effA1 = localParams.a1 ?? params.a1 ?? effA;
  const effB1 = localParams.b1 ?? params.b1 ?? effB;
  const effA2 = localParams.a2 ?? params.a2 ?? (mode === 'perpendicular_lines' ? (effA1 !== 0 ? -1 / effA1 : -1) : 1);
  const effB2 = localParams.b2 ?? params.b2 ?? 2;
  const effM = localParams.m ?? params.m ?? 1;
  const effN = localParams.n ?? params.n ?? 2;
  const effH = localParams.h ?? params.h ?? 0;
  const effK = localParams.k ?? params.k ?? 0;

  // Auto-Rotation / Animated transition for coefficient `a` (Tự xoay từ a dương sang a âm)
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [rotationSpeed, setRotationSpeed] = useState<'slow' | 'medium'>('slow');
  const animAngleRef = useRef<number>(Math.PI / 2); // angle in radians to drive sin wave for smooth continuous back-and-forth

  useEffect(() => {
    if (!isAutoRotating) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Speed multiplier: slow = 0.6 rad/s, medium = 1.2 rad/s
      const speed = rotationSpeed === 'slow' ? 0.6 : 1.2;
      animAngleRef.current += dt * speed;

      // Map sin wave [-1, 1] to amplitude [-3.5, 3.5]
      const currentA = Number((Math.sin(animAngleRef.current) * 3.5).toFixed(1));

      setLocalParams((prev) => ({
        ...prev,
        a: currentA,
        a1: currentA,
      }));

      if (onParamChange) {
        onParamChange('a', currentA);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isAutoRotating, rotationSpeed, onParamChange]);

  // Mode: Single Graph vs Dual Graph (So sánh 2 đồ thị)
  const [activeGraphCount, setActiveGraphCount] = useState<1 | 2>(
    mode === 'parallel_lines' || mode === 'perpendicular_lines' || mode === 'linear_intersection' ? 2 : 1
  );

  // Parabola vs Line Correlation View Toggle
  const [showParabolaLine, setShowParabolaLine] = useState<boolean>(mode === 'parabola_line');

  // Canvas / Coordinate System Viewport State
  const [scale, setScale] = useState<number>(35); // pixels per unit
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // offset from center
  const [showTable, setShowTable] = useState<boolean>(true);
  const [showSlopeTriangle, setShowSlopeTriangle] = useState<boolean>(true);
  const [selectedPointX, setSelectedPointX] = useState<number>(2);

  // Mouse Drag / Panning & Hover State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 480 });

  // Handle ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(300, entry.contentRect.width),
          height: Math.max(300, entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const centerX = dimensions.width / 2 + pan.x;
  const centerY = dimensions.height / 2 + pan.y;

  // Convert Math (x, y) to Screen (px, py)
  const toScreenX = (x: number) => centerX + x * scale;
  const toScreenY = (y: number) => centerY - y * scale;

  // Convert Screen (px, py) to Math (x, y)
  const toMathX = (px: number) => (px - centerX) / scale;
  const toMathY = (py: number) => (centerY - py) / scale;

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prevScale) => Math.min(120, Math.max(12, Math.round(prevScale * zoomFactor))));
  };

  // Mouse Drag Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const mathX = Number(((px - centerX) / scale).toFixed(1));
    const mathY = Number(((centerY - py) / scale).toFixed(1));
    setHoverCoords({ x: mathX, y: mathY });

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: panStart.x + dx, y: panStart.y + dy });
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverCoords(null);
  };

  // Calculate Math Calculations
  const isDualMode = activeGraphCount === 2 || mode === 'parallel_lines' || mode === 'perpendicular_lines' || mode === 'linear_intersection';

  let linearIntersection: LinearIntersection | null = null;
  if (isDualMode && !mode.startsWith('parabola')) {
    linearIntersection = MathEngine.calculateLinearIntersection(effA1, effB1, effA2, effB2);
  }

  const isParabolaLineActive = mode === 'parabola_line' || (mode.startsWith('parabola') && showParabolaLine);
  let parabolaIntersection: ParabolaLineIntersection | null = null;
  if (isParabolaLineActive) {
    parabolaIntersection = MathEngine.calculateParabolaLineIntersection(effA, effM, effN);
  }

  // Generate Table of Values
  const tableXValues = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <div
      ref={wrapperRef}
      className={`w-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4 overflow-y-auto' : 'h-full'
      }`}
    >
      {/* Top Controls Overlay Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs z-10 backdrop-blur-md">
        {/* Function Equation & Mode Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <Activity className="w-4 h-4 text-sky-400" />
          <span className="text-slate-300 font-bold">HÀM SỐ:</span>

          {mode.startsWith('parabola') ? (
            mode === 'parabola_shift' ? (
              <span className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                y = {effA}(x - {effH})² + {effK}
              </span>
            ) : isParabolaLineActive ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  (P): y = {effA}x²
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                  (d): y = {effM}x {effN >= 0 ? `+ ${effN}` : `- ${Math.abs(effN)}`}
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                y = {effA}x²
              </span>
            )
          ) : isDualMode ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                (d₁): y = {effA1}x {effB1 >= 0 ? `+ ${effB1}` : `- ${Math.abs(effB1)}`}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                (d₂): y = {effA2}x {effB2 >= 0 ? `+ ${effB2}` : `- ${Math.abs(effB2)}`}
              </span>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-md bg-sky-950 text-sky-300 border border-sky-800 font-bold">
              y = {effA1}x {effB1 >= 0 ? `+ ${effB1}` : `- ${Math.abs(effB1)}`}
            </span>
          )}
        </div>

        {/* Viewport & Graph Mode Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AUTO-ROTATE TOGGLE BUTTON (TỰ XOAY HỆ SỐ a) */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-1.5 transition ${
              isAutoRotating
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20 animate-pulse'
                : 'bg-indigo-950/80 text-indigo-300 border-indigo-700 hover:bg-indigo-900'
            }`}
            title="Tự động biến đổi hệ số a từ dương sang âm chậm rãi để học sinh quan sát"
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoRotating ? 'Dừng xoay a' : 'Tự xoay đồ thị (a)'}</span>
          </button>

          {/* PARABOLA & LINE CORRELATION TOGGLE FOR PARABOLA MODE */}
          {mode.startsWith('parabola') && mode !== 'parabola_shift' && (
            <button
              onClick={() => setShowParabolaLine(!showParabolaLine)}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                showParabolaLine
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Hiện/Ẩn đường thẳng (d) để khảo sát tương quan với Parabol (P)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tương quan (P) & (d)</span>
            </button>
          )}

          {/* Toggle 1 Graph vs 2 Graphs (So sánh 2 đồ thị) */}
          {!mode.startsWith('parabola') && (
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveGraphCount(1)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                  activeGraphCount === 1
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Đồ thị
              </button>
              <button
                onClick={() => setActiveGraphCount(2)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                  activeGraphCount === 2
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>2 Đồ thị (So sánh)</span>
              </button>
            </div>
          )}

          {/* Toggle Slope Triangle for Linear */}
          {(!mode.startsWith('parabola') || mode === 'slope_triangle') && (
            <button
              onClick={() => setShowSlopeTriangle(!showSlopeTriangle)}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
                showSlopeTriangle
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tam giác độ dốc</span>
            </button>
          )}

          {/* Toggle Table View */}
          <button
            onClick={() => setShowTable(!showTable)}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition ${
              showTable
                ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bảng giá trị</span>
          </button>

          {/* Viewport Zoom & Reset */}
          <button
            onClick={() => setScale((s) => Math.min(120, s + 5))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(12, s - 5))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScale(35);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1"
            title="Đặt lại góc nhìn (Reset View)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-sky-400 border-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình thí nghiệm'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC PARAMETER ADJUSTMENT CONTROL BAR */}
      <div className="bg-slate-900/95 border-b border-slate-800 p-2.5 px-4 flex flex-col gap-2.5 text-xs z-10 backdrop-blur-md">
        {/* AUTO-ROTATION CONTROL STATUS BAR IF ACTIVE */}
        {isAutoRotating && (
          <div className="bg-indigo-950/60 border border-indigo-800/80 p-2 rounded-xl flex flex-wrap items-center justify-between gap-3 text-indigo-200">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="font-bold">Đang tự xoay biến đổi hệ số a:</span>
              <span className="font-mono font-bold text-white bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
                a = {effA}
              </span>
              <span className="text-[11px] text-indigo-300">
                ({effA > 0 ? 'a > 0 (Đồng biến / Bề lõm quay lên)' : effA < 0 ? 'a < 0 (Nghịch biến / Bề lõm quay xuống)' : 'a = 0 (Trục Ox)'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Tốc độ xoay:</span>
              <button
                onClick={() => setRotationSpeed('slow')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  rotationSpeed === 'slow'
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Chậm (Quan sát)
              </button>
              <button
                onClick={() => setRotationSpeed('medium')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  rotationSpeed === 'medium'
                    ? 'bg-indigo-500 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Vừa
              </button>
              <button
                onClick={() => setIsAutoRotating(false)}
                className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 font-bold text-[11px]"
              >
                Dừng xoay
              </button>
            </div>
          </div>
        )}

        {mode.startsWith('parabola') ? (
          /* Parabola Controls */
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="font-bold text-purple-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Hệ số a (bề lõm / hướng mở):
                </span>
                <button
                  onClick={() => handleUpdateParam('a', effA - 0.5)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={effA}
                  onChange={(e) => handleUpdateParam('a', parseFloat(e.target.value))}
                  className="w-28 accent-purple-500 cursor-pointer"
                />
                <button
                  onClick={() => handleUpdateParam('a', effA + 0.5)}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                >
                  +
                </button>
                <span className="font-mono font-bold text-purple-300 w-10 text-center bg-purple-950/60 p-0.5 rounded border border-purple-800">
                  {effA}
                </span>
              </div>

              {/* Quick presets for Parabola & Auto Rotate Button */}
              <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                <button
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                    isAutoRotating
                      ? 'bg-rose-500 text-white'
                      : 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800 border border-indigo-700'
                  }`}
                >
                  {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isAutoRotating ? 'Dừng xoay a' : 'Tự xoay a (+ -> -)'}</span>
                </button>
                <span className="text-slate-400 font-medium ml-1">Mẫu a:</span>
                {[1, 2, 0.5, -1, -0.5].map((val) => (
                  <button
                    key={`preset-a-${val}`}
                    onClick={() => handleUpdateParam('a', val)}
                    className={`px-2 py-0.5 rounded font-mono transition ${
                      effA === val
                        ? 'bg-purple-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    a={val}
                  </button>
                ))}
              </div>
            </div>

            {/* PARABOLA & LINE CORRELATION INTERACTIVE CONTROLS (TƯƠNG QUAN PARABOL VÀ ĐƯỜNG THẲNG) */}
            {isParabolaLineActive && (
              <div className="bg-slate-950/80 p-2 px-3 rounded-xl border border-amber-800/50 flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                     Tương quan giữa Parabol (P) và Đường thẳng (d): y = mx + n
                  </span>

                  {/* 3 Relation Position Presets: Cắt nhau, Tiếp xúc, Không giao nhau */}
                  <div className="flex items-center gap-1 text-[11px] flex-wrap">
                    <button
                      onClick={() => {
                        handleUpdateParam('a', 1);
                        handleUpdateParam('m', 1);
                        handleUpdateParam('n', 2);
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                        parabolaIntersection?.type === 'secant'
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                      }`}
                      title="Δ > 0: Đường thẳng cắt Parabol tại 2 điểm phân biệt"
                    >
                      <span>⚡ Cắt nhau (2 điểm)</span>
                    </button>

                    <button
                      onClick={() => {
                        handleUpdateParam('a', 1);
                        handleUpdateParam('m', 2);
                        handleUpdateParam('n', -1);
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                        parabolaIntersection?.type === 'tangent'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
                      }`}
                      title="Δ = 0: Đường thẳng tiếp xúc Parabol tại 1 điểm chung"
                    >
                      <span>⚡ Tiếp xúc nhau (1 điểm)</span>
                    </button>

                    <button
                      onClick={() => {
                        handleUpdateParam('a', 1);
                        handleUpdateParam('m', 1);
                        handleUpdateParam('n', -2);
                      }}
                      className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                        parabolaIntersection?.type === 'none'
                          ? 'bg-rose-500 text-white shadow'
                          : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                      }`}
                      title="Δ < 0: Đường thẳng và Parabol không giao nhau"
                    >
                      <span>⚡ Không giao nhau (0 điểm)</span>
                    </button>
                  </div>
                </div>

                {/* Line Parameters Sliders (m and n) */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">Hệ số góc m:</span>
                    <input
                      type="range"
                      min="-4"
                      max="4"
                      step="0.5"
                      value={effM}
                      onChange={(e) => handleUpdateParam('m', parseFloat(e.target.value))}
                      className="w-24 accent-sky-400 cursor-pointer"
                    />
                    <span className="font-mono text-sky-300 font-bold w-8 text-center">{effM}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">Tung độ gốc n:</span>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.25"
                      value={effN}
                      onChange={(e) => handleUpdateParam('n', parseFloat(e.target.value))}
                      className="w-28 accent-sky-400 cursor-pointer"
                    />
                    <span className="font-mono text-sky-300 font-bold w-10 text-center">{effN}</span>
                  </div>

                  {/* Calculated Discriminant Delta Badge */}
                  <div className="ml-auto flex items-center gap-2 font-mono">
                    <span className="text-slate-400">Biệt thức:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-extrabold text-xs border ${
                        parabolaIntersection?.type === 'secant'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : parabolaIntersection?.type === 'tangent'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                      }`}
                    >
                      Δ = m² + 4an = {parabolaIntersection?.discriminant}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !isDualMode ? (
          /* Single Line Controls (d: y = ax + b) */
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-4">
              {/* Slope a Control */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Hệ số a (độ dốc):
                </span>
                <button
                  onClick={() => {
                    handleUpdateParam('a', effA1 - 0.5);
                    handleUpdateParam('a1', effA1 - 0.5);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                  title="Giảm a"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={effA1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleUpdateParam('a', val);
                    handleUpdateParam('a1', val);
                  }}
                  className="w-28 accent-sky-500 cursor-pointer"
                />
                <button
                  onClick={() => {
                    handleUpdateParam('a', effA1 + 0.5);
                    handleUpdateParam('a1', effA1 + 0.5);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                  title="Tăng a"
                >
                  +
                </button>
                <span className="font-mono font-bold text-sky-300 w-12 text-center bg-sky-950/60 p-0.5 rounded border border-sky-800">
                  a = {effA1}
                </span>
              </div>

              {/* Intercept b Control */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-400">Hệ số b (giao Oy):</span>
                <button
                  onClick={() => {
                    handleUpdateParam('b', effB1 - 1);
                    handleUpdateParam('b1', effB1 - 1);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                >
                  -
                </button>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.5"
                  value={effB1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleUpdateParam('b', val);
                    handleUpdateParam('b1', val);
                  }}
                  className="w-24 accent-emerald-500 cursor-pointer"
                />
                <button
                  onClick={() => {
                    handleUpdateParam('b', effB1 + 1);
                    handleUpdateParam('b1', effB1 + 1);
                  }}
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                >
                  +
                </button>
                <span className="font-mono font-bold text-emerald-300 w-12 text-center bg-emerald-950/60 p-0.5 rounded border border-emerald-800">
                  b = {effB1}
                </span>
              </div>
            </div>

            {/* Quick Slope Presets & Auto Rotate */}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
              <button
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`px-2.5 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                  isAutoRotating
                    ? 'bg-rose-500 text-white'
                    : 'bg-indigo-900 text-indigo-200 hover:bg-indigo-800 border border-indigo-700'
                }`}
              >
                {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isAutoRotating ? 'Dừng xoay a' : 'Tự xoay a (+ -> -)'}</span>
              </button>
              <span className="text-slate-400 font-medium ml-1">Mẫu a:</span>
              {[
                { label: 'a = 1 (45°)', val: 1 },
                { label: 'a = 2 (Dốc)', val: 2 },
                { label: 'a = -1 (Giảm)', val: -1 },
                { label: 'a = 0.5 (Thoải)', val: 0.5 },
                { label: 'a = 0 (Ngang)', val: 0 },
              ].map((p) => (
                <button
                  key={`preset-single-${p.val}`}
                  onClick={() => {
                    handleUpdateParam('a', p.val);
                    handleUpdateParam('a1', p.val);
                  }}
                  className={`px-2 py-0.5 rounded font-mono transition ${
                    effA1 === p.val
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Dual Lines Controls (d1 & d2 comparison) */
          <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Line 1 Controls (d1: sky blue) */}
              <div className="flex flex-wrap items-center gap-3 bg-sky-950/40 p-1.5 px-2.5 rounded-lg border border-sky-800/60">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  (d₁): y = a₁x + b₁
                </span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-slate-400">a₁:</span>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.2"
                    value={effA1}
                    onChange={(e) => handleUpdateParam('a1', parseFloat(e.target.value))}
                    className="w-20 accent-sky-400 cursor-pointer"
                  />
                  <span className="text-sky-300 font-bold w-8 text-center">{effA1}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-slate-400">b₁:</span>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={effB1}
                    onChange={(e) => handleUpdateParam('b1', parseFloat(e.target.value))}
                    className="w-20 accent-sky-400 cursor-pointer"
                  />
                  <span className="text-sky-300 font-bold w-8 text-center">{effB1}</span>
                </div>
              </div>

              {/* Line 2 Controls (d2: amber gold) */}
              <div className="flex flex-wrap items-center gap-3 bg-amber-950/40 p-1.5 px-2.5 rounded-lg border border-amber-800/60">
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  (d₂): y = a₂x + b₂
                </span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-slate-400">a₂:</span>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.2"
                    value={effA2}
                    onChange={(e) => handleUpdateParam('a2', parseFloat(e.target.value))}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-amber-300 font-bold w-8 text-center">{effA2}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-slate-400">b₂:</span>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={effB2}
                    onChange={(e) => handleUpdateParam('b2', parseFloat(e.target.value))}
                    className="w-20 accent-amber-400 cursor-pointer"
                  />
                  <span className="text-amber-300 font-bold w-8 text-center">{effB2}</span>
                </div>
              </div>
            </div>

            {/* Quick Relation Presets for 2 Lines */}
            <div className="flex items-center gap-1.5 text-[11px] flex-wrap pt-0.5">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Tương quan nhanh:
              </span>
              <button
                onClick={() => {
                  handleUpdateParam('a2', effA1);
                  handleUpdateParam('b2', effB1 + 3);
                }}
                className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 font-medium"
              >
                ⚡ Song song (a₁ = a₂)
              </button>
              <button
                onClick={() => {
                  const perpA2 = effA1 !== 0 ? -1 / effA1 : -1;
                  handleUpdateParam('a2', Math.round(perpA2 * 10) / 10);
                }}
                className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 font-medium"
              >
                ⚡ Vuông góc (a₁ · a₂ = -1)
              </button>
              <button
                onClick={() => {
                  handleUpdateParam('b2', effB1);
                  if (effA2 === effA1) handleUpdateParam('a2', effA1 - 2);
                }}
                className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900 font-medium"
              >
                ⚡ Cắt nhau trên Oy (b₁ = b₂)
              </button>
              <button
                onClick={() => {
                  handleUpdateParam('a2', effA1);
                  handleUpdateParam('b2', effB1);
                }}
                className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 font-medium"
              >
                ⚡ Trùng nhau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main SVG Coordinate Graph Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`flex-1 w-full h-full relative overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg className="w-full h-full">
          {/* GRID LINES */}
          <g className="stroke-slate-800/60" strokeWidth="1">
            {/* Vertical grid lines */}
            {Array.from({ length: Math.ceil(dimensions.width / scale) + 4 }).map((_, i) => {
              const mathX = Math.floor(toMathX(0)) - 2 + i;
              const screenX = toScreenX(mathX);
              return (
                <line
                  key={`v-${i}`}
                  x1={screenX}
                  y1={0}
                  x2={screenX}
                  y2={dimensions.height}
                  strokeDasharray={mathX === 0 ? undefined : '2 2'}
                />
              );
            })}
            {/* Horizontal grid lines */}
            {Array.from({ length: Math.ceil(dimensions.height / scale) + 4 }).map((_, i) => {
              const mathY = Math.floor(toMathY(dimensions.height)) - 2 + i;
              const screenY = toScreenY(mathY);
              return (
                <line
                  key={`h-${i}`}
                  x1={0}
                  y1={screenY}
                  x2={dimensions.width}
                  y2={screenY}
                  strokeDasharray={mathY === 0 ? undefined : '2 2'}
                />
              );
            })}
          </g>

          {/* MAIN AXES (Ox, Oy) */}
          <line
            x1={0}
            y1={centerY}
            x2={dimensions.width}
            y2={centerY}
            className="stroke-slate-300"
            strokeWidth="2"
          />
          <line
            x1={centerX}
            y1={0}
            x2={centerX}
            y2={dimensions.height}
            className="stroke-slate-300"
            strokeWidth="2"
          />

          {/* Axis Arrowheads & Labels */}
          <text x={dimensions.width - 18} y={centerY - 8} className="fill-slate-300 text-xs font-bold font-mono">
            x
          </text>
          <text x={centerX + 8} y={18} className="fill-slate-300 text-xs font-bold font-mono">
            y
          </text>
          <text x={centerX - 12} y={centerY + 16} className="fill-slate-400 text-[10px] font-bold font-mono">
            O
          </text>

          {/* TICKS & NUMBERS ON AXES */}
          {Array.from({ length: 30 }).map((_, i) => {
            const step = i - 15;
            if (step === 0) return null;

            const px = toScreenX(step);
            const py = toScreenY(step);

            return (
              <React.Fragment key={`tick-${step}`}>
                {/* Ox tick */}
                {px >= 0 && px <= dimensions.width && (
                  <g>
                    <line x1={px} y1={centerY - 3} x2={px} y2={centerY + 3} className="stroke-slate-300" strokeWidth="1.5" />
                    <text x={px - 4} y={centerY + 15} className="fill-slate-400 text-[9px] font-mono">
                      {step}
                    </text>
                  </g>
                )}
                {/* Oy tick */}
                {py >= 0 && py <= dimensions.height && (
                  <g>
                    <line x1={centerX - 3} y1={py} x2={centerX + 3} y2={py} className="stroke-slate-300" strokeWidth="1.5" />
                    <text x={centerX - 18} y={py + 3} className="fill-slate-400 text-[9px] font-mono text-right">
                      {step}
                    </text>
                  </g>
                )}
              </React.Fragment>
            );
          })}

          {/* GRAPH PLOTTING */}

          {/* LINE 1 (d1) */}
          {!mode.startsWith('parabola') && (
            <g>
              <line
                x1={toScreenX(-30)}
                y1={toScreenY(MathEngine.evalLinear(effA1, effB1, -30))}
                x2={toScreenX(30)}
                y2={toScreenY(MathEngine.evalLinear(effA1, effB1, 30))}
                className="stroke-sky-400"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Y-intercept point (0, b1) */}
              <circle
                cx={toScreenX(0)}
                cy={toScreenY(effB1)}
                r="4"
                className="fill-sky-300 stroke-slate-900"
                strokeWidth="1.5"
              />

              {/* Label for Line 1 */}
              <text
                x={toScreenX(2) + 5}
                y={toScreenY(MathEngine.evalLinear(effA1, effB1, 2)) - 8}
                className="fill-sky-300 text-xs font-bold font-mono bg-slate-950 px-1 rounded"
              >
                (d₁) y = {effA1}x {effB1 >= 0 ? `+ ${effB1}` : `- ${Math.abs(effB1)}`}
              </text>
            </g>
          )}

          {/* LINE 2 (d2) */}
          {isDualMode && !mode.startsWith('parabola') && (
            <g>
              <line
                x1={toScreenX(-30)}
                y1={toScreenY(MathEngine.evalLinear(effA2, effB2, -30))}
                x2={toScreenX(30)}
                y2={toScreenY(MathEngine.evalLinear(effA2, effB2, 30))}
                className="stroke-amber-400"
                strokeWidth="3.5"
                strokeDasharray={effA1 === effA2 && effB1 !== effB2 ? '6 4' : undefined}
                strokeLinecap="round"
              />

              {/* Y-intercept point (0, b2) */}
              <circle
                cx={toScreenX(0)}
                cy={toScreenY(effB2)}
                r="4"
                className="fill-amber-300 stroke-slate-900"
                strokeWidth="1.5"
              />

              {/* Label for Line 2 */}
              <text
                x={toScreenX(-2) + 5}
                y={toScreenY(MathEngine.evalLinear(effA2, effB2, -2)) - 8}
                className="fill-amber-300 text-xs font-bold font-mono bg-slate-950 px-1 rounded"
              >
                (d₂) y = {effA2}x {effB2 >= 0 ? `+ ${effB2}` : `- ${Math.abs(effB2)}`}
              </text>
            </g>
          )}

          {/* PARABOLA CURVE */}
          {mode.startsWith('parabola') && (
            <path
              d={Array.from({ length: 300 })
                .map((_, i) => {
                  const x = -15 + i * 0.1;
                  const y =
                    mode === 'parabola_shift'
                      ? MathEngine.evalParabolaShifted(effA, effH, effK, x)
                      : MathEngine.evalParabola(effA, x);
                  const px = toScreenX(x);
                  const py = toScreenY(y);
                  return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
                })
                .join(' ')}
              className="stroke-purple-400 fill-none"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* LINE FOR PARABOLA-LINE CORRELATION (d): y = mx + n */}
          {isParabolaLineActive && (
            <g>
              <line
                x1={toScreenX(-30)}
                y1={toScreenY(MathEngine.evalLinear(effM, effN, -30))}
                x2={toScreenX(30)}
                y2={toScreenY(MathEngine.evalLinear(effM, effN, 30))}
                className="stroke-sky-400"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <text
                x={toScreenX(2) + 5}
                y={toScreenY(MathEngine.evalLinear(effM, effN, 2)) - 8}
                className="fill-sky-300 text-xs font-bold font-mono bg-slate-950 px-1 rounded"
              >
                (d) y = {effM}x {effN >= 0 ? `+ ${effN}` : `- ${Math.abs(effN)}`}
              </text>
            </g>
          )}

          {/* SLOPE TRIANGLE (Δx, Δy) */}
          {showSlopeTriangle && !mode.startsWith('parabola') && !isDualMode && (
            <g>
              {(() => {
                const x1 = selectedPointX;
                const y1 = MathEngine.evalLinear(effA1, effB1, x1);
                const x2 = x1 + 1;
                const y2 = MathEngine.evalLinear(effA1, effB1, x2);

                const px1 = toScreenX(x1);
                const py1 = toScreenY(y1);
                const px2 = toScreenX(x2);
                const py2 = toScreenY(y2);

                return (
                  <g>
                    {/* Horizontal leg (Δx = 1) */}
                    <line x1={px1} y1={py1} x2={px2} y2={py1} className="stroke-emerald-400" strokeWidth="2" strokeDasharray="3 3" />
                    {/* Vertical leg (Δy = a1) */}
                    <line x1={px2} y1={py1} x2={px2} y2={py2} className="stroke-emerald-400" strokeWidth="2" strokeDasharray="3 3" />

                    {/* Point A */}
                    <circle cx={px1} cy={py1} r="5" className="fill-emerald-400 stroke-slate-900" strokeWidth="2" />
                    {/* Point B */}
                    <circle cx={px2} cy={py2} r="5" className="fill-emerald-400 stroke-slate-900" strokeWidth="2" />

                    {/* Labels */}
                    <text x={(px1 + px2) / 2 - 10} y={py1 + (y1 >= y2 ? -6 : 16)} className="fill-emerald-300 text-[11px] font-bold font-mono">
                      Δx = 1
                    </text>
                    <text x={px2 + 6} y={(py1 + py2) / 2 + 4} className="fill-emerald-300 text-[11px] font-bold font-mono">
                      Δy = {effA1}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* PARABOLA VERTEX HIGHLIGHT */}
          {mode.startsWith('parabola') && (
            <g>
              <circle
                cx={toScreenX(effH)}
                cy={toScreenY(effK)}
                r="6"
                className="fill-purple-400 stroke-slate-950 animate-pulse"
                strokeWidth="2"
              />
              <text
                x={toScreenX(effH) + 8}
                y={toScreenY(effK) - 8}
                className="fill-purple-300 font-mono text-[11px] font-bold"
              >
                Đỉnh V({effH}, {effK})
              </text>
            </g>
          )}

          {/* INTERSECTION POINTS HIGHLIGHT FOR DUAL LINES */}
          {linearIntersection && linearIntersection.point && (
            <g>
              <circle
                cx={toScreenX(linearIntersection.point.x)}
                cy={toScreenY(linearIntersection.point.y)}
                r="7"
                className="fill-rose-500 stroke-white animate-bounce"
                strokeWidth="2"
              />
              <text
                x={toScreenX(linearIntersection.point.x) + 10}
                y={toScreenY(linearIntersection.point.y) - 10}
                className="fill-rose-300 font-mono text-xs font-extrabold bg-slate-900/90 px-1.5 py-0.5 rounded border border-rose-800 shadow"
              >
                Giao điểm A({linearIntersection.point.x}, {linearIntersection.point.y})
              </text>
            </g>
          )}

          {/* PARABOLA & LINE INTERSECTION / TANGENCY POINTS HIGHLIGHT */}
          {isParabolaLineActive &&
            parabolaIntersection &&
            parabolaIntersection.points.map((pt, idx) => (
              <g key={`p-int-${idx}`}>
                <circle
                  cx={toScreenX(pt.x)}
                  cy={toScreenY(pt.y)}
                  r="7"
                  className={`${
                    parabolaIntersection?.type === 'tangent'
                      ? 'fill-amber-400 stroke-slate-950 animate-pulse'
                      : 'fill-rose-500 stroke-white animate-bounce'
                  }`}
                  strokeWidth="2"
                />
                <text
                  x={toScreenX(pt.x) + 10}
                  y={toScreenY(pt.y) - 10}
                  className={`font-mono text-xs font-extrabold bg-slate-900/95 px-2 py-0.5 rounded border shadow ${
                    parabolaIntersection?.type === 'tangent'
                      ? 'fill-amber-300 border-amber-700'
                      : 'fill-rose-300 border-rose-800'
                  }`}
                >
                  {parabolaIntersection?.type === 'tangent' ? 'Tiếp điểm T' : `Giao điểm G_${idx + 1}`}({pt.x}, {pt.y})
                </text>
              </g>
            ))}
        </svg>

        {/* Hover Coordinate Tooltip */}
        {hoverCoords && (
          <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-sky-300 pointer-events-none shadow">
            Tọa độ con trỏ: ({hoverCoords.x}, {hoverCoords.y})
          </div>
        )}

        {/* Floating Controls Usage Hint */}
        <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg text-[10px] text-slate-400 flex items-center gap-1 pointer-events-none">
          <Move className="w-3 h-3 text-sky-400" />
          <span>Lăn chuột để phóng to/thu nhỏ | Kéo chuột để di chuyển</span>
        </div>

        {/* Floating Mathematical Status Card */}
        <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-xl max-w-sm text-xs space-y-1.5 backdrop-blur-md">
          {isParabolaLineActive ? (
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Tương quan giữa (P): y = {effA}x² và (d): y = {effM}x {effN >= 0 ? `+ ${effN}` : `- ${Math.abs(effN)}`}:</span>
              </div>
              <div className="text-[11px] font-mono text-slate-300 mt-1 bg-slate-950 p-1.5 rounded border border-slate-800 space-y-1">
                <p>
                  <span className="text-slate-400">Phương trình HĐGĐ:</span>{' '}
                  <span className="text-purple-300 font-bold">{effA}x² - ({effM})x - ({effN}) = 0</span>
                </p>
                <p>
                  <span className="text-slate-400">Biệt thức Δ = m² + 4an:</span>{' '}
                  <span
                    className={`font-bold ${
                      parabolaIntersection?.type === 'secant'
                        ? 'text-emerald-400'
                        : parabolaIntersection?.type === 'tangent'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Δ = {parabolaIntersection?.discriminant}
                  </span>
                </p>
              </div>
              <p
                className={`font-semibold text-[11px] mt-1.5 p-1 rounded border ${
                  parabolaIntersection?.type === 'secant'
                    ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800'
                    : parabolaIntersection?.type === 'tangent'
                    ? 'text-amber-300 bg-amber-950/60 border-amber-800'
                    : 'text-rose-300 bg-rose-950/60 border-rose-800'
                }`}
              >
                {parabolaIntersection?.explanation}
              </p>
            </div>
          ) : isDualMode && !mode.startsWith('parabola') ? (
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Trạng thái tương quan giữa 2 đường thẳng:</span>
              </div>
              <p className="text-amber-300 font-medium text-[11px] mt-1">
                {linearIntersection?.explanation}
              </p>
              {MathEngine.isPerpendicular(effA1, effA2) && (
                <div className="mt-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/60 p-1 rounded border border-emerald-800/60">
                  a₁ × a₂ = ({effA1}) × ({effA2}) = {(effA1 * effA2).toFixed(2)} ✓ (HAI ĐƯỜNG THẲNG VUÔNG GÓC)
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Phân tích hệ số a = {effA1}:</span>
              </div>
              <p className="text-sky-300 text-[11px] mt-1">
                {mode.startsWith('parabola')
                  ? effA > 0
                    ? `a = ${effA} > 0: Parabol có bề lõm quay LÊN TRÊN. Điểm O(0,0) là điểm CỰC TIỂU.`
                    : effA < 0
                    ? `a = ${effA} < 0: Parabol có bề lõm quay XUỐNG DƯỚI. Điểm O(0,0) là điểm CỰC ĐẠI.`
                    : `a = 0: Đồ thị suy biến thành đường thẳng trùng với TRỤC HOÀNH Ox.`
                  : effA1 > 0
                  ? `a = ${effA1} > 0: Hàm số đồng biến. Góc tạo bởi đường thẳng và Ox là góc nhọn.`
                  : effA1 < 0
                  ? `a = ${effA1} < 0: Hàm số nghịch biến. Góc tạo bởi đường thẳng và Ox là góc tù.`
                  : `a = 0: Hàm số hằng y = ${effB1}. Đường thẳng song song với Ox.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Table of Values View */}
      {showTable && (
        <div className="bg-slate-900 border-t border-slate-800 p-3 px-4 text-xs overflow-x-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
              Bảng giá trị tương ứng (Table of Values):
            </span>
            <span className="text-[10px] text-slate-400">Thay đổi tham số để cập nhật bảng</span>
          </div>

          <table className="w-full text-center border-collapse font-mono text-[11px]">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-1 px-3 border-r border-slate-800">x</th>
                {tableXValues.map((x) => (
                  <td key={`th-x-${x}`} className="p-1 px-2 border-r border-slate-800 font-bold text-white">
                    {x}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {mode.startsWith('parabola') ? (
                <tr className="border-b border-slate-800/60 text-purple-300">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold bg-purple-950/30">
                    (P) y = {effA}x²
                  </th>
                  {tableXValues.map((x) => (
                    <td key={`tb-y1-${x}`} className="p-1 px-2 border-r border-slate-800">
                      {MathEngine.evalParabola(effA, x).toFixed(1)}
                    </td>
                  ))}
                </tr>
              ) : (
                <tr className="border-b border-slate-800/60 text-sky-300">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold bg-sky-950/30">
                    (d₁) y = {effA1}x {effB1 >= 0 ? `+ ${effB1}` : `- ${Math.abs(effB1)}`}
                  </th>
                  {tableXValues.map((x) => (
                    <td key={`tb-y1-${x}`} className="p-1 px-2 border-r border-slate-800">
                      {MathEngine.evalLinear(effA1, effB1, x).toFixed(1)}
                    </td>
                  ))}
                </tr>
              )}

              {isParabolaLineActive && (
                <tr className="text-sky-300 border-b border-slate-800/60">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold bg-sky-950/30">
                    (d) y = {effM}x {effN >= 0 ? `+ ${effN}` : `- ${Math.abs(effN)}`}
                  </th>
                  {tableXValues.map((x) => (
                    <td key={`tb-yd-${x}`} className="p-1 px-2 border-r border-slate-800">
                      {MathEngine.evalLinear(effM, effN, x).toFixed(1)}
                    </td>
                  ))}
                </tr>
              )}

              {isDualMode && !mode.startsWith('parabola') && (
                <tr className="text-amber-300">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold bg-amber-950/30">
                    (d₂) y = {effA2}x {effB2 >= 0 ? `+ ${effB2}` : `- ${Math.abs(effB2)}`}
                  </th>
                  {tableXValues.map((x) => (
                    <td key={`tb-y2-${x}`} className="p-1 px-2 border-r border-slate-800">
                      {MathEngine.evalLinear(effA2, effB2, x).toFixed(1)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
