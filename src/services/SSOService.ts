import { MAIN_WEBSITE_CONFIG, isAllowedOrigin } from '../integration/config';

export interface UserSession {
  userId: string;
  userName: string;
  userEmail?: string;
  role: 'admin' | 'teacher' | 'student' | 'guest';
  school?: string;
  avatarUrl?: string;
  source: 'main-website' | 'direct' | 'share-link' | 'quick-auth';
  token?: string;
  expiresAt: number; // timestamp
}

const STORAGE_KEY = 'mathlab_sso_session';

class SSOService {
  private currentSession: UserSession | null = null;
  private listeners: ((session: UserSession | null) => void)[] = [];

  constructor() {
    this.restoreSession();
    this.setupMessageListener();
  }

  private restoreSession(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: UserSession = JSON.parse(raw);
        if (parsed.expiresAt > Date.now()) {
          this.currentSession = parsed;
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (!isAllowedOrigin(event.origin)) return;

      const data = event.data;
      if (data && (data.type === 'SSO_AUTH_HANDSHAKE' || data.type === 'MATHLAB_AUTH_TOKEN')) {
        const { user, token, role, expiresIn } = data.payload || {};
        if (user || role) {
          const session: UserSession = {
            userId: user?.id || user?.uid || 'teacher-01',
            userName: user?.displayName || user?.name || 'Thầy Nguyễn Quang Phúc',
            userEmail: user?.email || 'teacher@example.com',
            role: role === 'admin' ? 'admin' : role === 'student' ? 'student' : 'teacher',
            school: user?.school || 'THCS Hưng Bình, Nghệ An',
            source: 'main-website',
            token: token || `token_${Date.now()}`,
            expiresAt: Date.now() + (expiresIn || 3600 * 12) * 1000,
          };
          this.setSession(session);
        }
      } else if (data && data.type === 'SSO_LOGOUT') {
        this.clearSession();
      }
    });
  }

  /**
   * Parse authentication from URL parameters (e.g. from Website Chính link)
   */
  public authenticateFromUrlParams(searchParams: URLSearchParams): UserSession | null {
    const ssoTicket = searchParams.get('sso_ticket') || searchParams.get('token') || searchParams.get('auth_token');
    const teacherId = searchParams.get('teacherId') || searchParams.get('userId');
    const teacherName = searchParams.get('teacherName') || searchParams.get('userName');
    const roleParam = searchParams.get('role');
    const sourceParam = searchParams.get('source');

    if (ssoTicket || roleParam === 'teacher' || roleParam === 'admin' || sourceParam === 'main-website') {
      const sessionRole: 'admin' | 'teacher' | 'student' =
        roleParam === 'admin' ? 'admin' : roleParam === 'student' ? 'student' : 'teacher';

      const session: UserSession = {
        userId: teacherId || 'teacher_01',
        userName: teacherName || (sessionRole === 'student' ? 'Học sinh' : 'Thầy Nguyễn Quang Phúc'),
        userEmail: searchParams.get('userEmail') || (sessionRole === 'student' ? '' : 'teacher@example.com'),
        role: sessionRole,
        school: searchParams.get('school') || 'THCS Hưng Bình, Nghệ An',
        source: 'main-website',
        token: ssoTicket || `sso_verified_${Date.now()}`,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
      };

      this.setSession(session);
      return session;
    }

    return this.currentSession;
  }

  public loginTeacher(params?: {
    userEmail?: string;
    userName?: string;
    school?: string;
    role?: 'teacher' | 'admin';
  }): UserSession {
    const session: UserSession = {
      userId: `teacher_${Date.now()}`,
      userName: params?.userName || 'Thầy Nguyễn Quang Phúc',
      userEmail: params?.userEmail || 'teacher@example.com',
      role: params?.role || 'teacher',
      school: params?.school || 'THCS Hưng Bình, Nghệ An',
      source: 'quick-auth',
      token: `auth_token_${Date.now()}`,
      expiresAt: Date.now() + 1000 * 60 * 60 * 48, // 48 hours
    };
    this.setSession(session);
    return session;
  }

  public loginGuest(name?: string): UserSession {
    const session: UserSession = {
      userId: `guest_${Date.now()}`,
      userName: name || 'Học sinh / Khách',
      role: 'student',
      source: 'direct',
      expiresAt: Date.now() + 1000 * 60 * 60 * 12,
    };
    this.setSession(session);
    return session;
  }

  public setSession(session: UserSession): void {
    this.currentSession = session;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Cannot write session to localStorage', e);
    }
    this.notifyListeners();
  }

  public getSession(): UserSession | null {
    if (this.currentSession && this.currentSession.expiresAt <= Date.now()) {
      this.clearSession();
      return null;
    }
    return this.currentSession;
  }

  public isTeacher(): boolean {
    const session = this.getSession();
    return !!session && (session.role === 'teacher' || session.role === 'admin');
  }

  public isAdmin(): boolean {
    const session = this.getSession();
    return !!session && session.role === 'admin';
  }

  public isStudent(): boolean {
    const session = this.getSession();
    return !session || session.role === 'student' || session.role === 'guest';
  }

  public clearSession(): void {
    this.currentSession = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  public redirectToMainLogin(currentPath: string = window.location.pathname): void {
    const returnUrl = encodeURIComponent(window.location.origin + currentPath);
    const loginUrl = `${MAIN_WEBSITE_CONFIG.baseUrl}${MAIN_WEBSITE_CONFIG.loginPath}?redirect_uri=${returnUrl}&source=mathlab`;
    window.location.href = loginUrl;
  }

  public subscribe(callback: (session: UserSession | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.getSession());
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentSession);
    }
  }
}

export const ssoService = new SSOService();
