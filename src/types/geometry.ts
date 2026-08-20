export type VisualizationType = '3d' | 'graph' | 'geometry2d' | 'probability' | 'statistics';

export type ModelType =
  | 'cuboid'
  | 'cube'
  | 'cylinder'
  | 'cone'
  | 'sphere'
  | 'parabol'
  | 'prism'
  | 'prism_quad'
  | 'pyramid'
  | 'pyramid_triangular'
  | 'graph_linear'
  | 'graph_parabola'
  | 'probability_sim'
  | 'statistics_sim'
  | 'line_circle'
  | 'two_circles'
  | 'algebra_identity'
  | 'pythagorean_theorem'
  | 'congruent_triangles'
  | 'similar_triangles';

export interface ModelParams {
  a?: number; // Length / Side / Slope / Parabola factor
  b?: number; // Width / Y-intercept
  h?: number; // Height / Shift X / Distance to line
  r?: number; // Radius
  r1?: number; // Radius 1 (Circle 1)
  r2?: number; // Radius 2 (Circle 2)
  d?: number; // Distance between centers OO'
  angle?: number; // Angle theta for line in degrees
  k?: number; // Shift Y
  a1?: number; // Line 1 slope
  b1?: number; // Line 1 intercept
  a2?: number; // Line 2 slope
  b2?: number; // Line 2 intercept
  m?: number; // Secant slope
  n?: number; // Secant intercept
  trials?: number; // Number of simulation trials
  red?: number; // Marbles red
  blue?: number; // Marbles blue
  yellow?: number; // Marbles yellow
  [key: string]: any;
}

export interface DisplayOptions {
  showRadius: boolean;
  showHeight: boolean;
  showSlantHeight: boolean;
  showDimensions: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showWireframe: boolean;
  transparentSolid: boolean;
  solidOpacity: number;
  modelColor?: string;
  showDiagonals?: boolean;
  performanceMode?: boolean; // Tối ưu hiệu năng / giảm độ phân giải & khử răng cưa cho thiết bị cấu hình yếu
}

export interface GeometryModelConfig {
  id: string; // e.g., 'cuboid-001'
  lessonId: string; // e.g., 'lop9-hinh-trung'
  modelType: ModelType;
  title: string;
  shortDescription: string;
  grade: number; // 6, 7, 8, 9
  subject: string;
  visualizationType?: VisualizationType;
  defaultParams: ModelParams;
  paramBounds: {
    [key in keyof ModelParams]?: { min: number; max: number; step: number; unit: string; name: string };
  };
  formulas: {
    baseArea?: string;
    lateralArea?: string;
    totalArea?: string;
    volume?: string;
    slantHeight?: string;
    equation?: string;
  };
  educationalNotes: string[];
}

export interface LessonTopic {
  id: string;
  grade: number;
  title: string;
  chapter: string;
  description: string;
  labId: string;
  modelType: ModelType;
  visualizationType?: VisualizationType;
}

export type UserRole = 'student' | 'teacher';

export type LabTab = 'observe' | 'unfolding' | 'section' | 'liquid' | 'experiment';

export interface SectionPlaneParams {
  enabled: boolean;
  position: number;
  orientation: 'horizontal' | 'vertical' | 'custom' | 'diagonal_45' | 'apex_midpoint';
  showSectionFace: boolean;
  // Enhanced 3D Real Cross Section properties
  isCut?: boolean; // Thực hiện phép cắt khối thực
  separation?: number; // Độ dịch chuyển tách 2 phần (0 -> 10)
  extractSection?: boolean; // Tách thiết diện rời ra ngoài
  extractOffset?: number; // Khoảng cách đẩy thiết diện ra ngoài
  extractRotation?: number; // Góc xoay hướng về người quan sát (0 -> 1)
  pitch?: number; // Góc nghiêng trục X (-90 -> +90 độ)
  yaw?: number; // Góc xoay trục Y (-180 -> +180 độ)
  roll?: number; // Góc nghiêng trục Z (-90 -> +90 độ)
  showContour?: boolean; // Làm nổi bật đường viền giao tuyến
  showCap?: boolean; // Đậy kín mặt cắt cho 2 nửa khối
  showDimensions?: boolean; // Hiển thị số đo kích thước trên thiết diện
  activeModeStep?: 'plane' | 'cut' | 'separate' | 'section' | 'predict';
  isAnimating?: boolean; // Trạng thái đang chạy animation 7 bước
  animationProgress?: number; // 0 -> 1
}

export interface UnfoldingState {
  progress: number;
  isPlaying: boolean;
  speed: number;
}

export interface PredictionStep {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface GuidingQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface ConclusionStep {
  title: string;
  options: string[];
  correctAnswerIndex: number;
  summary: string;
}

export interface ExperimentStep {
  stepNumber: number;
  title: string;
  instruction: string;
  targetParam?: string;
  targetValue?: number;
  suggestedParams?: Partial<ModelParams>;
  observationInsight: string;
  formulaHighlight?: string;
  prediction?: PredictionStep;
}

export interface Experiment {
  id: string;
  labId: string;
  slug?: string;
  lessonId?: string;
  title: string;
  description: string;
  modelType: ModelType;
  visualizationType?: VisualizationType;
  engine?: '3d' | 'graph' | 'geometry2d' | 'probability' | 'statistics';
  steps: ExperimentStep[];
  guidingQuestions?: GuidingQuestion[];
  conclusionStep?: ConclusionStep;
  status?: 'published' | 'draft' | 'archived';
  // Configs for specific engines
  graphConfig?: {
    mode: 'linear_slope' | 'parallel_lines' | 'perpendicular_lines' | 'linear_intersection' | 'slope_triangle' | 'parabola_basic' | 'parabola_line' | 'parabola_shift';
    initialFunctions?: string[];
  };
  probabilityConfig?: {
    mode: 'coin' | 'dice' | 'two_dice' | 'marbles';
    defaultTrials?: number;
    withReplacement?: boolean;
  };
  statisticsConfig?: {
    mode: 'basic_metrics' | 'outlier_effect' | 'compare_datasets';
    initialDataset?: number[];
    datasetB?: number[];
  };
}
