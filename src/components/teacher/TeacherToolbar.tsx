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
} from 'lucide-react';
import { ssoService } from '../../services/SSOService';
import { ShareModal } from '../share/ShareModal';
import { ModelType } from '../../types/geometry';
import { MAIN_WEBSITE_CONFIG, buildReturnUrl } from '../../integration/config';
import { soundEffects } from '../../utils/audioEffects';

interface TeacherToolbarProps {
  modelType: ModelType;
  experimentSlug: string;
  modelTitle: string;
  lessonId?: string;
  isStudentMode?: boolean;
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
      <div className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Role Badge & Return to Main Lesson Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReturnToMain}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold transition group"
            title="Quay lại bài học trên Luyện đề Kết nối tri thức"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại bài học</span>
          </button>

          {isEffectiveTeacher ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>TEACHER MODE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>STUDENT MODE</span>
            </div>
          )}
        </div>

        {/* Right: Actions & AI Tutor Trigger */}
        <div className="flex items-center gap-2">
          {/* Inspector 2D Button for both */}
          {onOpenInspectorModal && (
            <button
              onClick={() => {
                soundEffects.playPopSound();
                onOpenInspectorModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition"
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
                  : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
              title="Mở bảng Trợ lý AI Toán học & Gợi ý Socratic"
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAITutorOpen ? 'Ẩn AI' : '🤖 Hỏi Trợ lý AI'}</span>
            </button>
          )}

          {/* Teacher Only Actions */}
          {isEffectiveTeacher && (
            <>
              {onOpenPredictionModal && (
                <button
                  onClick={onOpenPredictionModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition"
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
                <span>Chia Sẻ Cho Học Sinh</span>
              </button>
            </>
          )}

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
            title="Trình chiếu toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

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
