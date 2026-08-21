import { ModelType } from '../types/geometry';

export interface ExperimentSlugDefinition {
  slug: string;
  modelType: ModelType;
  titleVi: string;
  category: '3d-solid' | 'dynamic-2d' | 'probability' | 'algebra';
  grade: 6 | 7 | 8 | 9;
  curriculumLessonId?: string;
  defaultSectionPlane?: boolean;
  defaultUnfolding?: boolean;
  descriptionVi: string;
}

// Canonical Registry
export const SLUG_TO_EXPERIMENT_REGISTRY: Record<string, ExperimentSlugDefinition> = {
  // 1. Khối 3D Chính
  'hinh-hop-chu-nhat': {
    slug: 'hinh-hop-chu-nhat',
    modelType: 'cuboid',
    titleVi: 'Mô hình Hình Hộp Chữ Nhật 3D',
    category: '3d-solid',
    grade: 8,
    curriculumLessonId: 'toan8-hinh-hop-chu-nhat',
    descriptionVi: 'Quan sát các mặt, đỉnh, cạnh, đường chéo và mặt cắt hình hộp chữ nhật.',
  },
  'hinh-lap-phuong': {
    slug: 'hinh-lap-phuong',
    modelType: 'cube',
    titleVi: 'Mô hình Hình Lập Phương 3D',
    category: '3d-solid',
    grade: 8,
    curriculumLessonId: 'toan8-hinh-lap-phuong',
    descriptionVi: 'Hình lập phương 6 mặt vuông bằng nhau, khai triển hộp và các dạng mặt cắt đa giác.',
  },
  'hinh-tru': {
    slug: 'hinh-tru',
    modelType: 'cylinder',
    titleVi: 'Mô hình Hình Trụ 3D',
    category: '3d-solid',
    grade: 9,
    curriculumLessonId: 'toan9-hinh-tru',
    descriptionVi: 'Khám phá hình trụ, mặt cắt hình trụ, khai triển mặt xung quanh và thể tích.',
  },
  'hinh-non': {
    slug: 'hinh-non',
    modelType: 'cone',
    titleVi: 'Mô hình Hình Nón 3D',
    category: '3d-solid',
    grade: 9,
    curriculumLessonId: 'toan9-hinh-non',
    descriptionVi: 'Mô hình hình nón, đường sinh, mặt cắt nón và khai triển xung quanh.',
  },
  'hinh-cau': {
    slug: 'hinh-cau',
    modelType: 'sphere',
    titleVi: 'Mô hình Mặt Cầu & Khối Cầu 3D',
    category: '3d-solid',
    grade: 9,
    curriculumLessonId: 'toan9-hinh-cau',
    descriptionVi: 'Mô hình khối cầu, mặt cắt đi qua tâm, diện tích mặt cầu và thể tích khối cầu.',
  },
  'hinh-lang-tru-dung-tam-giac': {
    slug: 'hinh-lang-tru-dung-tam-giac',
    modelType: 'prism',
    titleVi: 'Hình Lăng Trụ Đứng Tam Giác',
    category: '3d-solid',
    grade: 7,
    curriculumLessonId: 'toan7-lang-tru-tam-giac',
    descriptionVi: '2 đáy là tam giác, các mặt bên là hình chữ nhật.',
  },
  'hinh-lang-tru-dung-tu-giac': {
    slug: 'hinh-lang-tru-dung-tu-giac',
    modelType: 'prism_quad',
    titleVi: 'Hình Lăng Trụ Đứng Tứ Giác',
    category: '3d-solid',
    grade: 7,
    curriculumLessonId: 'toan7-lang-tru-tu-giac',
    descriptionVi: '2 đáy là tứ giác, các mặt bên là hình chữ nhật vuông góc với đáy.',
  },
  'hinh-chop-tu-giac-deu': {
    slug: 'hinh-chop-tu-giac-deu',
    modelType: 'pyramid',
    titleVi: 'Hình Chóp Tứ Giác Đều 3D',
    category: '3d-solid',
    grade: 8,
    curriculumLessonId: 'toan8-chop-tu-giac-deu',
    descriptionVi: 'Đáy hình vuông, 4 mặt bên là các tam giác cân bằng nhau, trung đoạn và chiều cao.',
  },
  'hinh-chop-tam-giac-deu': {
    slug: 'hinh-chop-tam-giac-deu',
    modelType: 'pyramid_triangular',
    titleVi: 'Hình Chóp Tam Giác Đều 3D',
    category: '3d-solid',
    grade: 8,
    curriculumLessonId: 'toan8-chop-tam-giac-deu',
    descriptionVi: 'Đáy là tam giác đều, 3 mặt bên là tam giác cân bằng nhau.',
  },

  // 2. Hình học phẳng động (2D)
  'hai-tam-giac-bang-nhau': {
    slug: 'hai-tam-giac-bang-nhau',
    modelType: 'congruent_triangles',
    titleVi: 'Khám Phá Hai Tam Giác Bằng Nhau (c-c-c, c-g-c, g-c-g)',
    category: 'dynamic-2d',
    grade: 7,
    curriculumLessonId: 'toan7-hai-tam-giac-bang-nhau',
    descriptionVi: 'Kéo thả các đỉnh, chồng khít 2 tam giác để kiểm chứng các trường hợp bằng nhau.',
  },
  'tam-giac-dong-dang': {
    slug: 'tam-giac-dong-dang',
    modelType: 'similar_triangles',
    titleVi: 'Khám Phá Tam Giác Đồng Dạng',
    category: 'dynamic-2d',
    grade: 8,
    curriculumLessonId: 'toan8-tam-giac-dong-dang',
    descriptionVi: 'Thay đổi tỉ số đồng dạng k, kiểm tra các góc tương ứng và tỉ lệ cạnh.',
  },
  'dinh-ly-pythagore': {
    slug: 'dinh-ly-pythagore',
    modelType: 'pythagorean_theorem',
    titleVi: 'Mô Phỏng Trực Quan Định Lý Pythagore',
    category: 'dynamic-2d',
    grade: 8,
    curriculumLessonId: 'toan8-dinh-ly-pythagore',
    descriptionVi: 'Chứng minh diện tích hình vuông dựng trên cạnh huyền bằng tổng diện tích hai hình vuông dựng trên hai cạnh góc vuông.',
  },
  'duong-thang-duong-tron': {
    slug: 'duong-thang-duong-tron',
    modelType: 'line_circle',
    titleVi: 'Vị Trí Tương Đối Của Đường Thẳng Và Đường Tròn',
    category: 'dynamic-2d',
    grade: 9,
    curriculumLessonId: 'toan9-duong-thang-duong-tron',
    descriptionVi: 'Khảo sát khoảng cách d từ tâm đến đường thẳng và bán kính R (Cắt nhau, Tiếp xúc, Không giao nhau).',
  },
  'hai-duong-tron': {
    slug: 'hai-duong-tron',
    modelType: 'two_circles',
    titleVi: 'Vị Trí Tương Đối Của Hai Đường Tròn',
    category: 'dynamic-2d',
    grade: 9,
    curriculumLessonId: 'toan9-hai-duong-tron',
    descriptionVi: 'Khảo sát đoạn nối tâm d và hai bán kính R, r trong 5 vị trí tương đối.',
  },

  // 3. Xác suất & Đại số
  'xac-suat-dong-xu': {
    slug: 'xac-suat-dong-xu',
    modelType: 'probability_sim',
    titleVi: 'Thí Nghiệm Xác Suất: Tung Đồng Xu 3D',
    category: 'probability',
    grade: 8,
    curriculumLessonId: 'toan8-xac-suat-dong-xu',
    descriptionVi: 'Mô phỏng gieo đồng xu n lần, biểu đồ tần số tương đối hội tụ về xác suất lý thuyết 0.5.',
  },
  'xac-suat-xuc-xac': {
    slug: 'xac-suat-xuc-xac',
    modelType: 'probability_sim',
    titleVi: 'Thí Nghiệm Xác Suất: Gieo Xúc Xắc 3D',
    category: 'probability',
    grade: 8,
    curriculumLessonId: 'toan8-xac-suat-xuc-xac',
    descriptionVi: 'Gieo xúc xắc 6 mặt, theo dõi phân phối tần số các mặt từ 1 đến 6 chấm.',
  },
  'do-thi-bac-nhat': {
    slug: 'do-thi-bac-nhat',
    modelType: 'graph_linear',
    titleVi: 'Khảo Sát Đồ Thị Hàm Số Bậc Nhất y = ax + b',
    category: 'algebra',
    grade: 8,
    curriculumLessonId: 'toan8-ham-so-bac-nhat',
    descriptionVi: 'Trượt thanh điều khiển hệ số a và tung độ gốc b để thấy sự tịnh tiến và độ dốc đường thẳng.',
  },
  'do-thi-bac-hai': {
    slug: 'do-thi-bac-hai',
    modelType: 'graph_parabola',
    titleVi: 'Khảo Sát Đồ Thị Parabol y = ax²',
    category: 'algebra',
    grade: 9,
    curriculumLessonId: 'toan9-ham-so-bac-hai',
    descriptionVi: 'Thay đổi hệ số a để quan sát bề lõm, trục đối xứng và đỉnh của parabol.',
  },
};

// Aliases mapping Model IDs, Lab IDs, Model Types, and Lesson IDs to their canonical Experiment Slug
const SLUG_ALIASES: Record<string, string> = {
  // Model IDs from GEOMETRY_MODELS
  'cuboid-001': 'hinh-hop-chu-nhat',
  'cube-001': 'hinh-lap-phuong',
  'cylinder-001': 'hinh-tru',
  'cone-001': 'hinh-non',
  'sphere-001': 'hinh-cau',
  'prism-001': 'hinh-lang-tru-dung-tam-giac',
  'prism-quad-001': 'hinh-lang-tru-dung-tu-giac',
  'pyramid-001': 'hinh-chop-tu-giac-deu',
  'pyramid-triangular-001': 'hinh-chop-tam-giac-deu',
  'congruent-triangles-001': 'hai-tam-giac-bang-nhau',
  'similar-triangles-001': 'tam-giac-dong-dang',
  'pythagorean-theorem-001': 'dinh-ly-pythagore',
  'line-circle-001': 'duong-thang-duong-tron',
  'two-circles-001': 'hai-duong-tron',
  'graph-linear-001': 'do-thi-bac-nhat',
  'graph-parabola-001': 'do-thi-bac-hai',
  'prob-sim-001': 'xac-suat-dong-xu',
  'stat-sim-001': 'xac-suat-xuc-xac',

  // Raw Model Types
  'cuboid': 'hinh-hop-chu-nhat',
  'cube': 'hinh-lap-phuong',
  'cylinder': 'hinh-tru',
  'cone': 'hinh-non',
  'sphere': 'hinh-cau',
  'prism': 'hinh-lang-tru-dung-tam-giac',
  'prism_quad': 'hinh-lang-tru-dung-tu-giac',
  'pyramid': 'hinh-chop-tu-giac-deu',
  'pyramid_triangular': 'hinh-chop-tam-giac-deu',
  'congruent_triangles': 'hai-tam-giac-bang-nhau',
  'similar_triangles': 'tam-giac-dong-dang',
  'pythagorean_theorem': 'dinh-ly-pythagore',
  'line_circle': 'duong-thang-duong-tron',
  'two_circles': 'hai-duong-tron',
  'graph_linear': 'do-thi-bac-nhat',
  'graph_parabola': 'do-thi-bac-hai',
  'probability_sim': 'xac-suat-dong-xu',
  'stat_sim': 'xac-suat-xuc-xac',

  // Lab IDs from LocalLabDataAdapter
  'lab-cuboid-001': 'hinh-hop-chu-nhat',
  'lab-cube-001': 'hinh-lap-phuong',
  'lab-cylinder-001': 'hinh-tru',
  'lab-cylinder-unfold-001': 'hinh-tru',
  'lab-cylinder-volume-001': 'hinh-tru',
  'lab-cone-001': 'hinh-non',
  'lab-sphere-001': 'hinh-cau',
  'lab-prism-001': 'hinh-lang-tru-dung-tam-giac',
  'lab-prism-quad-001': 'hinh-lang-tru-dung-tu-giac',
  'lab-pyramid-001': 'hinh-chop-tu-giac-deu',
  'lab-pyramid-triangular-001': 'hinh-chop-tam-giac-deu',

  // Lesson IDs from lessons.ts
  'les-001': 'hinh-hop-chu-nhat',
  'les-002': 'hinh-lap-phuong',
  'les-003': 'hinh-tru',
  'les-004': 'hinh-non',
  'les-005': 'hinh-cau',
  'les-006': 'hinh-lang-tru-dung-tam-giac',
  'les-007': 'hinh-chop-tam-giac-deu',
  'les-008': 'do-thi-bac-nhat',
  'les-009': 'do-thi-bac-hai',
  'les-010': 'xac-suat-dong-xu',
  'les-011': 'xac-suat-xuc-xac',

  // Text-book lesson identifiers
  'lop8-hinh-hop-chu-nhat': 'hinh-hop-chu-nhat',
  'lop8-hinh-lap-phuong': 'hinh-lap-phuong',
  'lop9-hinh-tru': 'hinh-tru',
  'lop9-hinh-non': 'hinh-non',
  'lop9-hinh-cau': 'hinh-cau',
  'lop7-hinh-lang-tru-dung': 'hinh-lang-tru-dung-tam-giac',
  'lop7-lang-tru-tam-giac': 'hinh-lang-tru-dung-tam-giac',
  'lop7-lang-tru-tu-giac': 'hinh-lang-tru-dung-tu-giac',
  'lop8-hinh-chop-tu-giac-deu': 'hinh-chop-tu-giac-deu',
  'lop8-hinh-chop-tam-giac-deu': 'hinh-chop-tam-giac-deu',
  'toan8-hinh-hop-chu-nhat': 'hinh-hop-chu-nhat',
  'toan8-hinh-lap-phuong': 'hinh-lap-phuong',
  'toan9-hinh-tru': 'hinh-tru',
  'toan9-hinh-non': 'hinh-non',
  'toan9-hinh-cau': 'hinh-cau',
  'toan7-lang-tru-tam-giac': 'hinh-lang-tru-dung-tam-giac',
  'toan7-lang-tru-tu-giac': 'hinh-lang-tru-dung-tu-giac',
  'toan8-chop-tu-giac-deu': 'hinh-chop-tu-giac-deu',
  'toan8-chop-tam-giac-deu': 'hinh-chop-tam-giac-deu',
};

export function getExperimentBySlug(rawSlugOrId: string): ExperimentSlugDefinition | undefined {
  if (!rawSlugOrId) return undefined;
  const clean = rawSlugOrId
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\/[^/]+/, '')
    .replace(/^\/experiment\//, '')
    .replace(/^\/demo\//, '')
    .replace(/^\/share\/[^/]+\/?/, '')
    .replace(/^\//, '');

  // 1. Direct registry hit
  if (SLUG_TO_EXPERIMENT_REGISTRY[clean]) {
    return SLUG_TO_EXPERIMENT_REGISTRY[clean];
  }

  // 2. Alias lookup
  const canonicalSlug = SLUG_ALIASES[clean];
  if (canonicalSlug && SLUG_TO_EXPERIMENT_REGISTRY[canonicalSlug]) {
    return SLUG_TO_EXPERIMENT_REGISTRY[canonicalSlug];
  }

  // 3. Fallback: Search by modelType
  const matchByType = Object.values(SLUG_TO_EXPERIMENT_REGISTRY).find(
    (item) => item.modelType === clean || item.modelType.replace('_', '-') === clean
  );
  if (matchByType) return matchByType;

  // 4. Fuzzy keyword match
  if (clean.includes('cuboid') || clean.includes('hop-chu-nhat') || clean.includes('hop')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-hop-chu-nhat'];
  }
  if (clean.includes('cube') || clean.includes('lap-phuong')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-lap-phuong'];
  }
  if (clean.includes('cylinder') || clean.includes('tru')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-tru'];
  }
  if (clean.includes('cone') || clean.includes('non')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-non'];
  }
  if (clean.includes('sphere') || clean.includes('cau')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-cau'];
  }
  if (clean.includes('prism_quad') || clean.includes('lang-tru-tu-giac')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-lang-tru-dung-tu-giac'];
  }
  if (clean.includes('prism') || clean.includes('lang-tru')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-lang-tru-dung-tam-giac'];
  }
  if (clean.includes('pyramid_triangular') || clean.includes('chop-tam-giac')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-chop-tam-giac-deu'];
  }
  if (clean.includes('pyramid') || clean.includes('chop')) {
    return SLUG_TO_EXPERIMENT_REGISTRY['hinh-chop-tu-giac-deu'];
  }

  return undefined;
}

export function getSlugByModelType(modelType: ModelType): string {
  const entry = Object.entries(SLUG_TO_EXPERIMENT_REGISTRY).find(([_, item]) => item.modelType === modelType);
  return entry ? entry[0] : 'hinh-hop-chu-nhat';
}
