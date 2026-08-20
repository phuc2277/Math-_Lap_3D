import { UserRole } from '../models/Lab';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  classId?: string;
}

export interface AuthAdapter {
  getCurrentUser(): Promise<User | null>;
  getToken(): Promise<string | null>;
  isAuthenticated(): boolean;
  setMockRole(role: UserRole): void;
}
