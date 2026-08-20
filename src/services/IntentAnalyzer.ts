import { AIGeneratorRequest, ExperimentIntent } from '../models/AIGenerator';
import { EXPERIMENT_REGISTRY } from '../models/ExperimentRegistry';
import { ModelType } from '../types/geometry';

export class IntentAnalyzer {
  /**
   * Layer 1: Analyzes Teacher Request, Prompt, Selected Type, Selected Domain, and Lesson Content
   * to determine the strict ExperimentIntent.
   */
  public static analyze(req: AIGeneratorRequest): ExperimentIntent {
    const teacherText = `${req.teacherPrompt || ''} ${req.lessonTitle || ''} ${req.lessonContent || ''}`.toLowerCase();
    const domain = req.selectedDomain || '2d';

    // Priority 1: Explicit Teacher Model Selection in UI (if not 'auto')
    if (req.selectedModelType && req.selectedModelType !== 'auto' && EXPERIMENT_REGISTRY[req.selectedModelType]) {
      const reg = EXPERIMENT_REGISTRY[req.selectedModelType];
      return {
        experimentType: reg.type,
        domain: reg.domain,
        dimension: reg.dimension,
        objects: reg.objects,
        interactions: ['drag_components', 'change_parameters', 'toggle_measurements'],
        measurements: reg.measurements,
        requiredCases: reg.requiredCases,
        mode: 'teacher_specified',
        reasoning: `Giáo viên chỉ định trực tiếp mô hình: ${reg.titleVi}.`,
      };
    }

    // Priority 2: Keyword Analysis on Teacher Request Text
    let targetType: ModelType | null = null;

    if (
      teacherText.includes('hằng đẳng thức') ||
      teacherText.includes('nhân đơn thức') ||
      teacherText.includes('đơn thức với đa thức') ||
      teacherText.includes('a(b+c)') ||
      teacherText.includes('a(b + c)') ||
      teacherText.includes('(a+b)^2') ||
      teacherText.includes('(a-b)^2') ||
      teacherText.includes('a^2+2ab+b^2') ||
      teacherText.includes('a^2-b^2') ||
      teacherText.includes('bình phương của một tổng') ||
      teacherText.includes('diện tích hình chữ nhật') ||
      teacherText.includes('diện tích hình vuông')
    ) {
      targetType = 'algebra_identity';
    } else if (
      teacherText.includes('hai đường tròn') ||
      teacherText.includes('2 đường tròn') ||
      teacherText.includes('vị trí tương đối của hai đường tròn') ||
      teacherText.includes('two_circles')
    ) {
      targetType = 'two_circles';
    } else if (
      teacherText.includes('đường thẳng và đường tròn') ||
      teacherText.includes('line_circle') ||
      teacherText.includes('tiếp tuyến') ||
      teacherText.includes('cát tuyến')
    ) {
      targetType = 'line_circle';
    } else if (
      teacherText.includes('parabol') ||
      teacherText.includes('y = ax^2') ||
      teacherText.includes('y=ax^2') ||
      teacherText.includes('graph_parabola')
    ) {
      targetType = 'graph_parabola';
    } else if (
      teacherText.includes('hàm số bậc nhất') ||
      teacherText.includes('y = ax + b') ||
      teacherText.includes('y=ax+b') ||
      teacherText.includes('graph_linear') ||
      teacherText.includes('hệ số góc')
    ) {
      targetType = 'graph_linear';
    } else if (teacherText.includes('hình trụ') || teacherText.includes('cylinder')) {
      targetType = 'cylinder';
    } else if (teacherText.includes('hình nón') || teacherText.includes('cone')) {
      targetType = 'cone';
    } else if (teacherText.includes('hình cầu') || teacherText.includes('sphere') || teacherText.includes('mặt cầu')) {
      targetType = 'sphere';
    } else if (teacherText.includes('hình hộp') || teacherText.includes('cuboid')) {
      targetType = 'cuboid';
    } else if (teacherText.includes('hình lập phương') || teacherText.includes('cube')) {
      targetType = 'cube';
    } else if (teacherText.includes('lăng trụ') || teacherText.includes('prism')) {
      if (teacherText.includes('tứ giác')) {
        targetType = 'prism_quad';
      } else {
        targetType = 'prism';
      }
    } else if (teacherText.includes('hình chóp') || teacherText.includes('pyramid')) {
      if (teacherText.includes('tam giác')) {
        targetType = 'pyramid_triangular';
      } else {
        targetType = 'pyramid';
      }
    } else if (
      teacherText.includes('xác suất') ||
      teacherText.includes('đồng xu') ||
      teacherText.includes('xúc xắc') ||
      teacherText.includes('probability')
    ) {
      targetType = 'probability_sim';
    } else if (
      teacherText.includes('thống kê') ||
      teacherText.includes('trung vị') ||
      teacherText.includes('trung bình') ||
      teacherText.includes('statistics')
    ) {
      targetType = 'statistics_sim';
    }

    // Priority 3: Fallback based on user UI selectedDomain if no keywords matched
    if (!targetType) {
      if (domain === '2d') {
        targetType = 'two_circles';
      } else if (domain === 'algebra') {
        targetType = 'algebra_identity';
      } else if (domain === 'prob_stat') {
        targetType = 'probability_sim';
      } else {
        targetType = 'cylinder';
      }
    }

    const reg = EXPERIMENT_REGISTRY[targetType] || EXPERIMENT_REGISTRY['two_circles'];

    return {
      experimentType: reg.type,
      domain: reg.domain,
      dimension: reg.dimension,
      objects: reg.objects,
      interactions: ['drag_components', 'change_parameters', 'toggle_measurements'],
      measurements: reg.measurements,
      requiredCases: reg.requiredCases,
      mode: req.mode || (req.teacherPrompt ? 'teacher_specified' : 'ai_suggested'),
      reasoning: `Khởi tạo mô hình '${reg.titleVi}' (${reg.dimension} ${reg.domain}) phân tích trực tiếp từ yêu cầu của giáo viên: "${req.teacherPrompt || req.lessonTitle || 'Tạo thí nghiệm'}"`,
    };
  }
}
