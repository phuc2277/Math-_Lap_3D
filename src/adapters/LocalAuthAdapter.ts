import { AuthAdapter, User } from './AuthAdapter';
import { UserRole } from '../models/Lab';
import { parseIntegrationContext } from '../integration/context';

export class LocalAuthAdapter implements AuthAdapter {
  private currentUser: User;

  constructor() {
    const context = parseIntegrationContext();
    this.currentUser = {
      id: context.userContext.userId || 'usr-mock-123',
      name: context.userContext.userName || (context.userContext.userRole === 'teacher' ? 'Thầy Nguyễn Văn A' : 'Học sinh Nguyễn Văn B'),
      role: context.userContext.userRole,
      classId: context.userContext.classId || 'class-9a1',
      email: context.userContext.userRole === 'teacher' ? 'teacher@school.edu.vn' : 'student@school.edu.vn',
    };
  }

  public async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  public async getToken(): Promise<string | null> {
    return 'mock-jwt-token-mathlab-stage3';
  }

  public isAuthenticated(): boolean {
    return true;
  }

  public setMockRole(role: UserRole): void {
    this.currentUser.role = role;
    this.currentUser.name = role === 'teacher' ? 'Thầy Nguyễn Văn A (Giáo viên)' : 'Học sinh Nguyễn Văn B';
  }
}

export const defaultAuthAdapter = new LocalAuthAdapter();
