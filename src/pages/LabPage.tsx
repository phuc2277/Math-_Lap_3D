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
} from 'lucide-react';
import { ModelType, ModelParams, SectionPlaneParams, DisplayOptions } from '../types/geometry';
import { GEOMETRY_MODELS } from '../data/geometryModels';
import { GeometryScene } from '../components/geometry/GeometryScene';
import { ParameterControls } from '../components/controls/ParameterControls';
import { SectionControls } from '../components/section/SectionControls';
import { CrossSectionPresentationBar } from '../components/section/CrossSectionPresentationBar';
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
import { buildReturnUrl } from '../integration/config';

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
  const [selectedType, setSelectedType] = useState<ModelType>(resolvedDef?.modelType || 'cylinder');
  const [currentSlug, setCurrentSlug] = useState<string>(initialSlug);

  // 2. Model & Section States
  const currentModelConfig = GEOMETRY_MODELS.find((m) => m.modelType === selectedType) || GEOMETRY_MODELS[0];
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
  const [activeTab, setActiveTab] = useState<'params' | 'section' | 'unfold'>('section');

  // Update slug and model when initialSlug changes
  useEffect(() => {
    const def = getExperimentBySlug(initialSlug);
    if (def) {
      setSelectedType(def.modelType);
      setCurrentSlug(initialSlug);
      const conf = GEOMETRY_MODELS.find((m) => m.modelType === def.modelType);
      if (conf) {
        setParams(conf.defaultParams);
      }
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

  // Cross section intersection computation for modals & AI Tutor
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

  // Volume and Area calculation from Geometry Engine (for AI Tutor context)
  const volumeAndArea = useMemo(() => {
    const r = params.radius || 4;
    const h = params.height || 8;
    const l = params.slantHeight || Math.sqrt(r * r + h * h);
    const a = params.sideA || 6;
    const b = params.sideB || 6;
    const c = params.sideC || 6;
    switch (selectedType) {
      case 'cylinder':
        return {
          volume: Math.PI * r * r * h,
          surfaceArea: 2 * Math.PI * r * h + 2 * Math.PI * r * r,
          lateralArea: 2 * Math.PI * r * h,
        };
      case 'cone':
        return {
          volume: (1 / 3) * Math.PI * r * r * h,
          surfaceArea: Math.PI * r * l + Math.PI * r * r,
          lateralArea: Math.PI * r * l,
        };
      case 'sphere':
        return {
          volume: (4 / 3) * Math.PI * Math.pow(r, 3),
          surfaceArea: 4 * Math.PI * r * r,
          lateralArea: 4 * Math.PI * r * r,
        };
      case 'cube':
        return {
          volume: Math.pow(a, 3),
          surfaceArea: 6 * a * a,
          lateralArea: 4 * a * a,
        };
      case 'cuboid':
        return {
          volume: a * b * c,
          surfaceArea: 2 * (a * b + b * c + c * a),
          lateralArea: 2 * (a * c + b * c),
        };
      default:
        return {
          volume: Math.PI * r * r * h,
          surfaceArea: 2 * Math.PI * r * h + 2 * Math.PI * r * r,
          lateralArea: 2 * Math.PI * r * h,
        };
    }
  }, [selectedType, params]);

  // Real-time AI Context derived from verified engine metrics
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
    <div className="flex flex-col flex-1 h-full w-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 1. TEACHER / STUDENT TOP BAR */}
      <TeacherToolbar
        modelType={selectedType}
        experimentSlug={currentSlug}
        modelTitle={currentModelConfig.title}
        isStudentMode={isStudentMode}
        onOpenPredictionModal={() => setIsPredictionModalOpen(true)}
        onOpenInspectorModal={() => setIsInspectorModalOpen(true)}
        onToggleAITutor={() => setIsAITutorOpen(!isAITutorOpen)}
        isAITutorOpen={isAITutorOpen}
      />

      {/* 2. MAIN 3D WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side 3D Canvas */}
        <div className="flex-1 h-[55vh] lg:h-full relative bg-slate-950">
          <GeometryScene
            modelType={selectedType}
            params={params}
            displayOptions={displayOptions}
            sectionParams={sectionParams}
            onSectionChange={handleSectionUpdate}
            onOptionToggle={handleOptionToggle}
          />

          {/* Quick Model Carousel Selector (Hidden in strict student mode) */}
          {!isStudentMode && (
            <div className="absolute top-3 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800/80 shadow-lg max-w-[85vw] overflow-x-auto">
              {GEOMETRY_MODELS.slice(0, 7).map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelChange(m.modelType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedType === m.modelType
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span>{m.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side Controls Panel */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-[45vh] lg:h-full z-20">
          {/* Panel Navigation Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/90 px-3 py-2 gap-1.5">
            <button
              onClick={() => setActiveTab('section')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'section'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Cắt Mặt Phẳng</span>
            </button>
            <button
              onClick={() => setActiveTab('params')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'params'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Kích Thước 3D</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          </div>
        </div>

        {/* AI Tutor Panel (Docked or Overlay) */}
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

      {/* 3. MODALS (Prediction & 2D Inspector) */}
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
