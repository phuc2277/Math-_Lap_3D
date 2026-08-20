import { ModelType } from '../types/geometry';

export type LabType = '3d' | '2d' | 'simulation';
export type LabStatus = 'published' | 'draft' | 'archived';
export type UserRole = 'student' | 'teacher';
export type IntegrationSource = 'teacher' | 'student' | 'lesson' | 'preview' | 'direct';
export type DisplayMode = 'normal' | 'presentation';

export interface LabMetadata {
  id: string; // e.g. "lab-cylinder-001"
  title: string;
  description: string;
  type: LabType;
  modelType: ModelType;
  grade: number;
  subject: string;
  lessonId: string; // e.g. "lop9-hinh-tru"
  status: LabStatus;
  createdAt?: string;
  updatedAt?: string;
  authorId?: string;
}

export interface UserContext {
  userId?: string;
  userRole: UserRole;
  userName?: string;
  classId?: string;
}

export interface IntegrationContext {
  labId: string;
  lessonId?: string;
  experimentId?: string;
  source: IntegrationSource;
  mode: DisplayMode;
  returnUrl?: string;
  userContext: UserContext;
}

export interface LessonReference {
  lessonId: string;
  title: string;
  grade: number;
  chapter: string;
  linkedLabIds: string[];
}

export interface LabActivityEvent {
  type:
    | 'LAB_OPENED'
    | 'EXPERIMENT_STARTED'
    | 'EXPERIMENT_COMPLETED'
    | 'PARAM_CHANGED'
    | 'PARAMETER_CHANGED'
    | 'LAB_CLOSED'
    | 'STEP_STARTED'
    | 'STEP_COMPLETED'
    | 'MEASUREMENT_VIEWED'
    | 'MODEL_ROTATED'
    | 'MODEL_UNFOLDED'
    | 'SECTION_USED'
    | 'QUESTION_ANSWERED'
    | 'HINT_USED';
  labId: string;
  lessonId?: string;
  userId?: string;
  details?: Record<string, any>;
  timestamp: string;
}
