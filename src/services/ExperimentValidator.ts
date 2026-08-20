import {
  GeneratedExperiment,
  ExperimentIntent,
  WHITELISTED_MODEL_TYPES,
  WHITELISTED_ACTION_TYPES,
  WhitelistedActionType,
} from '../models/AIGenerator';
import { EXPERIMENT_REGISTRY } from '../models/ExperimentRegistry';
import { ModelType } from '../types/geometry';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedExperiment?: GeneratedExperiment;
  warningNotice?: string;
}

export class ExperimentValidator {
  /**
   * Sanitizes string inputs to prevent HTML/XSS/Code execution attacks.
   */
  private static sanitizeText(text: string): string {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .replace(/javascript:/gi, '')
      .replace(/eval\s*\(/gi, '')
      .trim();
  }

  /**
   * Validates a single GeneratedExperiment object against Stage 4 & Intent Criteria.
   */
  public static validate(raw: any, intent?: ExperimentIntent): ValidationResult {
    const errors: string[] = [];
    let warningNotice: string | undefined = undefined;

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, errors: ['Cấu hình experiment không phải là một Object hợp lệ.'] };
    }

    // 1. Validate & Sanitize Basic Fields
    const title = this.sanitizeText(raw.title || '');
    if (!title) {
      errors.push('Thiếu tiêu đề bài thí nghiệm (title).');
    }

    const description = this.sanitizeText(raw.description || '');

    // 2. Validate & Enforce Intent Alignment
    let rawModelType = raw.model?.type || raw.modelType;

    // Enforce Intent if Intent is specified (Teacher Request Highest Authority)
    if (intent && intent.experimentType) {
      if (rawModelType !== intent.experimentType) {
        warningNotice = `⚠️ AI từng đề xuất '${rawModelType || 'chưa rõ'}' nhưng đã bị Validator sửa lại thành '${intent.experimentType}' để tuân thủ đúng yêu cầu giáo viên.`;
        rawModelType = intent.experimentType;
      }
    }

    if (!rawModelType || !WHITELISTED_MODEL_TYPES.includes(rawModelType as ModelType)) {
      errors.push(
        `Mô hình '${rawModelType || 'không xác định'}' chưa được hỗ trợ. Chỉ chấp nhận các mô hình: ${WHITELISTED_MODEL_TYPES.join(', ')}.`
      );
    }

    const validatedModelType: ModelType = WHITELISTED_MODEL_TYPES.includes(rawModelType)
      ? (rawModelType as ModelType)
      : intent?.experimentType || 'cylinder';

    // 3. Sanitize Model Parameters with default registry fallbacks
    const rawParams = raw.model?.parameters || raw.parameters || {};
    const registryDefaults = EXPERIMENT_REGISTRY[validatedModelType]?.defaultParams || {};
    const sanitizedParams: Record<string, number> = { ...registryDefaults };

    for (const [key, val] of Object.entries(rawParams)) {
      const numVal = Number(val);
      if (!isNaN(numVal) && isFinite(numVal)) {
        sanitizedParams[key] = Math.max(0, Math.min(100, numVal));
      }
    }

    // 4. Validate & Sanitize Steps
    const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
    if (rawSteps.length === 0) {
      errors.push('Thí nghiệm phải chứa ít nhất 1 bước thực hành (steps).');
    }

    const sanitizedSteps = rawSteps.map((step: any, index: number) => {
      const stepOrder = step.order || index + 1;
      const stepTitle = this.sanitizeText(step.title || `Bước ${stepOrder}`);
      const stepInstruction = this.sanitizeText(step.instruction || '');
      const expectedObservation = this.sanitizeText(step.expectedObservation || '');

      // Check Whitelisted Action
      const rawActionType = step.action?.type || step.action || 'observe';
      let actionType: WhitelistedActionType = 'observe';

      if (!WHITELISTED_ACTION_TYPES.includes(rawActionType as WhitelistedActionType)) {
        errors.push(
          `Bước ${stepOrder}: Hành động '${rawActionType}' không được hỗ trợ. Chỉ cho phép: ${WHITELISTED_ACTION_TYPES.join(', ')}.`
        );
      } else {
        actionType = rawActionType as WhitelistedActionType;
      }

      return {
        id: step.id || `step-${index + 1}`,
        order: stepOrder,
        title: stepTitle,
        instruction: stepInstruction,
        action: {
          type: actionType,
          targetParam: this.sanitizeText(step.action?.targetParam || ''),
          value: Number(step.action?.value) || undefined,
        },
        expectedObservation,
        modelState: step.modelState || undefined,
        formula: step.formula
          ? {
              latex: this.sanitizeText(step.formula.latex || ''),
              explanation: this.sanitizeText(step.formula.explanation || ''),
            }
          : undefined,
        hint: this.sanitizeText(step.hint || ''),
      };
    });

    const isValid = errors.length === 0;

    const experimentTypeCategory =
      EXPERIMENT_REGISTRY[validatedModelType]?.domain === 'geometry2d'
        ? '2D Geometry'
        : EXPERIMENT_REGISTRY[validatedModelType]?.domain === 'algebra'
        ? 'Graph Analysis'
        : EXPERIMENT_REGISTRY[validatedModelType]?.domain === 'probability'
        ? 'Probability Simulation'
        : '3D Exploration';

    const sanitizedExperiment: GeneratedExperiment = {
      id: raw.id || `exp-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      labId: raw.labId || `lab-${validatedModelType}-001`,
      lessonId: raw.lessonId || 'lop9-bai-hoc',
      title: title || EXPERIMENT_REGISTRY[validatedModelType]?.titleVi || 'Thí nghiệm Toán học',
      description,
      type: experimentTypeCategory as any,
      learningObjectives: Array.isArray(raw.learningObjectives)
        ? raw.learningObjectives.map((obj: string) => this.sanitizeText(obj))
        : ['Khám phá kiến thức trực quan'],
      model: {
        type: validatedModelType,
        parameters: sanitizedParams,
      },
      interaction: {
        allowRotate: raw.interaction?.allowRotate !== false,
        allowZoom: raw.interaction?.allowZoom !== false,
        allowParameterChange: raw.interaction?.allowParameterChange !== false,
      },
      steps: sanitizedSteps,
      status: 'draft',
      reviewState: 'pending',
    };

    return {
      isValid,
      errors,
      sanitizedExperiment: isValid ? sanitizedExperiment : undefined,
      warningNotice,
    };
  }
}

