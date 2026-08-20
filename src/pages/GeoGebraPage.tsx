import React, { useState } from 'react';
import { GeoGebraCanvas, GeoGebraAppName } from '../components/geogebra/GeoGebraCanvas';
import {
  Compass,
  Sparkles,
  BookOpen,
  Code2,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight,
  Maximize2,
  Info,
} from 'lucide-react';

export const GeoGebraPage: React.FC = () => {
  const [activePreset, setActivePreset] = useState<'free' | 'triangle' | 'circles' | 'transformations' | 'graphing'>('free');

  return (
    <div className="space-y-6 pb-12">
      {/* Page Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>TÍCH HỢP GEOGEBRA WEB & TABLET API</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Bảng Vẽ Hình Học & Dựng Hình Tương Tác
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Dựng các đối tượng hình học cơ bản (điểm, đường thẳng, đường tròn, góc) và thực hiện các phép biến hình (đối xứng, quay, tịnh tiến). Điều khiển trực tiếp bằng JavaScript API, lắng nghe tọa độ biến đổi realtime và xuất kết quả hình học.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Ô nhập lệnh Tiếng Việt tự động bóc tách</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-4 h-4 text-sky-400" />
              <span>Chế độ Toàn màn hình (Fullscreen)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dựng điểm, giao điểm, trung điểm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Đường tròn & tiếp tuyến</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Phép đối xứng, tịnh tiến, quay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive GeoGebra Canvas Component */}
      <GeoGebraCanvas initialAppName="geometry" />

      {/* Educational Presets & Documentation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Features Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-sky-400 font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <h3>Các Tính Năng Dựng Hình Key</h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300 leading-normal">
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>Điểm & Tọa Độ:</strong> Tạo điểm tự do, điểm cố định, giao điểm đường thẳng / đường tròn.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>Đường Đặc Biệt:</strong> Dựng đường trung trực, đường phân giác góc, đường vuông góc, đường song song.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sky-400 font-bold">•</span>
              <span><strong>Phép Biến Hình:</strong> Phép đối xứng qua đường thẳng/điểm, phép tịnh tiến véctơ, phép quay quanh tâm.</span>
            </li>
          </ul>
        </div>

        {/* Card 2: JS API Capabilities */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-sm">
            <Code2 className="w-4 h-4" />
            <h3>Điều Khiển Bằng JavaScript API</h3>
          </div>
          <p className="text-xs text-slate-300 leading-normal">
            Sử dụng GeoGebra Web API cho phép ứng dụng tương tác 2 chiều với bảng vẽ:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-300 space-y-1">
            <p>// Tạo đối tượng qua lệnh</p>
            <p className="text-indigo-300">api.evalCommand("A = (2, 3)")</p>
            <p>// Lắng nghe sự kiện di chuyển</p>
            <p className="text-indigo-300">api.registerUpdateListener(fn)</p>
            <p>// Đọc tọa độ & xuất ảnh PNG</p>
            <p className="text-indigo-300">api.getPNGBase64(dpi)</p>
          </div>
        </div>

        {/* Card 3: Instructions & Classroom Usage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <h3>Ứng Dụng Giảng Dạy & Luyện Tập</h3>
          </div>
          <p className="text-xs text-slate-300 leading-normal">
            Giáo viên có thể sử dụng bảng vẽ GeoGebra để minh họa trực quan các bài toán dựng hình khó, cho học sinh di chuyển các đỉnh tam giác để kiểm chứng các tính chất đồng quy của 3 đường trung tuyến, 3 đường phân giác, hoặc đường tròn ngoại tiếp.
          </p>
        </div>
      </div>
    </div>
  );
};
