import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Upload,
  CheckSquare,
  Square,
  Eye,
  CheckCircle2,
  Trash2,
  Rocket,
  AlertTriangle,
  BookOpen,
  Layers,
  ShieldCheck,
  X,
  Info,
  Compass,
  Sliders,
  Check,
} from 'lucide-react';
import {
  AIGeneratorRequest,
  AIGeneratorResponse,
  GeneratedExperiment,
} from '../../models/AIGenerator';
import { EXPERIMENT_REGISTRY } from '../../models/ExperimentRegistry';
import { ModelType } from '../../types/geometry';
import { AIGeneratorService } from '../../services/aiGeneratorService';
import { ExperimentValidator } from '../../services/ExperimentValidator';
import { VisualizationEngineRegistry } from '../engines/VisualizationEngineRegistry';

interface AIGeneratorPanelProps {
  onPublishExperiment?: (experiment: GeneratedExperiment) => void;
  onPreviewExperiment?: (experiment: GeneratedExperiment) => void;
}

export const AIGeneratorPanel: React.FC<AIGeneratorPanelProps> = ({
  onPublishExperiment,
}) => {
  // Input Form State
  const [teacherPrompt, setTeacherPrompt] = useState<string>(
    'Thiết lập phòng thí nghiệm hình học động về vị trí tương đối của hai đường tròn. Học sinh kéo tâm O\' biến đổi khoảng cách d = OO\' để đo, dự đoán và phân loại 6 trường hợp vị trí tương đối.'
  );
  const [selectedModelType, setSelectedModelType] = useState<ModelType | 'auto'>('two_circles');
  const [selectedDomain, setSelectedDomain] = useState<'2d' | '3d' | 'algebra' | 'prob_stat'>('2d');
  const [grade, setGrade] = useState<number>(9);
  const [subject, setSubject] = useState<string>('Toán');
  const [lessonTitle, setLessonTitle] = useState<string>('Vị trí tương đối của hai đường tròn');
  const [goals, setGoals] = useState({
    visualize: true,
    exploreFormulas: true,
    interactiveExperiment: true,
    practice: false,
    review: false,
  });

  // UI Flow State
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<AIGeneratorResponse | null>(null);
  const [acceptedExperiments, setAcceptedExperiments] = useState<GeneratedExperiment[]>([]);
  const [previewExp, setPreviewExp] = useState<GeneratedExperiment | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'generator' | 'review'>('generator');

  // Trigger AI Analysis & Generation
  const handleGenerate = async () => {
    setLoading(true);
    setValidationErrors([]);

    const req: AIGeneratorRequest = {
      lessonContent: teacherPrompt,
      teacherPrompt,
      selectedModelType,
      selectedDomain,
      grade,
      subject,
      lessonTitle,
      mode: selectedModelType === 'auto' ? 'ai_suggested' : 'teacher_specified',
      goals,
    };

    const res = await AIGeneratorService.generateExperiments(req);
    setResponse(res);
    setLoading(false);

    if (res.intent && res.intent.domain) {
      if (res.intent.domain === 'geometry2d') setSelectedDomain('2d');
      else if (res.intent.domain === 'geometry3d') setSelectedDomain('3d');
      else if (res.intent.domain === 'algebra') setSelectedDomain('algebra');
      else if (res.intent.domain === 'probability' || res.intent.domain === 'statistics') setSelectedDomain('prob_stat');
    }

    if (res.errors && res.errors.length > 0) {
      setValidationErrors(res.errors);
    }
  };

  // Teacher Review Actions
  const handleAcceptExperiment = (exp: GeneratedExperiment) => {
    const validated = ExperimentValidator.validate(exp, response?.intent);
    if (!validated.isValid) {
      setValidationErrors(validated.errors);
      return;
    }

    const newExp: GeneratedExperiment = {
      ...validated.sanitizedExperiment!,
      status: 'draft',
      reviewState: 'accepted',
    };

    if (!acceptedExperiments.some((e) => e.id === newExp.id)) {
      setAcceptedExperiments((prev) => [...prev, newExp]);
    }
  };

  const handleRemoveAccepted = (id: string) => {
    setAcceptedExperiments((prev) => prev.filter((e) => e.id !== id));
  };

  const handlePublish = (exp: GeneratedExperiment) => {
    const publishedExp: GeneratedExperiment = {
      ...exp,
      status: 'published',
    };

    setAcceptedExperiments((prev) =>
      prev.map((e) => (e.id === exp.id ? publishedExp : e))
    );

    if (onPublishExperiment) {
      onPublishExperiment(publishedExp);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>MATH LAB ARCHITECTURE • INTENT ➔ ENGINE ➔ RENDERER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              ✨ AI Khởi Tạo Thí Nghiệm Toán Học
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Hệ thống 3 tầng: AI phân tích Ý định (Intent) ➔ Validator kiểm tra Engine trong Registry ➔ Canvas Renderer trực quan chính xác.
            </p>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('generator')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'generator'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ 1. Yêu cầu & Tạo Đề Xuất
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'review'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🚀 2. Quản Lý Thí Nghiệm</span>
              {acceptedExperiments.length > 0 && (
                <span className="bg-amber-400 text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {acceptedExperiments.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Area (Left Panel) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Yêu cầu của Giáo viên</span>
              </h2>
              <span className="text-xs font-medium text-slate-500">Teacher Request</span>
            </div>

            {/* Category Domain Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Chọn Miền Toán Học (Domain):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '2d', label: '📐 Hình học 2D' },
                  { id: '3d', label: '🧊 Hình học 3D' },
                  { id: 'algebra', label: '📈 Đồ thị Hàm số' },
                  { id: 'prob_stat', label: '🎲 Xác suất & Thống kê' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setSelectedDomain(d.id as any);
                      setSelectedModelType('auto');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      selectedDomain === d.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                2. Loại Mô hình Thí nghiệm (Engine Type):
              </label>
              <select
                value={selectedModelType}
                onChange={(e) => setSelectedModelType(e.target.value as any)}
                className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="auto">🤖 AI Tự Động Phân Tích Ý Định (Auto Intent)</option>
                {Object.values(EXPERIMENT_REGISTRY)
                  .filter((item) => {
                    if (selectedDomain === '2d') return item.domain === 'geometry2d';
                    if (selectedDomain === '3d') return item.domain === 'geometry3d';
                    if (selectedDomain === 'algebra') return item.domain === 'algebra';
                    return item.domain === 'probability' || item.domain === 'statistics';
                  })
                  .map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.titleVi} ({item.dimension})
                    </option>
                  ))}
              </select>
            </div>

            {/* Prompt Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                3. Mô tả yêu cầu bài thí nghiệm:
              </label>
              <textarea
                value={teacherPrompt}
                onChange={(e) => setTeacherPrompt(e.target.value)}
                placeholder="Nhập mô tả chi tiết bài học hoặc yêu cầu giáo viên..."
                rows={5}
                className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all font-sans leading-relaxed"
              />
            </div>

            {/* Grade, Subject, Lesson Title Selectors */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp:</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full p-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                    <option key={g} value={g} className="text-slate-900 bg-white">
                      Lớp {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bài học:</label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Tên bài học..."
                  className="w-full p-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI đang phân tích Intent & Tạo thí nghiệm...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>✨ Phân Tích Ý Định & Tạo Thí Nghiệm</span>
                </>
              )}
            </button>
          </div>

          {/* Results Area (Right Panel) */}
          <div className="lg:col-span-7 space-y-6">
            {validationErrors.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Experiment Validator Notice</span>
                </div>
                {validationErrors.map((err, idx) => (
                  <p key={idx}>• {err}</p>
                ))}
              </div>
            )}

            {!response && !loading && (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800">Sẵn sàng khởi tạo thí nghiệm</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Chọn loại hình thí nghiệm bên trái và bấm <span className="font-semibold text-indigo-600">Phân Tích Ý Định</span> để hệ thống kiểm duyệt và dựng canvas tương tác.
                </p>
              </div>
            )}

            {response && (
              <div className="space-y-6 animate-fadeIn">
                {/* Intent Analysis Display Card */}
                {response.intent && (
                  <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl p-5 shadow-md space-y-3 border border-indigo-800/50">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-300" />
                        TẦNG 1: Ý ĐỊNH THÍ NGHIỆM (EXPERIMENT INTENT)
                      </span>
                      <span className="text-[11px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                        {response.intent.mode === 'teacher_specified' ? 'CHỈ ĐỊNH CỦA GIÁO VIÊN' : 'AI ĐỀ XUẤT'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Loại mô hình:</span>
                        <span className="font-bold text-amber-300 text-sm">{EXPERIMENT_REGISTRY[response.intent.experimentType]?.titleVi || response.intent.experimentType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Không gian / Miền:</span>
                        <span className="font-semibold text-slate-200">{response.intent.dimension} • {response.intent.domain}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Đối tượng toán học:</span>
                        <span className="font-semibold text-slate-200">{response.intent.objects.join(', ')}</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/60 p-3 rounded-xl text-xs space-y-1 border border-slate-700/50">
                      <span className="text-slate-400 block text-[10px] font-bold">Lý do phân tích:</span>
                      <p className="text-slate-300 italic">{response.intent.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* Proposed Experiments List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-600" />
                      <span>Kịch bản Thí nghiệm đã xác thực</span>
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      {response.experiments.length} thí nghiệm
                    </span>
                  </div>

                  <div className="space-y-4">
                    {response.experiments.map((exp, index) => {
                      const isAccepted = acceptedExperiments.some((e) => e.id === exp.id);

                      return (
                        <div
                          key={exp.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2 py-0.5 rounded-md border border-indigo-100">
                                  🧪 Thí nghiệm {index + 1}
                                </span>
                                <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-md font-semibold">
                                  {exp.type}
                                </span>
                              </div>
                              <h3 className="text-base font-bold text-slate-900">{exp.title}</h3>
                            </div>

                            {isAccepted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã chọn</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>

                          <div className="bg-slate-50 p-3 rounded-xl space-y-1 border border-slate-100">
                            <p className="text-[11px] text-slate-500 font-bold uppercase">Các bước thực hành ({exp.steps.length} bước):</p>
                            <div className="space-y-1">
                              {exp.steps.map((step) => (
                                <div key={step.id} className="text-xs text-slate-700 flex items-start gap-1.5">
                                  <span className="font-bold text-indigo-600">{step.order}.</span>
                                  <span><strong>{step.title}:</strong> {step.instruction}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Experiment Actions */}
                          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setPreviewExp(exp)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>👁 Xem Canvas</span>
                              </button>

                              <button
                                onClick={() => handlePublish(exp)}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                              >
                                <Rocket className="w-3.5 h-3.5 text-purple-600" />
                                <span>🚀 Mở Thí Nghiệm</span>
                              </button>
                            </div>

                            <button
                              onClick={() => handleAcceptExperiment(exp)}
                              disabled={isAccepted}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                isAccepted
                                  ? 'bg-emerald-50 text-emerald-700 cursor-default'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAccepted ? 'Đã duyệt' : '✓ Duyệt Kịch Bản'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Teacher Review & Management Tab */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
                <span>Teacher Review & Phê Duyệt Xuất Bản</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Giáo viên kiểm tra và xuất bản thí nghiệm đã chọn cho lớp học.
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">
              Đã duyệt: {acceptedExperiments.length}
            </span>
          </div>

          {acceptedExperiments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Info className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-medium">Chưa có thí nghiệm nào được phê duyệt.</p>
              <button
                onClick={() => setActiveTab('generator')}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow"
              >
                Chuyển sang Yêu cầu & Tạo đề xuất
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {exp.model.type.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          exp.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {exp.status === 'published' ? '🚀 Published' : '✏️ Draft'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{exp.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{exp.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewExp(exp)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold flex items-center gap-1"
                        title="Xem trước"
                      >
                        <Eye className="w-4 h-4 text-indigo-600" />
                      </button>
                      <button
                        onClick={() => handleRemoveAccepted(exp.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {exp.status === 'draft' ? (
                      <button
                        onClick={() => handlePublish(exp)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                      >
                        <Rocket className="w-4 h-4" />
                        <span>🚀 Xuất bản cho học sinh</span>
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã xuất bản</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Canvas Experiment Preview Modal */}
      {previewExp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30">
                  INTERACTIVE CANVAS PREVIEW
                </span>
                <h3 className="font-bold text-lg text-white">{previewExp.title}</h3>
              </div>
              <button
                onClick={() => setPreviewExp(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: VisualizationEngineRegistry handles 2D, 3D, Graph, Prob, Stat seamlessly */}
            <div className="flex-1 relative bg-slate-950 overflow-hidden">
              <VisualizationEngineRegistry
                modelType={previewExp.model.type}
                params={previewExp.model.parameters}
                displayOptions={{
                  showRadius: true,
                  showHeight: true,
                  showSlantHeight: true,
                  showDimensions: true,
                  showLabels: true,
                  showGrid: true,
                  showAxes: true,
                  showWireframe: false,
                  transparentSolid: false,
                  solidOpacity: 0.8,
                }}
                activeMode="observe"
                unfoldingProgress={0}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                Engine: {previewExp.model.type}
              </span>
              <button
                onClick={() => {
                  handleAcceptExperiment(previewExp);
                  setPreviewExp(null);
                  setActiveTab('review');
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Phê duyệt kịch bản này</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGeneratorPanel;
