import React, { useState } from 'react';
import {
  GraduationCap,
  Share2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Settings,
  HelpCircle,
  Sparkles,
  Presentation,
  CheckCircle,
  Bot,
  Lightbulb,
  Eye,
  Box,
  ChevronRight,
} from 'lucide-react';
import { ssoService } from '../../services/SSOService';
import { ShareModal } from '../share/ShareModal';
import { ModelType } from '../../types/geometry';
import { MAIN_WEBSITE_CONFIG, buildReturnUrl } from '../../integration/config';
import { soundEffects } from '../../utils/audioEffects';
import { GEOMETRY_MODELS } from '../../data/geometryModels';

interface TeacherToolbarProps {
  modelType: ModelType;
  experimentSlug: string;
  modelTitle: string;
  lessonId?: string;
  isStudentMode?: boolean;
  onModelChange?: (type: ModelType) => void;
  onOpenPredictionModal?: () => void;
  onOpenInspectorModal?: () => void;
  onToggleAITutor?: () => void;
  isAITutorOpen?: boolean;
}

export const TeacherToolbar: React.FC<TeacherToolbarProps> = ({
  modelType,
  experimentSlug,
  modelTitle,
  lessonId,
  isStudentMode = false,
  onModelChange,
  onOpenPredictionModal,
  onOpenInspectorModal,
  onToggleAITutor,
  isAITutorOpen = false,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEffectiveTeacher = !isStudentMode && ssoService.isTeacher();

  const toggleFullscreen = () => {
    soundEffects.playPopSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleReturnToMain = () => {
    soundEffects.playPopSound();
    const returnUrl = buildReturnUrl(lessonId);
    window.location.href = returnUrl;
  };

  return (
    <>
      <div className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 shadow-md z-30">
        {/* Left: Role Badge, Return to Lesson & Model Breadcrumb */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReturnToMain}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition group shrink-0"
            title="Quay lại bài học trên Luyện đề Kết nối tri thức"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại bài học</span>
          </button>

          {isEffectiveTeacher ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shrink-0">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">TEACHER MODE</span>
              <span className="sm:hidden">GV</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">STUDENT MODE</span>
              <span className="sm:hidden">HS</span>
            </div>
          )}

          {/* Model Title Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
            <Box className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-sky-200">{modelTitle}</span>
          </div>
        </div>

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Inspector 2D Button */}
          {onOpenInspectorModal && (
            <button
              onClick={() => {
                soundEffects.playPopSound();
                onOpenInspectorModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition"
              title="Soi mặt cắt thiết diện 2D chi tiết"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Soi Thiết Diện 2D</span>
            </button>
          )}

          {/* AI Tutor Toggle Button */}
          {onToggleAITutor && (
            <button
              onClick={() => {
                soundEffects.playPopSound();
                onToggleAITutor();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                isAITutorOpen
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sky-500/25 border border-sky-400/40'
                  : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
              }`}
              title="Mở bảng Trợ lý AI Toán học & Gợi ý Socratic"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{isAITutorOpen ? 'Ẩn AI' : '🤖 Trợ lý AI'}</span>
            </button>
          )}

          {/* Teacher Only Actions */}
          {isEffectiveTeacher && (
            <>
              {onOpenPredictionModal && (
                <button
                  onClick={onOpenPredictionModal}
                  className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tạo Thử Thách</span>
                </button>
              )}

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chia Sẻ Cho HS</span>
                <span className="sm:hidden">Chia sẻ</span>
              </button>
            </>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700 transition"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-rose-400" /> : <Maximize2 className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Clean Secondary Navigation: 3D Model Quick Switcher Bar (only when teacher / free exploration) */}
      {!isStudentMode && onModelChange && (
        <div className="w-full bg-slate-950 border-b border-slate-800/80 px-3 sm:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-20">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0 hidden sm:inline">
            Khối Hình:
          </span>
          <div className="flex items-center gap-1.5 flex-nowrap">
            {GEOMETRY_MODELS.map((m) => {
              const isSelected = modelType === m.modelType;
              return (
                <button
                  key={m.id}
                  onClick={() => onModelChange(m.modelType)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20 ring-1 ring-sky-300/40'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                  }`}
                >
                  <Box className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span>{m.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {isEffectiveTeacher && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          experimentSlug={experimentSlug}
          modelType={modelType}
          modelTitle={modelTitle}
        />
      )}
    </>
  );
};
