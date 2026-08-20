import {
  AIGeneratorRequest,
  AIGeneratorResponse,
  LessonAnalysis,
  GeneratedExperiment,
} from '../models/AIGenerator';
import { EXPERIMENT_REGISTRY } from '../models/ExperimentRegistry';
import { IntentAnalyzer } from './IntentAnalyzer';
import { ExperimentValidator } from './ExperimentValidator';

/**
 * Deterministic AI Generator service used as local fallback or standalone generator.
 * Analyzes teacher request intent and creates structured, validated math experiments.
 */
export class LocalAIGenerator {
  public static generate(req: AIGeneratorRequest): AIGeneratorResponse {
    // 1. Layer 1: Intent Analysis
    const intent = IntentAnalyzer.analyze(req);
    const reg = EXPERIMENT_REGISTRY[intent.experimentType] || EXPERIMENT_REGISTRY['cylinder'];
    const lessonTitle = req.lessonTitle || reg.titleVi;

    // 2. Generate Lesson Analysis
    const analysis: LessonAnalysis = {
      lessonTitle,
      grade: req.grade || 9,
      subject: req.subject || 'Toán',
      keyConcepts: [
        reg.titleVi,
        `Đối tượng: ${reg.objects.join(', ')}`,
        `Thành phần đo: ${reg.measurements.join(', ')}`,
      ],
      learningObjectives: [
        `Trực quan hóa ${reg.titleVi} trong không gian ${reg.dimension}.`,
        `Thực hành tương tác biến đổi tham số và quan sát các trường hợp: ${reg.requiredCases.slice(0, 3).join('; ')}.`,
        `Rút ra nhận xét kết luận toán học chuẩn xác.`,
      ],
      recommendedModelType: reg.type,
    };

    // 3. Build 3 distinct Experiments matching the exact intent criteria
    let rawExp1: any;
    let rawExp2: any;
    let rawExp3: any;

    if (reg.type === 'two_circles') {
      rawExp1 = {
        id: `exp-two-circles-1-${Date.now()}`,
        labId: 'two-circles-001',
        lessonId: `lop${req.grade}-vt-hai-duong-tron`,
        title: 'Khảo sát Vị trí tương đối của Hai đường tròn',
        description: 'Tương tác dịch chuyển tâm O\', thay đổi bán kính R, r và đo khoảng cách d = OO\' để phân loại 6 vị trí tương đối.',
        type: '2D Geometry',
        learningObjectives: ['Nhận biết 6 vị trí tương đối giữa hai đường tròn (O,R) và (O\',r).'],
        model: {
          type: 'two_circles',
          parameters: { r1: 5, r2: 3, d: 9 },
        },
        interaction: { allowRotate: false, allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Trường hợp ở ngoài nhau (d > R + r)',
            instruction: 'Kéo tâm O\' xa O sao cho d = 9 cm (với R = 5 cm, r = 3 cm).',
            action: { type: 'changeParameter', targetParam: 'd', value: 9 },
            expectedObservation: 'Khi d (9cm) > R + r (8cm), hai đường tròn không có điểm chung nào.',
            formula: { latex: 'd > R + r \\implies 0\\text{ giao điểm}', explanation: 'Hai đường tròn nằm ngoài nhau.' },
          },
          {
            id: 's2',
            order: 2,
            title: 'Trường hợp tiếp xúc ngoài (d = R + r)',
            instruction: 'Giảm khoảng cách d về đúng 8 cm.',
            action: { type: 'changeParameter', targetParam: 'd', value: 8 },
            expectedObservation: 'Khi d (8cm) = R + r (8cm), hai đường tròn tiếp xúc ngoài tại đúng 1 tiếp điểm T.',
            formula: { latex: 'd = R + r \\implies 1\\text{ tiếp điểm}', explanation: 'Tiếp xúc ngoài.' },
          },
          {
            id: 's3',
            order: 3,
            title: 'Trường hợp cắt nhau tại 2 điểm (|R - r| < d < R + r)',
            instruction: 'Di chuyển d về d = 5 cm.',
            action: { type: 'changeParameter', targetParam: 'd', value: 5 },
            expectedObservation: 'Hai đường tròn cắt nhau tại 2 giao điểm A, B. Đoạn nối tâm OO\' vuông góc dây chung AB.',
            formula: { latex: '|R - r| < d < R + r \\implies 2\\text{ giao điểm}', explanation: 'Cắt nhau tại A và B.' },
          },
        ],
      };

      rawExp2 = {
        id: `exp-two-circles-2-${Date.now()}`,
        labId: 'two-circles-001',
        lessonId: `lop${req.grade}-vt-hai-duong-tron`,
        title: 'Trường hợp Tiếp xúc trong & Nằm trong nhau',
        description: 'Đưa đường tròn nhỏ vào hẳn bên trong đường tròn lớn để khảo sát điều kiện d = |R - r| và d < |R - r|.',
        type: '2D Geometry',
        learningObjectives: ['Phân biệt tiếp xúc trong và nằm trong nhau dựa vào hiệu hai bán kính |R - r|.'],
        model: {
          type: 'two_circles',
          parameters: { r1: 5, r2: 3, d: 2 },
        },
        interaction: { allowRotate: false, allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Trường hợp tiếp xúc trong (d = |R - r|)',
            instruction: 'Chỉnh khoảng cách d = 2 cm (chính bằng R - r = 5 - 3 = 2 cm).',
            action: { type: 'changeParameter', targetParam: 'd', value: 2 },
            expectedObservation: 'Đường tròn (O\',r) nằm bên trong (O,R) và tiếp xúc tại 1 điểm duy nhất T.',
            formula: { latex: 'd = |R - r| \\implies 1\\text{ tiếp điểm}', explanation: 'Tiếp xúc trong.' },
          },
          {
            id: 's2',
            order: 2,
            title: 'Trường hợp đồng tâm (d = 0)',
            instruction: 'Đưa tâm O\' trùng hoàn toàn với tâm O (d = 0 cm).',
            action: { type: 'changeParameter', targetParam: 'd', value: 0 },
            expectedObservation: 'Hai đường tròn có chung tâm O, không có điểm chung.',
            formula: { latex: 'd = 0 \\implies \\text{Hai đường tròn đồng tâm}', explanation: 'Đồng tâm.' },
          },
        ],
      };

      rawExp3 = {
        id: `exp-two-circles-3-${Date.now()}`,
        labId: 'two-circles-001',
        lessonId: `lop${req.grade}-vt-hai-duong-tron`,
        title: 'Tổng kết & Luyện tập Nhận biết Vị trí tương đối',
        description: 'Thay đổi bán kính R, r bất kỳ và quan sát sự biến đổi tự động của khoảng cách OO\' cùng số giao điểm.',
        type: 'Parameter Experiment',
        learningObjectives: ['Tổng hợp và ghi nhớ điều kiện số giao điểm giữa hai đường tròn.'],
        model: {
          type: 'two_circles',
          parameters: { r1: 6, r2: 4, d: 7 },
        },
        interaction: { allowRotate: false, allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Thay đổi bán kính r1 = 6cm, r2 = 4cm',
            instruction: 'Chỉnh R1 = 6 cm, R2 = 4 cm và thử kéo d từ 0cm đến 12cm.',
            action: { type: 'changeParameter', targetParam: 'r1', value: 6 },
            expectedObservation: 'Giao điểm tự động cập nhật chính xác theo vị trí tương đối.',
          },
        ],
      };
    } else if (reg.type === 'line_circle') {
      rawExp1 = {
        id: `exp-line-circle-1-${Date.now()}`,
        labId: 'line-circle-001',
        lessonId: `lop${req.grade}-vt-line-circle`,
        title: 'Vị trí tương đối của Đường thẳng và Đường tròn',
        description: 'Thay đổi khoảng cách h từ tâm O tới đường thẳng d để phát hiện 3 vị trí tương đối.',
        type: '2D Geometry',
        learningObjectives: ['So sánh h với R để tìm số giao điểm.'],
        model: {
          type: 'line_circle',
          parameters: { r: 5, h: 7, angle: 0 },
        },
        interaction: { allowRotate: false, allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Trường hợp không giao nhau (h > R)',
            instruction: 'Đặt h = 7 cm (với R = 5 cm).',
            action: { type: 'changeParameter', targetParam: 'h', value: 7 },
            expectedObservation: 'Đường thẳng d không cắt đường tròn (0 giao điểm).',
            formula: { latex: 'h > R \\implies 0\\text{ điểm chung}', explanation: 'Không giao nhau.' },
          },
          {
            id: 's2',
            order: 2,
            title: 'Trường hợp tiếp xúc (h = R)',
            instruction: 'Kéo đường thẳng d chạm viền tròn h = 5 cm.',
            action: { type: 'changeParameter', targetParam: 'h', value: 5 },
            expectedObservation: 'Đường thẳng d tiếp xúc đường tròn tại tiếp điểm T, tiếp tuyến vuông góc bán kính OT.',
            formula: { latex: 'h = R \\implies 1\\text{ tiếp điểm } T', explanation: 'Tiếp xúc (Tiếp tuyến).' },
          },
          {
            id: 's3',
            order: 3,
            title: 'Trường hợp cắt nhau tại 2 điểm (h < R)',
            instruction: 'Chỉnh h = 3 cm.',
            action: { type: 'changeParameter', targetParam: 'h', value: 3 },
            expectedObservation: 'Đường thẳng d cắt đường tròn tại 2 điểm A, B. OH ⟂ AB tại trung điểm H.',
            formula: { latex: 'h < R \\implies 2\\text{ giao điểm } A, B', explanation: 'Cát tuyến.' },
          },
        ],
      };

      rawExp2 = rawExp1;
      rawExp3 = rawExp1;
    } else if (reg.type === 'algebra_identity') {
      rawExp1 = {
        id: `exp-identity-1-${Date.now()}`,
        labId: 'algebra-identity-001',
        lessonId: `lop${req.grade}-hang-dang-thuc`,
        title: `Xây dựng Hằng đẳng thức (a + b)² = a² + 2ab + b² thông qua diện tích`,
        description: `Mô phỏng cắt ghép diện tích hình chữ nhật và hình vuông để trực quan hóa hằng đẳng thức (a + b)² = a² + 2ab + b² theo đúng yêu cầu bài học.`,
        type: '2D Geometry',
        learningObjectives: [
          'Trực quan hóa diện tích hình vuông lớn cạnh (a + b).',
          'Chứng minh hình học: (a + b)² = a² + 2ab + b² bằng cách tổng hợp 4 vùng diện tích.',
        ],
        model: {
          type: 'algebra_identity',
          parameters: { a: 4, b: 3 },
        },
        interaction: { allowRotate: false, allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Khởi tạo hình vuông lớn cạnh (a + b)',
            instruction: 'Điều chỉnh cạnh a = 4 cm và cạnh b = 3 cm. Quan sát tổng độ dài cạnh là 7 cm.',
            action: { type: 'changeParameter', targetParam: 'a', value: 4 },
            expectedObservation: 'Hình vuông lớn có cạnh (a + b) = 7 cm, tổng diện tích S = (4 + 3)² = 49 cm².',
            formula: { latex: 'S = (a + b)^2 = 7^2 = 49', explanation: 'Diện tích hình vuông lớn ban đầu.' },
          },
          {
            id: 's2',
            order: 2,
            title: 'Phân chia thành 4 hình chữ nhật & hình vuông nhỏ',
            instruction: 'Quan sát 4 vùng diện tích phân màu: hình vuông xanh a², 2 hình chữ nhật vàng ab, và hình vuông lục b².',
            action: { type: 'changeParameter', targetParam: 'b', value: 3 },
            expectedObservation: 'Vùng 1 có diện tích a² = 16. Hai vùng chữ nhật có diện tích ab = 12 (tổng 2ab = 24). Vùng 4 có diện tích b² = 9.',
            formula: { latex: 'a^2 = 16, \\quad 2ab = 24, \\quad b^2 = 9', explanation: 'Diện tích từng vùng cấu thành.' },
          },
          {
            id: 's3',
            order: 3,
            title: 'Tổng hợp và chứng minh hằng đẳng thức',
            instruction: 'Cộng tổng diện tích 4 hình: 16 + 24 + 9 = 49 cm².',
            action: { type: 'compare' },
            expectedObservation: 'Tổng diện tích 4 hình nhỏ đúng bằng diện tích hình vuông lớn: (a + b)² = a² + 2ab + b².',
            formula: { latex: '(a + b)^2 = a^2 + 2ab + b^2', explanation: 'Hằng đẳng thức được chứng minh bằng diện tích hình học.' },
          },
        ],
      };
      rawExp2 = rawExp1;
      rawExp3 = rawExp1;
    } else if (reg.type === 'graph_parabola') {
      rawExp1 = {
        id: `exp-parabola-1-${Date.now()}`,
        labId: 'graph-parabola-001',
        lessonId: `lop${req.grade}-parabola`,
        title: `Khảo sát Đồ thị Hàm số & Hằng đẳng thức ${lessonTitle}`,
        description: `Thí nghiệm trực quan hóa hàm số bậc hai y = ax² và biến đổi hằng đẳng thức hình học liên quan.`,
        type: 'Graph Analysis',
        learningObjectives: ['Quan sát sự phụ thuộc của dạng parabol vào hệ số a.', 'Liên hệ biểu thức bậc hai với mô hình trực quan.'],
        model: {
          type: 'graph_parabola',
          parameters: { a: 1, b: 0, k: 0 },
        },
        interaction: { allowRotate: false, allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Quan sát đồ thị y = x² (a = 1)',
            instruction: 'Đặt hệ số a = 1 và quan sát bề lõm quay lên trên, đỉnh O(0,0).',
            action: { type: 'changeParameter', targetParam: 'a', value: 1 },
            expectedObservation: 'Đồ thị nhận trục Oy làm trục đối xứng, đi qua các điểm (1,1), (2,4).',
            formula: { latex: 'y = x^2 \\implies \\text{Bề lõm quay lên}', explanation: 'Parabol tiêu chuẩn với a > 0.' },
          },
          {
            id: 's2',
            order: 2,
            title: 'Biến đổi hệ số a (a > 0 và a < 0)',
            instruction: 'Thay đổi a = -1 để quan sát khi hệ số a âm.',
            action: { type: 'changeParameter', targetParam: 'a', value: -1 },
            expectedObservation: 'Khi a < 0 (a = -1), đồ thị lật ngược, bề lõm quay xuống dưới.',
            formula: { latex: 'a < 0 \\implies \\text{Bề lõm quay xuống}', explanation: 'Tính chất lật đồ thị khi a đổi dấu.' },
          },
        ],
      };
      rawExp2 = rawExp1;
      rawExp3 = rawExp1;
    } else {
      // Default / General Domain Experiment Generation
      const expTypeMap: Record<string, '3D Exploration' | '2D Geometry' | 'Graph Analysis' | 'Probability Simulation'> = {
        geometry3d: '3D Exploration',
        geometry2d: '2D Geometry',
        algebra: 'Graph Analysis',
        probability: 'Probability Simulation',
        statistics: 'Probability Simulation',
      };

      rawExp1 = {
        id: `exp-${reg.type}-1-${Date.now()}`,
        labId: `lab-${reg.type}-001`,
        lessonId: `lop${req.grade}-${reg.type}`,
        title: `Khảo sát trực quan ${lessonTitle}`,
        description: `Thí nghiệm tương tác giúp học sinh quan sát các yếu tố cấu tạo và tham số của ${lessonTitle} trong miền ${reg.domain}.`,
        type: expTypeMap[reg.domain] || '3D Exploration',
        learningObjectives: [`Nhận biết cấu tạo và kích thước đặc trưng của ${lessonTitle}.`],
        model: {
          type: reg.type,
          parameters: reg.defaultParams,
        },
        interaction: { allowRotate: reg.dimension === '3D', allowZoom: true, allowParameterChange: true },
        steps: [
          {
            id: 's1',
            order: 1,
            title: 'Quan sát tổng thể mô hình',
            instruction: 'Thay đổi các tham số tương tác để quan sát sự thay đổi.',
            action: { type: 'changeParameter' },
            expectedObservation: `${lessonTitle} được thể hiện trực quan với các tham số đo đạc chính xác.`,
          },
        ],
      };
      rawExp2 = rawExp1;
      rawExp3 = rawExp1;
    }

    // Run ExperimentValidator on generated raw candidate experiments with explicit intent checking
    const candidateRaw = [rawExp1, rawExp2, rawExp3];
    const validatedExperiments: GeneratedExperiment[] = [];
    const allErrors: string[] = [];

    for (const rawExp of candidateRaw) {
      const vResult = ExperimentValidator.validate(rawExp, intent);
      if (vResult.isValid && vResult.sanitizedExperiment) {
        validatedExperiments.push(vResult.sanitizedExperiment);
      } else {
        allErrors.push(...vResult.errors);
      }
    }

    return {
      success: validatedExperiments.length > 0,
      intent,
      analysis,
      experiments: validatedExperiments,
      errors: allErrors.length > 0 ? allErrors : undefined,
    };
  }
}

