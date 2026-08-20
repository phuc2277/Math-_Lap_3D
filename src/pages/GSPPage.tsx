import React from 'react';
import { GSPSketchpadCanvas } from '../components/gsp/GSPSketchpadCanvas';
import {
  Compass,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Maximize2,
  Layers,
  RotateCw,
  Ruler,
  Play,
  Share2,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

export const GSPPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>TÍCH HỢP PHẦN MỀM GSP SKETCHPAD (THE GEOMETER'S SKETCHPAD)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bảng Vẽ Hình Học Động GSP Sketchpad
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Môi trường dựng hình hình học phẳng kinh điển và mạnh mẽ: Dựng các đối tượng cơ bản (điểm, đoạn thẳng, tia, đường thẳng, đường tròn), thực hiện phép biến hình (quay, tịnh tiến, vị tự, đối xứng), đo đạc số đo góc/độ dài/diện tích và tạo chuyển động hoạt họa quỹ tích động học.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Dựng trung điểm, đường vuông góc, song song, phân giác</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCw className="w-4 h-4 text-rose-400" />
              <span>Phép biến hình (Quay, Tịnh tiến, Vị tự, Đối xứng)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-sky-400" />
              <span>Đo khoảng cách, số đo góc & Bảng máy tính GSP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Chuyển động hoạt họa & Quỹ tích Elip, đường tròn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive GSP Sketchpad Canvas */}
      <GSPSketchpadCanvas />

      {/* Educational Features & Documentation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Construct Menu */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <Compass className="w-4 h-4" />
            <h3>1. Thực Đơn Dựng Hình (Construct)</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-normal">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Trung điểm:</strong> Chọn 2 điểm hoặc 1 đoạn thẳng để tạo trung điểm chính xác.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Đường vuông góc & song song:</strong> Chọn 1 điểm và 1 đường thẳng để kẻ đường vuông góc hoặc song song.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Đường phân giác góc:</strong> Chọn 3 điểm (đỉnh góc ở giữa) để chia đôi góc chuẩn xác.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Transform Menu */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
            <RotateCw className="w-4 h-4" />
            <h3>2. Phép Biến Hình (Transform)</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-normal">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Đánh dấu tâm (Mark Center):</strong> Chọn 1 điểm làm tâm chuẩn cho các phép quay, vị tự.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Phép quay & vị tự:</strong> Xoay đối tượng quanh tâm với góc $\alpha$ tùy ý hoặc co giãn theo hệ số $k$.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">•</span>
              <span><strong>Phép tịnh tiến:</strong> Dịch chuyển hình học theo vector $(dx, dy)$ bảo toàn khoảng cách.</span>
            </li>
          </ul>
        </div>

        {/* Card 3: Measurements & Animations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
            <Play className="w-4 h-4" />
            <h3>3. Đo Lường & Hoạt Họa (Animate)</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-normal">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Bảng số đo realtime:</strong> Độ dài các cạnh và số đo góc tự động cập nhật khi kéo thả đỉnh.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Hoạt họa chuyển động:</strong> Nút [Chuyển động] cho phép điểm di chuyển tuần hoàn trên quỹ đạo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Lưu file .gsp:</strong> Xuất và nhập bản vẽ dạng JSON Sketchpad tương thích cao.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
