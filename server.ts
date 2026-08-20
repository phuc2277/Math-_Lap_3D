import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { ExperimentValidator } from './src/services/ExperimentValidator.js';
import { LocalAIGenerator } from './src/services/localAIGenerator.js';
import { IntentAnalyzer } from './src/services/IntentAnalyzer.js';
import { AITutorBackend } from './src/server/AITutorBackend.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // ============================================================================
  // OpenAI & Multi-provider AI Tutor Routes for Math Lab
  // ============================================================================
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid message' });
      }
      const result = await AITutorBackend.handleChat({ message, history, context });
      return res.json(result);
    } catch (err: any) {
      console.warn('[API] /api/ai/chat error:', err?.message || err);
      return res.json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/ai/hint', async (req, res) => {
    try {
      const { context, level } = req.body;
      const targetLevel = (level >= 1 && level <= 4) ? level : 1;
      const result = await AITutorBackend.handleHint({ context, level: targetLevel });
      return res.json(result);
    } catch (err: any) {
      console.warn('[API] /api/ai/hint error:', err?.message || err);
      return res.json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/ai/guide', async (req, res) => {
    try {
      const { context, stepIndex, studentAnswer } = req.body;
      const result = await AITutorBackend.handleSocraticGuide({
        context,
        stepIndex: Number(stepIndex) || 0,
        studentAnswer,
      });
      return res.json(result);
    } catch (err: any) {
      console.warn('[API] /api/ai/guide error:', err?.message || err);
      return res.json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/ai/generate-questions', async (req, res) => {
    try {
      const { context, difficulty, count } = req.body;
      const result = await AITutorBackend.handleGenerateQuestions({ context, difficulty, count });
      return res.json(result);
    } catch (err: any) {
      console.warn('[API] /api/ai/generate-questions error:', err?.message || err);
      return res.json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post('/api/ai/generate-lesson-plan', async (req, res) => {
    try {
      const { context, durationMinutes, focus } = req.body;
      const result = await AITutorBackend.handleGenerateLessonPlan({
        context,
        durationMinutes: Number(durationMinutes) || 15,
        focus,
      });
      return res.json(result);
    } catch (err: any) {
      console.warn('[API] /api/ai/generate-lesson-plan error:', err?.message || err);
      return res.json({ success: false, error: err?.message || String(err) });
    }
  });

  // ============================================================================
  // API Route: AI Math & Geometry Assistant (Gemini 3.1 Pro with High Thinking)
  // ============================================================================
  app.post('/api/ai-chat', async (req, res) => {
    try {
      const { message, history, context } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid message' });
      }

      if (!ai) {
        return res.json({
          success: true,
          reply: `🤖 **Trợ lý Toán học Math Lab (Chế độ Cục bộ)**:\n\nBạn đang hỏi về: "${message}".\n\n*Gợi ý sư phạm:*\n- Trong hình học phẳng và không gian, hãy luôn bắt đầu từ việc vẽ hình chính xác, xác định các yếu tố giả thiết (điểm, góc vuông, song song, đồng quy).\n- Áp dụng các định lý cơ bản: Pitago, Thales, hệ thức lượng tam giác vuông, tính chất đường trung tuyến và góc nội tiếp.\n- Bạn có thể chuyển sang tab **GSP Sketchpad** hoặc **GeoGebra** để mô phỏng động trực quan!`,
        });
      }

      const systemInstruction = `Bạn là "MATH LAB AI" - Trợ lý Giáo sư Sư phạm Toán học & Hình học Cao cấp, tích hợp trong ứng dụng Math Lab 3D / GSP Sketchpad / GeoGebra.

Nhiệm vụ của bạn:
1. Giải đáp các câu hỏi Toán học (Đại số, Hình học phẳng 2D, Hình học không gian 3D, Lượng giác, Giải tích, Xác suất - Thống kê) từ lớp 6 đến lớp 12 và đại học.
2. Cung cấp lời giải chi tiết, chuẩn mực sư phạm, từng bước rõ ràng (Step-by-Step Reasoning), phân tích bản chất hình học.
3. Khi người dùng hỏi cách dựng hình, hãy hướng dẫn thao tác cụ thể trên GSP Sketchpad hoặc GeoGebra (ví dụ: dùng công cụ compa, phép quay, kẻ đường vuông góc, tính số đo góc).
4. Sử dụng công thức Toán học đẹp mắt bằng định dạng LaTeX (VD: $a^2 + b^2 = c^2$, $\\Delta ABC$, $\\widehat{BAC} = 90^\\circ$, $V = \\frac{1}{3}\\pi r^2 h$).
5. Khuyến khích tư duy logic, đặt câu hỏi gợi mở để học sinh tự khám phá kiến thức.
6. Luôn phản hồi bằng tiếng Việt thân thiện, chuẩn mực, truyền cảm hứng học Toán.`;

      let userContents = '';
      if (context && (context.topic || context.domain || context.grade)) {
        userContents += `[Ngữ cảnh học tập: Chủ đề = ${context.topic || 'Toán học'}, Lớp = ${context.grade || 'THCS/THPT'}, Miền = ${context.domain || 'Hình học'}]\n`;
      }
      if (history && Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-6).map((h) => `${h.role === 'user' ? 'Học sinh' : 'AI'}: ${h.content}`).join('\n');
        userContents += `[Lịch sử hội thoại trước đó]:\n${recentHistory}\n\n`;
      }
      userContents += `[Câu hỏi hiện tại của học sinh / giáo viên]:\n${message}`;

      const candidateModels = ['gemini-3.1-pro-preview', 'gemini-3.7-flash', 'gemini-flash-latest'];
      let responseText = '';

      for (const modelName of candidateModels) {
        try {
          const config: any = {
            systemInstruction,
            temperature: 0.2,
          };

          if (modelName === 'gemini-3.1-pro-preview') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: userContents,
            config,
          });

          if (response && response.text) {
            responseText = response.text.trim();
            break;
          }
        } catch (err: any) {
          console.warn(`[AI Chat] Model ${modelName} error:`, err?.message || err);
        }
      }

      if (!responseText) {
        return res.json({
          success: false,
          reply: 'Rất tiếc, AI tạm thời chưa thể phản hồi câu hỏi này. Vui lòng thử lại sau giây lát!',
        });
      }

      return res.json({
        success: true,
        reply: responseText,
      });
    } catch (error: any) {
      console.warn('[AI Chat] /api/ai-chat error:', error?.message || error);
      return res.json({ success: false, error: error?.message || String(error) });
    }
  });

  // ============================================================================
  // API Route: AI Natural Language to GSP Sketch Objects (Gemini 3.1 Pro High Thinking)
  // ============================================================================
  app.post('/api/generate-gsp-sketch', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid prompt' });
      }

      if (!ai) {
        // High quality fallback geometric presets for GSP
        return res.json({
          success: true,
          explanation: 'Bản vẽ tam giác vuông và đường cao được dựng bởi AI GSP Generator.',
          sketch: {
            points: [
              { id: 'p_a', name: 'A', x: 260, y: 160, color: '#38bdf8', size: 6 },
              { id: 'p_b', name: 'B', x: 260, y: 440, color: '#38bdf8', size: 6 },
              { id: 'p_c', name: 'C', x: 680, y: 440, color: '#38bdf8', size: 6 },
              { id: 'p_h', name: 'H', x: 335, y: 390, color: '#fbbf24', size: 5 },
            ],
            segments: [
              { id: 's_ab', p1Id: 'p_a', p2Id: 'p_b', type: 'segment', color: '#60a5fa', strokeWidth: 2, lineStyle: 'solid' },
              { id: 's_bc', p1Id: 'p_b', p2Id: 'p_c', type: 'segment', color: '#60a5fa', strokeWidth: 2, lineStyle: 'solid' },
              { id: 's_ca', p1Id: 'p_c', p2Id: 'p_a', type: 'segment', color: '#60a5fa', strokeWidth: 2, lineStyle: 'solid' },
              { id: 's_ah', p1Id: 'p_a', p2Id: 'p_h', type: 'segment', color: '#fbbf24', strokeWidth: 2, lineStyle: 'dashed' },
            ],
            circles: [],
            polygons: [{ id: 'poly_abc', pointIds: ['p_a', 'p_b', 'p_c'], color: '#3b82f6', opacity: 0.15 }],
            measurements: [
              { id: 'm_1', type: 'distance', targetIds: ['s_ab'], label: 'AB', value: 280, unit: 'px', x: 230, y: 300 },
              { id: 'm_2', type: 'distance', targetIds: ['s_bc'], label: 'BC', value: 420, unit: 'px', x: 470, y: 460 },
            ],
          },
        });
      }

      const systemInstruction = `Bạn là AI chuyên gia hình học phẳng GSP Sketchpad.
Nhiệm vụ: Chuyển đổi mô tả hình học tiếng Việt tự nhiên thành dữ liệu tọa độ hình học phẳng 2D chuẩn xác trong khung vẽ [Width: 960, Height: 580].
Tọa độ gốc (0,0) ở góc trên bên trái màn hình, trục X hướng sang phải [100..860], trục Y hướng xuống dưới [80..500].

Yêu cầu tọa độ:
- Phải tính toán tọa độ chính xác về mặt hình học (ví dụ: góc vuông thì vector tích vô hướng = 0, đường cao thì H là hình chiếu vuông góc, tâm đường tròn ngoại tiếp O cách đều 3 đỉnh, trung điểm M = (A+B)/2).
- Các điểm phải có khoảng cách hợp lý, nhìn rõ ràng, cân đối ở trung tâm khung vẽ (khoảng x: 250..700, y: 120..460).
- Tên điểm viết hoa: A, B, C, H, M, O, I, K, D, E...
- Màu sắc tươi sáng, tương thích nền tối (cyan: #38bdf8, amber: #fbbf24, emerald: #34d399, rose: #fb7185, purple: #c084fc).
- Trả về JSON hợp lệ theo đúng schema.`;

      const candidateModels = ['gemini-3.1-pro-preview', 'gemini-3.7-flash', 'gemini-flash-latest'];
      let jsonResult: any = null;

      for (const modelName of candidateModels) {
        try {
          const config: any = {
            systemInstruction,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                explanation: { type: Type.STRING, description: 'Giải thích ngắn gọn về cách dựng hình' },
                points: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      color: { type: Type.STRING },
                      size: { type: Type.NUMBER },
                    },
                    required: ['id', 'name', 'x', 'y', 'color', 'size'],
                  },
                },
                segments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      p1Id: { type: Type.STRING },
                      p2Id: { type: Type.STRING },
                      type: { type: Type.STRING },
                      color: { type: Type.STRING },
                      strokeWidth: { type: Type.NUMBER },
                      lineStyle: { type: Type.STRING },
                    },
                    required: ['id', 'p1Id', 'p2Id', 'type', 'color', 'strokeWidth', 'lineStyle'],
                  },
                },
                circles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      centerId: { type: Type.STRING },
                      radius: { type: Type.NUMBER },
                      color: { type: Type.STRING },
                      strokeWidth: { type: Type.NUMBER },
                      lineStyle: { type: Type.STRING },
                    },
                    required: ['id', 'centerId', 'radius', 'color', 'strokeWidth', 'lineStyle'],
                  },
                },
                polygons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      pointIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                      color: { type: Type.STRING },
                      opacity: { type: Type.NUMBER },
                    },
                    required: ['id', 'pointIds', 'color', 'opacity'],
                  },
                },
              },
              required: ['explanation', 'points', 'segments'],
            },
          };

          if (modelName === 'gemini-3.1-pro-preview') {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: `Hãy dựng bản vẽ GSP cho yêu cầu sau: "${prompt}"`,
            config,
          });

          if (response && response.text) {
            jsonResult = JSON.parse(response.text);
            break;
          }
        } catch (err: any) {
          console.warn(`[GSP AI] Model ${modelName} error:`, err?.message || err);
        }
      }

      if (jsonResult && jsonResult.points && jsonResult.points.length > 0) {
        return res.json({
          success: true,
          explanation: jsonResult.explanation,
          sketch: {
            points: jsonResult.points,
            segments: jsonResult.segments || [],
            circles: jsonResult.circles || [],
            polygons: jsonResult.polygons || [],
            measurements: [],
          },
        });
      }

      throw new Error('AI generation returned empty schema');
    } catch (error: any) {
      console.warn('[GSP AI] /api/generate-gsp-sketch error:', error?.message || error);
      return res.json({
        success: false,
        error: error?.message || String(error),
      });
    }
  });

  // API Route: AI Natural Language to GeoGebra Script (Vietnamese -> GGB)
  app.post('/api/convert-vietnamese-ggb', async (req, res) => {
    try {
      const { userPrompt } = req.body;
      if (!userPrompt || typeof userPrompt !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid userPrompt' });
      }

      if (!ai) {
        return res.json({ success: false, reason: 'no_api_key' });
      }

      const systemInstruction = `Bạn là một trợ lý AI chuyên gia về toán học và hình học động, có nhiệm vụ hỗ trợ giáo viên trung học cơ sở sử dụng phần mềm GeoGebra thông qua ngôn ngữ tự nhiên. 

Nhiệm vụ của bạn: Nhận câu lệnh tiếng Việt tự nhiên từ người dùng và chuyển đổi thành mã lệnh GeoGebra Script chuẩn (bằng tiếng Anh).

### QUY TẮC BẮT BUỘC:
1. CHỈ TRẢ VỀ MÃ LỆNH GEOGEBRA thuần túy. Tuyệt đối không kèm theo lời giải thích, không trò chuyện, không định dạng markdown (như \`\`\`javascript ... \`\`\`), chỉ xuất thẳng chuỗi lệnh.
2. Nếu có từ 2 lệnh trở lên, bắt buộc phải bọc chúng trong hàm Execute theo cấu trúc: Execute({"lệnh_1", "lệnh_2", ...})
3. Quy tắc đặt tên và cú pháp:
   - Tên điểm phải viết hoa (VD: A = (1, 2)).
   - Luôn sử dụng cú pháp tiếng Anh chuẩn của GeoGebra cho các hàm hình học.

### BẢNG ĐỐI CHIẾU LỆNH (MAPPING THCS):
- Vẽ điểm: A = (x, y) hoặc Point(x, y)
- Vẽ đoạn thẳng nối 2 điểm: Segment(A, B)
- Vẽ đường thẳng qua 2 điểm: Line(A, B)
- Vẽ tia: Ray(A, B)
- Vẽ đường tròn tâm A bán kính r: Circle(A, r)
- Vẽ đường tròn tâm A đi qua B: Circle(A, B)
- Vẽ tam giác, đa giác: Polygon(A, B, C)
- Tìm trung điểm: Midpoint(A, B)
- Tìm giao điểm: Intersect(object1, object2)
- Vẽ đường trung trực: PerpendicularBisector(A, B)
- Vẽ phân giác góc: AngularBisector(A, B, C) hoặc AngleBisector(A, B, C)
- Đồ thị hàm số / Hàm bậc nhất / Bậc hai: Nhập trực tiếp dạng phương trình (VD: y = 2x + 3, y = x^2, f(x) = ax^2 + bx + c)
- Xóa toàn bộ màn hình: Deleteall

### VÍ DỤ MẪU:
User: "Vẽ hai điểm A tọa độ 1 2 và B tọa độ 4 6"
Assistant: Execute({"A = (1, 2)", "B = (4, 6)"})

User: "Vẽ đường tròn tâm O gốc tọa độ bán kính 5"
Assistant: Execute({"O = (0, 0)", "c = Circle(O, 5)"})

User: "Vẽ đồ thị hàm số y bằng 2x bình phương"
Assistant: y = 2x^2

User: "Vẽ tam giác ABC với các đỉnh A(0,0), B(4,0), C(0,3)"
Assistant: Execute({"A = (0, 0)", "B = (4, 0)", "C = (0, 3)", "Polygon(A, B, C)"})

User: "Vẽ đường trung trực của đoạn thẳng AB"
Assistant: PerpendicularBisector(A, B)`;

      const candidateModels = ['gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
      let responseText = '';

      for (const modelName of candidateModels) {
        try {
          const config: any = {
            systemInstruction,
            temperature: 0.1,
          };

          if (modelName === 'gemini-3.1-pro-preview' || modelName.includes('3.6')) {
            config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: userPrompt,
            config,
          });
          if (response && response.text) {
            responseText = response.text.trim();
            break;
          }
        } catch (err: any) {
          console.warn(`[GGB AI] Model ${modelName} error:`, err?.message || err);
        }
      }

      if (!responseText) {
        return res.json({ success: false, reason: 'ai_empty' });
      }

      // Clean markdown formatting if any
      const cleanedCode = responseText
        .replace(/^```[a-z]*\n?/gi, '')
        .replace(/```$/g, '')
        .trim();

      return res.json({
        success: true,
        script: cleanedCode,
      });
    } catch (error: any) {
      console.warn('[GGB AI] /api/convert-vietnamese-ggb error:', error?.message || error);
      return res.json({ success: false, error: error?.message || String(error) });
    }
  });

  // API Route: AI Generate Experiments
  app.post('/api/generate-experiment', async (req, res) => {
    try {
      const { lessonContent, grade, subject, lessonTitle, goals, teacherPrompt, selectedModelType, selectedDomain, mode } = req.body;

      // Layer 1: Intent Analyzer
      const intent = IntentAnalyzer.analyze({
        lessonContent: lessonContent || '',
        grade: Number(grade) || 9,
        subject: subject || 'Toán',
        lessonTitle: lessonTitle || '',
        teacherPrompt: teacherPrompt || '',
        selectedModelType: selectedModelType || 'auto',
        selectedDomain: selectedDomain || '2d',
        mode: mode || 'teacher_specified',
        goals: goals || { visualize: true, exploreFormulas: true, interactiveExperiment: true, practice: false, review: false },
      });

      if (!ai) {
        // Fallback if no Gemini key configured
        const fallback = LocalAIGenerator.generate({
          lessonContent,
          grade: Number(grade) || 9,
          subject: subject || 'Toán',
          lessonTitle: lessonTitle || '',
          teacherPrompt: teacherPrompt || '',
          selectedModelType: selectedModelType || 'auto',
          selectedDomain: selectedDomain || '2d',
          mode: mode || 'teacher_specified',
          goals: goals || { visualize: true, exploreFormulas: true, interactiveExperiment: true, practice: false, review: false },
        });
        return res.json(fallback);
      }

      const prompt = `
Bạn là AI chuyên gia sư phạm Toán học cho ứng dụng MATH LAB.
Nhiệm vụ của bạn: Phân tích nội dung bài học và đề xuất các thí nghiệm tương tác CHÍNH XÁC THEO YÊU CẦU CỦA GIÁO VIÊN.

YÊU CẦU CỤ THỂ CỦA GIÁO VIÊN: "${teacherPrompt || lessonTitle || ''}"
Ý ĐỊNH MÔ HÌNH (INTENT MANDATE):
- Loại hình thí nghiệm chỉ định (experimentType): "${intent.experimentType}"
- Miền toán học (domain): "${intent.domain}"
- Miền không gian (dimension): "${intent.dimension}"
- Các đối tượng toán học bắt buộc: ${JSON.stringify(intent.objects)}
- Các chỉ số cần đo đạc: ${JSON.stringify(intent.measurements)}
- Các trường hợp bắt buộc khảo sát: ${JSON.stringify(intent.requiredCases)}

Nội dung bài học: "${lessonContent || lessonTitle || intent.experimentType}"
Lớp: ${grade || 9}
Môn: ${subject || 'Toán'}
Tên bài: ${lessonTitle || intent.experimentType}

QUY TẮC BẮT BUỘC (CRITICAL):
1. Tiêu đề (title), mô tả (description), và các bước thực hành (steps) của thí nghiệm BẮT BUỘC PHẢI THỂ HIỆN TRỰC TIẾP YÊU CẦU CỦA GIÁO VIÊN ("${teacherPrompt || lessonTitle}"). KHÔNG tạo tiêu đề hay các bước chung chung không khớp với yêu cầu!
2. Bạn BẮT BUỘC phải trả về "model.type": "${intent.experimentType}".
3. AI KHÔNG được tự tạo mesh 3D hay viết code JavaScript/Three.js.
4. AI CHỈ ĐƯỢC CHỌN hành động từ danh sách đăng ký: ["observe", "rotate", "zoom", "changeParameter", "showMeasurement", "hideMeasurement", "unfold", "fold", "section", "compare", "reset"].
5. Trả về định dạng JSON hợp lệ theo đúng cấu trúc yêu cầu.
`;

      const generateConfig = {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.OBJECT,
                properties: {
                  lessonTitle: { type: Type.STRING },
                  grade: { type: Type.INTEGER },
                  subject: { type: Type.STRING },
                  keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                  learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendedModelType: { type: Type.STRING },
                },
                required: ['lessonTitle', 'grade', 'subject', 'keyConcepts', 'learningObjectives', 'recommendedModelType'],
              },
              experiments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    labId: { type: Type.STRING },
                    lessonId: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    learningObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    model: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        parameters: {
                          type: Type.OBJECT,
                          properties: {
                            radius: { type: Type.NUMBER },
                            height: { type: Type.NUMBER },
                            width: { type: Type.NUMBER },
                            depth: { type: Type.NUMBER },
                            r1: { type: Type.NUMBER },
                            r2: { type: Type.NUMBER },
                            d: { type: Type.NUMBER },
                            r: { type: Type.NUMBER },
                            h: { type: Type.NUMBER },
                            a: { type: Type.NUMBER },
                            b: { type: Type.NUMBER },
                          },
                        },
                      },
                      required: ['type'],
                    },
                    interaction: {
                      type: Type.OBJECT,
                      properties: {
                        allowRotate: { type: Type.BOOLEAN },
                        allowZoom: { type: Type.BOOLEAN },
                        allowParameterChange: { type: Type.BOOLEAN },
                      },
                    },
                    steps: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          order: { type: Type.INTEGER },
                          title: { type: Type.STRING },
                          instruction: { type: Type.STRING },
                          action: {
                            type: Type.OBJECT,
                            properties: {
                              type: { type: Type.STRING },
                              targetParam: { type: Type.STRING },
                              value: { type: Type.NUMBER },
                            },
                            required: ['type'],
                          },
                          expectedObservation: { type: Type.STRING },
                        },
                        required: ['order', 'title', 'instruction', 'action', 'expectedObservation'],
                      },
                    },
                  },
                  required: ['id', 'title', 'description', 'type', 'learningObjectives', 'model', 'steps'],
                },
              },
            },
            required: ['analysis', 'experiments'],
          },
        },
      };

      let response: any = null;
      const candidateModels = ['gemini-3.1-pro-preview', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
      
      for (const modelName of candidateModels) {
        try {
          const configCopy: any = { ...generateConfig.config };
          if (modelName === 'gemini-3.1-pro-preview' || modelName.includes('3.6')) {
            configCopy.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
          }

          response = await ai.models.generateContent({
            model: modelName,
            contents: generateConfig.contents,
            config: configCopy,
          });
          if (response && response.text) break;
        } catch (err: any) {
          console.warn(`[API] Gemini model ${modelName} returned error, trying next fallback:`, err?.message || err);
        }
      }

      if (!response || !response.text) {
        throw new Error('All Gemini AI model candidates returned empty or were unavailable.');
      }

      const rawJson = response.text;
      const parsed = JSON.parse(rawJson || '{}');

      // Validate every returned experiment against intent
      const validExps = [];
      if (parsed.experiments && Array.isArray(parsed.experiments)) {
        for (const exp of parsed.experiments) {
          const vRes = ExperimentValidator.validate(exp, intent);
          if (vRes.isValid && vRes.sanitizedExperiment) {
            validExps.push(vRes.sanitizedExperiment);
          }
        }
      }

      if (validExps.length > 0) {
        return res.json({
          success: true,
          intent,
          analysis: parsed.analysis,
          experiments: validExps,
        });
      }

      // If Gemini returned something invalid, fallback to local generator
      const fallback = LocalAIGenerator.generate({
        lessonContent,
        grade: Number(grade) || 9,
        subject: subject || 'Toán',
        lessonTitle: lessonTitle || '',
        teacherPrompt: teacherPrompt || '',
        selectedModelType: selectedModelType || 'auto',
        selectedDomain: selectedDomain || '2d',
        mode: mode || 'teacher_specified',
        goals: goals || { visualize: true, exploreFormulas: true, interactiveExperiment: true, practice: false, review: false },
      });
      return res.json(fallback);
    } catch (error: any) {
      console.warn('[API] /api/generate-experiment: Gemini API unavailable or high demand. Utilizing local AI generator fallback.', error?.message || error);
      const fallback = LocalAIGenerator.generate({
        lessonContent: req.body.lessonContent,
        grade: Number(req.body.grade) || 9,
        subject: req.body.subject || 'Toán',
        lessonTitle: req.body.lessonTitle || '',
        teacherPrompt: req.body.teacherPrompt || '',
        selectedModelType: req.body.selectedModelType || 'auto',
        selectedDomain: req.body.selectedDomain || '2d',
        mode: req.body.mode || 'teacher_specified',
        goals: req.body.goals || { visualize: true, exploreFormulas: true, interactiveExperiment: true, practice: false, review: false },
      });
      return res.json(fallback);
    }
  });

  // Vite integration in development mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MATH LAB] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
