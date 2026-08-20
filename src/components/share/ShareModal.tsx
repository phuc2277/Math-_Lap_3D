import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  QrCode,
  Clock,
  ShieldCheck,
  Users,
  Share2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { ModelType } from '../../types/geometry';
import { shareService, ShareSessionConfig } from '../../services/ShareService';
import { ssoService } from '../../services/SSOService';
import { soundEffects } from '../../utils/audioEffects';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  experimentSlug: string;
  modelType: ModelType;
  modelTitle: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  experimentSlug,
  modelType,
  modelTitle,
}) => {
  const [durationHours, setDurationHours] = useState<number>(24);
  const [createdSession, setCreatedSession] = useState<ShareSessionConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateLink = () => {
    soundEffects.playPopSound();
    const currentSession = ssoService.getSession();
    const session = shareService.createShareLink({
      experimentSlug,
      modelType,
      title: modelTitle,
      durationHours: durationHours === 0 ? undefined : durationHours,
      teacherName: currentSession?.userName || 'Giáo viên',
      schoolName: currentSession?.school || '',
    });
    setCreatedSession(session);
  };

  const shareUrl = createdSession
    ? `${window.location.origin}/share/${createdSession.shareId}`
    : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    soundEffects.playPopSound();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyPin = () => {
    if (!createdSession) return;
    navigator.clipboard.writeText(createdSession.pinCode);
    setPinCopied(true);
    soundEffects.playPopSound();
    setTimeout(() => setPinCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-200 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">🔗 Chia Sẻ Cho Học Sinh</h3>
              <p className="text-xs text-slate-400">
                Học sinh truy cập trực tiếp • <strong>Không cần đăng nhập / tài khoản</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Experiment Info */}
        <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Mô hình chia sẻ
            </span>
            <h4 className="text-sm font-bold text-white">{modelTitle}</h4>
          </div>
          <span className="px-2 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-md text-xs font-mono">
            /experiment/{experimentSlug}
          </span>
        </div>

        {!createdSession ? (
          /* Step 1: Configuration */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                Thời hạn liên kết:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1 Giờ', val: 1 },
                  { label: '1 Ngày', val: 24 },
                  { label: '7 Ngày', val: 168 },
                  { label: 'Vô thời hạn', val: 0 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDurationHours(item.val)}
                    className={`py-2 px-1 text-xs font-medium rounded-lg border transition ${
                      durationHours === item.val
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Bảo vệ quyền Giáo viên (Student Mode)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Học sinh khi mở link chỉ có quyền xoay 3D, cắt lát, đo đạc và dự đoán. Học sinh tuyệt đối không thể chỉnh sửa bài gốc hay xem cấu hình quản trị của thầy.
              </p>
            </div>

            <button
              onClick={handleGenerateLink}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Tạo Link Chia Sẻ Ngay</span>
            </button>
          </div>
        ) : (
          /* Step 2: Result & Share Link */
          <div className="space-y-4 animate-fadeIn">
            {/* Share URL Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Link trực tiếp cho học sinh:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 text-xs transition"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {/* Room PIN Code Box */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Mã phiên (PIN Code trên lớp)
                </span>
                <p className="text-xl font-mono font-black text-sky-400 tracking-wider">
                  {createdSession.pinCode}
                </p>
              </div>
              <button
                onClick={handleCopyPin}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition"
              >
                {pinCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{pinCopied ? 'Đã lưu' : 'Chép mã'}</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCreatedSession(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                ← Tạo link khác
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    shareService.revokeShareLink(createdSession.shareId);
                    setCreatedSession(null);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Đóng link</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
