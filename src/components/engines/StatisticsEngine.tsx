import React, { useState, useEffect, useRef } from 'react';
import { ModelParams } from '../../types/geometry';
import { MathEngine } from '../../engine/MathEngine';
import { BarChart3, Plus, Trash2, Sliders, AlertTriangle, Layers, Award, Maximize2, Minimize2 } from 'lucide-react';

interface StatisticsEngineProps {
  params: ModelParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
  statisticsConfig?: {
    mode?: 'basic_metrics' | 'outlier_effect' | 'compare_datasets';
    initialDataset?: number[];
    datasetB?: number[];
  };
}

export const StatisticsEngine: React.FC<StatisticsEngineProps> = ({
  params,
  onParamChange,
  statisticsConfig,
}) => {
  const mode = statisticsConfig?.mode || 'basic_metrics';

  // Fullscreen mode state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
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

  // State for Dataset A
  const [datasetA, setDatasetA] = useState<number[]>(
    statisticsConfig?.initialDataset || [5, 6, 6, 7, 7, 8, 8, 9]
  );

  // State for Dataset B (for comparison)
  const [datasetB, setDatasetB] = useState<number[]>(
    statisticsConfig?.datasetB || [2, 4, 6, 8, 10, 12]
  );

  // Input string state
  const [inputStrA, setInputStrA] = useState<string>(datasetA.join(', '));
  const [hasOutlier, setHasOutlier] = useState<boolean>(false);

  // Apply Outlier Toggle
  const toggleOutlier = () => {
    if (!hasOutlier) {
      setDatasetA((prev) => [...prev, 50]);
      setHasOutlier(true);
    } else {
      setDatasetA((prev) => prev.filter((val) => val !== 50));
      setHasOutlier(false);
    }
  };

  const handleApplyInput = () => {
    const parsed = inputStrA
      .split(/[,;\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (parsed.length > 0) {
      setDatasetA(parsed);
      setHasOutlier(false);
    }
  };

  // Calculations for Dataset A
  const meanA = MathEngine.calculateMean(datasetA);
  const medianA = MathEngine.calculateMedian(datasetA);
  const modeA = MathEngine.calculateMode(datasetA);
  const rangeA = MathEngine.calculateRange(datasetA);
  const freqsA = MathEngine.calculateFrequencies(datasetA);

  // Calculations for Dataset B
  const meanB = MathEngine.calculateMean(datasetB);
  const medianB = MathEngine.calculateMedian(datasetB);
  const modeB = MathEngine.calculateMode(datasetB);
  const rangeB = MathEngine.calculateRange(datasetB);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 gap-4 text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6 overflow-y-auto' : 'h-full'
      }`}
    >
      {/* Top Header & Data Input Control Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-indigo-400">
          <BarChart3 className="w-4 h-4" />
          <span>
            {mode === 'outlier_effect' && 'Thí nghiệm: Tác động của Giá trị Ngoại lai (Outlier)'}
            {mode === 'compare_datasets' && 'Thí nghiệm: So sánh hai bộ dữ liệu (Dataset A & B)'}
            {mode === 'basic_metrics' && 'Thí nghiệm: Khám phá các Đại lượng Thống kê'}
          </span>
        </div>

        {/* Custom Data Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputStrA}
            onChange={(e) => setInputStrA(e.target.value)}
            placeholder="Nhập số cách nhau bởi dấu phẩy, e.g. 5, 6, 7"
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-white w-64 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleApplyInput}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
          >
            Cập nhật
          </button>

          {/* Outlier Button for Outlier Mode */}
          {mode === 'outlier_effect' && (
            <button
              onClick={toggleOutlier}
              className={`px-3 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 ${
                hasOutlier
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{hasOutlier ? 'Bỏ giá trị ngoại lai (50)' : '+ Thêm Ngoại lai (50)'}</span>
            </button>
          )}

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`px-2.5 py-1.5 rounded-lg border font-bold transition flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-sky-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình thí nghiệm'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Key Statistical Metrics Cards */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Các đại lượng đo lường trung tâm & độ tán sắc:</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {/* Mean */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-sky-800/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Trung bình cộng (Mean - x̄)</span>
                <span className="text-lg font-bold text-sky-400">{meanA}</span>
              </div>
              <span className="text-[10px] text-slate-400 max-w-[120px] text-right">
                Tổng chia cho số lượng phần tử ({datasetA.length})
              </span>
            </div>

            {/* Median */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Trung vị (Median - Me)</span>
                <span className="text-lg font-bold text-emerald-400">{medianA}</span>
              </div>
              <span className="text-[10px] text-slate-400 max-w-[120px] text-right">
                Giá trị ở chính giữa dãy số xếp tăng dần
              </span>
            </div>

            {/* Mode */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-800/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Mốt (Mode - Mo)</span>
                <span className="text-lg font-bold text-purple-400">
                  {modeA.length > 0 ? modeA.join(', ') : 'Không có'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 max-w-[120px] text-right">
                Giá trị xuất hiện với tần số nhiều nhất
              </span>
            </div>

            {/* Range */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Khoảng biến thiên (Range - R)</span>
                <span className="text-lg font-bold text-amber-400">{rangeA}</span>
              </div>
              <span className="text-[10px] text-slate-400 max-w-[120px] text-right">
                Khoảng chênh lệch: Max - Min
              </span>
            </div>
          </div>

          {/* Outlier Alert Explanation */}
          {hasOutlier && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Quan sát hiện tượng Ngoại lai:</span>
              </div>
              <p>
                Khi thêm điểm dị biệt (50), <strong>Trung bình (Mean)</strong> bị tăng vọt lên{' '}
                <strong className="text-white">{meanA}</strong>, trong khi <strong>Trung vị (Median)</strong> chỉ thay đổi rất ít (<strong className="text-white">{medianA}</strong>).
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Histogram / Dot Plot */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="text-xs font-bold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Biểu đồ tần số phân bố dữ liệu (Histogram & Frequency Plot)
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Tập dữ liệu: [{datasetA.join(', ')}]
            </span>
          </div>

          {/* HISTOGRAM BARS */}
          <div className="grid grid-cols-8 gap-2 items-end h-52 pt-8 pb-2 border-b border-slate-800 relative">
            {freqsA.map((item) => {
              const maxFreq = Math.max(...freqsA.map((f) => f.frequency));
              const heightPercent = Math.min(100, Math.max(10, (item.frequency / maxFreq) * 90));

              return (
                <div key={`stat-bar-${item.value}`} className="flex flex-col items-center h-full justify-end">
                  <span className="text-[10px] font-mono text-indigo-300 mb-1">
                    n = {item.frequency}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 relative ${
                      item.value === 50
                        ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                        : 'bg-gradient-to-t from-indigo-600 to-sky-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <div className="mt-2 font-mono text-xs font-bold text-white">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FREQUENCY TABLE */}
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-center border-collapse font-mono text-[11px]">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold">Giá trị (x)</th>
                  {freqsA.map((f) => (
                    <td key={`tb-val-${f.value}`} className="p-1 px-2 border-r border-slate-800 text-white font-bold">
                      {f.value}
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-sky-300">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold bg-slate-950/40">Tần số (n)</th>
                  {freqsA.map((f) => (
                    <td key={`tb-freq-${f.value}`} className="p-1 px-2 border-r border-slate-800">
                      {f.frequency}
                    </td>
                  ))}
                </tr>
                <tr className="text-emerald-300">
                  <th className="p-1 px-3 border-r border-slate-800 text-left font-bold bg-slate-950/40">Tần số tương đối (f)</th>
                  {freqsA.map((f) => (
                    <td key={`tb-rel-${f.value}`} className="p-1 px-2 border-r border-slate-800">
                      {(f.relativeFreq * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
