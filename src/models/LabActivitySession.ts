export type SessionStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'expired';

export type ActivityEventType =
  | 'LAB_OPENED'
  | 'EXPERIMENT_STARTED'
  | 'STEP_STARTED'
  | 'STEP_COMPLETED'
  | 'PARAM_CHANGED'
  | 'PARAMETER_CHANGED'
  | 'MEASUREMENT_VIEWED'
  | 'MODEL_ROTATED'
  | 'MODEL_UNFOLDED'
  | 'SECTION_USED'
  | 'QUESTION_ANSWERED'
  | 'HINT_USED'
  | 'EXPERIMENT_COMPLETED'
  | 'LAB_CLOSED';

export interface LabActivityEvent {
  id: string; // unique event ID for idempotency
  sessionId: string;
  assignmentId: string;
  studentId: string;
  type: ActivityEventType;
  timestamp: string;
  payload: Record<string, any>;
}

export type QuestionType = 'single_choice' | 'numeric' | 'observation';

export interface ExperimentQuestion {
  id: string;
  stepNumber: number;
  questionText: string;
  type: QuestionType;
  options?: string[]; // For single_choice
  correctAnswer?: string | number; // Expected value
  tolerance?: number; // For numeric questions e.g. 0.1
  points?: number;
  explanation?: string;
}

export interface QuestionResult {
  questionId: string;
  stepNumber: number;
  questionText: string;
  type: QuestionType;
  studentAnswer: string | number;
  expectedAnswer?: string | number;
  isCorrect: boolean | null; // null if manual review required (observation)
  score: number;
  maxScore: number;
  attemptsCount: number;
  requiresTeacherReview: boolean;
}

export interface LabActivitySession {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  labId: string;
  experimentId: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  status: SessionStatus;
  currentStep: number;
  completedSteps: number[]; // e.g. [1, 2, 3]
  answers: Record<string, string | number>; // questionId -> answer
  savedParams?: Record<string, number>;
  attemptNumber: number;
  scoreEarned?: number;
  scorePossible?: number;
}

export interface LabActivityResult {
  assignmentId: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  experimentId: string;
  labId: string;
  lessonId?: string;
  status: 'completed' | 'in_progress';
  startedAt: string;
  completedAt: string;
  progressPercentage: number;
  completedStepsCount: number;
  totalStepsCount: number;
  score: {
    earned: number;
    possible: number;
  };
  questionResults: QuestionResult[];
  durationSeconds: number;
  attemptNumber: number;
}
