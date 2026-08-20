import React, { useState, useEffect } from 'react';
import { Navbar } from './components/navigation/Navbar';
import { HomePage } from './pages/HomePage';
import { Geometry3DPage } from './pages/Geometry3DPage';
import { LabPage } from './pages/LabPage';
import { GeoGebraPage } from './pages/GeoGebraPage';
import { GSPPage } from './pages/GSPPage';
import { CasioCalculatorPage } from './pages/CasioCalculatorPage';
import { LessonsPage } from './pages/LessonsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { AIGeneratorPage } from './pages/AIGeneratorPage';
import { AIMathAssistantModal } from './components/ai/AIMathAssistantModal';
import { ChatbotFloatingWidget } from './components/ChatbotFloatingWidget';
import { LoginModal } from './components/auth/LoginModal';
import { ssoService, UserSession } from './services/SSOService';
import { UserRole } from './types/geometry';
import { FlaskConical } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'home' | '3d-geometry' | 'geogebra' | 'gsp' | 'calculator' | 'lessons' | 'assignments' | 'lab' | 'ai-generator'>('home');
  const [currentSlug, setCurrentSlug] = useState<string>('hinh-tru');
  const [shareId, setShareId] = useState<string | undefined>(undefined);
  const [isStudentMode, setIsStudentMode] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('teacher');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [userSession, setUserSession] = useState<UserSession | null>(ssoService.getSession());

  // Listen to SSO session changes
  useEffect(() => {
    const unsubscribe = ssoService.subscribe((sess) => {
      setUserSession(sess);
      if (sess) {
        setUserRole(sess.role === 'student' || sess.role === 'guest' ? 'student' : 'teacher');
      }
    });
    return unsubscribe;
  }, []);

  // Router & Deep Link Parser
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      // 1. Check for SSO login callback or query token (Scenario A)
      const session = ssoService.authenticateFromUrlParams(searchParams);
      if (session) {
        setUserRole(session.role === 'student' || session.role === 'guest' ? 'student' : 'teacher');
      }

      // 2. Parse Share Links: /share/:shareId or /share/:shareId/:slug (Scenario C)
      const shareMatch = path.match(/^\/share\/([^/]+)(?:\/([^/]+))?/);
      if (shareMatch) {
        const id = shareMatch[1];
        const optionalSlug = shareMatch[2];
        setShareId(id);
        if (optionalSlug) {
          setCurrentSlug(optionalSlug);
        }
        setActiveTab('lab');
        setIsStudentMode(true);
        setUserRole('student');
        return;
      }

      // 3. Parse Deep Links: /experiment/:slug or /mathlab/experiment/:slug (Scenario A & B)
      const experimentMatch = path.match(/^(?:\/mathlab)?\/experiment\/([^/]+)/);
      if (experimentMatch) {
        const slug = experimentMatch[1];
        setCurrentSlug(slug);
        setActiveTab('lab');
        setIsStudentMode(false);
        return;
      }

      // 4. Parse Demo Links: /demo/:slug
      const demoMatch = path.match(/^\/demo\/([^/]+)/);
      if (demoMatch) {
        const slug = demoMatch[1];
        setCurrentSlug(slug);
        setActiveTab('lab');
        setIsStudentMode(false);
        return;
      }

      // 5. Standard Tab Routes
      if (path === '/lab' || path.startsWith('/lab')) {
        setActiveTab('lab');
      } else if (path === '/3d-geometry' || path === '/geometry-3d') {
        setActiveTab('3d-geometry');
      } else if (path === '/geogebra') {
        setActiveTab('geogebra');
      } else if (path === '/gsp') {
        setActiveTab('gsp');
      } else if (path === '/calculator') {
        setActiveTab('calculator');
      } else if (path === '/lessons') {
        setActiveTab('lessons');
      } else if (path === '/assignments') {
        setActiveTab('assignments');
      } else if (path === '/ai-generator') {
        setActiveTab('ai-generator');
      } else {
        setActiveTab('home');
      }
    };

    handleUrlRoute();
    window.addEventListener('popstate', handleUrlRoute);
    return () => window.removeEventListener('popstate', handleUrlRoute);
  }, []);

  const navigateTo = (tab: typeof activeTab, slug?: string) => {
    setActiveTab(tab);
    if (tab === 'lab' && slug) {
      setCurrentSlug(slug);
      window.history.pushState({}, '', `/experiment/${slug}`);
    } else if (tab === 'home') {
      window.history.pushState({}, '', '/');
    } else {
      window.history.pushState({}, '', `/${tab}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRoleToggle = () => {
    const nextRole: UserRole = userRole === 'teacher' ? 'student' : 'teacher';
    setUserRole(nextRole);
    if (ssoService.getSession()) {
      ssoService.setSession({
        ...ssoService.getSession()!,
        role: nextRole,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Bar */}
      {!isStudentMode && (
        <Navbar
          activeTab={activeTab}
          onTabChange={(tab) => navigateTo(tab)}
          userRole={userRole}
          onRoleToggle={handleRoleToggle}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />
      )}

      {/* Main Views */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'home' && (
          <HomePage
            onExploreLab={(slug) => navigateTo('lab', slug || 'hinh-tru')}
            onNavigateTab={(tab) => navigateTo(tab)}
          />
        )}

        {activeTab === '3d-geometry' && (
          <Geometry3DPage onExploreLab={(slug) => navigateTo('lab', slug)} />
        )}

        {activeTab === 'lab' && (
          <LabPage
            initialSlug={currentSlug}
            shareId={shareId}
            isStudentMode={isStudentMode}
            onNavigateHome={() => navigateTo('home')}
          />
        )}

        {activeTab === 'geogebra' && <GeoGebraPage />}
        {activeTab === 'gsp' && <GSPPage />}
        {activeTab === 'calculator' && <CasioCalculatorPage />}
        {activeTab === 'lessons' && (
          <LessonsPage
            onSelectLab={(slug) => navigateTo('lab', slug)}
            onOpenLabWithContext={(slug) => navigateTo('lab', slug)}
          />
        )}
        {activeTab === 'assignments' && (
          <AssignmentsPage
            userRole={userRole}
            onOpenAssignmentLab={(_, labId) => navigateTo('lab', labId)}
          />
        )}
        {activeTab === 'ai-generator' && (
          <AIGeneratorPage
            onPublishExperiment={(exp) => {
              navigateTo('lab', exp.id);
            }}
          />
        )}
      </main>

      {/* Gemini / OpenAI Chatbot Floating Widget */}
      <ChatbotFloatingWidget
        onOpenAIGenerator={() => navigateTo('ai-generator')}
      />

      {/* AI Assistant Modal */}
      <AIMathAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onNavigateToTab={(tab) => navigateTo(tab as any)}
      />

      {/* Single Identity SSO Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        targetExperimentSlug={activeTab === 'lab' ? currentSlug : undefined}
        onLoginSuccess={(sess) => {
          setUserRole(sess.role === 'student' || sess.role === 'guest' ? 'student' : 'teacher');
        }}
      />

      {/* Footer */}
      {!isStudentMode && activeTab !== 'lab' && (
        <footer className="bg-slate-900/90 border-t border-slate-800/80 py-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-sky-400" />
                <span className="font-bold text-slate-200">MATH LAB 3D</span>
              </div>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="text-slate-400 font-medium">
                Mô phỏng hình học không gian, cắt lát 3D, khai triển phẳng & máy tính đồ họa
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Tích hợp hệ thống Luyện đề Kết nối tri thức (Single Identity SSO)
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
