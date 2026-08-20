import React, { useState } from 'react';
import {
  X,
  Lock,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  School,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ssoService, UserSession } from '../../services/SSOService';
import { soundEffects } from '../../utils/audioEffects';
import { MAIN_WEBSITE_CONFIG } from '../../integration/config';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetExperimentSlug?: string;
  onLoginSuccess?: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  targetExperimentSlug,
  onLoginSuccess,
}) => {
  const [customEmail, setCustomEmail] = useState('teacher@example.com');
  const [customName, setCustomName] = useState('Thầy Nguyễn Quang Phúc');
  const [customSchool, setCustomSchool] = useState('THCS Hưng Bình, Nghệ An');
  const [showManualForm, setShowManualForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const currentPath = targetExperimentSlug
    ? `/experiment/${targetExperimentSlug}`
    : window.location.pathname;

  // 1. Redirect to Main Website SSO
  const handleSSORedirect = () => {
    soundEffects.playPopSound();
    setIsLoading(true);
    ssoService.redirectToMainLogin(currentPath);
  };

  // 2. Quick Teacher Login (Single Identity)
  const handleQuickTeacherLogin = (role: 'teacher' | 'admin' = 'teacher') => {
    soundEffects.playPopSound();
    const session = ssoService.loginTeacher({
      userEmail: customEmail.trim() || 'teacher@example.com',
      userName: customName.trim() || 'Thầy Nguyễn Quang Phúc',
      school: customSchool.trim() || 'THCS Hưng Bình, Nghệ An',
      role: role,
    });

    if (onLoginSuccess) {
      onLoginSuccess(session);
    }
    onClose();
  };

  // 3. Guest / Student Access (No password required)
  const handleGuestStudentLogin = () => {
    soundEffects.playPopSound();
    const session = ssoService.loginGuest();
    if (onLoginSuccess) {
      onLoginSuccess(session);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-200 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-sky-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Lock className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Đăng Nhập Math Lab
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full">
                  Single Identity
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đồng bộ tài khoản với <strong>{MAIN_WEBSITE_CONFIG.name}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Single Identity Principle Note */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Hệ thống Đăng nhập Đồng nhất (SSO)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Giáo viên chỉ cần dùng <strong>1 tài khoản duy nhất</strong> từ Website chính để mở và điều khiển mọi thí nghiệm Math Lab mà không phải tạo tài khoản phụ.
          </p>
          {targetExperimentSlug && (
            <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-sky-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Đang mở thí nghiệm: <strong>/experiment/{targetExperimentSlug}</strong></span>
            </div>
          )}
        </div>

        {/* Primary Action: Single Sign-On */}
        <div className="space-y-2.5">
          <button
            onClick={handleSSORedirect}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-sky-500/20 transition flex items-center justify-between group disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform shrink-0" />
              <div>
                <div>Đăng nhập bằng Website Chính</div>
                <div className="text-[10px] font-normal text-sky-100 opacity-90">
                  {MAIN_WEBSITE_CONFIG.name}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {/* Quick Teacher Sign-in (Demo / Direct verified session) */}
          <button
            onClick={() => handleQuickTeacherLogin('teacher')}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold text-xs sm:text-sm transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span>Vào thẳng với tư cách Giáo viên</span>
                  <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-bold">
                    Teacher Mode
                  </span>
                </div>
                <div className="text-[10px] font-normal text-slate-400">
                  {customName} ({customEmail})
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>

        {/* Manual Teacher Credentials Toggle */}
        <div className="text-center">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
          >
            {showManualForm ? '▲ Thu gọn thông tin giáo viên' : '▼ Tùy chỉnh thông tin giáo viên / đơn vị công tác'}
          </button>
        </div>

        {showManualForm && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Họ và tên Giáo viên:</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Email / Tài khoản:</label>
              <input
                type="text"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Đơn vị / Trường học:</label>
              <input
                type="text"
                value={customSchool}
                onChange={(e) => setCustomSchool(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleQuickTeacherLogin('admin')}
                className="flex-1 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 font-bold text-[11px] transition"
              >
                Vào với vai trò Admin
              </button>
              <button
                onClick={() => handleQuickTeacherLogin('teacher')}
                className="flex-1 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-[11px] transition"
              >
                Lưu & Đăng nhập
              </button>
            </div>
          </div>
        )}

        {/* Guest / Student Mode Direct Access */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Bạn là học sinh hoặc khách muốn xem thử?
          </div>
          <button
            onClick={handleGuestStudentLogin}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Vào Chế Độ Học Sinh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
