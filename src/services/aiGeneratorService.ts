import { AIGeneratorRequest, AIGeneratorResponse } from '../models/AIGenerator';
import { LocalAIGenerator } from './localAIGenerator';
import { ExperimentValidator } from './ExperimentValidator';
import { IntentAnalyzer } from './IntentAnalyzer';

export class AIGeneratorService {
  /**
   * Generates interactive experiments from lesson content.
   * Calls the server endpoint /api/generate-experiment if available,
   * otherwise falls back seamlessly to LocalAIGenerator.
   */
  public static async generateExperiments(
    request: AIGeneratorRequest
  ): Promise<AIGeneratorResponse> {
    const localIntent = IntentAnalyzer.analyze(request);

    try {
      const response = await fetch('/api/generate-experiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (response.ok) {
        const data = await response.json();
        const effectiveIntent = data.intent || localIntent;

        if (data && data.experiments && Array.isArray(data.experiments)) {
          // Validate server-returned experiments through ExperimentValidator
          const validExps = [];
          for (const exp of data.experiments) {
            const vResult = ExperimentValidator.validate(exp, effectiveIntent);
            if (vResult.isValid && vResult.sanitizedExperiment) {
              validExps.push(vResult.sanitizedExperiment);
            }
          }

          if (validExps.length > 0) {
            return {
              success: true,
              intent: effectiveIntent,
              analysis: data.analysis || LocalAIGenerator.generate(request).analysis,
              experiments: validExps,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[AIGeneratorService] Server endpoint unavailable or error, using local generator:', err);
    }

    // Fallback to high-quality deterministic local generator
    return LocalAIGenerator.generate(request);
  }
}

