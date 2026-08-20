export interface TeacherLabPermissions {
  allowRotate: boolean;
  allowParameterChange: boolean;
  allowSectionCut: boolean;
  showFormulas: boolean;
  showAnswers: boolean;
  timeLimitMinutes: number;
}

export type ExperimentSubMode = 'explore' | 'guided' | 'challenge';

export interface ChallengeTask {
  id: string;
  title: string;
  instruction: string;
  targetType: 'param' | 'section' | 'volume_multiplier' | 'section_shape';
  targetKey?: string;
  targetValue: number;
  tolerance: number;
  unit?: string;
  hint?: string;
}
