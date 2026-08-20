import React, { useRef } from 'react';
import { ModelType, ModelParams, SectionPlaneParams } from '../../types/geometry';
import { IntersectionResult } from './CrossSectionMath';
import {
  X,
  Printer,
  Sparkles,
  Maximize2,
  Layers,
  Compass,
  FileSpreadsheet,
  Cpu,
  HeartPulse,
  Building,
  TreeDeciduous,
  Share2,
  Check,
} from 'lucide-react';

interface CrossSection2DInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: IntersectionResult | null;
  modelType: ModelType;
  params: ModelParams;
  sectionParams: SectionPlaneParams;
}

export const CrossSection2DInspectorModal: React.FC<CrossSection2DInspectorModalProps> = ({
  isOpen,
  onClose,
  result,
  modelType,
  params,
  sectionParams,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !result) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyFormula = () => {
    navigator.clipboard.writeText(
      `Thiết diện: ${result.shapeNameVi}\nDiện tích S: ${result.area.toFixed(2)} cm²\nChu vi P: ${result.perimeter.toFixed(2)} cm\nCông thức: ${result.formulaVi}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute bounding box for 2D canvas drawing
  const pts2D = result.vertices2D || [];
  let minX = -3, maxX = 3, minY = -3, maxY = 3;
  if (pts2D.length > 0) {
    minX = Math.min(...pts2D.map((p) => p.x));
    maxX = Math.max(...pts2D.map((p) => p.x));
    minY = Math.min(...pts2D.map((p) => p.y));
    maxY = Math.max(...pts2D.map((p) => p.y));
  }
  const spanX = Math.max(2, maxX - minX);
  const spanY = Math.max(2, maxY - minY);
  const maxSpan = Math.max(spanX, spanY) * 1.4;
  const svgScale = 140 / maxSpan;

  // Real world applications by model
  const getRealWorldApplication = () => {
    switch (modelType) {
      case 'cylinder':
        return {
          icon: <HeartPulse className="w-5 h-5 text-rose-400" />,
          title: 'Y học: Chụp cắt lớp vi tính (CT / MRI Scan)',
          desc: 'Trong y học, máy chụp CT cắt các lát mỏng hình tròn/elip qua cơ thể và mạch máu hình trụ để phát hiện tổn thương chi tiết từng milimét.',
        };
      case 'sphere':
        return {
          icon: <Compass className="w-5 h-5 text-sky-400" />,
          title: 'Địa lý & Thiên văn học: Vĩ tuyến trên Trái Đất',
          desc: 'Mặt phẳng cắt Trái Đất song song xích đạo tạo thành các đường Vĩ tuyến (vòng tròn có bán kính thu nhỏ dần về 2 cực).',
        };
      case 'cone':
        return {
          icon: <Cpu className="w-5 h-5 text-amber-400" />,
          title: 'Quang học & Radar: Chùm tia quét nón & Anten Parabol',
          desc: 'Chùm tia sáng đèn pin hoặc radar quét hình nón cắt mặt đất tạo thành các vệt sáng hình Elip, Parabol hoặc Hypebol.',
        };
      case 'cuboid':
      case 'cube':
        return {
          icon: <Building className="w-5 h-5 text-emerald-400" />,
          title: 'Kiến trúc & Xây dựng: Bản vẽ Mặt cắt dầm cột',
          desc: 'Kỹ sư kết cấu cắt khối bê tông cốt thép để tính toán khả năng chịu lực, bố trí thép và độ bền cấu kiện công trình.',
        };
      default:
        return {
          icon: <TreeDeciduous className="w-5 h-5 text-purple-400" />,
          title: 'Khoa học Tự nhiên: Mặt cắt Thân cây & Tinh thể học',
          desc: 'Mặt cắt thân cây tiết lộ các vòng sinh trưởng hằng năm; trong khi mặt cắt tinh thể đá quý tạo ra các giác cắt đa giác lấp lánh.',
        };
    }
  };

  const realWorld = getRealWorldApplication();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div
        ref={printRef}
        className="bg-slate-900 border border-slate-700/90 rounded-3xl p-5 sm:p-7 max-w-3xl w-full shadow-2xl space-y-6 text-white my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-rose-600 to-purple-600 rounded-2xl shadow-lg shadow-rose-600/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-extrabold text-rose-400">
                Phân tích Hình học Phẳng 2D
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Bản Vẽ Kỹ Thuật Thiết Diện Thực Tế</span>
                <span className="px-2.5 py-0.5 text-xs bg-rose-500/20 text-rose-300 rounded-lg border border-rose-500/30">
                  {result.shapeNameVi}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="In hoặc Xuất PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2D Technical Drawing SVG & Blueprint Board */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Blueprint SVG Preview */}
          <div className="md:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[260px]">
            <div className="absolute top-3 left-3 text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
              Hệ tọa độ Oxy (Tỉ lệ 1:1 cm)
            </div>

            {/* SVG 2D Cross Section with Grid */}
            <svg
              width="240"
              height="240"
              viewBox="-120 -120 240 240"
              className="overflow-visible select-none drop-shadow-md"
            >
              {/* Coordinate Grid */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="-120" y="-120" width="240" height="240" fill="url(#grid)" />

              {/* Axes */}
              <line x1="-110" y1="0" x2="110" y2="0" stroke="#334155" strokeWidth="1.5" />
              <line x1="0" y1="-110" x2="0" y2="110" stroke="#334155" strokeWidth="1.5" />

              {/* Polygon / Ellipse Shape */}
              {pts2D.length >= 3 && (
                <>
                  <polygon
                    points={pts2D
                      .map((p) => `${p.x * svgScale},${-p.y * svgScale}`)
                      .join(' ')}
                    fill="#f43f5e"
                    fillOpacity="0.45"
                    stroke="#fb7185"
                    strokeWidth="2.5"
                  />

                  {/* Vertices and labels */}
                  {pts2D.map((p, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const sx = p.x * svgScale;
                    const sy = -p.y * svgScale;
                    return (
                      <g key={`svg-vert-${idx}`}>
                        <circle cx={sx} cy={sy} r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                        <text
                          x={sx + (sx >= 0 ? 8 : -14)}
                          y={sy + (sy >= 0 ? 12 : -6)}
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {letter}'
                        </text>
                      </g>
                    );
                  })}
                </>
              )}

              {/* If Conic circle or ellipse */}
              {result.isConic && (!pts2D.length || pts2D.length > 20) && (
                <circle
                  cx="0"
                  cy="0"
                  r={Math.min(90, (result.radii?.r1 ?? 2) * 22)}
                  fill="#f43f5e"
                  fillOpacity="0.45"
                  stroke="#fb7185"
                  strokeWidth="2.5"
                />
              )}
            </svg>
          </div>

          {/* Metric Calculations Card */}
          <div className="md:col-span-6 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Diện tích thiết diện:</span>
                <span className="text-base font-black text-emerald-400">
                  {result.area.toFixed(2)} cm²
                </span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Chu vi thiết diện:</span>
                <span className="text-base font-black text-sky-400">
                  {result.perimeter.toFixed(2)} cm
                </span>
              </div>
            </div>

            {/* Formula box */}
            <div className="p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-rose-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Công thức tính toán:</span>
                </span>
                <button
                  onClick={handleCopyFormula}
                  className="p-1 hover:text-white text-slate-400 rounded transition"
                  title="Sao chép công thức"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="font-mono text-emerald-300 text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                {result.formulaVi}
              </p>
              <p className="text-slate-300 text-[11px] leading-relaxed pt-0.5">
                {result.descriptionVi}
              </p>
            </div>

            {/* Vertex Coordinate Table */}
            {pts2D.length > 0 && pts2D.length <= 8 && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-[11px]">
                <span className="text-slate-400 font-bold block mb-1.5 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
                  <span>Tọa độ các đỉnh thiết diện (Oxy):</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono">
                  {pts2D.map((p, idx) => (
                    <div
                      key={`pt-tbl-${idx}`}
                      className="px-2 py-1 bg-slate-900 rounded-lg text-slate-200 border border-slate-800"
                    >
                      <strong className="text-sky-300">{String.fromCharCode(65 + idx)}':</strong> (
                      {p.x.toFixed(1)}, {p.y.toFixed(1)})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real World STEM Application Banner */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3">
          <div className="p-2.5 bg-slate-800/90 rounded-xl shrink-0 mt-0.5">
            {realWorld.icon}
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-white text-sm">{realWorld.title}</h4>
            <p className="text-slate-300 leading-relaxed">{realWorld.desc}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Xuất phiếu học tập</span>
          </button>
        </div>
      </div>
    </div>
  );
};
