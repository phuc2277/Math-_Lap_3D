/**
 * AI Tutor Types & Interfaces for Math Lab
 * Supports OpenAI & Gemini multi-provider architecture with Engine result integration
 */

export interface ExperimentAIContext {
  experimentId: string;
  subject: string; // e.g. "Toán"
  grade?: number; // e.g. 6, 7, 8, 9, 10, 11, 12
  topic: string; // e.g. "Hình trụ", "Mặt cắt hình trụ", "Xác suất thực nghiệm", "Đồ thị hàm số"
  experimentType: string; // e.g. "3D cross section", "3D Unfolding", "Graph 2D", "Probability"
  
  // State directly computed by Geometry / Measurement / Probability / Graph Engines
  geometryState?: {
    shape?: string;
    radius?: number;
    height?: number;
    slantHeight?: number;
    sideA?: number;
    sideB?: number;
    sideC?: number;
    planeAngle?: number;
    planePitch?: number;
    planeYaw?: number;
    planeRoll?: number;
    planePosition?: number;
    
    // Engine Computed Metrics (AI must NEVER re-invent these)
    crossSectionType?: string; // e.g. "ellipse", "rectangle", "circle", "triangle", "polygon", "parabola"
    crossSectionArea?: number;
    volume?: number;
    surfaceArea?: number;
    lateralArea?: number;
    cutCount?: number;
    isSeparated?: boolean;
    
    // Probability Engine data
    probabilityTrials?: number;
    probabilityFrequencies?: Record<string | number, number>;
    
    // Graph Engine data
    graphSlope?: number;
    graphYIntercept?: number;
    graphEquation?: string;
  };
  
  mode: 'student' | 'teacher';
  learningObjectives?: string[];
}

export interface AITutorChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  thinking?: string;
  engineVerified?: boolean;
}

export type HintTierLevel = 1 | 2 | 3 | 4;

export interface HintTier {
  level: HintTierLevel;
  title: string;
  category: 'observation' | 'action' | 'concept' | 'solution';
  content: string;
}

export interface SocraticGuideStep {
  stepNumber: number;
  question: string;
  expectedAction: string;
  pedagogicalGoal: string;
}

export interface TeacherGeneratedQuestion {
  id: string;
  type: 'observation' | 'prediction' | 'explanation' | 'application';
  typeLabel: string;
  question: string;
  hint: string;
  expectedAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface LessonPlanStage {
  stepNumber: number;
  name: string;
  durationMinutes: number;
  teacherAction: string;
  studentAction: string;
  mathLabOperation: string;
  guidingQuestion: string;
}

export interface TeacherLessonPlan {
  title: string;
  grade: number;
  topic: string;
  totalDuration: number;
  learningObjectives: string[];
  stages: LessonPlanStage[];
  summary: string;
}
