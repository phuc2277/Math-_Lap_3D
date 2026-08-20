import { ModelType } from '../types/geometry';

export const WHITELISTED_MODEL_TYPES: ModelType[] = [
  'cuboid',
  'cube',
  'cylinder',
  'cone',
  'sphere',
  'parabol',
  'prism',
  'prism_quad',
  'pyramid',
  'pyramid_triangular',
  'graph_linear',
  'graph_parabola',
  'probability_sim',
  'statistics_sim',
  'line_circle',
  'two_circles',
  'algebra_identity',
];

export type WhitelistedActionType =
  | 'observe'
  | 'rotate'
  | 'zoom'
  | 'changeParameter'
  | 'showMeasurement'
  | 'hideMeasurement'
  | 'unfold'
  | 'fold'
  | 'section'
  | 'compare'
  | 'reset';

export const WHITELISTED_ACTION_TYPES: WhitelistedActionType[] = [
  'observe',
  'rotate',
  'zoom',
  'changeParameter',
  'showMeasurement',
  'hideMeasurement',
  'unfold',
  'fold',
  'section',
  'compare',
  'reset',
];

export interface ExperimentIntent {
  experimentType: ModelType;
  domain: 'geometry2d' | 'geometry3d' | 'algebra' | 'probability' | 'statistics';
  dimension: '2D' | '3D' | 'N/A';
  objects: string[];
  interactions: string[];
  measurements: string[];
  requiredCases: string[];
  mode: 'teacher_specified' | 'ai_suggested';
  reasoning?: string;
}

export interface LessonAnalysis {
  lessonTitle: string;
  grade: number;
  subject: string;
  keyConcepts: string[];
  learningObjectives: string[];
  recommendedModelType: ModelType;
}

export interface GeneratedExperimentStep {
  id: string;
  order: number;
  title: string;
  instruction: string;
  action: {
    type: WhitelistedActionType;
    targetParam?: string;
    value?: number;
  };
  expectedObservation: string;
  modelState?: Record<string, number>;
  formula?: {
    latex?: string;
    explanation?: string;
  };
  hint?: string;
}

export interface GeneratedExperiment {
  id: string;
  labId: string;
  lessonId: string;
  title: string;
  description: string;
  type: '3D Exploration' | 'Unfolding' | 'Parameter Experiment' | 'Section Cut' | '2D Geometry' | 'Graph Analysis' | 'Probability Simulation';
  learningObjectives: string[];
  model: {
    type: ModelType;
    parameters: Record<string, number>;
  };
  interaction: {
    allowRotate: boolean;
    allowZoom: boolean;
    allowParameterChange: boolean;
  };
  steps: GeneratedExperimentStep[];
  status: 'draft' | 'published';
  reviewState?: 'pending' | 'accepted' | 'rejected';
}

export interface AIGeneratorRequest {
  lessonContent: string;
  grade: number;
  subject: string;
  lessonTitle: string;
  teacherPrompt?: string; // Specific description from teacher
  selectedModelType?: ModelType | 'auto'; // Teacher chosen specific type
  selectedDomain?: '2d' | '3d' | 'algebra' | 'prob_stat'; // Selected domain from UI
  mode?: 'teacher_specified' | 'ai_suggested';
  goals: {
    visualize: boolean;
    exploreFormulas: boolean;
    interactiveExperiment: boolean;
    practice: boolean;
    review: boolean;
  };
}

export interface AIGeneratorResponse {
  success: boolean;
  intent: ExperimentIntent;
  analysis: LessonAnalysis;
  experiments: GeneratedExperiment[];
  errors?: string[];
}

