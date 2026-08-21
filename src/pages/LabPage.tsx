import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Layers,
  GraduationCap,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Grid,
  Box,
  Compass,
  FileSpreadsheet,
  Cpu,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Eye,
  Scissors,
  Share2,
  Clock,
  ArrowLeft,
  KeyRound,
  LogIn,
  Sliders,
  Calculator,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ModelType, ModelParams, SectionPlaneParams, DisplayOptions } from '../types/geometry';
import { GEOMETRY_MODELS } from '../data/geometryModels';
import { GeometryScene } from '../components/geometry/GeometryScene';
import { ParameterControls } from '../components/controls/ParameterControls';
import { SectionControls } from '../components/section/SectionControls';
import { CrossSectionPredictionModal } from '../components/section/CrossSectionPredictionModal';
import { CrossSection2DInspectorModal } from '../components/section/CrossSection2DInspectorModal';
import { createCuttingPlane, solveCrossSection, IntersectionResult } from '../components/section/CrossSectionMath';
import { TeacherToolbar } from '../components/teacher/TeacherToolbar';
import { AITutorPanel } from '../components/ai/AITutorPanel';
import { ExperimentAIContext } from '../types/aiTutor';
import { soundEffects } from '../utils/audioEffects';
import { ssoService, UserSession } from '../services/SSOService';
import { shareService, ShareSessionConfig } from '../services/ShareService';
import { getExperimentBySlug, getSlugByModelType } from '../data/slugMapping';

interface LabPageProps {
  initialSlug?: string;
  shareId?: string;
  isStudentMode?: boolean;
  onNavigateHome?: () => void;
}

export const LabPage: React.FC<LabPageProps> = ({
  initialSlug = 'hinh-tru',
  shareId,
  isStudentMode = false,
  onNavigateHome,
}) => {
  // 1. Resolve Initial Experiment from Slug
  const resolvedDef = getExperimentBySlug(initialSlug);
  const [selectedType, setSelectedType] = useState<ModelType>(resolvedDef?.modelType || 'cuboid');
  const [currentSlug, setCurrentSlug] = useState<string>(resolvedDef?.slug || initialSlug);

  // 2. Model & Section States
  const currentModelConfig = useMemo(() => {
    return GEOMETRY_MODELS.find((m) => m.modelType === selectedType) || GEOMETRY_MODELS[0];
  }, [selectedType]);

  const [params, setParams] = useState<ModelParams>(() => currentModelConfig.defaultParams);

  const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
    showRadius: true,
    showHeight: true,
    showSlantHeight: true,
    showDimensions: true,
    showLabels: true,
    showGrid: true,
    showAxes: false,
    showWireframe: false,
    transparentSolid: false,
    solidOpacity: 0.85,
    modelColor: '#38bdf8',
  });

  const [sectionParams, setSectionParams] = useState<SectionPlaneParams>({
    enabled: true,
    position: 0,
    orientation: 'horizontal',
    pitch: 0,
    yaw: 0,
    roll: 0,
    showContour: true,
    showSectionFace: true,
    isCut: true,
    separation: 0,
    extractSection: false,
    showDimensions: true,
  });

  // 3. User Session & Modals
  const [userSession, setUserSession] = useState<UserSession | null>(ssoService.getSession());
  const [shareConfig, setShareConfig] = useState<ShareSessionConfig | null>(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isAITutorExpanded, setIsAITutorExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'section' | 'params' | 'formulas'>('section');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Synchronize when initialSlug prop changes from parent navigation
  useEffect(() => {
    if (!initialSlug) return;
    const def = getExperimentBySlug(initialSlug);
    if (def) {
      setSelectedType(def.modelType);
      setCurrentSlug(def.slug);
      const conf = GEOMETRY_MODELS.find((m) => m.modelType === def.modelType);
      if (conf) {
        setParams(conf.defaultParams);
      }
      setSectionParams((prev) => ({
        ...prev,
        position: 0,
        separation: 0,
        pitch: 0,
        yaw: 0,
        roll: 0,
      }));
    }
  }, [initialSlug]);

  // SSO Session Subscription
  useEffect(() => {
    const unsubscribe = ssoService.subscribe((sess) => {
      setUserSession(sess);
    });
    return unsubscribe;
  }, []);

  // Student Share Link validation
  useEffect(() => {
    if (shareId) {
      const res = shareService.getShareSession(shareId);
      if (res.valid && res.session) {
        setShareConfig(res.session);
        setSelectedType(res.session.modelType);
        setCurrentSlug(res.session.experimentSlug);
        const conf = GEOMETRY_MODELS.find((m) => m.modelType === res.session?.modelType);
        if (conf) {
          setParams(conf.defaultParams);
        }
      }
    }
  }, [shareId]);

  const isTeacher = !isStudentMode && ssoService.isTeacher();

  // Model Type Selector Handler
  const handleModelChange = (type: ModelType) => {
    soundEffects.playPopSound();
    setSelectedType(type);
    setCurrentSlug(getSlugByModelType(type));
    const conf = GEOMETRY_MODELS.find((m) => m.modelType === type);
    if (conf) {
      setParams(conf.defaultParams);
    }
    setSectionParams((prev) => ({
      ...prev,
      position: 0,
      separation: 0,
    }));
  };

  const handleParamChange = (key: keyof ModelParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleOptionToggle = (key: keyof DisplayOptions, value?: any) => {
    setDisplayOptions((prev) => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key],
    }));
  };

  const handleSectionUpdate = (updates: Partial<SectionPlaneParams>) => {
    setSectionParams((prev) => ({ ...prev, ...updates }));
  };

  // Cross section intersection computation
  const intersectionResult = useMemo<IntersectionResult | null>(() => {
    try {
      const { plane } = createCuttingPlane(
        sectionParams.pitch || 0,
        sectionParams.yaw || 0,
        sectionParams.roll || 0,
        sectionParams.position || 0
      );
      return solveCrossSection(selectedType, params, plane);
    } catch {
      return null;
    }
  }, [selectedType, params, sectionParams.pitch, sectionParams.yaw, sectionParams.roll, sectionParams.position]);

  // Volume and Area calculation
  const volumeAndArea = useMemo(() => {
    const r = params.radius || params.r || 3;
    const h = params.height || params.h || 5;
    const l = params.slantHeight || Math.sqrt(r * r + h * h);
    const a = params.sideA || params.a || 5;
    const b = params.sideB || params.b || 4;
    const c = params.sideC || params.h || 4;
    switch (selectedType) {
      case 'cylinder':
        return {
          volume: Math.PI * r * r * h,
          surfaceArea: 2 * Math.PI * r * h + 2 * Math.PI * r * r,
          lateralArea: 2 * Math.PI * r * h,
          formulas: [
            { label: 'Diện tích xung quanh', formula: 'S_xq = 2πrh', value: (2 * Math.PI * r * h).toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = 2πrh + 2πr²', value: (2 * Math.PI * r * h + 2 * Math.PI * r * r).toFixed(2) + ' cm²' },
            { label: 'Thể tích', formula: 'V = πr²h', value: (Math.PI * r * r * h).toFixed(2) + ' cm³' },
          ],
        };
      case 'cone':
        return {
          volume: (1 / 3) * Math.PI * r * r * h,
          surfaceArea: Math.PI * r * l + Math.PI * r * r,
          lateralArea: Math.PI * r * l,
          formulas: [
            { label: 'Đường sinh', formula: 'l = √(r² + h²)', value: l.toFixed(2) + ' cm' },
            { label: 'Diện tích xung quanh', formula: 'S_xq = πrl', value: (Math.PI * r * l).toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = πrl + πr²', value: (Math.PI * r * l + Math.PI * r * r).toFixed(2) + ' cm²' },
            { label: 'Thể tích', formula: 'V = (1/3)πr²h', value: ((1 / 3) * Math.PI * r * r * h).toFixed(2) + ' cm³' },
          ],
        };
      case 'sphere':
        return {
          volume: (4 / 3) * Math.PI * Math.pow(r, 3),
          surfaceArea: 4 * Math.PI * r * r,
          lateralArea: 4 * Math.PI * r * r,
          formulas: [
            { label: 'Diện tích mặt cầu', formula: 'S = 4πR²', value: (4 * Math.PI * r * r).toFixed(2) + ' cm²' },
            { label: 'Thể tích khối cầu', formula: 'V = (4/3)πR³', value: ((4 / 3) * Math.PI * Math.pow(r, 3)).toFixed(2) + ' cm³' },
          ],
        };
      case 'cube':
        return {
          volume: Math.pow(a, 3),
          surfaceArea: 6 * a * a,
          lateralArea: 4 * a * a,
          formulas: [
            { label: 'Diện tích xung quanh', formula: 'S_xq = 4a²', value: (4 * a * a).toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = 6a²', value: (6 * a * a).toFixed(2) + ' cm²' },
            { label: 'Thể tích', formula: 'V = a³', value: (Math.pow(a, 3)).toFixed(2) + ' cm³' },
            { label: 'Đường chéo', formula: 'd = a√3', value: (a * Math.sqrt(3)).toFixed(2) + ' cm' },
          ],
        };
      case 'cuboid':
        return {
          volume: a * b * c,
          surfaceArea: 2 * (a * b + b * c + c * a),
          lateralArea: 2 * (a * c + b * c),
          formulas: [
            { label: 'Diện tích xung quanh', formula: 'S_xq = 2h(a + b)', value: (2 * c * (a + b)).toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = S_xq + 2ab', value: (2 * (a * b + b * c + c * a)).toFixed(2) + ' cm²' },
            { label: 'Thể tích', formula: 'V = a.b.h', value: (a * b * c).toFixed(2) + ' cm³' },
            { label: 'Đường chéo', formula: 'd = √(a² + b² + h²)', value: Math.sqrt(a * a + b * b + c * c).toFixed(2) + ' cm' },
          ],
        };
      case 'prism': {
        const baseA = a;
        const baseB = b;
        const heightH = h;
        const hyp = Math.sqrt(baseA * baseA + baseB * baseB);
        const sDay = 0.5 * baseA * baseB;
        const sXq = (baseA + baseB + hyp) * heightH;
        const sTp = sXq + 2 * sDay;
        const v = sDay * heightH;
        return {
          volume: v,
          surfaceArea: sTp,
          lateralArea: sXq,
          formulas: [
            { label: 'Diện tích đáy', formula: 'S_day = 1/2 · a · b', value: sDay.toFixed(2) + ' cm²' },
            { label: 'Cạnh huyền đáy', formula: 'c = √(a² + b²)', value: hyp.toFixed(2) + ' cm' },
            { label: 'Diện tích xung quanh', formula: 'S_xq = C_day · h', value: sXq.toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = S_xq + 2S_day', value: sTp.toFixed(2) + ' cm²' },
            { label: 'Thể tích lăng trụ', formula: 'V = S_day · h', value: v.toFixed(2) + ' cm³' },
          ],
        };
      }
      case 'prism_quad': {
        const sDay = a * b;
        const sXq = 2 * (a + b) * h;
        const sTp = sXq + 2 * sDay;
        const v = sDay * h;
        return {
          volume: v,
          surfaceArea: sTp,
          lateralArea: sXq,
          formulas: [
            { label: 'Diện tích đáy', formula: 'S_day = a · b', value: sDay.toFixed(2) + ' cm²' },
            { label: 'Diện tích xung quanh', formula: 'S_xq = 2(a + b) · h', value: sXq.toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = S_xq + 2S_day', value: sTp.toFixed(2) + ' cm²' },
            { label: 'Thể tích lăng trụ', formula: 'V = S_day · h', value: v.toFixed(2) + ' cm³' },
          ],
        };
      }
      case 'pyramid': {
        const slantD = Math.sqrt(h * h + Math.pow(a / 2, 2));
        const sDay = a * a;
        const sXq = 2 * a * slantD;
        const sTp = sXq + sDay;
        const v = (1 / 3) * sDay * h;
        return {
          volume: v,
          surfaceArea: sTp,
          lateralArea: sXq,
          formulas: [
            { label: 'Trung đoạn', formula: 'd = √(h² + (a/2)²)', value: slantD.toFixed(2) + ' cm' },
            { label: 'Diện tích đáy', formula: 'S_day = a²', value: sDay.toFixed(2) + ' cm²' },
            { label: 'Diện tích xung quanh', formula: 'S_xq = 2a · d', value: sXq.toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = S_xq + S_day', value: sTp.toFixed(2) + ' cm²' },
            { label: 'Thể tích hình chóp', formula: 'V = 1/3 · S_day · h', value: v.toFixed(2) + ' cm³' },
          ],
        };
      }
      case 'pyramid_triangular': {
        const sDay = (Math.sqrt(3) / 4) * a * a;
        const apothem = (a * Math.sqrt(3)) / 6;
        const slantD = Math.sqrt(h * h + apothem * apothem);
        const sXq = 1.5 * a * slantD;
        const sTp = sXq + sDay;
        const v = (1 / 3) * sDay * h;
        return {
          volume: v,
          surfaceArea: sTp,
          lateralArea: sXq,
          formulas: [
            { label: 'Diện tích đáy tam giác đều', formula: 'S_day = (√3/4)a²', value: sDay.toFixed(2) + ' cm²' },
            { label: 'Trung đoạn chóp', formula: 'd = √(h² + (a√3/6)²)', value: slantD.toFixed(2) + ' cm' },
            { label: 'Diện tích xung quanh', formula: 'S_xq = (3/2)a · d', value: sXq.toFixed(2) + ' cm²' },
            { label: 'Diện tích toàn phần', formula: 'S_tp = S_xq + S_day', value: sTp.toFixed(2) + ' cm²' },
            { label: 'Thể tích hình chóp', formula: 'V = 1/3 · S_day · h', value: v.toFixed(2) + ' cm³' },
          ],
        };
      }
      default:
        return {
          volume: Math.PI * r * r * h,
          surfaceArea: 2 * Math.PI * r * h + 2 * Math.PI * r * r,
          lateralArea: 2 * Math.PI * r * h,
          formulas: [],
        };
    }
  }, [selectedType, params]);

  // Real-time AI Context
  const aiContext = useMemo<ExperimentAIContext>(() => {
    return {
      experimentId: currentSlug,
      subject: 'Toán',
      grade: 9,
      topic: currentModelConfig.title,
      experimentType: '3D cross section',
      geometryState: {
        shape: selectedType,
        radius: params.radius ?? params.r,
        height: params.height ?? params.h,
        slantHeight: params.slantHeight,
        sideA: params.sideA ?? params.a,
        sideB: params.sideB ?? params.b,
        sideC: params.sideC ?? params.h,
        planeAngle: sectionParams.pitch,
        planePitch: sectionParams.pitch,
        planeYaw: sectionParams.yaw,
        planeRoll: sectionParams.roll,
        planePosition: sectionParams.position,
        crossSectionType: intersectionResult?.shapeNameVi || intersectionResult?.shapeType || 'circle',
        crossSectionArea: intersectionResult?.area || 0,
        volume: volumeAndArea.volume,
        surfaceArea: volumeAndArea.surfaceArea,
        lateralArea: volumeAndArea.lateralArea,
        isSeparated: (sectionParams.separation || 0) > 0,
      },
      mode: isTeacher ? 'teacher' : 'student',
      learningObjectives: [
        `Quan sát và nhận biết dạng thiết diện của ${currentModelConfig.title}`,
        'Khảo sát sự biến đổi thiết diện khi thay đổi góc nghiêng mặt phẳng cắt',
        'Vận dụng công thức diện tích thiết diện và thể tích khối tròn xoay',
      ],
    };
  }, [currentSlug, currentModelConfig.title, selectedType, params, sectionParams, intersectionResult, volumeAndArea, isTeacher]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.75rem)] w-full bg-slate-950 text-slate-100 overflow-hidden relative select-none">
      {/* 1. TOP TOOLBAR & MODEL SELECTOR */}
      <TeacherToolbar
        modelType={selectedType}
        experimentSlug={currentSlug}
        modelTitle={currentModelConfig.title}
        isStudentMode={isStudentMode}
        onModelChange={!isStudentMode ? handleModelChange : undefined}
        onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
        onOpenInspectorModal={() => setIsInspectorModalOpen(true)}
        onToggleAITutor={() => setIsAITutorOpen(!isAITutorOpen)}
        isAITutorOpen={isAITutorOpen}
      />

      {/* 2. MAIN 3D WORKSPACE (Responsive Flex Row) */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Side: 3D Interactive Canvas */}
        <div className="flex-1 h-full relative bg-slate-950 p-2 sm:p-3 overflow-hidden">
          <GeometryScene
            modelType={selectedType}
            params={params}
            displayOptions={displayOptions}
            sectionParams={sectionParams}
            onSectionChange={handleSectionUpdate}
            onOptionToggle={handleOptionToggle}
          />

          {/* Toggle Sidebar Collapse Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -translate-y-1/2 right-4 z-30 w-7 h-12 rounded-l-xl bg-slate-900/90 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center shadow-2xl transition"
            title={isSidebarOpen ? 'Thu gọn bảng điều khiển' : 'Mở rộng bảng điều khiển'}
          >
            {isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Side: Professional Side Control Panel */}
        {isSidebarOpen && (
          <aside className="w-[360px] xl:w-[400px] h-full bg-slate-900/95 border-l border-slate-800 flex flex-col z-20 shadow-2xl shrink-0">
            {/* Panel Tabs */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/90 p-2 gap-1.5 shrink-0">
              <button
                onClick={() => setActiveTab('section')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'section'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-rose-400" />
                <span>Mặt Phẳng Cắt</span>
              </button>

              <button
                onClick={() => setActiveTab('params')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'params'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Kích Thước</span>
              </button>

              <button
                onClick={() => setActiveTab('formulas')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'formulas'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span>Công Thức</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {activeTab === 'section' && (
                <SectionControls
                  modelType={selectedType}
                  params={params}
                  sectionParams={sectionParams}
                  onChange={handleSectionUpdate}
                />
              )}

              {activeTab === 'params' && (
                <ParameterControls
                  config={currentModelConfig}
                  params={params}
                  displayOptions={displayOptions}
                  onParamChange={handleParamChange}
                  onOptionToggle={handleOptionToggle}
                  onReset={() => setParams(currentModelConfig.defaultParams)}
                  isTeacherMode={isTeacher}
                />
              )}

              {activeTab === 'formulas' && (
                <div className="space-y-3.5 animate-fadeIn">
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-indigo-400" />
                      <span>{currentModelConfig.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tính toán tự động theo kích thước đang thiết lập trên mô hình 3D:
                    </p>
                  </div>

                  <div className="space-y-2">
                    {volumeAndArea.formulas?.map((f, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 space-y-1 transition"
                      >
                        <div className="text-xs text-slate-400 font-medium flex justify-between items-center">
                          <span>{f.label}</span>
                          <span className="font-mono text-amber-300 font-bold">{f.formula}</span>
                        </div>
                        <div className="text-sm font-extrabold text-sky-400 font-mono">
                          = {f.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {intersectionResult && (
                    <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-1.5">
                      <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-rose-400" />
                        <span>Mặt Cắt Hiện Tại</span>
                      </div>
                      <div className="text-xs text-slate-300 flex justify-between">
                        <span>Hình dạng thiết diện:</span>
                        <span className="font-bold text-emerald-400">{intersectionResult.shapeNameVi}</span>
                      </div>
                      <div className="text-xs text-slate-300 flex justify-between">
                        <span>Diện tích thiết diện:</span>
                        <span className="font-bold text-sky-400">{intersectionResult.area.toFixed(2)} cm²</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* AI Tutor Panel */}
        {isAITutorOpen && (
          <AITutorPanel
            context={aiContext}
            isOpen={isAITutorOpen}
            onClose={() => setIsAITutorOpen(false)}
            onToggleExpand={() => setIsAITutorExpanded(!isAITutorExpanded)}
            isExpanded={isAITutorExpanded}
          />
        )}
      </div>

      {/* 3. MODALS */}
      <CrossSectionPredictionModal
        isOpen={isPredictionModalOpen}
        onClose={() => setIsPredictionModalOpen(false)}
        modelType={selectedType}
        params={params}
        sectionParams={sectionParams}
        onExecuteCut={() => handleSectionUpdate({ isCut: true, enabled: true })}
        onStartAnimation={() => {}}
      />

      <CrossSection2DInspectorModal
        isOpen={isInspectorModalOpen}
        onClose={() => setIsInspectorModalOpen(false)}
        result={intersectionResult}
        modelType={selectedType}
        params={params}
        sectionParams={sectionParams}
      />
    </div>
  );
};
