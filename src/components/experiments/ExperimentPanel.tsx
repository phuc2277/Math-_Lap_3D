import React, { useState, useEffect, useRef } from 'react';
import { Experiment, ModelParams, SectionPlaneParams } from '../../types/geometry';
import { ExperimentQuestion, LabActivityResult } from '../../models/LabActivitySession';
import { StudentQuestionCard } from '../assignment/StudentQuestionCard';
import { activityPersistenceService } from '../../services/ActivityPersistenceService';
import { platformIntegrationAdapter } from '../../adapters/PlatformIntegrationAdapter';
import { ExperimentSubMode, ChallengeTask } from '../../types/teacher';
import {
  FlaskConical,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sliders,
  RotateCcw,
  Lightbulb,
  Send,
  Award,
  Maximize2,
  Minimize2,
  X,
  Compass,
  BookOpen,
  Trophy,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ExperimentPanelProps {
  experiment: Experiment;
  params: ModelParams;
  sectionParams?: SectionPlaneParams;
  onApplySuggestedParams: (suggested: Partial<ModelParams>) => void;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
  isTeacher?: boolean;
  onOpenAssignModal?: () => void;
  assignmentId?: string;
  studentId?: string;
  onCompleteAssignment?: (result: LabActivityResult) => void;
  onClose?: () => void;
}

export const ExperimentPanel: React.FC<ExperimentPanelProps> = ({
  experiment,
  params,
  sectionParams,
  onApplySuggestedParams,
  onParamChange,
  isTeacher = false,
  onOpenAssignModal,
  assignmentId,
  studentId = 'student-101',
  onCompleteAssignment,
  onClose,
}) => {
  // Sub-mode selection state
  const [subMode, setSubMode] = useState<ExperimentSubMode>('guided');
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active challenge task index
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);

  // Fullscreen mode state
  const panelRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && panelRef.current) {
      if (panelRef.current.requestFullscreen) {
        panelRef.current.requestFullscreen().catch(() => {
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

  const steps = experiment.steps;
  const step = steps[currentStepIdx];
  const isFirstStep = currentStepIdx === 0;
  const isLastStep = currentStepIdx === steps.length - 1;

  // Derive questions for steps
  const mockQuestionsForSteps: ExperimentQuestion[] = steps.map((st, i) => {
    if (i === 0) {
      return {
        id: `q_${experiment.id}_1`,
        stepNumber: 1,
        questionText: `Khi thay đổi bán kính r hoặc chiều dài cạnh, yếu tố nào thay đổi tương ứng?`,
        type: 'single_choice',
        options: ['Diện tích đáy S_đáy', 'Độ cao h', 'Không có yếu tố nào đổi'],
        correctAnswer: 'Diện tích đáy S_đáy',
        points: 2,
        explanation: 'Diện tích đáy tỉ lệ thuận với bình phương bán kính r (S_đáy = πr²).',
      };
    } else if (i === 1) {
      return {
        id: `q_${experiment.id}_2`,
        stepNumber: 2,
        questionText: `Nếu bán kính r = 3 cm và chiều cao h = 5 cm, hãy tính thể tích V xấp xỉ (lấy π ≈ 3.14):`,
        type: 'numeric',
        correctAnswer: 141.3,
        tolerance: 0.5,
        points: 3,
        explanation: 'V = π * r² * h = 3.14 * 3² * 5 = 141.3 cm³.',
      };
    } else {
      return {
        id: `q_${experiment.id}_${i + 1}`,
        stepNumber: i + 1,
        questionText: `Nêu nhận xét trực quan của em khi quan sát mô hình 3D ở bước này:`,
        type: 'observation',
        points: 2,
        explanation: 'Thích hợp cho quan sát hình học 3D.',
      };
    }
  });

  const activeQuestion = mockQuestionsForSteps.find((q) => q.stepNumber === step?.stepNumber);

  // Generate Challenge Tasks based on Model Type
  const challengeTasks: ChallengeTask[] = (() => {
    const mType = experiment.modelType;

    if (mType === 'cylinder') {
      const r = params.r ?? 3;
      const h = params.h ?? 5;
      const pos = sectionParams?.position ?? 0;
      const yCut = h / 2 + (pos * h) / 2;
      const cutR = r; // Horizontal cut gives radius r

      return [
        {
          id: 'task-cyl-1',
          title: 'Thay đổi chiều cao h để thể tích V = 280 cm³',
          instruction: 'Điều chỉnh thanh trượt chiều cao h để thể tích khối trụ đạt xấp xỉ 282.7 cm³ (với r = 3 cm).',
          targetType: 'param',
          targetKey: 'h',
          targetValue: 10,
          tolerance: 0.2,
          unit: 'cm',
          hint: 'Gợi ý: Công thức V = πr²h. Với r = 3 cm, V ≈ 28.27 * h. Cần chọn h ≈ 10 cm.',
        },
        {
          id: 'task-cyl-2',
          title: 'Tạo mặt cắt hình tròn bằng cắt ngang',
          instruction: 'Đảm bảo hướng cắt là "Cắt ngang (Mặt đáy)" và chọn hiển thị mặt cắt.',
          targetType: 'section_shape',
          targetValue: 1,
          tolerance: 0,
          hint: 'Chọn hướng mặt cắt ngang trong bảng điều khiển mặt cắt.',
        },
      ];
    }

    if (mType === 'cone') {
      const r = params.r ?? 3;
      const h = params.h ?? 5;
      const pos = sectionParams?.position ?? 0;
      const yCut = Math.max(0.1, Math.min(h - 0.1, h / 2 + (pos * h) / 2));
      const cutR = Math.max(0.01, r * (1 - yCut / h));

      return [
        {
          id: 'task-cone-1',
          title: 'Di chuyển mặt cắt để tạo đường tròn thiết diện bán kính r\' = 1.5 cm',
          instruction: 'Kéo vị trí mặt phẳng cắt sao cho bán kính mặt cắt r\' đạt đúng 1.5 cm (với r = 3 cm, h = 5 cm).',
          targetType: 'section',
          targetValue: 1.5,
          tolerance: 0.1,
          unit: 'cm',
          hint: 'Mặt phẳng cắt nằm ở khoảng giữa chiều cao của hình nón (yCut ≈ 2.5 cm).',
        },
      ];
    }

    if (mType === 'sphere') {
      const R = params.r ?? 4;
      const pos = sectionParams?.position ?? 0;
      const planeY = pos * R * 0.88;
      const d = Math.abs(planeY);
      const cutR = Math.sqrt(Math.max(0, R * R - d * d));

      return [
        {
          id: 'task-sph-1',
          title: 'Tạo thiết diện đường tròn có bán kính r\' = 3.0 cm',
          instruction: 'Di chuyển mặt phẳng cắt lên hoặc xuống sao cho bán kính thiết diện hình tròn r\' đạt 3.0 cm (với R = 4 cm).',
          targetType: 'section',
          targetValue: 3.0,
          tolerance: 0.1,
          unit: 'cm',
          hint: 'Theo Pitago: d = √(R² - r\'²) = √(16 - 9) ≈ 2.65 cm.',
        },
        {
          id: 'task-sph-2',
          title: 'Tìm vị trí mặt phẳng cắt để diện tích thiết diện ĐẠT CỰC ĐẠI',
          instruction: 'Di chuyển mặt phẳng cắt về đúng vị trí d = 0 (qua tâm hình cầu) để r\' = R = 4 cm.',
          targetType: 'section',
          targetValue: R,
          tolerance: 0.15,
          unit: 'cm',
          hint: 'Mặt cắt lớn nhất khi mặt phẳng cắt đi qua tâm của hình cầu (vị trí = 0).',
        },
      ];
    }

    // Default fallback task
    return [
      {
        id: 'task-default-1',
        title: 'Thử thách điều chỉnh tham số',
        instruction: `Thay đổi thông số mô hình để quan sát sự biến đổi toán học trực quan.`,
        targetType: 'param',
        targetKey: 'h',
        targetValue: (params.h ?? 5),
        tolerance: 0.5,
        unit: 'cm',
      },
    ];
  })();

  const currentTask = challengeTasks[activeChallengeIdx] || challengeTasks[0];

  // Evaluate current challenge task status
  const evaluateTask = (): { actualVal: number; isCorrect: boolean; diff: number } => {
    if (!currentTask) return { actualVal: 0, isCorrect: false, diff: 0 };

    if (currentTask.targetType === 'param' && currentTask.targetKey) {
      const actualVal = params[currentTask.targetKey] ?? 0;
      const diff = Math.abs(actualVal - currentTask.targetValue);
      const isCorrect = diff <= currentTask.tolerance;
      return { actualVal, isCorrect, diff };
    }

    if (currentTask.targetType === 'section') {
      const r = params.r ?? 3;
      const h = params.h ?? 5;
      const pos = sectionParams?.position ?? 0;

      let actualVal = 0;
      if (experiment.modelType === 'cone') {
        const yCut = Math.max(0.1, Math.min(h - 0.1, h / 2 + (pos * h) / 2));
        actualVal = Math.max(0.01, r * (1 - yCut / h));
      } else if (experiment.modelType === 'sphere') {
        const R = params.r ?? 4;
        const planeY = pos * R * 0.88;
        const d = Math.abs(planeY);
        actualVal = Math.sqrt(Math.max(0, R * R - d * d));
      } else {
        actualVal = r;
      }

      const diff = Math.abs(actualVal - currentTask.targetValue);
      const isCorrect = diff <= currentTask.tolerance;
      return { actualVal, isCorrect, diff };
    }

    if (currentTask.targetType === 'section_shape') {
      const isCorrect = sectionParams?.orientation === 'horizontal' && sectionParams?.enabled;
      return { actualVal: isCorrect ? 1 : 0, isCorrect, diff: 0 };
    }

    return { actualVal: 0, isCorrect: false, diff: 0 };
  };

  const taskResult = evaluateTask();

  // Initialize session if assignmentId is present
  useEffect(() => {
    if (assignmentId) {
      const session = activityPersistenceService.initializeSession(
        assignmentId,
        studentId,
        `Học sinh (${studentId})`,
        experiment.labId,
        experiment.id
      );
      setSavedAnswers(session.answers || {});
      if (session.currentStep > 1 && session.currentStep <= steps.length) {
        setCurrentStepIdx(session.currentStep - 1);
      }
    }
  }, [assignmentId, studentId, experiment]);

  const handleNext = () => {
    if (assignmentId) {
      activityPersistenceService.updateStepProgress(step.stepNumber, true);
    }

    if (!isLastStep) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (steps[nextIdx].suggestedParams) {
        onApplySuggestedParams(steps[nextIdx].suggestedParams!);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleSelectStep = (idx: number) => {
    if (assignmentId) {
      activityPersistenceService.updateStepProgress(steps[idx].stepNumber, false);
    }
    setCurrentStepIdx(idx);
    if (steps[idx].suggestedParams) {
      onApplySuggestedParams(steps[idx].suggestedParams!);
    }
  };

  const handleSaveQuestionAnswer = (qId: string, answer: string | number) => {
    setSavedAnswers((prev) => ({ ...prev, [qId]: answer }));
    if (assignmentId) {
      activityPersistenceService.recordAnswer(qId, answer);
    }
  };

  const handleFinishExperiment = async () => {
    if (!assignmentId) return;

    setIsSubmitting(true);
    activityPersistenceService.updateStepProgress(step.stepNumber, true);
    activityPersistenceService.completeSession();

    const currentSession = activityPersistenceService.getSession();
    if (currentSession) {
      const result = await platformIntegrationAdapter.submitActivityResult(
        currentSession,
        mockQuestionsForSteps,
        steps.length
      );
      setIsSubmitting(false);
      if (onCompleteAssignment) {
        onCompleteAssignment(result);
      }
    }
  };

  return (
    <div
      ref={panelRef}
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-6' : ''
      }`}
    >
      {/* Experiment Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800 rounded-md uppercase">
                Chế độ Thí nghiệm
              </span>
              <h2 className="text-base font-bold text-white">{experiment.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">{experiment.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Teacher Assignment Button */}
          {isTeacher && onOpenAssignModal && (
            <button
              onClick={onOpenAssignModal}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Giao bài</span>
            </button>
          )}

          <button
            onClick={() => {
              setCurrentStepIdx(0);
              if (steps[0]?.suggestedParams) {
                onApplySuggestedParams(steps[0].suggestedParams!);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Đặt lại</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình thí nghiệm'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
              title="Tắt ô Thí nghiệm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3 SUB-MODES SELECTOR TABS */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setSubMode('explore')}
          className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
            subMode === 'explore'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>① Khám phá</span>
        </button>

        <button
          onClick={() => setSubMode('guided')}
          className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
            subMode === 'guided'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>② Hướng dẫn</span>
        </button>

        <button
          onClick={() => setSubMode('challenge')}
          className={`py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 ${
            subMode === 'challenge'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-amber-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>③ Thử thách</span>
        </button>
      </div>

      {/* SUB-MODE 1: ① KHÁM PHÁ (EXPLORATION) */}
      {subMode === 'explore' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
          <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-slate-800 pb-2">
            <Compass className="w-4 h-4" />
            <span>Chế độ Khám phá tự do (Học sinh chủ động thao tác)</span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Học sinh được hoàn toàn tự do <strong>xoay mô hình 3D, kéo mặt phẳng cắt, thay đổi bán kính, chiều cao</strong> và bật/tắt các thành phần hình học để tự phát hiện quy luật.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Realtime math metrics display */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium">Bán kính đáy r:</span>
              <p className="text-sm font-bold text-sky-300">{params.r ?? params.a ?? 3} cm</p>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium">Chiều cao h:</span>
              <p className="text-sm font-bold text-emerald-300">{params.h ?? 5} cm</p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODE 2: ② HƯỚNG DẪN (GUIDED) */}
      {subMode === 'guided' && (
        <div className="space-y-4">
          {/* Step Timeline Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Tiến trình thí nghiệm</span>
              <span className="text-purple-400 font-mono">
                Bước {currentStepIdx + 1} / {steps.length}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {steps.map((st, idx) => {
                const isActive = idx === currentStepIdx;
                const isCompleted = idx < currentStepIdx;

                return (
                  <button
                    key={st.stepNumber}
                    onClick={() => handleSelectStep(idx)}
                    className={`flex-1 h-2.5 rounded-full transition-all relative ${
                      isActive
                        ? 'bg-purple-500 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/30'
                        : isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={`Bước ${st.stepNumber}: ${st.title}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Active Step Content Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs font-bold">
                  {step?.stepNumber ?? 1}
                </span>
                {step?.title}
              </h3>

              {step?.formulaHighlight && (
                <span className="px-2.5 py-1 text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 rounded-lg shadow-sm">
                  {step.formulaHighlight}
                </span>
              )}
            </div>

            {/* Instructions */}
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {step?.instruction}
            </p>

            {/* Suggested Parameters Action */}
            {step?.suggestedParams && (
              <div className="flex items-center justify-between p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-sky-300">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span>Gợi ý thông số chuẩn:</span>
                  <span className="font-mono font-bold text-white">
                    {Object.entries(step.suggestedParams)
                      .map(([k, v]) => `${k} = ${v} cm`)
                      .join(', ')}
                  </span>
                </div>

                <button
                  onClick={() => onApplySuggestedParams(step.suggestedParams!)}
                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition shadow"
                >
                  Tự động áp dụng
                </button>
              </div>
            )}

            {/* Question Card inside step if available */}
            {activeQuestion && (
              <StudentQuestionCard
                question={activeQuestion}
                savedAnswer={savedAnswers[activeQuestion.id]}
                onSaveAnswer={(ans) => handleSaveQuestionAnswer(activeQuestion.id, ans)}
                showFeedback={Boolean(assignmentId)}
              />
            )}

            {/* Observation Insight Card */}
            {step?.observationInsight && (
              <div className="p-3.5 bg-purple-950/30 border border-purple-800/50 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>💡 Nhận xét toán học:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-5">
                  {step.observationInsight}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Footer Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                isFirstStep
                  ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Bước trước</span>
            </button>

            {isLastStep && assignmentId ? (
              <button
                onClick={handleFinishExperiment}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>{isSubmitting ? 'Đang gửi...' : '🎉 Nộp bài thí nghiệm'}</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isLastStep && !assignmentId}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  isLastStep
                    ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500/30 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-600/20'
                }`}
              >
                <span>{isLastStep ? 'Đã ở bước cuối' : 'Bước tiếp theo'}</span>
                {!isLastStep ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-MODE 3: ③ THỬ THÁCH (CHALLENGE WITH AUTO-EVALUATION) */}
      {subMode === 'challenge' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Trophy className="w-4 h-4" />
              <span>Nhiệm vụ Thử thách: {currentTask.title}</span>
            </div>
            {challengeTasks.length > 1 && (
              <div className="flex gap-1">
                {challengeTasks.map((_, tIdx) => (
                  <button
                    key={tIdx}
                    onClick={() => setActiveChallengeIdx(tIdx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tIdx === activeChallengeIdx
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Bài {tIdx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-medium">
            🎯 <strong>Nhiệm vụ:</strong> {currentTask.instruction}
          </p>

          {/* Live System Auto-Check & Tolerance Box */}
          <div
            className={`p-4 rounded-xl border space-y-2 transition-all ${
              taskResult.isCorrect
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Kiểm tra trạng thái thời gian thực:</span>
              <span
                className={`px-2.5 py-1 rounded-md text-[11px] uppercase font-extrabold ${
                  taskResult.isCorrect
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {taskResult.isCorrect ? '✅ ĐÚNG - HOÀN THÀNH!' : '⏳ ĐANG THAO TÁC...'}
              </span>
            </div>

            {currentTask.targetType !== 'section_shape' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Mục tiêu:</span>
                  <span className="text-amber-300 font-bold">
                    {currentTask.targetValue.toFixed(2)} {currentTask.unit || ''}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Giá trị thực tế:</span>
                  <span
                    className={`font-bold ${
                      taskResult.isCorrect ? 'text-emerald-400' : 'text-sky-300'
                    }`}
                  >
                    {taskResult.actualVal.toFixed(2)} {currentTask.unit || ''}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 text-[10px] block">Sai số cho phép:</span>
                  <span className="text-purple-300 font-bold">
                    ±{currentTask.tolerance} {currentTask.unit || ''}
                  </span>
                </div>
              </div>
            )}

            {currentTask.hint && !taskResult.isCorrect && (
              <p className="text-[11px] text-amber-300/90 pt-1 italic flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>{currentTask.hint}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
