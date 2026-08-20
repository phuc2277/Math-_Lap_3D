import React from 'react';
import { GeometryModelConfig, ModelParams, DisplayOptions } from '../../types/geometry';
import { Sliders, Eye, RotateCcw, Settings2, ShieldCheck, X, Palette, EyeOff, Type, Zap, Gauge } from 'lucide-react';

interface ParameterControlsProps {
  config: GeometryModelConfig;
  params: ModelParams;
  displayOptions: DisplayOptions;
  onParamChange: (key: keyof ModelParams, value: number) => void;
  onOptionToggle: (key: keyof DisplayOptions, value?: any) => void;
  onReset: () => void;
  isTeacherMode?: boolean;
  onClose?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Xanh lam', hex: '#38bdf8', bg: 'bg-[#38bdf8]' },
  { name: 'Xanh lá', hex: '#10b981', bg: 'bg-[#10b981]' },
  { name: 'Vàng cam', hex: '#f59e0b', bg: 'bg-[#f59e0b]' },
  { name: 'Hồng đỏ', hex: '#f43f5e', bg: 'bg-[#f43f5e]' },
  { name: 'Tím hoa sen', hex: '#a855f7', bg: 'bg-[#a855f7]' },
  { name: 'Xanh chàm', hex: '#6366f1', bg: 'bg-[#6366f1]' },
];

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  config,
  params,
  displayOptions,
  onParamChange,
  onOptionToggle,
  onReset,
  isTeacherMode = false,
  onClose,
}) => {
  const { paramBounds } = config;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3.5 text-slate-100 relative group">
      {/* Title & Reset Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="font-bold text-slate-100 text-xs sm:text-sm tracking-wide">
            ĐIỀU CHỈNH THÔNG SỐ
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700"
            title="Đặt lại thông số mặc định"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Đặt lại</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
              title="Tắt ô Điều chỉnh thông số"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sliders Section */}
      <div className="space-y-4">
        {Object.entries(paramBounds).map(([key, bound]) => {
          if (!bound) return null;
          const paramKey = key as keyof ModelParams;
          const val = params[paramKey] ?? bound.min;

          return (
            <div key={key} className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  {bound.name}
                </span>
                <div className="flex items-center gap-1 font-mono text-sky-300 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded-md">
                  <input
                    type="number"
                    min={bound.min}
                    max={bound.max}
                    step={bound.step}
                    value={val}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        onParamChange(paramKey, Math.max(bound.min, Math.min(bound.max, num)));
                      }
                    }}
                    className="w-12 bg-transparent text-right outline-none text-sky-300 font-mono font-semibold"
                  />
                  <span>{bound.unit}</span>
                </div>
              </div>

              <input
                type="range"
                min={bound.min}
                max={bound.max}
                step={bound.step}
                value={val}
                onChange={(e) => onParamChange(paramKey, parseFloat(e.target.value))}
                className="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{bound.min} {bound.unit}</span>
                <span>{bound.max} {bound.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toggles & Display Options */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span>Hiển thị yếu tố hình học</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {displayOptions.hasOwnProperty('showRadius') && config.paramBounds.r && (
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={displayOptions.showRadius}
                onChange={() => onOptionToggle('showRadius')}
                className="rounded accent-sky-400 text-sky-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-slate-300 text-[11px]">Bán kính (r)</span>
            </label>
          )}

          {displayOptions.hasOwnProperty('showHeight') && config.paramBounds.h && (
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={displayOptions.showHeight}
                onChange={() => onOptionToggle('showHeight')}
                className="rounded accent-emerald-400 text-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-slate-300 text-[11px]">Chiều cao (h)</span>
            </label>
          )}

          {config.modelType === 'cone' && (
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={displayOptions.showSlantHeight}
                onChange={() => onOptionToggle('showSlantHeight')}
                className="rounded accent-purple-400 text-purple-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-slate-300 text-[11px]">Đường sinh (l)</span>
            </label>
          )}

          {[
            'cuboid',
            'cube',
            'prism',
            'prism_quad',
            'pyramid',
            'pyramid_triangular',
            'cylinder',
            'cone',
            'sphere',
          ].includes(config.modelType) && (
            <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
              <input
                type="checkbox"
                checked={displayOptions.showDiagonals ?? true}
                onChange={() => onOptionToggle('showDiagonals')}
                className="rounded accent-amber-400 text-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="text-slate-300 text-[11px] font-medium text-amber-300/90">
                Đường chéo / Trục (d)
              </span>
            </label>
          )}

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={displayOptions.showLabels}
              onChange={() => onOptionToggle('showLabels')}
              className="rounded accent-amber-400 text-amber-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-slate-300 text-[11px]">Tên nhãn 3D</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={displayOptions.showDimensions}
              onChange={() => onOptionToggle('showDimensions')}
              className="rounded accent-sky-400 text-sky-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-slate-300 text-[11px]">Kích thước</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={displayOptions.showGrid}
              onChange={() => onOptionToggle('showGrid')}
              className="rounded accent-slate-400 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-slate-300 text-[11px]">Lưới không gian</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={displayOptions.showAxes}
              onChange={() => onOptionToggle('showAxes')}
              className="rounded accent-rose-400 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-slate-300 text-[11px]">Trục XYZ</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
            <input
              type="checkbox"
              checked={displayOptions.transparentSolid}
              onChange={() => onOptionToggle('transparentSolid')}
              className="rounded accent-indigo-400 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-slate-300 text-[11px]">Nhìn xuyên 3D</span>
          </label>

          <label className={`col-span-2 flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
            displayOptions.performanceMode
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${displayOptions.performanceMode ? 'text-emerald-400 fill-current animate-pulse' : 'text-slate-400'}`} />
              <div className="flex flex-col">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  Performance Mode (Tiết kiệm GPU)
                  {displayOptions.performanceMode && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">BẬT</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">Giảm phân giải & khử răng cưa cho thiết bị yếu / điện thoại</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(displayOptions.performanceMode)}
              onChange={() => onOptionToggle('performanceMode')}
              className="rounded accent-emerald-500 text-emerald-400 w-4 h-4 cursor-pointer ml-2"
            />
          </label>
        </div>
      </div>

      {/* Model Color Selector */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-sky-400" />
            <span>Màu sắc khối 3D/2D</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {displayOptions.modelColor || '#38bdf8'}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2 pt-1">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.hex}
              onClick={() => onOptionToggle('modelColor', c.hex)}
              className={`w-7 h-7 rounded-lg transition-transform ${c.bg} ${
                (displayOptions.modelColor || '#38bdf8') === c.hex
                  ? 'ring-2 ring-white scale-110 shadow-lg'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              }`}
              title={`Màu ${c.name}`}
            />
          ))}

          {/* Custom Color Input */}
          <label
            className="relative w-7 h-7 rounded-lg overflow-hidden border border-slate-700 cursor-pointer flex items-center justify-center bg-slate-800 hover:bg-slate-700 transition"
            title="Tùy chọn màu bất kỳ"
          >
            <input
              type="color"
              value={displayOptions.modelColor || '#38bdf8'}
              onChange={(e) => onOptionToggle('modelColor', e.target.value)}
              className="absolute opacity-0 w-full h-full cursor-pointer"
            />
            <span className="text-[10px] font-bold text-slate-300">+</span>
          </label>
        </div>
      </div>

      {/* Quick Clear Text / Delete Labels Button */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          onClick={() => onOptionToggle('showLabels')}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border ${
            !displayOptions.showLabels
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-md'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
          }`}
          title={displayOptions.showLabels ? 'Xóa/Ẩn tất cả các chữ/nhãn tên trên hình để đỡ nhức mắt' : 'Mở lại các chữ/nhãn tên trên hình'}
        >
          {displayOptions.showLabels ? (
            <>
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Xóa/Ẩn chữ trên hình (Tránh nhức mắt)</span>
            </>
          ) : (
            <>
              <Type className="w-4 h-4 text-emerald-400" />
              <span>Hiện lại chữ trên hình</span>
            </>
          )}
        </button>
      </div>

      {/* Teacher Mode preset buttons */}
      {isTeacherMode && (
        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Chế độ Giáo viên: Cấu hình nhanh</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                if (config.paramBounds.a) onParamChange('a', 3);
                if (config.paramBounds.b) onParamChange('b', 3);
                if (config.paramBounds.h) onParamChange('h', 3);
                if (config.paramBounds.r) onParamChange('r', 3);
              }}
              className="py-1.5 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 rounded-lg transition font-medium border border-amber-700/50"
            >
              Cấu hình Nhỏ (3cm)
            </button>
            <button
              onClick={() => {
                if (config.paramBounds.a) onParamChange('a', 6);
                if (config.paramBounds.b) onParamChange('b', 4);
                if (config.paramBounds.h) onParamChange('h', 8);
                if (config.paramBounds.r) onParamChange('r', 5);
              }}
              className="py-1.5 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 rounded-lg transition font-medium border border-amber-700/50"
            >
              Cấu hình Lớn
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
