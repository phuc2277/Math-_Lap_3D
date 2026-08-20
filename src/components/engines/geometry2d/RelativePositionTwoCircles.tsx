import React, { useState, useRef } from 'react';
import { ModelParams } from '../../../types/geometry';
import { analyzeTwoCircles, TwoCirclesAnalysis, Point2D } from './GeometryMath';
import { IntersectionEngine } from './IntersectionEngine';
import {
  Ruler,
  HelpCircle,
  Compass,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Table,
  Check,
  ChevronRight,
  UserCheck,
  GraduationCap,
  Layers,
  Award,
} from 'lucide-react';

interface RelativePositionTwoCirclesProps {
  params: ModelParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
}

export const RelativePositionTwoCircles: React.FC<
  RelativePositionTwoCirclesProps
> = ({ params, onParamChange }) => {
  // Model Parameters
  const [R1, setR1] = useState<number>(params.r1 ?? 5);
  const [R2, setR2] = useState<number>(params.r2 ?? 3);
  const [d, setD] = useState<number>(params.d ?? 6);

  // Toggle options
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showCenterLine, setShowCenterLine] = useState<boolean>(true);
  const [showCommonChord, setShowCommonChord] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Mode and View Tabs
  const [activeTab, setActiveTab] = useState<'free' | 'challenge' | 'predict' | 'summary' | 'compare'>('free');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);

  // Challenge Mode State
  const [challengeTarget, setChallengeTarget] = useState<'tangent_external' | 'intersecting' | 'tangent_internal' | 'outside'>('tangent_external');
  const [challengeSuccess, setChallengeSuccess] = useState<boolean>(false);

  // Prediction State
  const [predictChoice, setPredictChoice] = useState<number | null>(null);
  const [predictVerified, setPredictVerified] = useState<boolean>(false);

  // Canvas coordinates
  const centerO1: Point2D = { x: 200, y: 200 };
  const scale = 22; // 22px = 1cm

  // Calculate O2 position relative to O1 along horizontal axis
  const centerO2: Point2D = {
    x: centerO1.x + d * scale,
    y: centerO1.y,
  };

  // Perform exact geometry calculation
  const analysis: TwoCirclesAnalysis = analyzeTwoCircles(centerO1, R1 * scale, centerO2, R2 * scale);
  const summary = IntersectionEngine.getTwoCirclesSummary(analysis);

  // Dragging state on canvas
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingO2, setIsDraggingO2] = useState<boolean>(false);

  const updateParam = (key: keyof ModelParams, val: number) => {
    if (key === 'r1') setR1(val);
    if (key === 'r2') setR2(val);
    if (key === 'd') setD(val);
    if (onParamChange) onParamChange(key, val);
  };

  const handleMouseDown = () => {
    setIsDraggingO2(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingO2 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const dx = mouseX - centerO1.x;
    const newD = Math.min(14, Math.max(0, Number((dx / scale).toFixed(1))));
    updateParam('d', newD);

    // Check challenge condition if in challenge mode
    if (activeTab === 'challenge') {
      if (
        (challengeTarget === 'tangent_external' && analysis.status === 'tangent_external') ||
        (challengeTarget === 'intersecting' && analysis.status === 'intersecting') ||
        (challengeTarget === 'tangent_internal' && analysis.status === 'tangent_internal') ||
        (challengeTarget === 'outside' && analysis.status === 'outside')
      ) {
        setChallengeSuccess(true);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingO2(false);
  };

  return (
    <div
      className={`w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative select-none transition-all duration-300 ${
        isPresentationMode ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-slate-950' : ''
      }`}
    >
      {/* HEADER CONTROL BAR */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            🔵🔵 VỊ TRÍ TƯƠNG ĐỐI HAI ĐƯỜNG TRÒN
          </h2>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            R = {R1} cm • r = {R2} cm • d(OO') = {d} cm
          </span>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('free')}
            className={`px-2.5 py-1.5 rounded-md font-bold transition flex items-center gap-1 ${
              activeTab === 'free' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🎯 Thử tự do</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('challenge');
              setChallengeSuccess(false);
            }}
            className={`px-2.5 py-1.5 rounded-md font-bold transition flex items-center gap-1 ${
              activeTab === 'challenge' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>🎯 Tìm trường hợp</span>
          </button>
          <button
            onClick={() => setActiveTab('predict')}
            className={`px-2.5 py-1.5 rounded-md font-bold transition flex items-center gap-1 ${
              activeTab === 'predict' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>🔎 Dự đoán</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-2.5 py-1.5 rounded-md font-bold transition flex items-center gap-1 ${
              activeTab === 'summary' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>📊 Bảng kết luận</span>
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-2.5 py-1.5 rounded-md font-bold transition flex items-center gap-1 ${
              activeTab === 'compare' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>So sánh</span>
          </button>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1 transition ${
              showMeasurements
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>📏 Đo</span>
          </button>

          <button
            onClick={() => setIsTeacherMode(!isTeacherMode)}
            className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1 transition ${
              isTeacherMode
                ? 'bg-purple-950 text-purple-300 border-purple-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Giáo viên</span>
          </button>

          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 shadow transition"
            title="Trình chiếu toàn màn hình"
          >
            {isPresentationMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Trình chiếu</span>
          </button>
        </div>
      </div>

      {/* TEACHER MODE BANNER */}
      {isTeacherMode && (
        <div className="bg-purple-950/70 border-b border-purple-800 px-4 py-2 text-xs text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <strong>Gợi ý giảng dạy:</strong> Giúp học sinh nhận thức được khoảng cách nối tâm d = OO' so sánh với 2 mốc quan trọng: Hiệu hai bán kính |R - r| và Tổng hai bán kính (R + r).
          </span>
        </div>
      )}

      {/* MAIN CANVAS & SIDE CONTROL PANELS */}
      <div className="flex-1 w-full relative flex flex-col lg:flex-row overflow-hidden">
        {/* SVG INTERACTIVE GEOMETRY CANVAS */}
        <div className="flex-1 h-full min-h-[320px] relative bg-slate-950 flex items-center justify-center p-4">
          <svg
            ref={svgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full max-w-2xl max-h-[460px] cursor-grab active:cursor-grabbing overflow-visible"
            viewBox="0 0 540 400"
          >
            {/* Grid background */}
            <defs>
              <pattern id="gridPatternTwo" width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPatternTwo)" rx="16" />

            {/* CONNECTING LINE BETWEEN CENTERS OO' */}
            {showCenterLine && (
              <g>
                <line
                  x1={centerO1.x - 40}
                  y1={centerO1.y}
                  x2={centerO2.x + 40}
                  y2={centerO2.y}
                  stroke="#64748b"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <line
                  x1={centerO1.x}
                  y1={centerO1.y}
                  x2={centerO2.x}
                  y2={centerO2.y}
                  stroke="#38bdf8"
                  strokeWidth="3"
                />
              </g>
            )}

            {/* CIRCLE 1 (O, R1) */}
            <circle
              cx={centerO1.x}
              cy={centerO1.y}
              r={R1 * scale}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />
            <circle cx={centerO1.x} cy={centerO1.y} r="5" fill="#38bdf8" />
            {showLabels && (
              <text x={centerO1.x - 18} y={centerO1.y - 10} fill="#38bdf8" fontSize="14" fontWeight="bold">
                O
              </text>
            )}

            {/* CIRCLE 2 (O', R2) */}
            <circle
              cx={centerO2.x}
              cy={centerO2.y}
              r={R2 * scale}
              fill="rgba(245, 158, 11, 0.08)"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <circle cx={centerO2.x} cy={centerO2.y} r="5" fill="#f59e0b" />
            {showLabels && (
              <text x={centerO2.x + 10} y={centerO2.y - 10} fill="#f59e0b" fontSize="14" fontWeight="bold">
                O'
              </text>
            )}

            {/* TANGENT OR INTERSECTION POINTS */}
            {analysis.pointsCount === 1 && analysis.tangentPoint && (
              <g>
                <circle
                  cx={analysis.tangentPoint.x}
                  cy={analysis.tangentPoint.y}
                  r="7"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {showLabels && (
                  <text
                    x={analysis.tangentPoint.x}
                    y={analysis.tangentPoint.y - 12}
                    fill="#10b981"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    T (Tiếp điểm)
                  </text>
                )}
              </g>
            )}

            {analysis.pointsCount === 2 && analysis.intersections.length === 2 && (
              <g>
                {/* Common Chord AB */}
                {showCommonChord && (
                  <line
                    x1={analysis.intersections[0].x}
                    y1={analysis.intersections[0].y}
                    x2={analysis.intersections[1].x}
                    y2={analysis.intersections[1].y}
                    stroke="#10b981"
                    strokeWidth="3.5"
                  />
                )}

                {/* Point A */}
                <circle
                  cx={analysis.intersections[0].x}
                  cy={analysis.intersections[0].y}
                  r="6"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {showLabels && (
                  <text
                    x={analysis.intersections[0].x - 14}
                    y={analysis.intersections[0].y - 10}
                    fill="#10b981"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    A
                  </text>
                )}

                {/* Point B */}
                <circle
                  cx={analysis.intersections[1].x}
                  cy={analysis.intersections[1].y}
                  r="6"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {showLabels && (
                  <text
                    x={analysis.intersections[1].x - 14}
                    y={analysis.intersections[1].y + 20}
                    fill="#10b981"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    B
                  </text>
                )}
              </g>
            )}

            {/* Instruction Badge */}
            <g transform="translate(10, 370)">
              <rect x="0" y="0" width="240" height="24" rx="6" fill="#0f172a" opacity="0.85" />
              <text x="10" y="16" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
                💡 Rê chuột để thay đổi khoảng cách nối tâm d = OO'
              </text>
            </g>
          </svg>

          {/* REALTIME BADGE & CLASSIFICATION DISPLAY */}
          <div className="absolute top-4 left-4 z-10 max-w-sm space-y-2">
            <div className={`p-3 rounded-xl border backdrop-blur-md shadow-xl ${summary.badgeColor}`}>
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
                <span className="font-bold text-xs uppercase tracking-wide">{summary.badgeText}</span>
                <span className="px-2 py-0.5 rounded bg-white/20 font-bold text-[11px]">
                  {summary.pointsText}
                </span>
              </div>
              <p className="text-[12px] font-mono font-bold">{summary.conditionMath}</p>
              <p className="text-[11px] leading-snug mt-1 opacity-90">{summary.explanation}</p>
            </div>

            {/* LIVE MEASUREMENTS PANEL */}
            {showMeasurements && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-200 backdrop-blur-md shadow-lg">
                <div className="text-[11px] font-bold text-emerald-400 mb-1 flex items-center gap-1 font-sans">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>KẾT QUẢ ĐO ĐẠC THỜI GIAN THỰC</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Bán kính R:</span>{' '}
                    <strong className="text-sky-300">{R1.toFixed(2)} cm</strong>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Bán kính r:</span>{' '}
                    <strong className="text-amber-300">{R2.toFixed(2)} cm</strong>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Độ dài OO' (d):</span>{' '}
                    <strong className="text-emerald-300">{d.toFixed(2)} cm</strong>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">R + r:</span>{' '}
                    <strong className="text-purple-300">{(R1 + R2).toFixed(2)} cm</strong>
                  </div>
                  <div className="col-span-2 bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Hiệu |R - r|:</span>{' '}
                    <strong className="text-sky-300">{Math.abs(R1 - R2).toFixed(2)} cm</strong>
                  </div>
                  {analysis.status === 'intersecting' && (
                    <div className="col-span-2 bg-emerald-950/60 p-1.5 rounded border border-emerald-800 text-emerald-200">
                      Dây chung AB = <strong>{analysis.chordLength.toFixed(2)} cm</strong> (OO' ⟂ AB)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE CONTROL PANELS */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
          {/* TAB 1: FREE TRIAL CONTROLS */}
          {activeTab === 'free' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  THAM SỐ ĐIỀU CHỈNH
                </span>
                <button
                  onClick={() => {
                    updateParam('r1', 5);
                    updateParam('r2', 3);
                    updateParam('d', 6);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  đặt lại
                </button>
              </div>

              {/* Slider R1 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Bán kính đường tròn 1 (R):</span>
                  <span className="font-mono text-sky-400 font-bold">{R1} cm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={R1}
                  onChange={(e) => updateParam('r1', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider R2 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Bán kính đường tròn 2 (r):</span>
                  <span className="font-mono text-amber-400 font-bold">{R2} cm</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.5"
                  value={R2}
                  onChange={(e) => updateParam('r2', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider Distance d */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Khoảng cách nối tâm (d = OO'):</span>
                  <span className="font-mono text-emerald-400 font-bold">{d} cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.1"
                  value={d}
                  onChange={(e) => updateParam('d', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Quick Jump Buttons for Cases */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">Nhảy nhanh tới 6 trường hợp:</span>
                <div className="grid grid-cols-1 gap-1 text-xs font-medium">
                  <button
                    onClick={() => updateParam('d', R1 + R2 + 2)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-left flex justify-between"
                  >
                    <span>1. Ở ngoài nhau (d &gt; R+r)</span>
                    <span className="font-mono text-[11px] opacity-70">d = {R1 + R2 + 2}</span>
                  </button>
                  <button
                    onClick={() => updateParam('d', R1 + R2)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded border border-slate-800 text-left flex justify-between"
                  >
                    <span>2. Tiếp xúc ngoài (d = R+r)</span>
                    <span className="font-mono text-[11px] opacity-70">d = {R1 + R2}</span>
                  </button>
                  <button
                    onClick={() => updateParam('d', (Math.abs(R1 - R2) + R1 + R2) / 2)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-300 rounded border border-slate-800 text-left flex justify-between"
                  >
                    <span>3. Cắt nhau (|R-r| &lt; d &lt; R+r)</span>
                    <span className="font-mono text-[11px] opacity-70">d = {((Math.abs(R1 - R2) + R1 + R2) / 2).toFixed(1)}</span>
                  </button>
                  <button
                    onClick={() => updateParam('d', Math.abs(R1 - R2))}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-sky-300 rounded border border-slate-800 text-left flex justify-between"
                  >
                    <span>4. Tiếp xúc trong (d = |R-r|)</span>
                    <span className="font-mono text-[11px] opacity-70">d = {Math.abs(R1 - R2)}</span>
                  </button>
                  <button
                    onClick={() => updateParam('d', Math.max(0.5, Math.abs(R1 - R2) / 2))}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-purple-300 rounded border border-slate-800 text-left flex justify-between"
                  >
                    <span>5. Nằm trong nhau (d &lt; |R-r|)</span>
                    <span className="font-mono text-[11px] opacity-70">d = {Math.max(0.5, Math.abs(R1 - R2) / 2).toFixed(1)}</span>
                  </button>
                  <button
                    onClick={() => updateParam('d', 0)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 rounded border border-slate-800 text-left flex justify-between"
                  >
                    <span>6. Đồng tâm (d = 0)</span>
                    <span className="font-mono text-[11px] opacity-70">d = 0</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHALLENGE FIND CASE */}
          {activeTab === 'challenge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  THỬ THÁCH TÌM TRƯỜNG HỢP
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                <span className="font-bold text-slate-200">Chọn mục tiêu thực hành:</span>
                <select
                  value={challengeTarget}
                  onChange={(e) => {
                    setChallengeTarget(e.target.value as any);
                    setChallengeSuccess(false);
                  }}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-xs"
                >
                  <option value="tangent_external">1. Tiếp xúc ngoài (d = R + r)</option>
                  <option value="intersecting">2. Cắt nhau tại 2 điểm (|R-r| &lt; d &lt; R+r)</option>
                  <option value="tangent_internal">3. Tiếp xúc trong (d = |R - r|)</option>
                  <option value="outside">4. Ở ngoài nhau (d &gt; R + r)</option>
                </select>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  👉 <strong>Nhiệm vụ:</strong> Rê chuột trên mô hình hoặc kéo thanh trượt khoảng cách nối tâm d sao cho hai đường tròn đạt đúng mục tiêu chọn ở trên!
                </p>

                {challengeSuccess ? (
                  <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-200 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>✓ CHÍNH XÁC! Bạn đã tìm đúng vị trí tương đối!</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-amber-300 text-[11px] font-mono">
                    Trạng thái hiện tại: {analysis.statusLabel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PREDICTION */}
          {activeTab === 'predict' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  THỬ THÁCH DỰ ĐOÁN
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                <p className="font-bold text-amber-200 leading-relaxed">
                  ❓ Câu hỏi: Cho R = 6 cm, r = 3 cm. Nếu khoảng cách hai tâm d = 9 cm thì hai đường tròn sẽ ở vị trí nào?
                </p>

                <div className="space-y-1.5">
                  {[
                    'A. Ở ngoài nhau',
                    'B. Tiếp xúc ngoài',
                    'C. Cắt nhau tại 2 điểm',
                    'D. Tiếp xúc trong',
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPredictChoice(idx);
                        setPredictVerified(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition font-medium ${
                        predictChoice === idx
                          ? 'bg-amber-950/80 border-amber-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <button
                  disabled={predictChoice === null}
                  onClick={() => {
                    setPredictVerified(true);
                    updateParam('r1', 6);
                    updateParam('r2', 3);
                    updateParam('d', 9);
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow transition ${
                    predictChoice === null
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  🔍 KIỂM TRA TRÊN MÔ HÌNH
                </button>

                {predictVerified && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold leading-relaxed ${
                      predictChoice === 1
                        ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                        : 'bg-rose-950/90 border-rose-800 text-rose-200'
                    }`}
                  >
                    {predictChoice === 1
                      ? '🎉 Chính xác! Vì d = 9 cm đúng bằng tổng hai bán kính R + r = 6 + 3 = 9 cm nên hai đường tròn tiếp xúc ngoài!'
                      : '❌ Chưa chính xác! So sánh: d (9 cm) = R + r (6 + 3 = 9 cm) $\\rightarrow$ hai đường tròn tiếp xúc ngoài.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUMMARY CONCLUSION TABLE */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-sky-300 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-sky-400" />
                  BẢNG KẾT LUẬN 6 VỊ TRÍ TƯƠNG ĐỐI
                </span>
              </div>

              <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950 text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-1.5 border-r border-slate-800">Điều kiện (d vs R, r)</th>
                      <th className="p-1.5 border-r border-slate-800">Vị trí tương đối</th>
                      <th className="p-1.5">Điểm chung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-b border-slate-800 ${
                        analysis.status === 'outside' ? 'bg-slate-800 font-bold text-white' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-1.5 border-r border-slate-800 font-mono">d &gt; R + r</td>
                      <td className="p-1.5 border-r border-slate-800">Ở ngoài nhau</td>
                      <td className="p-1.5 font-mono">0</td>
                    </tr>
                    <tr
                      className={`border-b border-slate-800 ${
                        analysis.status === 'tangent_external' ? 'bg-amber-950/80 font-bold text-amber-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-1.5 border-r border-slate-800 font-mono">d = R + r</td>
                      <td className="p-1.5 border-r border-slate-800">Tiếp xúc ngoài</td>
                      <td className="p-1.5 font-mono">1 (T)</td>
                    </tr>
                    <tr
                      className={`border-b border-slate-800 ${
                        analysis.status === 'intersecting' ? 'bg-emerald-950/80 font-bold text-emerald-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-1.5 border-r border-slate-800 font-mono">|R-r| &lt; d &lt; R+r</td>
                      <td className="p-1.5 border-r border-slate-800">Cắt nhau</td>
                      <td className="p-1.5 font-mono">2 (A, B)</td>
                    </tr>
                    <tr
                      className={`border-b border-slate-800 ${
                        analysis.status === 'tangent_internal' ? 'bg-sky-950/80 font-bold text-sky-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-1.5 border-r border-slate-800 font-mono">d = |R - r|</td>
                      <td className="p-1.5 border-r border-slate-800">Tiếp xúc trong</td>
                      <td className="p-1.5 font-mono">1 (T)</td>
                    </tr>
                    <tr
                      className={`border-b border-slate-800 ${
                        analysis.status === 'inside' ? 'bg-purple-950/80 font-bold text-purple-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-1.5 border-r border-slate-800 font-mono">d &lt; |R - r|</td>
                      <td className="p-1.5 border-r border-slate-800">Nằm trong nhau</td>
                      <td className="p-1.5 font-mono">0</td>
                    </tr>
                    <tr
                      className={`${
                        analysis.status === 'concentric' || analysis.status === 'coincident'
                          ? 'bg-indigo-950/80 font-bold text-indigo-200'
                          : 'text-slate-300'
                      }`}
                    >
                      <td className="p-1.5 border-r border-slate-800 font-mono">d = 0</td>
                      <td className="p-1.5 border-r border-slate-800">Đồng tâm / Trùng</td>
                      <td className="p-1.5 font-mono">0 hoặc ∞</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: COMPARISON VIEW */}
          {activeTab === 'compare' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  SO SÁNH HAI THÍ NGHIỆM
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {IntersectionEngine.getComparisonMatrix().map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-bold text-amber-300 text-[11px] block">{item.aspect}</span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-sky-200">
                        <strong className="text-sky-400 block text-[10px]">Đường thẳng & Đường tròn:</strong>
                        {item.lineCircle}
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-emerald-200">
                        <strong className="text-emerald-400 block text-[10px]">Hai Đường tròn:</strong>
                        {item.twoCircles}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
