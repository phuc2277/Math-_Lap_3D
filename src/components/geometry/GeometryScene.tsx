import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  ModelType,
  ModelParams,
  DisplayOptions,
  SectionPlaneParams,
  LabTab,
} from '../../types/geometry';
import { Cuboid3D } from './Cuboid3D';
import { Cube3D } from './Cube3D';
import { Cylinder3D } from './Cylinder3D';
import { Cone3D } from './Cone3D';
import { Sphere3D } from './Sphere3D';
import { Parabol3D } from './Parabol3D';
import { Prism3D } from './Prism3D';
import { PrismQuad3D } from './PrismQuad3D';
import { Pyramid3D } from './Pyramid3D';
import { PyramidTriangular3D } from './PyramidTriangular3D';
import { LiquidFilling3D } from './LiquidFilling3D';
import { CustomAxesHelper } from './3DHelpers';
import { GeometryMeasurement } from '../measurements/GeometryMeasurement';
import { CuboidUnfolding } from '../unfolding/CuboidUnfolding';
import { CubeUnfolding } from '../unfolding/CubeUnfolding';
import { CylinderUnfolding } from '../unfolding/CylinderUnfolding';
import { ConeUnfolding } from '../unfolding/ConeUnfolding';
import { PrismUnfolding } from '../unfolding/PrismUnfolding';
import { PrismQuadUnfolding } from '../unfolding/PrismQuadUnfolding';
import { PyramidUnfolding } from '../unfolding/PyramidUnfolding';
import { PyramidTriangularUnfolding } from '../unfolding/PyramidTriangularUnfolding';
import { UniversalCrossSection3D } from '../section/UniversalCrossSection3D';
import { CrossSectionPresentationBar } from '../section/CrossSectionPresentationBar';
import { CrossSectionPredictionModal } from '../section/CrossSectionPredictionModal';
import {
  RotateCcw,
  Eye,
  Box,
  Compass,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Palette,
  EyeOff,
  Type,
  Scissors,
  Zap,
} from 'lucide-react';

interface GeometrySceneProps {
  modelType: ModelType;
  params: ModelParams;
  displayOptions: DisplayOptions;
  activeMode?: LabTab;
  unfoldingProgress?: number;
  sectionParams?: SectionPlaneParams;
  onOptionToggle?: (key: keyof DisplayOptions, value?: any) => void;
  onSectionChange?: (updates: Partial<SectionPlaneParams>) => void;
}

const TOP_COLOR_PRESETS = [
  '#38bdf8', // Xanh lam
  '#10b981', // Xanh lá
  '#f59e0b', // Vàng cam
  '#f43f5e', // Hồng đỏ
  '#a855f7', // Tím
  '#6366f1', // Chàm
];

export const GeometryScene: React.FC<GeometrySceneProps> = ({
  modelType,
  params,
  displayOptions,
  activeMode = 'observe',
  unfoldingProgress = 0,
  sectionParams,
  onOptionToggle,
  onSectionChange,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  // Local fallback section state
  const [localSection, setLocalSection] = useState<SectionPlaneParams>(
    sectionParams || { enabled: false, position: 0, orientation: 'horizontal', showSectionFace: true }
  );

  useEffect(() => {
    if (sectionParams) {
      setLocalSection(sectionParams);
    }
  }, [sectionParams]);

  const activeSection = sectionParams || localSection;

  const toggleSectionPlane = () => {
    const nextEnabled = !activeSection.enabled;
    const updated = { ...activeSection, enabled: nextEnabled };
    setLocalSection(updated);
    if (onSectionChange) {
      onSectionChange({ enabled: nextEnabled });
    }
  };

  const handleSectionUpdate = (updates: Partial<SectionPlaneParams>) => {
    const updated = { ...activeSection, ...updates };
    setLocalSection(updated);
    if (onSectionChange) {
      onSectionChange(updates);
    }
  };

  // Camera preset positions - centered and close to model
  const setCameraPreset = (preset: 'iso' | 'front' | 'top' | 'side') => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    controls.target.set(0, 1.8, 0);

    switch (preset) {
      case 'iso':
        controls.object.position.set(6.5, 4.5, 6.5);
        break;
      case 'front':
        controls.object.position.set(0, 2.0, 9.5);
        break;
      case 'top':
        controls.object.position.set(0, 10, 0.01);
        break;
      case 'side':
        controls.object.position.set(9.5, 2.0, 0);
        break;
    }
    controls.update();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const playSequentialAnimation = () => {
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step === 1) {
        handleSectionUpdate({ isCut: true, separation: 0, extractSection: false });
      } else if (step === 2) {
        handleSectionUpdate({ separation: 1.5 });
      } else if (step === 3) {
        handleSectionUpdate({ extractSection: true });
      } else {
        clearInterval(interval);
      }
    }, 900);
  };

  const renderBaseShape = () => {
    switch (modelType) {
      case 'cuboid':
        return <Cuboid3D params={params} displayOptions={displayOptions} />;
      case 'cube':
        return <Cube3D params={params} displayOptions={displayOptions} />;
      case 'cylinder':
        return <Cylinder3D params={params} displayOptions={displayOptions} />;
      case 'cone':
        return <Cone3D params={params} displayOptions={displayOptions} />;
      case 'sphere':
        return <Sphere3D params={params} displayOptions={displayOptions} />;
      case 'parabol':
        return <Parabol3D params={params} displayOptions={displayOptions} />;
      case 'prism':
        return <Prism3D params={params} displayOptions={displayOptions} />;
      case 'prism_quad':
        return <PrismQuad3D params={params} displayOptions={displayOptions} />;
      case 'pyramid':
        return <Pyramid3D params={params} displayOptions={displayOptions} />;
      case 'pyramid_triangular':
        return <PyramidTriangular3D params={params} displayOptions={displayOptions} />;
      default:
        return <Cylinder3D params={params} displayOptions={displayOptions} />;
    }
  };

  const renderContent = () => {
    if (activeMode === 'unfolding') {
      switch (modelType) {
        case 'cuboid':
          return <CuboidUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'cube':
          return <CubeUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'cylinder':
          return <CylinderUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'cone':
          return <ConeUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'prism':
          return <PrismUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'prism_quad':
          return <PrismQuadUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'pyramid':
          return <PyramidUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        case 'pyramid_triangular':
          return <PyramidTriangularUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
        default:
          return <CylinderUnfolding params={params} progress={unfoldingProgress} displayOptions={displayOptions} />;
      }
    }

    const isCutActive = activeSection.enabled && activeSection.isCut;
    const shouldRenderUncutBase = !isCutActive;

    return (
      <group>
        {shouldRenderUncutBase && renderBaseShape()}

        {/* Dynamic Measurement overlays */}
        <GeometryMeasurement
          modelType={modelType}
          params={params}
          displayOptions={displayOptions}
        />

        {/* Universal Cross-Section Engine 3D with Interactive Pointer Drag */}
        {activeSection.enabled && (
          <UniversalCrossSection3D
            modelType={modelType}
            params={params}
            sectionParams={activeSection}
            displayOptions={displayOptions}
            onSectionChange={handleSectionUpdate}
            controlsRef={controlsRef}
          />
        )}
      </group>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] bg-slate-950/95 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col group select-none"
    >
      {/* Top Floating Control Islands: Camera Left & Actions Right */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: Camera Angle Presets */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-800/90 shadow-xl pointer-events-auto shrink-0">
          <button
            onClick={() => setCameraPreset('iso')}
            title="Góc nhìn 3/4 (Khái quát)"
            className="px-2 sm:px-2.5 py-1.2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/90 rounded-lg transition flex items-center gap-1"
          >
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">3D 3/4</span>
          </button>
          <button
            onClick={() => setCameraPreset('front')}
            title="Nhìn chính diện (Mặt trước)"
            className="px-2 sm:px-2.5 py-1.2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/90 rounded-lg transition flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Chính diện</span>
          </button>
          <button
            onClick={() => setCameraPreset('top')}
            title="Nhìn từ trên xuống (Mặt đáy)"
            className="px-2 sm:px-2.5 py-1.2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/90 rounded-lg transition flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Từ trên</span>
          </button>
        </div>

        {/* Right: Quick Tools & Toggles */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-800/90 shadow-xl pointer-events-auto shrink-0">
          {/* Quick Section Plane Cut Toggle Button */}
          <button
            onClick={toggleSectionPlane}
            title={activeSection.enabled ? 'Tắt mặt phẳng cắt thiết diện' : 'Bật mặt phẳng cắt thiết diện'}
            className={`px-2 sm:px-2.5 py-1.2 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
              activeSection.enabled
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">{activeSection.enabled ? 'Tắt mặt cắt' : 'Bật mặt cắt'}</span>
          </button>

          {/* Quick Clear/Hide Labels Button */}
          {onOptionToggle && (
            <button
              onClick={() => onOptionToggle('showLabels')}
              title={displayOptions.showLabels ? 'Xóa/Ẩn tất cả các chữ trên hình' : 'Hiện lại chữ trên hình'}
              className={`px-2 sm:px-2.5 py-1.2 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                !displayOptions.showLabels
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              {!displayOptions.showLabels ? (
                <>
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Hiện chữ</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Xóa chữ</span>
                </>
              )}
            </button>
          )}

          {/* Quick Color Picker */}
          {onOptionToggle && (
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Đổi màu sắc mô hình"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition flex items-center gap-1"
              >
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm"
                  style={{ backgroundColor: displayOptions.modelColor || '#38bdf8' }}
                />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-full mt-2 bg-slate-900/95 border border-slate-700/80 p-2 rounded-xl shadow-2xl flex items-center gap-1.5 z-30 backdrop-blur-md">
                  {TOP_COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => {
                        onOptionToggle('modelColor', hex);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 rounded-md hover:scale-110 transition border border-white/20"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <label className="relative w-6 h-6 rounded-md border border-slate-600 bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-700">
                    <input
                      type="color"
                      value={displayOptions.modelColor || '#38bdf8'}
                      onChange={(e) => {
                        onOptionToggle('modelColor', e.target.value);
                        setShowColorPicker(false);
                      }}
                      className="absolute opacity-0 w-full h-full cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-300 font-bold">+</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Performance Mode Quick Toggle */}
          {onOptionToggle && (
            <button
              onClick={() => onOptionToggle('performanceMode')}
              title={
                displayOptions.performanceMode
                  ? 'Chế độ Hiệu năng Cao (ĐANG BẬT): Giảm tải đồ họa cho máy nhẹ'
                  : 'Bật Tiết kiệm GPU'
              }
              className={`p-1.5 md:px-2 md:py-1.2 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                displayOptions.performanceMode
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${displayOptions.performanceMode ? 'text-emerald-400 fill-current' : 'text-slate-400'}`} />
              <span className="hidden lg:inline">
                {displayOptions.performanceMode ? 'Hiệu năng cao' : 'Tiết kiệm GPU'}
              </span>
            </button>
          )}

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? 'Dừng tự xoay' : 'Bật tự xoay mô hình'}
            className={`p-1.5 md:px-2 md:py-1.2 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
              autoRotate
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5 text-sky-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden lg:inline">{autoRotate ? 'Dừng quay' : 'Tự xoay'}</span>
          </button>

          {/* Reset Camera */}
          <button
            onClick={() => setCameraPreset('iso')}
            title="Đặt lại camera"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Fullscreen inside Scene */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở toàn màn hình 3D'}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-rose-400" /> : <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [6.5, 4.5, 6.5], fov: 38 }}
        dpr={displayOptions.performanceMode ? [0.75, 1] : [1, 2]}
        gl={{
          antialias: !displayOptions.performanceMode,
          alpha: true,
          powerPreference: displayOptions.performanceMode ? 'low-power' : 'high-performance',
          precision: displayOptions.performanceMode ? 'mediump' : 'highp',
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={displayOptions.performanceMode ? 1.4 : 1.2} />
        <directionalLight position={[10, 14, 10]} intensity={1.8} castShadow={!displayOptions.performanceMode} />
        {!displayOptions.performanceMode && (
          <>
            <pointLight position={[-8, 6, -8]} intensity={0.6} color="#38bdf8" />
            <pointLight position={[8, -4, 8]} intensity={0.4} color="#f43f5e" />
          </>
        )}

        {/* Dynamic Content Render */}
        <group>{renderContent()}</group>

        {/* Floor Grid */}
        {displayOptions.showGrid && (
          <gridHelper args={[24, 24, '#475569', '#1e293b']} position={[0, -0.01, 0]} />
        )}

        {/* Axis Helper */}
        {displayOptions.showAxes && <CustomAxesHelper size={7} />}

        {/* Floor Shadow */}
        {!displayOptions.performanceMode && (
          <ContactShadows
            position={[0, -0.02, 0]}
            opacity={0.6}
            scale={15}
            blur={2.5}
            far={8}
            color="#000000"
          />
        )}

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={30}
          target={[0, 1.8, 0]}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>

      {/* Presentation Mode Cross-Section Floating Bar */}
      {activeSection.enabled && (
        <CrossSectionPresentationBar
          sectionParams={activeSection}
          onChange={handleSectionUpdate}
          onOpenPrediction={() => setShowPredictionModal(true)}
          onPlayAnimation={playSequentialAnimation}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          modelType={modelType}
        />
      )}

      {/* Cross-Section Prediction Quiz Modal */}
      <CrossSectionPredictionModal
        isOpen={showPredictionModal}
        onClose={() => setShowPredictionModal(false)}
        modelType={modelType}
        params={params}
        sectionParams={activeSection}
        onExecuteCut={() => handleSectionUpdate({ isCut: true, showSectionFace: true, showContour: true })}
        onStartAnimation={playSequentialAnimation}
      />

      {/* Bottom Canvas Overlay Instructions */}
      <div className="absolute bottom-2.5 left-3 z-10 hidden sm:flex items-center gap-2 pointer-events-none">
        <div className="text-[10px] text-slate-400 bg-slate-900/80 backdrop-blur-sm px-2 py-0.8 rounded-md border border-slate-800/70 shadow">
          🖱️ Chuột trái: Xoay • Phải: Di chuyển • Cuộn: Phóng to
        </div>
      </div>
    </div>
  );
};
