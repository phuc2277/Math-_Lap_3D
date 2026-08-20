import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../../types/geometry';
import {
  FlaskConical,
  Box,
  BookOpen,
  GraduationCap,
  Sparkles,
  Home,
  CheckSquare,
  Compass,
  Calculator,
  Lock,
  LogOut,
  User,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { ssoService, UserSession } from '../../services/SSOService';
import { soundEffects } from '../../utils/audioEffects';

interface NavbarProps {
  activeTab: 'home' | '3d-geometry' | 'geogebra' | 'gsp' | 'calculator' | 'lessons' | 'assignments' | 'lab' | 'ai-generator' | 'about';
  onTabChange: (tab: 'home' | '3d-geometry' | 'geogebra' | 'gsp' | 'calculator' | 'lessons' | 'assignments' | 'ai-generator') => void;
  userRole: UserRole;
  onRoleToggle: () => void;
  onOpenAIAssistant?: () => void;
  onOpenCasioModal?: () => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  onRoleToggle,
  onOpenAIAssistant,
  onOpenLoginModal,
}) => {
  const [userSession, setUserSession] = useState<UserSession | null>(ssoService.getSession());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = ssoService.subscribe((session) => {
      setUserSession(session);
    });
    return unsubscribe;
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    soundEffects.playPopSound();
    ssoService.clearSession();
    setIsProfileMenuOpen(false);
  };

  const isTeacherLoggedIn = userSession && (userSession.role === 'teacher' || userSession.role === 'admin');

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <button
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 group focus:outline-none text-left shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                MATH LAB 3D
              </span>
              <span className="hidden lg:inline-flex px-1.5 py-0.5 text-[9px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                GDPT 2018
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Phòng Thí Nghiệm Toán Học 3D
            </p>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 overflow-x-auto max-w-[620px]">
          <button
            onClick={() => onTabChange('home')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'home'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </button>

          <button
            onClick={() => onTabChange('3d-geometry')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === '3d-geometry' || activeTab === 'lab'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Hình học 3D</span>
          </button>

          <button
            onClick={() => onTabChange('geogebra')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'geogebra'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-indigo-300 hover:text-indigo-100 hover:bg-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>GeoGebra</span>
          </button>

          <button
            onClick={() => onTabChange('gsp')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'gsp'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-300 hover:text-amber-100 hover:bg-slate-900'
            }`}
          >
            <span className="font-black text-[10px] px-1 py-0.2 bg-amber-400 text-slate-950 rounded">GSP</span>
            <span>Sketchpad</span>
          </button>

          <button
            onClick={() => onTabChange('calculator')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/20'
                : 'text-sky-300 hover:text-sky-100 hover:bg-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-sky-400" />
            <span>Casio fx-580</span>
          </button>

          <button
            onClick={() => onTabChange('lessons')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'lessons'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Bài học</span>
          </button>

          <button
            onClick={() => onTabChange('assignments')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nhiệm vụ</span>
          </button>

          <button
            onClick={() => onTabChange('ai-generator')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap transition-all border ${
              activeTab === 'ai-generator'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20'
                : 'text-purple-300 border-purple-500/30 hover:bg-purple-950/40 hover:text-purple-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>AI Tạo</span>
          </button>
        </nav>

        {/* Right Section: Auth & Role & AI Assistant */}
        <div className="flex items-center gap-2 shrink-0">
          {/* AI Assistant Quick Trigger */}
          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-amber-300 border border-purple-500/40 shadow-sm shadow-purple-500/20"
              title="Mở Trợ lý AI Toán học"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">AI Trợ Lý</span>
            </button>
          )}

          {/* User Account / Login Button */}
          {isTeacherLoggedIn ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => {
                  soundEffects.playPopSound();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold transition shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                  {userSession.userName?.charAt(0) || 'G'}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {userSession.userName}
                </span>
                <span className="px-1 py-0.2 rounded text-[9px] bg-amber-400 text-slate-950 font-extrabold uppercase">
                  {userSession.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2.5 text-xs text-slate-200 z-50 animate-fadeIn">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 mb-2">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{userSession.userName}</span>
                    </div>
                    {userSession.userEmail && (
                      <p className="text-[11px] text-slate-400 truncate">{userSession.userEmail}</p>
                    )}
                    {userSession.school && (
                      <p className="text-[10px] text-sky-400 truncate">{userSession.school}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onRoleToggle();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 flex items-center justify-between text-slate-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-400" />
                        <span>Chế độ hiển thị:</span>
                      </div>
                      <span className="font-bold text-amber-300">
                        {userRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                      </span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất Math Lab</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Not Logged In -> Login Button */}
              {onOpenLoginModal && (
                <button
                  onClick={() => {
                    soundEffects.playPopSound();
                    onOpenLoginModal();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đăng Nhập</span>
                </button>
              )}

              <button
                onClick={onRoleToggle}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition"
                title="Chuyển chế độ xem"
              >
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">
                  {userRole === 'teacher' ? 'GV' : 'HS'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-950 border-t border-slate-800/80 px-2 py-1.5 text-xs overflow-x-auto">
        <button
          onClick={() => onTabChange('home')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === 'home' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          Trang chủ
        </button>
        <button
          onClick={() => onTabChange('3d-geometry')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === '3d-geometry' || activeTab === 'lab' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          Hình học 3D
        </button>
        <button
          onClick={() => onTabChange('geogebra')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === 'geogebra' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          GeoGebra
        </button>
        <button
          onClick={() => onTabChange('gsp')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === 'gsp' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          GSP
        </button>
        <button
          onClick={() => onTabChange('calculator')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === 'calculator' ? 'text-sky-400 font-bold' : 'text-slate-400'}`}
        >
          Casio fx-580
        </button>
        <button
          onClick={() => onTabChange('lessons')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === 'lessons' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Bài học
        </button>
        <button
          onClick={() => onTabChange('assignments')}
          className={`px-2 py-1 rounded-md whitespace-nowrap ${activeTab === 'assignments' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Nhiệm vụ
        </button>
      </div>
    </header>
  );
};
