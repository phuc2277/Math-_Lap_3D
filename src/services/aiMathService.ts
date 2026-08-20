/**
 * AI Math & Geometry Service
 * Client interface to full-stack Gemini 3.1 Pro backend endpoints
 */

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  thinking?: string;
  sourceContext?: string;
}

export interface AIGSPSketchResponse {
  success: boolean;
  sketch?: {
    points: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
      color: string;
      size: number;
      pinned?: boolean;
    }>;
    segments: Array<{
      id: string;
      name?: string;
      p1Id: string;
      p2Id: string;
      type: 'segment' | 'ray' | 'line';
      color: string;
      strokeWidth: number;
      lineStyle: 'solid' | 'dashed' | 'dotted';
    }>;
    circles: Array<{
      id: string;
      name?: string;
      centerId: string;
      radiusPointId?: string;
      radius?: number;
      color: string;
      strokeWidth: number;
      lineStyle: 'solid' | 'dashed';
    }>;
    polygons?: Array<{
      id: string;
      pointIds: string[];
      color: string;
      opacity: number;
    }>;
    measurements?: Array<{
      id: string;
      type: 'distance' | 'angle' | 'area' | 'perimeter' | 'radius' | 'slope';
      targetIds: string[];
      label: string;
      value: number;
      unit: string;
      x: number;
      y: number;
    }>;
  };
  explanation?: string;
  error?: string;
}

export class AIMathService {
  /**
   * Chat with Math AI Tutor (Gemini 3.1 Pro Preview with High Thinking)
   */
  static async sendChatMessage(params: {
    message: string;
    history?: AIChatMessage[];
    context?: {
      topic?: string;
      grade?: number;
      domain?: string;
      currentLab?: string;
      currentMode?: string;
    };
  }): Promise<{ success: boolean; reply: string; thinking?: string; error?: string }> {
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[AIMathService] sendChatMessage failed:', err);
      return {
        success: false,
        reply: 'Hệ thống AI đang tạm thời bận hoặc kết nối mạng bị gián đoạn. Vui lòng thử lại!',
        error: err?.message || String(err),
      };
    }
  }

  /**
   * Generate GSP Sketch objects from natural language prompt
   */
  static async generateGSPSketch(prompt: string): Promise<AIGSPSketchResponse> {
    try {
      const res = await fetch('/api/generate-gsp-sketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[AIMathService] generateGSPSketch failed:', err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * Convert natural language prompt to GeoGebra script
   */
  static async convertToGeoGebraScript(userPrompt: string): Promise<{ success: boolean; script?: string; error?: string }> {
    try {
      const res = await fetch('/api/convert-vietnamese-ggb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[AIMathService] convertToGeoGebraScript failed:', err);
      return {
        success: false,
        error: err?.message || String(err),
      };
    }
  }
}
