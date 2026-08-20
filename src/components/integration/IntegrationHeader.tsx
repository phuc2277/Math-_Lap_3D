import React, { useState } from 'react';
import { IntegrationContext, LabMetadata } from '../../models/Lab';
import { navigateToReturnUrl } from '../../integration/returnUrl';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ShieldCheck,
  Projector,
} from 'lucide-react';

interface IntegrationHeaderProps {
  context: IntegrationContext;
  labMetadata?: LabMetadata | null;
  onTogglePresentationMode?: () => void;
  isPresentationMode?: boolean;
}

export const IntegrationHeader: React.FC<IntegrationHeaderProps> = ({
  context,
  labMetadata,
  onTogglePresentationMode,
  isPresentationMode = false,
}) => {
  const [showMetaModal, setShowMetaModal] = useState(false);

  const { source, returnUrl, lessonId } = context;

  // Determine back button text & icon based on integration source
  const getBackLabel = () => {
    switch (source) {
      case 'lesson':
        return '← Quay lại bài học';
      case 'teacher':
        return '← Quay lại Teacher Workspace';
      case 'student':
        return '← Quay lại khóa học';
      case 'preview':
        return '← Đóng bản xem trước';
      default:
        return '← Quay lại';
    }
  };

  const handleBackClick = () => {
    if (returnUrl) {
      navigateToReturnUrl(returnUrl, '/lessons');
    } else {
      window.history.back();
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl mb-6 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Return Action & Lesson Context */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackClick}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span>{getBackLabel()}</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Context Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {source === 'lesson' && (
              <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 rounded-lg flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Được mở từ Bài học ({lessonId || 'lop9-hinh-tru'})</span>
              </span>
            )}

            {source === 'teacher' && (
              <span className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 rounded-lg flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Teacher Workspace</span>
              </span>
            )}

            {source === 'student' && (
              <span className="px-2.5 py-1 text-[11px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800/80 rounded-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giao diện Học sinh</span>
              </span>
            )}

            {labMetadata && (
              <button
                onClick={() => setShowMetaModal(true)}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition flex items-center gap-1"
                title="Xem Metadata liên kết"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Metadata</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Presentation Mode & Security Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {source === 'teacher' && onTogglePresentationMode && (
            <button
              onClick={onTogglePresentationMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isPresentationMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700'
              }`}
            >
              <Projector className="w-4 h-4" />
              <span>{isPresentationMode ? 'Thoát Trình chiếu' : 'Chế độ Máy chiếu'}</span>
            </button>
          )}

          <div
            className="flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1 bg-slate-950/60 rounded-lg border border-slate-800"
            title="Sử dụng kết nối tích hợp an toàn AuthAdapter & LabDataAdapter"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">Standard Integration</span>
          </div>
        </div>
      </div>

      {/* Lab Metadata Inspector Modal */}
      {showMetaModal && labMetadata && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Cấu hình Lab Metadata (JSON)</h3>
              </div>
              <button
                onClick={() => setShowMetaModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Dữ liệu liên kết giữa Nền tảng Giáo dục chính và Math Lab (Stage 3 Metadata Schema):
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-60 leading-relaxed">
              <pre>{JSON.stringify(labMetadata, null, 2)}</pre>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <ExternalLink className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Math Lab nhận <code className="text-sky-300">lessonId</code> và <code className="text-sky-300">labId</code> từ nền tảng quản lý bài học mà không phụ thuộc vào Three.js ở ứng dụng mẹ.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowMetaModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
