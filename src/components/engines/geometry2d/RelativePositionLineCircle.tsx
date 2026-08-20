import React, { useState, useRef, useEffect } from 'react';
import { ModelParams } from '../../../types/geometry';
import { analyzeLineCircle, LineCircleAnalysis, Point2D } from './GeometryMath';
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
  Eye,
  Sliders,
  Table,
  Check,
  ChevronRight,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

interface RelativePositionLineCircleProps {
  params: ModelParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
}

export const RelativePositionLineCircle: React.FC<
  RelativePositionLineCircleProps
> = ({ params, onParamChange }) => {
  // Model Parameters
  const [R, setR] = useState<number>(params.r ?? 5);
  const [h, setH] = useState<number>(params.h ?? 4);
  const [angleDeg, setAngleDeg] = useState<number>(params.angle ?? 0);

  // Display Toggles
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);
  const [showPerpendicular, setShowPerpendicular] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'free' | 'guided' | 'predict' | 'summary'>('free');

  // Modes & Fullscreen State
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(false);

  // Guided Experiment State
  const [guidedStep, setGuidedStep] = useState<number>(1);
  const [guidedAnswer, setGuidedAnswer] = useState<number | null>(null);
  const [guidedFeedback, setGuidedFeedback] = useState<string | null>(null);

  // Prediction State
  const [predictR, setPredictR] = useState<number>(5);
  const [predictH, setPredictH] = useState<number>(4);
  const [predictUserChoice, setPredictUserChoice] = useState<number | null>(null);
  const [predictVerified, setPredictVerified] = useState<boolean>(false);

  // Dragging interaction state
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDraggingLine, setIsDraggingLine] = useState<boolean>(false);

  // Circle center on canvas coordinate space (pixels)
  const centerCanvas: Point2D = { x: 260, y: 200 };
  const scale = 25; // 25px = 1cm

  // Perform exact mathematical analysis
  const analysis: LineCircleAnalysis = analyzeLineCircle(
    centerCanvas,
    R * scale,
    h * scale,
    angleDeg
  );

  const summary = IntersectionEngine.getLineCircleSummary(analysis);

  // Notify parent component of param changes
  const updateParam = (key: keyof ModelParams, val: number) => {
    if (key === 'r') setR(val);
    if (key === 'h') setH(val);
    if (key === 'angle') setAngleDeg(val);
    if (onParamChange) onParamChange(key, val);
  };

  // Dragging handler for line distance h on SVG canvas
  const handleMouseDown = () => {
    setIsDraggingLine(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingLine || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Distance from centerCanvas to mouse
    const dx = mouseX - centerCanvas.x;
    const dy = mouseY - centerCanvas.y;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const newH = Math.min(12, Math.max(0, Number((distPx / scale).toFixed(1))));
    updateParam('h', newH);
  };

  const handleMouseUp = () => {
    setIsDraggingLine(false);
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
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            🔵 VỊ TRÍ TƯƠNG ĐỐI ĐƯỜNG THẲNG – ĐƯỜNG TRÒN
          </h2>
          <span className="text-[11px] font-mono text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
            R = {R} cm • h = {h} cm
          </span>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('free')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeTab === 'free' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🎯 Thử tự do</span>
          </button>
          <button
            onClick={() => setActiveTab('guided')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeTab === 'guided' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🧪 Khám phá</span>
          </button>
          <button
            onClick={() => setActiveTab('predict')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeTab === 'predict' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>🔎 Dự đoán</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              activeTab === 'summary' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>📊 Bảng kết luận</span>
          </button>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1 transition ${
              showMeasurements
                ? 'bg-sky-950 text-sky-300 border-sky-800'
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
            <strong>Gợi ý sư phạm:</strong> Hãy hướng dẫn học sinh di chuyển đường thẳng d từ xa ($h &gt; R$) lại gần tâm O ($h = R$ rồi $h &lt; R$) để tự quan sát số điểm chung thay đổi từ 0 $\rightarrow$ 1 $\rightarrow$ 2.
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
            viewBox="0 0 520 400"
          >
            {/* Grid background */}
            <defs>
              <pattern id="gridPatternLine" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridPatternLine)" rx="16" />

            {/* CIRCLE (O, R) */}
            <circle
              cx={centerCanvas.x}
              cy={centerCanvas.y}
              r={R * scale}
              fill="rgba(56, 189, 248, 0.08)"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />

            {/* Center O */}
            <circle cx={centerCanvas.x} cy={centerCanvas.y} r="5" fill="#38bdf8" />
            {showLabels && (
              <text
                x={centerCanvas.x - 16}
                y={centerCanvas.y - 10}
                fill="#38bdf8"
                fontSize="14"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                O
              </text>
            )}

            {/* Radius line R indicator */}
            <line
              x1={centerCanvas.x}
              y1={centerCanvas.y}
              x2={centerCanvas.x + R * scale}
              y2={centerCanvas.y}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {showLabels && (
              <text
                x={centerCanvas.x + (R * scale) / 2 - 8}
                y={centerCanvas.y - 6}
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                R = {R}cm
              </text>
            )}

            {/* LINE d */}
            <line
              x1={analysis.lineP1.x}
              y1={analysis.lineP1.y}
              x2={analysis.lineP2.x}
              y2={analysis.lineP2.y}
              stroke="#f59e0b"
              strokeWidth="3.5"
            />
            {showLabels && (
              <text
                x={analysis.lineP2.x + 8}
                y={analysis.lineP2.y}
                fill="#f59e0b"
                fontSize="15"
                fontWeight="bold"
              >
                d
              </text>
            )}

            {/* PERPENDICULAR SEGMENT OH */}
            {showPerpendicular && (
              <g>
                <line
                  x1={centerCanvas.x}
                  y1={centerCanvas.y}
                  x2={analysis.footH.x}
                  y2={analysis.footH.y}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />

                {/* Foot of perpendicular H */}
                <circle cx={analysis.footH.x} cy={analysis.footH.y} r="4" fill="#10b981" />
                {showLabels && (
                  <text
                    x={analysis.footH.x + 8}
                    y={analysis.footH.y + 14}
                    fill="#10b981"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    H
                  </text>
                )}

                {/* Right angle symbol at H */}
                <rect
                  x={analysis.footH.x - 5}
                  y={analysis.footH.y - 5}
                  width="10"
                  height="10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                />
              </g>
            )}

            {/* INTERSECTIONS / TANGENT POINTS */}
            {analysis.status === 'tangent' && analysis.tangentPoint && (
              <g>
                <circle
                  cx={analysis.tangentPoint.x}
                  cy={analysis.tangentPoint.y}
                  r="7"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {showLabels && (
                  <text
                    x={analysis.tangentPoint.x + 10}
                    y={analysis.tangentPoint.y - 10}
                    fill="#f59e0b"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    T (Tiếp điểm)
                  </text>
                )}
              </g>
            )}

            {analysis.status === 'secant' && analysis.intersections.length === 2 && (
              <g>
                {/* Chord AB */}
                <line
                  x1={analysis.intersections[0].x}
                  y1={analysis.intersections[0].y}
                  x2={analysis.intersections[1].x}
                  y2={analysis.intersections[1].y}
                  stroke="#34d399"
                  strokeWidth="4"
                />

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
                    x={analysis.intersections[0].x - 18}
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
                    x={analysis.intersections[1].x + 10}
                    y={analysis.intersections[1].y - 10}
                    fill="#10b981"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    B
                  </text>
                )}
              </g>
            )}

            {/* Drag instruction overlay badge */}
            <g transform="translate(10, 370)">
              <rect x="0" y="0" width="220" height="24" rx="6" fill="#0f172a" opacity="0.85" />
              <text x="10" y="16" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
                💡 Nhấp & Rê chuột để kéo vị trí đường thẳng d
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
                <div className="text-[11px] font-bold text-sky-400 mb-1 flex items-center gap-1 font-sans">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>KẾT QUẢ ĐO ĐẠC THỜI GIAN THỰC</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Bán kính (R):</span>{' '}
                    <strong className="text-sky-300">{R.toFixed(2)} cm</strong>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">Khoảng cách (h):</span>{' '}
                    <strong className="text-amber-300">{h.toFixed(2)} cm</strong>
                  </div>
                  {analysis.status === 'secant' && (
                    <>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400">Dây cung AB:</span>{' '}
                        <strong className="text-emerald-300">{analysis.chordLength.toFixed(2)} cm</strong>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        <span className="text-slate-400">OH (⟂ AB):</span>{' '}
                        <strong className="text-emerald-300">{h.toFixed(2)} cm</strong>
                      </div>
                    </>
                  )}
                  {analysis.status === 'tangent' && (
                    <div className="col-span-2 bg-amber-950/50 p-1.5 rounded border border-amber-800 text-amber-200 text-[11px]">
                      OT = R = {R.toFixed(2)} cm (OT ⟂ d tại tiếp điểm T)
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDE PANELS FOR TABS & PARAMETER ADJUSTMENTS */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
          {/* TAB 1: FREE TRIAL CONTROLS */}
          {activeTab === 'free' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  THAM SỐ ĐIỀU CHỈNH
                </span>
                <button
                  onClick={() => {
                    updateParam('r', 5);
                    updateParam('h', 4);
                    updateParam('angle', 0);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                   đặt lại
                </button>
              </div>

              {/* Slider Radius R */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Bán kính đường tròn (R):</span>
                  <span className="font-mono text-sky-400 font-bold">{R} cm</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={R}
                  onChange={(e) => updateParam('r', parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider Distance h */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Khoảng cách d(O, d) = h:</span>
                  <span className="font-mono text-amber-400 font-bold">{h} cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={h}
                  onChange={(e) => updateParam('h', parseFloat(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Slider Angle theta */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Góc nghiêng đường thẳng (θ):</span>
                  <span className="font-mono text-purple-400 font-bold">{angleDeg}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  step="5"
                  value={angleDeg}
                  onChange={(e) => updateParam('angle', parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Quick Jump Buttons for Cases */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">Nhảy nhanh tới trường hợp:</span>
                <div className="grid grid-cols-1 gap-1.5 text-xs font-medium">
                  <button
                    onClick={() => updateParam('h', R + 2)}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-rose-300 rounded-lg border border-slate-800 text-left transition flex items-center justify-between"
                  >
                    <span>1. Không cắt (h &gt; R)</span>
                    <span className="font-mono text-[11px] opacity-70">h = {(R + 2).toFixed(1)}</span>
                  </button>
                  <button
                    onClick={() => updateParam('h', R)}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded-lg border border-slate-800 text-left transition flex items-center justify-between"
                  >
                    <span>2. Tiếp xúc (h = R)</span>
                    <span className="font-mono text-[11px] opacity-70">h = {R.toFixed(1)}</span>
                  </button>
                  <button
                    onClick={() => updateParam('h', Math.max(1, R - 2))}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-emerald-300 rounded-lg border border-slate-800 text-left transition flex items-center justify-between"
                  >
                    <span>3. Cắt 2 điểm (h &lt; R)</span>
                    <span className="font-mono text-[11px] opacity-70">h = {Math.max(1, R - 2).toFixed(1)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GUIDED DISCOVERY EXPERIMENT */}
          {activeTab === 'guided' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  NHIỆM VỤ KHÁM PHÁ CÓ HƯỚNG DẪN
                </span>
                <span className="text-xs font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                  Bước {guidedStep}/4
                </span>
              </div>

              {guidedStep === 1 && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-200 leading-relaxed">
                    <strong>Bước 1:</strong> Quan sát trạng thái ban đầu khi cho bán kính <strong className="text-sky-300">R = 5 cm</strong> và khoảng cách <strong className="text-amber-300">h = 8 cm</strong>.
                  </p>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <p className="font-bold text-amber-200">Đường thẳng d có cắt đường tròn (O) không?</p>
                    <div className="space-y-1.5">
                      {['Không cắt (0 giao điểm)', 'Tiếp xúc (1 giao điểm)', 'Cắt tại 2 giao điểm'].map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setGuidedAnswer(idx);
                            if (idx === 0) setGuidedFeedback('✓ Chính xác! Vì h (8 cm) > R (5 cm) nên không có điểm chung.');
                            else setGuidedFeedback('❌ Chưa đúng! Nhìn mô hình: h (8 cm) lớn hơn bán kính R (5 cm).');
                          }}
                          className={`w-full text-left p-2 rounded-lg border transition font-medium ${
                            guidedAnswer === idx ? 'bg-purple-900/60 border-purple-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {guidedFeedback && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-purple-200">
                      {guidedFeedback}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setGuidedStep(2);
                      updateParam('r', 5);
                      updateParam('h', 5);
                      setGuidedAnswer(null);
                      setGuidedFeedback(null);
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-1"
                  >
                    <span>Chuyển sang Bước 2</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {guidedStep === 2 && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-200 leading-relaxed">
                    <strong>Bước 2:</strong> Rút ngắn khoảng cách về <strong className="text-amber-300">h = 5 cm</strong> (đúng bằng bán kính R = 5 cm).
                  </p>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <p className="font-bold text-amber-200">Hãy quan sát đường thẳng d lúc này:</p>
                    <p className="text-slate-300 text-[11px]">
                      Đường thẳng d tiếp xúc với đường tròn tại 1 tiếp điểm duy nhất T. Bán kính OT vuông góc với d.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setGuidedStep(3);
                      updateParam('r', 5);
                      updateParam('h', 3);
                    }}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-1"
                  >
                    <span>Chuyển sang Bước 3</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {guidedStep === 3 && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-200 leading-relaxed">
                    <strong>Bước 3:</strong> Tiếp tục kéo đường thẳng d vào sâu hơn sao cho <strong className="text-amber-300">h = 3 cm</strong> (&lt; R = 5 cm).
                  </p>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <p className="font-bold text-emerald-300">Kết quả:</p>
                    <p className="text-slate-300 text-[11px]">
                      Đường thẳng cắt đường tròn tại 2 giao điểm A và B, tạo thành dây cung AB = 8 cm và đoạn OH ⟂ AB tại trung điểm H.
                    </p>
                  </div>
                  <button
                    onClick={() => setGuidedStep(4)}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-1"
                  >
                    <span>Chuyển sang Bước 4 (Tổng kết)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {guidedStep === 4 && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl space-y-2 text-emerald-100">
                    <span className="font-bold text-amber-300 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      🎉 HOÀN THÀNH KHÁM PHÁ!
                    </span>
                    <p className="leading-relaxed text-[11px]">
                      Số điểm chung của đường thẳng và đường tròn được quyết định hoàn toàn bởi so sánh giữa <strong>h</strong> (khoảng cách) và <strong>R</strong> (bán kính):
                    </p>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                      <li>h &gt; R $\rightarrow$ 0 điểm chung (Không cắt)</li>
                      <li>h = R $\rightarrow$ 1 điểm chung (Tiếp xúc)</li>
                      <li>h &lt; R $\rightarrow$ 2 điểm chung (Cắt nhau)</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setGuidedStep(1)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition"
                  >
                    Làm lại từ Bước 1
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREDICTION ENGINE */}
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
                  ❓ Câu hỏi: Cho đường tròn (O; 5 cm) và đường thẳng d cách O một khoảng 4 cm. Đường thẳng d sẽ:
                </p>

                <div className="space-y-1.5">
                  {[
                    'A. Không cắt đường tròn',
                    'B. Tiếp xúc đường tròn tại 1 điểm',
                    'C. Cắt đường tròn tại hai điểm',
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPredictUserChoice(idx);
                        setPredictVerified(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition font-medium ${
                        predictUserChoice === idx
                          ? 'bg-amber-950/80 border-amber-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <button
                  disabled={predictUserChoice === null}
                  onClick={() => {
                    setPredictVerified(true);
                    updateParam('r', 5);
                    updateParam('h', 4);
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white shadow transition ${
                    predictUserChoice === null
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  🔍 KIỂM TRA TRÊN MÔ HÌNH
                </button>

                {predictVerified && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold leading-relaxed ${
                      predictUserChoice === 2
                        ? 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
                        : 'bg-rose-950/90 border-rose-800 text-rose-200'
                    }`}
                  >
                    {predictUserChoice === 2
                      ? '🎉 Chính xác! Khoảng cách h = 4 cm < R = 5 cm nên đường thẳng d cắt đường tròn tại hai điểm A và B.'
                      : '❌ Chưa chính xác! Hãy quan sát mô hình: vì h (4 cm) < R (5 cm) nên đường thẳng cắt đường tròn tại hai điểm.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SUMMARY CONCLUSION TABLE */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-400" />
                  BẢNG KẾT LUẬN VỊ TRÍ TƯƠNG ĐỐI
                </span>
              </div>

              <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold">
                      <th className="p-2 border-r border-slate-800">Quan hệ (h vs R)</th>
                      <th className="p-2 border-r border-slate-800">Vị trí tương đối</th>
                      <th className="p-2">Số điểm chung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className={`border-b border-slate-800 transition ${
                        analysis.status === 'outside' ? 'bg-rose-950/60 font-bold text-rose-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-800 font-mono">h &gt; R</td>
                      <td className="p-2 border-r border-slate-800">Không cắt nhau</td>
                      <td className="p-2 font-mono">0</td>
                    </tr>
                    <tr
                      className={`border-b border-slate-800 transition ${
                        analysis.status === 'tangent' ? 'bg-amber-950/60 font-bold text-amber-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-800 font-mono">h = R</td>
                      <td className="p-2 border-r border-slate-800">Tiếp xúc nhau</td>
                      <td className="p-2 font-mono">1 (Tiếp điểm T)</td>
                    </tr>
                    <tr
                      className={`transition ${
                        analysis.status === 'secant' ? 'bg-emerald-950/60 font-bold text-emerald-200' : 'text-slate-300'
                      }`}
                    >
                      <td className="p-2 border-r border-slate-800 font-mono">h &lt; R</td>
                      <td className="p-2 border-r border-slate-800">Cắt nhau</td>
                      <td className="p-2 font-mono">2 (A và B)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-300">
                <span className="font-bold text-sky-400">💡 Ghi nhớ nhanh:</span>
                <p className="text-[11px] leading-relaxed">
                  Đoạn vuông góc <strong>OH ⟂ d</strong> tại H. Độ dài <strong>OH = h</strong> là thước đo trung tâm để so sánh với bán kính R!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
