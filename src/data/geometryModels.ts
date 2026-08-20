import { GeometryModelConfig } from '../types/geometry';

export const GEOMETRY_MODELS: GeometryModelConfig[] = [
  // ==========================================
  // 1. KHÔNG GIAN 3D
  // ==========================================
  {
    id: 'cuboid-001',
    lessonId: 'lop8-hinh-hop-chu-nhat',
    modelType: 'cuboid',
    visualizationType: '3d',
    title: 'Hình hộp chữ nhật',
    shortDescription: 'Mô hình 3D hình hộp chữ nhật với 3 kích thước: chiều dài (a), chiều rộng (b) và chiều cao (h).',
    grade: 8,
    subject: 'Hình học 3D',
    defaultParams: { a: 5, b: 3, h: 4 },
    paramBounds: {
      a: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều dài (a)' },
      b: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều rộng (b)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao (h)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = a \\cdot b',
      lateralArea: 'S_{\\text{xq}} = 2(a + b) \\cdot h',
      totalArea: 'S_{\\text{tp}} = 2(ab + ah + bh)',
      volume: 'V = a \\cdot b \\cdot h',
    },
    educationalNotes: [
      'Hình hộp chữ nhật có 6 mặt đều là hình chữ nhật.',
      'Các mặt đối diện bằng nhau.',
      'Thể tích thay đổi tỉ lệ thuận với từng kích thước chiều dài, chiều rộng, chiều cao.',
    ],
  },
  {
    id: 'cube-001',
    lessonId: 'lop8-hinh-lap-phuong',
    modelType: 'cube',
    visualizationType: '3d',
    title: 'Hình lập phương',
    shortDescription: 'Mô hình 3D hình lập phương đặc biệt với 6 mặt là các hình vuông bằng nhau có độ dài cạnh (a).',
    grade: 8,
    subject: 'Hình học 3D',
    defaultParams: { a: 4 },
    paramBounds: {
      a: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Cạnh (a)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = a^2',
      lateralArea: 'S_{\\text{xq}} = 4a^2',
      totalArea: 'S_{\\text{tp}} = 6a^2',
      volume: 'V = a^3',
    },
    educationalNotes: [
      'Hình lập phương là trường hợp đặc biệt của hình hộp chữ nhật khi a = b = h.',
      'Có 8 đỉnh, 12 cạnh bằng nhau và 6 mặt vuông bằng nhau.',
      'Khi cạnh tăng gấp 2 lần, thể tích tăng gấp 8 lần (2³ = 8).',
    ],
  },
  {
    id: 'cylinder-001',
    lessonId: 'lop9-hinh-tru',
    modelType: 'cylinder',
    visualizationType: '3d',
    title: 'Hình trụ tròn xoay',
    shortDescription: 'Mô hình 3D hình trụ tròn xoay tạo bởi đường sinh quay quanh một trục cố định, với bán kính đáy (r) và chiều cao (h).',
    grade: 9,
    subject: 'Hình học 3D',
    defaultParams: { r: 3, h: 5 },
    paramBounds: {
      r: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Bán kính đáy (r)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao (h)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = \\pi r^2',
      lateralArea: 'S_{\\text{xq}} = 2\\pi r h',
      totalArea: 'S_{\\text{tp}} = 2\\pi r h + 2\\pi r^2 = 2\\pi r(h + r)',
      volume: 'V = \\pi r^2 h',
    },
    educationalNotes: [
      'Hai đáy là hai hình tròn bằng nhau nằm trên hai mặt phẳng song song.',
      'Khi tăng bán kính r gấp 2 lần (h giữ nguyên), thể tích V tăng gấp 4 lần.',
      'Khi tăng chiều cao h gấp 2 lần (r giữ nguyên), thể tích V tăng gấp 2 lần.',
    ],
  },
  {
    id: 'cone-001',
    lessonId: 'lop9-hinh-non',
    modelType: 'cone',
    visualizationType: '3d',
    title: 'Hình nón tròn xoay',
    shortDescription: 'Mô hình 3D hình nón tròn xoay với đỉnh S, mặt đáy hình tròn bán kính (r), chiều cao (h) và đường sinh (l).',
    grade: 9,
    subject: 'Hình học 3D',
    defaultParams: { r: 3, h: 4 },
    paramBounds: {
      r: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Bán kính đáy (r)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao (h)' },
    },
    formulas: {
      slantHeight: 'l = \\sqrt{r^2 + h^2}',
      baseArea: 'S_{\\text{day}} = \\pi r^2',
      lateralArea: 'S_{\\text{xq}} = \\pi r l',
      totalArea: 'S_{\\text{tp}} = \\pi r l + \\pi r^2 = \\pi r(l + r)',
      volume: 'V = \\frac{1}{3}\\pi r^2 h',
    },
    educationalNotes: [
      'Đường sinh l, bán kính r và chiều cao h tạo thành một tam giác vuông: l² = r² + h².',
      'Thể tích hình nón đúng bằng 1/3 thể tích hình trụ có cùng bán kính đáy và chiều cao.',
    ],
  },
  {
    id: 'sphere-001',
    lessonId: 'lop9-hinh-cau',
    modelType: 'sphere',
    visualizationType: '3d',
    title: 'Hình cầu',
    shortDescription: 'Mô hình 3D khối cầu hoàn chỉnh với tâm O và bán kính R.',
    grade: 9,
    subject: 'Hình học 3D',
    defaultParams: { r: 4 },
    paramBounds: {
      r: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Bán kính (R)' },
    },
    formulas: {
      totalArea: 'S = 4\\pi R^2',
      volume: 'V = \\frac{4}{3}\\pi R^3',
    },
    educationalNotes: [
      'Mọi điểm nằm trên mặt cầu đều cách tâm O một khoảng đúng bằng R.',
      'Khi bán kính R tăng gấp 2 lần, diện tích mặt cầu S tăng 4 lần và thể tích V tăng 8 lần.',
    ],
  },
  {
    id: 'prism-001',
    lessonId: 'lop7-hinh-lang-tru-dung',
    modelType: 'prism',
    visualizationType: '3d',
    title: 'Hình lăng trụ đứng tam giác',
    shortDescription: 'Mô hình 3D lăng trụ đứng với 2 đáy là tam giác bằng nhau và các mặt bên là hình chữ nhật.',
    grade: 7,
    subject: 'Hình học 3D',
    defaultParams: { a: 4, b: 3, h: 5 },
    paramBounds: {
      a: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Cạnh đáy (a)' },
      b: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Chiều sâu đáy (b)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao (h)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = \\frac{1}{2} a \\cdot b',
      lateralArea: 'S_{\\text{xq}} = C_{\\text{day}} \\cdot h',
      totalArea: 'S_{\\text{tp}} = S_{\\text{xq}} + 2S_{\\text{day}}',
      volume: 'V = S_{\\text{day}} \\cdot h',
    },
    educationalNotes: [
      'Hai đáy là hai tam giác bằng nhau nằm trên hai mặt phẳng song song.',
      'Các cạnh bên song song và bằng nhau có độ dài bằng chiều cao h.',
      'Các mặt bên là hình chữ nhật vuông góc với hai đáy.',
    ],
  },
  {
    id: 'prism-quad-001',
    lessonId: 'lop7-hinh-lang-tru-dung',
    modelType: 'prism_quad',
    visualizationType: '3d',
    title: 'Hình lăng trụ đứng tứ giác (đáy hình thang)',
    shortDescription: 'Mô hình 3D lăng trụ đứng có 2 đáy là hình thang cân bằng nhau và 4 mặt bên là hình chữ nhật.',
    grade: 7,
    subject: 'Hình học 3D',
    defaultParams: { a: 6, b: 3, d: 4, h: 5 },
    paramBounds: {
      a: { min: 2, max: 10, step: 0.5, unit: 'cm', name: 'Đáy lớn hình thang (a)' },
      b: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Đáy nhỏ hình thang (b)' },
      d: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Chiều cao hình thang (d)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao lăng trụ (h)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = \\frac{(a + b) \\cdot d}{2}',
      lateralArea: 'S_{\\text{xq}} = C_{\\text{day}} \\cdot h = (a + b + 2c) \\cdot h',
      totalArea: 'S_{\\text{tp}} = S_{\\text{xq}} + 2S_{\\text{day}}',
      volume: 'V = S_{\\text{day}} \\cdot h',
    },
    educationalNotes: [
      'Lăng trụ đứng tứ giác có 2 đáy là hai hình thang cân bằng nhau nằm trên hai mặt phẳng song song.',
      'Có 4 mặt bên là các hình chữ nhật vuông góc với mặt đáy.',
      'Diện tích đáy S_đáy = (a + b) × d / 2. Thể tích V = S_đáy × h.',
    ],
  },
  {
    id: 'pyramid-triangular-001',
    lessonId: 'lop8-hinh-chop-deu',
    modelType: 'pyramid_triangular',
    visualizationType: '3d',
    title: 'Hình chóp tam giác đều',
    shortDescription: 'Mô hình 3D hình chóp đều có đáy là tam giác đều và 3 mặt bên là các tam giác cân bằng nhau.',
    grade: 8,
    subject: 'Hình học 3D',
    defaultParams: { a: 4, h: 5 },
    paramBounds: {
      a: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Cạnh đáy tam giác đều (a)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao (h)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = \\frac{a^2 \\sqrt{3}}{4}',
      lateralArea: 'S_{\\text{xq}} = 3 \\cdot \\frac{1}{2} a \\cdot d',
      totalArea: 'S_{\\text{tp}} = S_{\\text{xq}} + S_{\\text{day}}',
      volume: 'V = \\frac{1}{3} S_{\\text{day}} \\cdot h',
    },
    educationalNotes: [
      'Đáy là tam giác đều, 3 mặt bên là các tam giác cân bằng nhau.',
      'Chân đường cao trùng với trọng tâm của tam giác đáy.',
      'Thể tích hình chóp V = 1/3 S_đáy × h.',
    ],
  },
  {
    id: 'pyramid-001',
    lessonId: 'lop8-hinh-chop-deu',
    modelType: 'pyramid',
    visualizationType: '3d',
    title: 'Hình chóp tứ giác đều',
    shortDescription: 'Mô hình 3D hình chóp đều có đáy là hình vuông và 4 mặt bên là các tam giác cân bằng nhau.',
    grade: 8,
    subject: 'Hình học 3D',
    defaultParams: { a: 4, b: 4, h: 5 },
    paramBounds: {
      a: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Cạnh đáy (a)' },
      b: { min: 1, max: 8, step: 0.5, unit: 'cm', name: 'Rộng đáy (b)' },
      h: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Chiều cao (h)' },
    },
    formulas: {
      baseArea: 'S_{\\text{day}} = a \\cdot b',
      lateralArea: 'S_{\\text{xq}} = 4 \\cdot \\frac{1}{2} a \\cdot d',
      totalArea: 'S_{\\text{tp}} = S_{\\text{xq}} + S_{\\text{day}}',
      volume: 'V = \\frac{1}{3} S_{\\text{day}} \\cdot h',
    },
    educationalNotes: [
      'Chân đường cao trùng với tâm của đáy.',
      'Thể tích hình chóp bằng 1/3 thể tích lăng trụ có cùng diện tích đáy và chiều cao.',
    ],
  },

  // ==========================================
  // 2. ĐỒ THỊ HÀM SỐ (GRAPH ENGINE)
  // ==========================================
  {
    id: 'graph-linear-001',
    lessonId: 'lop8-ham-so-bac-nhat',
    modelType: 'graph_linear',
    visualizationType: 'graph',
    title: 'Hàm số bậc nhất y = ax + b',
    shortDescription: 'Đồ thị đường thẳng tương tác. Khám phá ảnh hưởng của hệ số góc (a) và tung độ gốc (b).',
    grade: 8,
    subject: 'Đại số & Đồ thị (Lớp 8)',
    defaultParams: { a: 2, b: 1, a1: 2, b1: 1, a2: -1, b2: 3 },
    paramBounds: {
      a1: { min: -5, max: 5, step: 0.5, unit: '', name: 'Hệ số góc a' },
      b1: { min: -5, max: 5, step: 0.5, unit: '', name: 'Tung độ gốc b' },
      a2: { min: -5, max: 5, step: 0.5, unit: '', name: 'Hệ số góc a₂' },
      b2: { min: -5, max: 5, step: 0.5, unit: '', name: 'Tung độ gốc b₂' },
    },
    formulas: {
      equation: 'y = a x + b \\quad (a \\neq 0)',
    },
    educationalNotes: [
      'a > 0: Hàm số đồng biến (đường thẳng đi lên từ trái sang phải).',
      'a < 0: Hàm số nghịch biến (đường thẳng đi xuống từ trái sang phải).',
      'b là tung độ giao điểm của đường thẳng với trục tung Oy tại điểm (0, b).',
      'Chương trình GDPT 2018: Hàm số bậc nhất y = ax + b được học trong chương trình Toán Lớp 8.',
    ],
  },
  {
    id: 'graph-parabola-001',
    lessonId: 'lop9-ham-so-y-ax2',
    modelType: 'graph_parabola',
    visualizationType: 'graph',
    title: 'Parabol y = ax²',
    shortDescription: 'Đồ thị hàm số bậc hai y = ax². Khám phá bề lõm, đỉnh O(0,0) và tương quan với đường thẳng y = mx + n.',
    grade: 9,
    subject: 'Đại số & Đồ thị',
    defaultParams: { a: 1, m: 1, n: 2, h: 0, k: 0 },
    paramBounds: {
      a: { min: -3, max: 3, step: 0.25, unit: '', name: 'Hệ số a' },
      m: { min: -4, max: 4, step: 0.5, unit: '', name: 'Hệ số m (đường thẳng)' },
      n: { min: -5, max: 5, step: 0.5, unit: '', name: 'Hệ số n (tung độ gốc)' },
      h: { min: -4, max: 4, step: 0.5, unit: '', name: 'Tịnh tiến x (h)' },
      k: { min: -4, max: 4, step: 0.5, unit: '', name: 'Tịnh tiến y (k)' },
    },
    formulas: {
      equation: 'y = a x^2',
    },
    educationalNotes: [
      'a > 0: Bề lõm quay lên trên, O(0,0) là điểm thấp nhất.',
      'a < 0: Bề lõm quay xuống dưới, O(0,0) là điểm cao nhất.',
      'Số giao điểm với đường thẳng y = mx + n phụ thuộc vào dấu của biệt thức Δ = m² + 4an.',
    ],
  },

  // ==========================================
  // 3. XÁC SUẤT (PROBABILITY ENGINE)
  // ==========================================
  {
    id: 'prob-sim-001',
    lessonId: 'lop8-xac-suat-thuc-nghiem',
    modelType: 'probability_sim',
    visualizationType: 'probability',
    title: 'Phòng Thí nghiệm Xác suất Tương tác',
    shortDescription: 'Mô phỏng tung đồng xu, tung xúc xắc và rút bi để kiểm chứng Luật số lớn và Xác suất thực nghiệm.',
    grade: 8,
    subject: 'Xác suất & Thống kê',
    defaultParams: { trials: 100, red: 4, blue: 3, yellow: 3 },
    paramBounds: {
      trials: { min: 10, max: 10000, step: 100, unit: 'lần', name: 'Số lần thử nghiệm' },
      red: { min: 1, max: 10, step: 1, unit: 'viên', name: 'Bi Đỏ' },
      blue: { min: 1, max: 10, step: 1, unit: 'viên', name: 'Bi Xanh' },
      yellow: { min: 1, max: 10, step: 1, unit: 'viên', name: 'Bi Vàng' },
    },
    formulas: {
      equation: 'f = \\frac{k}{N}',
    },
    educationalNotes: [
      'Xác suất thực nghiệm là tỉ số giữa số lần sự kiện xảy ra và tổng số lần thử.',
      'Khi số lần thử N tiến đến vô cùng, tần suất thực nghiệm f hội tụ về Xác suất lý thuyết P.',
    ],
  },

  // ==========================================
  // 4. THỐNG KÊ (STATISTICS ENGINE)
  // ==========================================
  {
    id: 'stat-sim-001',
    lessonId: 'lop8-thong-ke-va-bieu-do',
    modelType: 'statistics_sim',
    visualizationType: 'statistics',
    title: 'Phòng Thí nghiệm Phân tích Thống kê',
    shortDescription: 'Nhập bộ dữ liệu để tính tự động Trung bình, Trung vị, Mốt, Khoảng biến thiên và phân tích điểm ngoại lai.',
    grade: 8,
    subject: 'Xác suất & Thống kê',
    defaultParams: { trials: 10 },
    paramBounds: {},
    formulas: {
      equation: '\\bar{x} = \\frac{\\sum x_i}{N}',
    },
    educationalNotes: [
      'Trung bình cộng phản ánh giá trị đại diện tổng quát nhưng dễ bị ảnh hưởng bởi điểm ngoại lai.',
      'Trung vị là giá trị chia tập dữ liệu thành 2 nửa bằng nhau và ít bị méo bởi giá trị cực đoan.',
    ],
  },

  // ==========================================
  // 5. HÌNH HỌC 2D (2D GEOMETRY EXPERIMENTS)
  // ==========================================
  {
    id: 'line-circle-001',
    lessonId: 'lop9-vt-duong-thang-duong-tron',
    modelType: 'line_circle',
    visualizationType: 'geometry2d',
    title: 'Vị trí tương đối của Đường thẳng và Đường tròn',
    shortDescription: 'Khám phá 3 vị trí tương đối giữa đường thẳng d và đường tròn (O, R) dựa vào khoảng cách h từ O đến d.',
    grade: 9,
    subject: 'Hình học 2D',
    defaultParams: { r: 5, h: 4, angle: 0 },
    paramBounds: {
      r: { min: 2, max: 8, step: 0.5, unit: 'cm', name: 'Bán kính (R)' },
      h: { min: 0, max: 10, step: 0.1, unit: 'cm', name: 'Khoảng cách (h)' },
      angle: { min: 0, max: 180, step: 5, unit: '°', name: 'Góc nghiêng (θ)' },
    },
    formulas: {
      equation: 'h = d(O, d)',
    },
    educationalNotes: [
      'Đoạn vuông góc OH ⟂ d tại H có độ dài OH = h.',
      'h > R: Đường thẳng và đường tròn không có điểm chung.',
      'h = R: Đường thẳng d tiếp xúc với đường tròn tại tiếp điểm T, OT ⟂ d.',
      'h < R: Đường thẳng d cắt đường tròn tại 2 giao điểm A, B; OH ⟂ AB tại trung điểm H.',
    ],
  },
  {
    id: 'two-circles-001',
    lessonId: 'lop9-vt-hai-duong-tron',
    modelType: 'two_circles',
    visualizationType: 'geometry2d',
    title: 'Vị trí tương đối của Hai đường tròn',
    shortDescription: 'Khám phá 6 vị trí tương đối giữa hai đường tròn dựa vào khoảng cách nối tâm d = OO\' và hai bán kính R, r.',
    grade: 9,
    subject: 'Hình học 2D',
    defaultParams: { r1: 5, r2: 3, d: 6 },
    paramBounds: {
      r1: { min: 2, max: 8, step: 0.5, unit: 'cm', name: 'Bán kính (R)' },
      r2: { min: 1, max: 6, step: 0.5, unit: 'cm', name: 'Bán kính (r)' },
      d: { min: 0, max: 12, step: 0.1, unit: 'cm', name: 'Khoảng cách OO\' (d)' },
    },
    formulas: {
      equation: 'd = OO\'',
    },
    educationalNotes: [
      'd > R + r: Ở ngoài nhau (0 điểm chung).',
      'd = R + r: Tiếp xúc ngoài (1 tiếp điểm T).',
      '|R - r| < d < R + r: Cắt nhau tại 2 điểm A, B (Dây chung AB ⟂ OO\').',
      'd = |R - r|: Tiếp xúc trong (1 tiếp điểm T).',
      'd < |R - r|: Nằm trong nhau (0 điểm chung).',
      'd = 0: Đồng tâm (R ≠ r) hoặc Trùng nhau (R = r).',
    ],
  },

  // ==========================================
  // 6. HẰNG ĐẲNG THỨC ĐẠI SỐ (ALGEBRA IDENTITY)
  // ==========================================
  {
    id: 'algebra-identity-001',
    lessonId: 'lop8-nhan-don-thuc-da-thuc',
    modelType: 'algebra_identity',
    visualizationType: 'geometry2d',
    title: 'Nhân đơn thức với đa thức a(b + c) & Hằng đẳng thức',
    shortDescription: 'Mô phỏng phân tích diện tích hình chữ nhật a(b + c) = ab + ac, (a + b)² và (a + b)(c + d) theo mô hình hình học.',
    grade: 8,
    subject: 'Đại số & Hình học',
    defaultParams: { a: 4, b: 5, c: 8, d: 0 },
    paramBounds: {
      a: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Đơn thức (a)' },
      b: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Hạng tử 1 (b)' },
      c: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Hạng tử 2 (c)' },
      d: { min: 0, max: 8, step: 0.5, unit: 'cm', name: 'Hạng tử 3 (d)' },
    },
    formulas: {
      equation: 'a(b + c) = ab + ac',
    },
    educationalNotes: [
      'Hình chữ nhật lớn có chiều cao a và độ dài đáy (b + c) có diện tích tổng S = a(b + c).',
      'Phân chia đáy thành 2 đoạn b và c tương ứng với 2 hình chữ nhật con có diện tích S₁ = ab và S₂ = ac.',
      'Tổng diện tích các mảnh ghép không đổi: a(b + c) = ab + ac (Quy tắc nhân đơn thức với đa thức).',
    ],
  },

  // ==========================================
  // 7. ĐỊNH LÝ PYTHAGORE (PYTHAGOREAN THEOREM)
  // ==========================================
  {
    id: 'pythagorean-theorem-001',
    lessonId: 'lop8-dinh-ly-pythagore',
    modelType: 'pythagorean_theorem',
    visualizationType: 'geometry2d',
    title: 'Khám phá và Xây dựng Định lý Pythagore',
    shortDescription: 'Trực quan hóa diện tích 3 hình vuông dựng trên 3 cạnh của tam giác vuông và thí nghiệm cắt ghép diện tích a² + b² = c².',
    grade: 8,
    subject: 'Hình học',
    defaultParams: { a: 3, b: 4 },
    paramBounds: {
      a: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Cạnh góc vuông a (BC)' },
      b: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Cạnh góc vuông b (AC)' },
    },
    formulas: {
      equation: 'a² + b² = c²',
    },
    educationalNotes: [
      'Trong tam giác vuông, góc C = 90°, cạnh huyền c đối diện góc vuông.',
      'Dựng 3 hình vuông trên 3 cạnh có diện tích lần lượt là a², b² và c².',
      'Tổng diện tích hai hình vuông nhỏ trên 2 cạnh góc vuông đúng bằng diện tích hình vuông lớn trên cạnh huyền: a² + b² = c².',
    ],
  },
  // ==========================================
  // 8. HAI TAM GIÁC BẰNG NHAU (CONGRUENT TRIANGLES)
  // ==========================================
  {
    id: 'congruent-triangles-001',
    lessonId: 'lop7-hai-tam-giac-bang-nhau',
    modelType: 'congruent_triangles',
    visualizationType: 'geometry2d',
    title: 'Hai tam giác bằng nhau',
    shortDescription: 'Thí nghiệm hình học động: kéo đỉnh, xoay, tịnh tiến, đối xứng và chồng khít hai tam giác △ABC và △A\'B\'C\'.',
    grade: 7,
    subject: 'Hình học',
    defaultParams: { a: 5, b: 6, c: 7 },
    paramBounds: {
      a: { min: 1, max: 10, step: 0.5, unit: 'cm', name: 'Cạnh a' },
    },
    formulas: {
      equation: '△ABC = △A\'B\'C\'',
    },
    educationalNotes: [
      'Hai tam giác bằng nhau là hai tam giác có các cạnh tương ứng bằng nhau và các góc tương ứng bằng nhau.',
      'Các phép dời hình (tịnh tiến, quay, đối xứng) bảo toàn độ dài và góc, cho phép chồng khít hai tam giác bằng nhau.',
      'Ba trường hợp bằng nhau cơ bản: C-C-C, C-G-C, G-C-G.',
    ],
  },
  // ==========================================
  // 9. TAM GIÁC ĐỒNG DẠNG VÀ HÌNH ĐỒNG DẠNG (SIMILAR SHAPES)
  // ==========================================
  {
    id: 'similar-triangles-001',
    lessonId: 'lop8-tam-giac-dong-dang',
    modelType: 'similar_triangles',
    visualizationType: 'geometry2d',
    title: 'Tam giác đồng dạng và Hình đồng dạng',
    shortDescription: 'Khám phá sự đồng dạng qua: phóng to/thu nhỏ, đo góc & tỉ số cạnh, quan sát diện tích k², các trường hợp G-G, C-C-C, C-G-C và hình vuông, hình chữ nhật, hình tròn.',
    grade: 8,
    subject: 'Hình học',
    defaultParams: { k: 1.5, a: 6, b: 7, c: 8 },
    paramBounds: {
      k: { min: 0.25, max: 3.5, step: 0.05, unit: '', name: 'Tỉ số đồng dạng k' },
    },
    formulas: {
      equation: '△ABC ∼ △A\'B\'C\' (A\'B\'/AB = B\'C\'/BC = C\'A\'/CA = k, S\'/S = k²)',
    },
    educationalNotes: [
      'Hai tam giác đồng dạng có các góc tương ứng bằng nhau và các cạnh tương ứng tỉ lệ: A\'B\'/AB = B\'C\'/BC = C\'A\'/CA = k.',
      'Tỉ số diện tích của hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng: S\'/S = k².',
      'Ba trường hợp đồng dạng: C-C-C (3 cặp cạnh tỉ lệ), C-G-C (2 cặp cạnh tỉ lệ & góc xen giữa bằng nhau), G-G (2 cặp góc bằng nhau).',
      'Mọi hình vuông và mọi hình tròn đều đồng dạng với nhau.',
    ],
  },
];

export const getModelById = (id: string): GeometryModelConfig | undefined => {
  if (!id) return GEOMETRY_MODELS[0];

  const exact = GEOMETRY_MODELS.find((m) => m.id === id);
  if (exact) return exact;

  // Fuzzy match for dynamic generated labIds / experiment types
  const lower = id.toLowerCase();
  if (lower.includes('similar') || lower.includes('tam-giac-dong-dang') || lower.includes('dong-dang')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'similar_triangles');
  }
  if (lower.includes('congruent') || lower.includes('tam-giac-bang-nhau') || lower.includes('bang-nhau')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'congruent_triangles');
  }
  if (lower.includes('pythagor') || lower.includes('dinh-ly-pythagore') || lower.includes('pythagore')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'pythagorean_theorem');
  }
  if (lower.includes('identity') || lower.includes('algebra')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'algebra_identity');
  }
  if (lower.includes('two_circles') || lower.includes('two-circles')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'two_circles');
  }
  if (lower.includes('line_circle') || lower.includes('line-circle')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'line_circle');
  }
  if (lower.includes('parabola')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'graph_parabola');
  }
  if (lower.includes('linear')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'graph_linear');
  }
  if (lower.includes('prob')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'probability_sim');
  }
  if (lower.includes('stat')) {
    return GEOMETRY_MODELS.find((m) => m.modelType === 'statistics_sim');
  }

  return GEOMETRY_MODELS.find((m) => lower.includes(m.modelType)) || GEOMETRY_MODELS[0];
};
