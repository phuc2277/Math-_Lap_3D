import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Layers,
  Eye,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Move,
  RotateCw,
  Compass,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Maximize2,
  FileSpreadsheet,
  Printer,
  Volume2,
} from 'lucide-react';
import { SectionPlaneParams, ModelType, ModelParams } from '../../types/geometry';
import { createCuttingPlane, solveCrossSection, IntersectionResult } from './CrossSectionMath';
import { CrossSectionPredictionModal } from './CrossSectionPredictionModal';
import { CrossSection2DInspectorModal } from './CrossSection2DInspectorModal';
import { soundEffects } from '../../utils/audioEffects';

interface SectionControlsProps {
  modelType: ModelType;
  params: ModelParams;
  sectionParams: SectionPlaneParams;
  onChange: (updates: Partial<SectionPlaneParams>) => void;
  onClose?: () => void;
}

export const SectionControls: React.FC<SectionControlsProps> = ({
  modelType,
  params,
  sectionParams,
  onChange,
  onClose,
}) => {
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [show2DInspectorModal, setShow2DInspectorModal] = useState(false);
  const [activeStep, setActiveStep] = useState<'plane' | 'cut' | 'separate' | 'section' | 'predict'>('plane');

  const {
    enabled = false,
    position = 0,
    orientation = 'horizontal',
    pitch = 0,
    yaw = 0,
    roll = 0,
    isCut = false,
    separation = 0,
    extractSection = false,
    extractOffset = 3.5,
    showSectionFace = true,
    showContour = true,
    showCap = true,
    showDimensions = true,
    isAnimating = false,
  } = sectionParams;

  // Calculate live intersection result for display
  const liveResult = useMemo<IntersectionResult | null>(() => {
    if (!enabled) return null;
    const h = params.h ?? (modelType === 'sphere' ? (params.r ?? 3) * 2 : 5);
    let p = pitch;
    let y = yaw;
    let r_deg = roll;
    let off = position * (h / 2);

    if (orientation === 'horizontal') {
      p = 0; y = 0; r_deg = 0; off = position * (h / 2);
    } else if (orientation === 'vertical') {
      p = 90; y = 0; r_deg = 0; off = position * ((params.r ?? (params.a ?? 4) / 2) * 0.8);
    } else if (orientation === 'diagonal_45') {
      p = 45; y = 0; r_deg = 0; off = position * (h / 2.5);
    } else if (orientation === 'apex_midpoint') {
      p = 60; y = 45; r_deg = 0; off = position * (h / 3);
    }

    const { plane } = createCuttingPlane(p, y, r_deg, off);
    return solveCrossSection(modelType, params, plane);
  }, [enabled, modelType, params, position, orientation, pitch, yaw, roll]);

  // 7-Stage Cinematic Animation Runner
  const playSequentialAnimation = () => {
    onChange({
      enabled: true,
      isAnimating: true,
      isCut: false,
      separation: 0,
      extractSection: false,
    });

    // Step 1 & 2: Plane enters solid
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress <= 0.3) {
        // Stage 1 & 2
        onChange({ position: -0.6 + progress * 2 });
      } else if (progress <= 0.5) {
        // Stage 3 & 4: Cut execute
        onChange({ isCut: true, showSectionFace: true, showContour: true });
      } else if (progress <= 0.75) {
        // Stage 5: Separate halves
        onChange({ isCut: true, separation: (progress - 0.5) * 6 });
      } else if (progress <= 1.0) {
        // Stage 6 & 7: Extract cross section & rotate to viewer
        onChange({
          isCut: true,
          separation: 1.5,
          extractSection: true,
          extractRotation: 1,
        });
      } else {
        clearInterval(interval);
        onChange({ isAnimating: false });
      }
    }, 100);
  };

  const handleReset = () => {
    soundEffects.playPopSound();
    onChange({
      position: 0,
      pitch: 0,
      yaw: 0,
      roll: 0,
      isCut: false,
      separation: 0,
      extractSection: false,
      showSectionFace: true,
      showContour: true,
      orientation: 'horizontal',
    });
    setActiveStep('plane');
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 text-white">
      {/* 1. Header & Master Enable Toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl shadow-lg shadow-rose-500/20 text-white">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <span>Hệ Thống Mặt Cắt 3D & Thiết Diện Thực</span>
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] rounded-full border border-rose-500/30">
                PRO Real Cut
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Cắt khối thực, tách 2 nửa, làm nổi bật và tách thiết diện ra ngoài
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ enabled: !enabled })}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
              enabled
                ? 'bg-rose-500 text-white border border-rose-400 shadow-rose-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{enabled ? '🚫 Tắt mặt phẳng cắt' : '✂️ Bật mặt phẳng cắt'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Đóng bảng điều khiển"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!enabled ? (
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>
              Mặt phẳng cắt đang <strong>TẮT</strong>. Khối 3D ở trạng thái nguyên vẹn ban đầu.
            </span>
          </div>
          <button
            onClick={() => onChange({ enabled: true })}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Bật mặt cắt ngay</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 2. Step Navigation Bar (Requirement 12) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 overflow-x-auto text-xs">
            <button
              onClick={() => {
                setActiveStep('plane');
                onChange({ isCut: false });
              }}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                activeStep === 'plane' && !isCut
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Mặt phẳng</span>
            </button>

            <button
              onClick={() => {
                setActiveStep('cut');
                onChange({ isCut: true, showSectionFace: true, showContour: true });
              }}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                isCut && separation === 0 && !extractSection
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Scissors className="w-3 h-3" />
              <span>Cắt khối</span>
            </button>

            <button
              onClick={() => {
                setActiveStep('separate');
                onChange({ isCut: true, separation: separation > 0 ? separation : 1.5 });
              }}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                isCut && separation > 0 && !extractSection
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Move className="w-3 h-3" />
              <span>Tách 2 phần</span>
            </button>

            <button
              onClick={() => {
                setActiveStep('section');
                onChange({ extractSection: !extractSection });
              }}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                extractSection
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Mặt cắt</span>
            </button>

            <button
              onClick={() => setShowPredictionModal(true)}
              className="flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 text-purple-300 hover:text-white hover:bg-purple-900/40"
            >
              <HelpCircle className="w-3 h-3 text-purple-400" />
              <span>Dự đoán</span>
            </button>

            <button
              onClick={handleReset}
              className="py-1.5 px-2.5 rounded-xl font-bold text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition flex items-center justify-center gap-1"
              title="Khôi phục trạng thái ban đầu"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* 3. Main Action Buttons Grid (Requirements 3, 4, 5, 6, 7, 8) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Button 3: ✂️ Cắt khối */}
            <button
              onClick={() => {
                soundEffects.playSliceSound();
                onChange({ isCut: !isCut, showSectionFace: true, showContour: true });
              }}
              className={`p-2.5 rounded-2xl border text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md ${
                isCut
                  ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/25 ring-2 ring-rose-400/40'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Scissors className="w-4 h-4 text-rose-400" />
              <span>{isCut ? '✓ Đã Cắt Khối' : '✂️ Cắt khối'}</span>
            </button>

            {/* Button 4: ↔️ Tách hai phần */}
            <button
              onClick={() => {
                soundEffects.playSeparateSound();
                if (!isCut) onChange({ isCut: true, separation: 1.5 });
                else onChange({ separation: separation > 0 ? 0 : 1.5 });
              }}
              className={`p-2.5 rounded-2xl border text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md ${
                separation > 0
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/25'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Move className="w-4 h-4" />
              <span>{separation > 0 ? '✓ Đã Tách 2 Phần' : '↔️ Tách 2 phần'}</span>
            </button>

            {/* Button 5: 👁 Hiện mặt cắt */}
            <button
              onClick={() => {
                soundEffects.playPopSound();
                onChange({ showSectionFace: !showSectionFace, showContour: !showContour });
              }}
              className={`p-2.5 rounded-2xl border text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md ${
                showSectionFace
                  ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/25'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Eye className="w-4 h-4 text-sky-300" />
              <span>{showSectionFace ? '👁 Ẩn mặt cắt' : '👁 Hiện mặt cắt'}</span>
            </button>

            {/* Button 6: 🎯 Tách mặt cắt */}
            <button
              onClick={() => {
                soundEffects.playSeparateSound();
                onChange({ extractSection: !extractSection, extractRotation: 1 });
              }}
              className={`p-2.5 rounded-2xl border text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-md ${
                extractSection
                  ? 'bg-purple-600 text-white border-purple-500 shadow-purple-600/25 ring-2 ring-purple-400/40'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span>{extractSection ? '✓ Đã Tách Thiết Diện' : '🎯 Tách mặt cắt'}</span>
            </button>
          </div>

          {/* Separation Slider (When Split / Cut is Active) */}
          {isCut && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5" />
                  <span>Khoảng cách kéo tách hai phần khối:</span>
                </span>
                <span className="font-mono">{separation.toFixed(1)} cm</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={4}
                  step={0.1}
                  value={separation}
                  onChange={(e) => onChange({ separation: parseFloat(e.target.value) })}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <button
                  onClick={() => onChange({ separation: 0 })}
                  className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-semibold"
                >
                  Khép lại
                </button>
                <button
                  onClick={() => onChange({ separation: 2 })}
                  className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold"
                >
                  Tách rộng
                </button>
              </div>
            </div>
          )}

          {/* 4. Orientation Presets */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-rose-400" />
              <span>Góc cắt định sẵn (Presets):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                onClick={() => onChange({ orientation: 'horizontal', pitch: 0, yaw: 0, roll: 0 })}
                className={`p-2 rounded-xl border text-center font-semibold transition ${
                  orientation === 'horizontal'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cắt ngang (Song song đáy)
              </button>

              <button
                onClick={() => onChange({ orientation: 'vertical', pitch: 90, yaw: 0, roll: 0 })}
                className={`p-2 rounded-xl border text-center font-semibold transition ${
                  orientation === 'vertical'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cắt dọc (Trục / Đỉnh)
              </button>

              <button
                onClick={() => onChange({ orientation: 'diagonal_45', pitch: 45, yaw: 0, roll: 0 })}
                className={`p-2 rounded-xl border text-center font-semibold transition ${
                  orientation === 'diagonal_45'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cắt chéo 45°
              </button>

              <button
                onClick={() => onChange({ orientation: 'apex_midpoint', pitch: 60, yaw: 45, roll: 0 })}
                className={`p-2 rounded-xl border text-center font-semibold transition ${
                  orientation === 'apex_midpoint'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cắt xiên qua 3 điểm
              </button>
            </div>
          </div>

          {/* 5. Plane Position & 3-Axis Angle Sliders (Requirement 2) */}
          <div className="space-y-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-xs">
            {/* Position / Offset */}
            <div className="space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>Di chuyển vị trí mặt phẳng (Offset):</span>
                </span>
                <span className="font-mono text-rose-300 font-bold">
                  {position > 0 ? '+' : ''}
                  {(position * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={-0.85}
                max={0.85}
                step={0.02}
                value={position}
                onChange={(e) => onChange({ position: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Pitch & Yaw Angles (Góc nghiêng xoay mặt phẳng) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-sky-400" />
                    <span>Góc nghiêng trục X (Pitch):</span>
                  </span>
                  <span className="font-mono text-sky-300">{pitch}°</span>
                </div>
                <input
                  type="range"
                  min={-90}
                  max={90}
                  step={5}
                  value={pitch}
                  onChange={(e) =>
                    onChange({
                      pitch: parseInt(e.target.value),
                      orientation: 'custom',
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-400 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-purple-400" />
                    <span>Góc xoay trục Y (Yaw):</span>
                  </span>
                  <span className="font-mono text-purple-300">{yaw}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={yaw}
                  onChange={(e) =>
                    onChange({
                      yaw: parseInt(e.target.value),
                      orientation: 'custom',
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
              </div>
            </div>

            {/* Separation Distance Slider & Snap Controls */}
            {isCut && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>Khoảng cách tách 2 phần (d):</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-300 font-bold">
                      {((separation || 0) * 2).toFixed(1)} cm
                    </span>
                    <button
                      onClick={() => {
                        soundEffects.playPopSound();
                        onChange({ separation: 0 });
                      }}
                      className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded-md border border-amber-500/30 transition"
                      title="Nhập lại 2 phần thành khối liền"
                    >
                      ⏪ Nhập lại (0 cm)
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3.5}
                  step={0.05}
                  value={separation || 0}
                  onChange={(e) => onChange({ separation: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[10px] text-slate-400 italic">
                  💡 Bạn có thể dùng chuột kéo trực tiếp 2 nửa khối trong không gian 3D để tách hoặc nhập lại.
                </p>
              </div>
            )}
          </div>

          {/* 6. Real-time Mathematical Information Card (Requirements 10 & 11) */}
          {liveResult && (
            <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                    Hình học Thiết diện Thực tế
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white px-2.5 py-0.5 bg-rose-500/20 border border-rose-500/30 rounded-lg">
                    {liveResult.shapeNameVi}
                  </span>
                  <button
                    onClick={() => setShow2DInspectorModal(true)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg border border-slate-700 transition flex items-center gap-1 text-xs font-bold"
                    title="Mở bản vẽ kỹ thuật 2D & in ấn"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xem 2D / In</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Diện tích thiết diện S:</span>
                  <span className="text-sm font-black text-emerald-400">
                    {liveResult.area.toFixed(2)} cm²
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Chu vi thiết diện P:</span>
                  <span className="text-sm font-black text-sky-400">
                    {liveResult.perimeter.toFixed(2)} cm
                  </span>
                </div>
              </div>

              {/* Side lengths & angles breakdown if polygon */}
              {liveResult.sideLengths && liveResult.sideLengths.length > 0 && (
                <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200">
                    Độ dài các cạnh: {liveResult.sideLengths.map((s) => `${s.toFixed(1)} cm`).join(' — ')}
                  </div>
                  {liveResult.anglesDeg && liveResult.anglesDeg.length > 0 && (
                    <div className="text-slate-400">
                      Các góc trong: {liveResult.anglesDeg.map((a) => `${a.toFixed(0)}°`).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {liveResult.descriptionVi}
              </p>
            </div>
          )}

          {/* 7. Bottom Cinema Animation & Prediction Triggers */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={playSequentialAnimation}
              disabled={isAnimating}
              className="w-full sm:flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isAnimating ? 'Đang chạy hoạt họa...' : '🎬 Chạy hoạt họa 7 bước (Cinematic)'}</span>
            </button>

            <button
              onClick={() => setShowPredictionModal(true)}
              className="w-full sm:w-auto py-2.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>🔮 Dự đoán mặt cắt</span>
            </button>
          </div>
        </div>
      )}

      {/* Prediction Quiz Modal */}
      <CrossSectionPredictionModal
        isOpen={showPredictionModal}
        onClose={() => setShowPredictionModal(false)}
        modelType={modelType}
        params={params}
        sectionParams={sectionParams}
        onExecuteCut={() => onChange({ isCut: true, showSectionFace: true, showContour: true })}
        onStartAnimation={playSequentialAnimation}
      />

      {/* 2D Technical Blueprint & Inspector Modal */}
      <CrossSection2DInspectorModal
        isOpen={show2DInspectorModal}
        onClose={() => setShow2DInspectorModal(false)}
        result={liveResult}
        modelType={modelType}
        params={params}
        sectionParams={sectionParams}
      />
    </div>
  );
};
