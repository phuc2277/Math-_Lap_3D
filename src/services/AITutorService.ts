/**
 * Client AI Tutor Service for Math Lab
 * Communicates with /api/ai/* endpoints without exposing any API keys on client.
 */

import {
  ExperimentAIContext,
  AITutorChatMessage,
  HintTier,
  HintTierLevel,
  TeacherGeneratedQuestion,
  TeacherLessonPlan,
} from '../types/aiTutor';

export class AITutorService {
  /**
   * 1. Multi-turn contextual chat
   */
  static async sendChatMessage(params: {
    message: string;
    history?: AITutorChatMessage[];
    context?: ExperimentAIContext;
  }): Promise<{ success: boolean; reply: string; provider?: string; error?: string }> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('[AITutorService] sendChatMessage failed:', err);
      return {
        success: false,
        reply: 'Hệ thống AI đang tạm thời bận hoặc kết nối mạng bị gián đoạn. Vui lòng thử lại!',
        error: err?.message || String(err),
      };
    }
  }

  /**
   * 2. Scaffolding Tiered Hint (1: Quan sát -> 2: Thao tác -> 3: Liên hệ -> 4: Đáp án)
   */
  static async getHint(params: {
    context?: ExperimentAIContext;
    level: HintTierLevel;
  }): Promise<{ success: boolean; hint?: HintTier; error?: string }> {
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('[AITutorService] getHint failed:', err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * 3. Socratic Step-by-Step Guide
   */
  static async getSocraticGuide(params: {
    context?: ExperimentAIContext;
    stepIndex: number;
    studentAnswer?: string;
  }): Promise<{
    success: boolean;
    question?: string;
    expectedAction?: string;
    feedback?: string;
    nextStepAvailable?: boolean;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/ai/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('[AITutorService] getSocraticGuide failed:', err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * 4. Teacher Question Generator
   */
  static async generateTeacherQuestions(params: {
    context?: ExperimentAIContext;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  }): Promise<{ success: boolean; questions?: TeacherGeneratedQuestion[]; error?: string }> {
    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('[AITutorService] generateTeacherQuestions failed:', err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * 5. Teacher 15-Minute Lesson Plan Generator
   */
  static async generateLessonPlan(params: {
    context?: ExperimentAIContext;
    durationMinutes?: number;
    focus?: string;
  }): Promise<{ success: boolean; plan?: TeacherLessonPlan; error?: string }> {
    try {
      const res = await fetch('/api/ai/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn('[AITutorService] generateLessonPlan failed:', err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
