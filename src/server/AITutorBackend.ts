/**
 * OpenAI / Multi-provider AI Tutor Backend for Math Lab
 * Server-side AI dispatcher protecting API keys and respecting Engine-computed truths.
 */

import { GoogleGenAI } from '@google/genai';

export interface BackendExperimentContext {
  experimentId?: string;
  subject?: string;
  grade?: number;
  topic?: string;
  experimentType?: string;
  geometryState?: {
    shape?: string;
    radius?: number;
    height?: number;
    slantHeight?: number;
    sideA?: number;
    sideB?: number;
    sideC?: number;
    planeAngle?: number;
    planePitch?: number;
    planeYaw?: number;
    planeRoll?: number;
    planePosition?: number;
    crossSectionType?: string;
    crossSectionArea?: number;
    volume?: number;
    surfaceArea?: number;
    lateralArea?: number;
    probabilityResults?: Record<string | number, number>;
    graphSlope?: number;
    graphYIntercept?: number;
    graphEquation?: string;
  };
  mode?: 'student' | 'teacher';
  learningObjectives?: string[];
}

export class AITutorBackend {
  private static geminiClient: GoogleGenAI | null = null;

  static getGeminiClient(): GoogleGenAI | null {
    if (!this.geminiClient && process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }
    return this.geminiClient;
  }

  /**
   * Universal AI Completion dispatcher supporting OpenAI API & Gemini API
   */
  static async executeCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ success: boolean; text: string; provider: string; model: string }> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    // 1. Try OpenAI if API Key exists
    if (openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              { role: 'system', content: params.systemPrompt },
              { role: 'user', content: params.userPrompt },
            ],
            temperature: params.temperature ?? 0.3,
            max_tokens: params.maxTokens ?? 1500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            return {
              success: true,
              text: content.trim(),
              provider: 'OpenAI',
              model: openaiModel,
            };
          }
        } else {
          console.warn('[OpenAI API] Error response:', await response.text());
        }
      } catch (err: any) {
        console.warn('[OpenAI API] Request failed, falling back:', err?.message || err);
      }
    }

    // 2. Fallback to Gemini if available
    const gemini = this.getGeminiClient();
    if (gemini) {
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      try {
        const res = await gemini.models.generateContent({
          model: geminiModel,
          contents: params.userPrompt,
          config: {
            systemInstruction: params.systemPrompt,
            temperature: params.temperature ?? 0.3,
          },
        });
        if (res && res.text) {
          return {
            success: true,
            text: res.text.trim(),
            provider: 'Gemini',
            model: geminiModel,
          };
        }
      } catch (geminiErr: any) {
        console.warn('[Gemini API] Request failed, falling back:', geminiErr?.message || geminiErr);
      }
    }

    return {
      success: false,
      text: '',
      provider: 'none',
      model: 'none',
    };
  }

  /**
   * Helper to format engine state into context prompt
   */
  private static formatContextPrompt(context?: BackendExperimentContext): string {
    if (!context) return 'Không có ngữ cảnh bổ sung.';
    const g = context.geometryState || {};
    let prompt = `=== NGỮ CẢNH EXPERIMENT THỜI GIAN THỰC ===\n`;
    prompt += `- Môn học: ${context.subject || 'Toán'} (Lớp ${context.grade || 9})\n`;
    prompt += `- Chủ đề: ${context.topic || 'Hình học không gian'}\n`;
    prompt += `- Loại thí nghiệm: ${context.experimentType || '3D cross section'}\n`;
    prompt += `- Chế độ người dùng: ${context.mode === 'teacher' ? 'Giáo viên' : 'Học sinh'}\n`;

    prompt += `\n[DỮ LIỆU ĐÃ TÍNH TOÁN TỪ MATH LAB ENGINES (TUYỆT ĐỐI TUÂN THỦ, KHÔNG TỰ BỊA ĐẶT)]:\n`;
    if (g.shape) prompt += `• Hình khối 3D: ${g.shape}\n`;
    if (g.radius !== undefined) prompt += `• Bán kính r: ${g.radius}\n`;
    if (g.height !== undefined) prompt += `• Chiều cao h: ${g.height}\n`;
    if (g.slantHeight !== undefined) prompt += `• Đường sinh l: ${g.slantHeight}\n`;
    if (g.planePitch !== undefined || g.planeAngle !== undefined) {
      prompt += `• Góc nghiêng mặt phẳng cắt (Pitch): ${g.planePitch ?? g.planeAngle}°\n`;
    }
    if (g.planePosition !== undefined) prompt += `• Vị trí mặt phẳng cắt: ${g.planePosition}\n`;
    if (g.crossSectionType) prompt += `• Thiết diện tính bởi Geometry Engine: DẠNG "${g.crossSectionType.toUpperCase()}"\n`;
    if (g.crossSectionArea !== undefined) prompt += `• Diện tích thiết diện: ${g.crossSectionArea.toFixed(2)}\n`;
    if (g.volume !== undefined) prompt += `• Thể tích khối: ${g.volume.toFixed(2)}\n`;
    if (g.surfaceArea !== undefined) prompt += `• Diện tích toàn phần: ${g.surfaceArea.toFixed(2)}\n`;

    if (g.probabilityResults) {
      prompt += `• Dữ liệu Probability Engine: ${JSON.stringify(g.probabilityResults)}\n`;
    }
    if (g.graphSlope !== undefined || g.graphEquation) {
      prompt += `• Dữ liệu Graph Engine: Phương trình ${g.graphEquation || `y = ${g.graphSlope}x + ${g.graphYIntercept}`}, Hệ số góc a=${g.graphSlope}, Tung độ gốc b=${g.graphYIntercept}\n`;
    }
    return prompt;
  }

  /**
   * 1. Multi-turn AI Chat
   */
  static async handleChat(params: {
    message: string;
    history?: Array<{ role: string; content: string }>;
    context?: BackendExperimentContext;
  }): Promise<{ success: boolean; reply: string; provider?: string }> {
    const contextPrompt = this.formatContextPrompt(params.context);

    const systemPrompt = `Bạn là "OpenAI AI Math Tutor" - Trợ lý Sư phạm Toán học thông minh trong phần mềm thí nghiệm số Math Lab.

NGUYÊN TẮC CỐT LÕI (BẮT BUỘC):
1. BẠN KHÔNG ĐƯỢC THAY THẾ GEOMETRY ENGINE: Không tự ý tính toán lại các số đo, góc, dạng thiết diện khi Engine đã cung cấp. Luôn dựa trên kết quả chính xác từ Engine để giải thích.
2. VAI TRÒ CỦA BẠN: Giải thích bản chất, gợi ý tư duy, đặt câu hỏi gợi mở (Socratic), hướng dẫn học sinh thao tác trên 3D Math Lab, diễn giải kết quả thực nghiệm.
3. PHÙ HỢP LỨA TUỔI: Dùng ngôn ngữ thân thiện, dễ hiểu, chuẩn kiến thức SGK GDPT 2018 (Toán 6-12), không dùng ngôn ngữ quá hàn lâm.
4. TOÁN HỌC ĐẸP: Dùng định dạng công thức Toán LaTeX (ví dụ: $V = \\pi r^2 h$, $S_{tp} = 2\\pi r h + 2\\pi r^2$, thiết diện elip khi cắt nghiêng qua 2 đường sinh đối diện).
5. TRÁNH ĐƯA NGAY ĐÁP ÁN NẾU HỌC SINH ĐANG HỎI CÁCH LÀM: Khuyến khích học sinh thao tác xoay mô hình, kéo thanh trượt mặt phẳng cắt để tự tìm câu trả lời.`;

    let userPrompt = `${contextPrompt}\n\n`;
    if (params.history && params.history.length > 0) {
      userPrompt += `[LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY]:\n`;
      params.history.slice(-5).forEach((m) => {
        userPrompt += `${m.role === 'user' ? 'Học sinh' : 'AI Tutor'}: ${m.content}\n`;
      });
      userPrompt += `\n`;
    }
    userPrompt += `[CÂU HỎI HIỆN TẠI]:\n${params.message}`;

    const completion = await this.executeCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    });

    if (completion.success) {
      return { success: true, reply: completion.text, provider: completion.provider };
    }

    // Pedagogical Local Fallback
    const g = params.context?.geometryState || {};
    let localReply = `Xin chào! Tôi đang quan sát mô hình **${g.shape || '3D'}** cùng bạn.\n\n`;
    if (g.crossSectionType) {
      localReply += `📌 **Quan sát thực nghiệm:** Với góc nghiêng và vị trí mặt phẳng hiện tại, Geometry Engine xác định thiết diện thu được là **${g.crossSectionType.toUpperCase()}**.\n\n`;
    }
    localReply += `💡 **Gợi ý khám phá:**\n- Bạn hãy thử thay đổi góc nghiêng của mặt phẳng cắt để xem thiết diện thay đổi thế nào.\n- Hãy quan sát giao tuyến giữa mặt phẳng với đáy và mặt xung quanh của hình nhé!`;

    return { success: true, reply: localReply, provider: 'MathLab-Engine' };
  }

  /**
   * 2. Tiered Hint Generation (Scaffolding: 1. Quan sát -> 2. Thao tác -> 3. Liên hệ -> 4. Đáp án)
   */
  static async handleHint(params: {
    context?: BackendExperimentContext;
    level: 1 | 2 | 3 | 4;
  }): Promise<{ success: boolean; hint: { level: number; title: string; category: string; content: string } }> {
    const contextPrompt = this.formatContextPrompt(params.context);

    const levelDescriptions = {
      1: 'Mức 1 (Quan sát): Hướng dẫn học sinh chú ý vào các yếu tố thị giác trên mô hình 3D (mặt cắt, đường sinh, mặt đáy, các giao điểm).',
      2: 'Mức 2 (Thao tác): Hướng dẫn học sinh thực hiện một thao tác cụ thể trên Math Lab (xoay 360°, kéo thanh trượt góc cắt, mở khai triển phẳng).',
      3: 'Mức 3 (Liên hệ kiến thức): Gợi nhớ định lý, tính chất hình học hoặc công thức liên quan trong SGK.',
      4: 'Mức 4 (Đáp án & Kết luận hoàn chỉnh): Đưa ra kết luận hình học chính xác và diễn giải vì sao lại có kết quả đó.',
    };

    const systemPrompt = `Bạn là Trợ lý Sư phạm gợi ý theo mô hình Scaffolding (bậc thang nhận thức) của Math Lab.
Yêu cầu tạo gợi ý ở: ${levelDescriptions[params.level]}
NGUYÊN TẮC:
- Nếu level là 1, 2, 3: TUYỆT ĐỐI KHÔNG ĐƯỢC ĐƯA ĐÁP ÁN CUỐI CÙNG.
- Phải gắn liền với trạng thái mô hình hiện tại được cung cấp.
- Trả về lời gợi ý bằng tiếng Việt, ngắn gọn, súc tích (từ 2 đến 4 câu).`;

    const userPrompt = `${contextPrompt}\n\nHãy tạo gợi ý Mức ${params.level} cho học sinh.`;

    const completion = await this.executeCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.2,
    });

    const defaultTitles = {
      1: 'Quan sát mô hình',
      2: 'Thao tác thực nghiệm',
      3: 'Liên hệ định lý',
      4: 'Kết luận & Đáp án',
    };

    const defaultCategories = {
      1: 'observation',
      2: 'action',
      3: 'concept',
      4: 'solution',
    };

    if (completion.success) {
      return {
        success: true,
        hint: {
          level: params.level,
          title: defaultTitles[params.level],
          category: defaultCategories[params.level],
          content: completion.text,
        },
      };
    }

    // Local Fallback based on geometry state
    const g = params.context?.geometryState || {};
    const fallbacks: Record<number, string> = {
      1: `Em hãy quan sát kỹ đường bao màu đỏ (giao tuyến) giữa mặt phẳng cắt và bề mặt của hình khối ${g.shape || '3D'}. Giao tuyến này có cắt qua cả hai đáy không hay chỉ cắt thân?`,
      2: `Em hãy thử bấm vào thanh trượt "Góc nghiêng" và chỉnh về 0° (song song đáy) rồi tăng dần lên 45° và 90° (vuông góc đáy) để xem sự biến đổi hình học.`,
      3: `Hãy nhớ lại định lý: Thiết diện của hình trụ cắt bởi mặt phẳng song song với trục là hình gì? Cắt song song với đáy là hình gì? Cắt nghiêng qua thân là hình elip.`,
      4: `Kết luận chính xác: Với trạng thái hiện tại, thiết diện là ${g.crossSectionType || 'Elip'}. Diện tích thiết diện đo được là ${g.crossSectionArea ? g.crossSectionArea.toFixed(2) : 'hợp lệ'}.`,
    };

    return {
      success: true,
      hint: {
        level: params.level,
        title: defaultTitles[params.level],
        category: defaultCategories[params.level],
        content: fallbacks[params.level] || fallbacks[1],
      },
    };
  }

  /**
   * 3. Socratic Tutoring (Step-by-step guided exploration)
   */
  static async handleSocraticGuide(params: {
    context?: BackendExperimentContext;
    stepIndex: number;
    studentAnswer?: string;
  }): Promise<{
    success: boolean;
    question: string;
    expectedAction: string;
    feedback?: string;
    nextStepAvailable: boolean;
  }> {
    const contextPrompt = this.formatContextPrompt(params.context);

    const systemPrompt = `Bạn là Trợ lý "AI Socratic Tutor" dẫn dắt học sinh khám phá hình học qua chuỗi câu hỏi gợi mở 4 bước:
Bước 1: Quan sát hiện tượng ban đầu.
Bước 2: Dự đoán điều gì xảy ra khi thay đổi tham số (góc cắt, bán kính, chiều cao).
Bước 3: Hướng dẫn học sinh thao tác trên Math Lab để kiểm chứng dự đoán.
Bước 4: Tổng kết quy luật và định lý.

Nếu học sinh có gửi câu trả lời (studentAnswer), hãy nhận xét khích lệ ngắn gọn, phân tích xem học sinh đúng hay cần chỉnh sửa, sau đó đưa ra câu hỏi của bước tiếp theo.`;

    const userPrompt = `${contextPrompt}\n\n` +
      `Hiện đang ở Bước: ${params.stepIndex + 1}/4.\n` +
      (params.studentAnswer ? `Câu trả lời của học sinh cho bước trước: "${params.studentAnswer}"\n` : '') +
      `Hãy đưa ra nhận xét (nếu có) và câu hỏi gợi mở cho bước hiện tại.`;

    const completion = await this.executeCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    });

    if (completion.success) {
      return {
        success: true,
        question: completion.text,
        expectedAction: params.stepIndex === 0 ? 'Quan sát hình khối' : params.stepIndex === 1 ? 'Dự đoán kết quả' : 'Thao tác cắt mặt phẳng',
        nextStepAvailable: params.stepIndex < 3,
      };
    }

    const defaultSteps = [
      { q: 'Em hãy quan sát mặt phẳng cắt trên màn hình 3D. Em thấy mặt phẳng đang cắt hình khối tại những vị trí nào?', action: 'Quan sát mặt phẳng' },
      { q: 'Nếu em xoay góc nghiêng của mặt phẳng cắt thêm 30 độ nữa, em dự đoán hình dạng thiết diện sẽ thay đổi thành hình gì?', action: 'Dự đoán hình dạng' },
      { q: 'Bây giờ em hãy dùng chuột kéo thanh trượt "Góc nghiêng" hoặc "Vị trí" để kiểm chứng xem dự đoán của mình có chính xác không nhé!', action: 'Thao tác kiểm chứng' },
      { q: 'Tuyệt vời! Em hãy rút ra kết luận: Mối quan hệ giữa góc nghiêng mặt phẳng cắt và hình dạng thiết diện nhận được là gì?', action: 'Tổng kết quy luật' },
    ];

    const current = defaultSteps[Math.min(params.stepIndex, defaultSteps.length - 1)];

    return {
      success: true,
      question: current.q,
      expectedAction: current.action,
      nextStepAvailable: params.stepIndex < defaultSteps.length - 1,
    };
  }

  /**
   * 4. Teacher Question Generator (Quan sát, Dự đoán, Giải thích, Vận dụng)
   */
  static async handleGenerateQuestions(params: {
    context?: BackendExperimentContext;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  }): Promise<{ success: boolean; questions: any[] }> {
    const contextPrompt = this.formatContextPrompt(params.context);

    const systemPrompt = `Bạn là Trợ lý AI tạo câu hỏi dạy học cho Giáo viên Toán.
Dựa trên ngữ cảnh thí nghiệm hiện tại, hãy tạo ra 4 câu hỏi trắc nghiệm/tự luận tương tác thuộc 4 nhóm năng lực:
1. "observation": Câu hỏi quan sát trực quan
2. "prediction": Câu hỏi dự đoán trước khi thao tác
3. "explanation": Câu hỏi giải thích bản chất toán học
4. "application": Câu hỏi vận dụng thực tế / tính toán

Trả về JSON array thuần túy có cấu trúc:
[
  {
    "id": "q1",
    "type": "observation",
    "typeLabel": "Câu hỏi Quan Sát",
    "question": "Nội dung câu hỏi...",
    "hint": "Gợi ý cho học sinh...",
    "expectedAnswer": "Đáp án mong đợi...",
    "difficulty": "easy"
  },
  ...
]`;

    const userPrompt = `${contextPrompt}\n\nHãy tạo 4 câu hỏi sư phạm chất lượng cao phù hợp trình độ học sinh.`;

    const completion = await this.executeCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    });

    if (completion.success) {
      try {
        const cleanJson = completion.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { success: true, questions: parsed };
        }
      } catch (err) {
        console.warn('[Question Generator] JSON parse failed, using structured template:', err);
      }
    }

    const g = params.context?.geometryState || {};
    const shapeName = g.shape || 'hình trụ';

    return {
      success: true,
      questions: [
        {
          id: 'q1',
          type: 'observation',
          typeLabel: 'Quan Sát Trực Quan',
          question: `Khi mặt phẳng cắt song song với mặt đáy của ${shapeName}, thiết diện nhận được là hình gì?`,
          hint: 'Quan sát đường bao màu đỏ giao với các mặt của hình khối.',
          expectedAnswer: 'Thiết diện là hình tròn có bán kính bằng bán kính đáy.',
          difficulty: 'easy',
        },
        {
          id: 'q2',
          type: 'prediction',
          typeLabel: 'Dự Đoán Thao Tác',
          question: `Nếu nghiêng mặt phẳng cắt một góc $30^\\circ$ sao cho mặt phẳng cắt qua cả hai đáy, thiết diện thu được có còn là elip không?`,
          hint: 'Thử tưởng tượng phần bị cắt đứt ở hai đầu đáy.',
          expectedAnswer: 'Không, thiết diện sẽ là hình elip bị cắt cụt (hoặc hình chữ nhật / đa giác cong).',
          difficulty: 'medium',
        },
        {
          id: 'q3',
          type: 'explanation',
          typeLabel: 'Giải Thích Bản Chất',
          question: `Vì sao khi cắt mặt phẳng vuông góc với trục của ${shapeName}, ta luôn nhận được một hình tròn bằng đáy?`,
          hint: 'Dựa vào định nghĩa hình trụ tròn xoay khi quay hình chữ nhật quanh một cạnh.',
          expectedAnswer: 'Vì tất cả các điểm trên mặt xung quanh cách trục một khoảng không đổi đúng bằng bán kính đáy $R$.',
          difficulty: 'medium',
        },
        {
          id: 'q4',
          type: 'application',
          typeLabel: 'Vận Dụng Tính Toán',
          question: `Cho ${shapeName} có $r = ${g.radius || 4}$, $h = ${g.height || 8}$. Một mặt phẳng cắt song song với trục và cách trục một khoảng $d = 3$. Tính diện tích thiết diện.`,
          hint: 'Sử dụng định lý Pitago trong tam giác vuông tạo bởi khoảng cách $d$ và nửa dây cung đáy.',
          expectedAnswer: `Chiều rộng thiết diện là $2\\sqrt{r^2 - d^2} = 2\\sqrt{16-9} = 2\\sqrt{7}$. Diện tích thiết diện là $S = 2\\sqrt{7} \\times 8 = 16\\sqrt{7}$.`,
          difficulty: 'hard',
        },
      ],
    };
  }

  /**
   * 5. Teacher 15-Minute Lesson Plan Generator
   */
  static async handleGenerateLessonPlan(params: {
    context?: BackendExperimentContext;
    durationMinutes?: number;
    focus?: string;
  }): Promise<{ success: boolean; plan: any }> {
    const contextPrompt = this.formatContextPrompt(params.context);
    const duration = params.durationMinutes || 15;

    const systemPrompt = `Bạn là Chuyên gia Phương pháp Dạy học Toán THCS & THPT.
Hãy tạo một Kịch bản Hoạt động Dạy học ${duration} phút sử dụng phần mềm Math Lab tương tác 3D.
Kịch bản gồm đúng 7 bước sư phạm chuẩn GDPT 2018:
1. Khởi động (Khơi gợi vấn đề)
2. Dự đoán (Học sinh nêu phán đoán)
3. Thao tác thực nghiệm (Học sinh tương tác trực tiếp trên mô hình 3D)
4. Quan sát & Thu thập số liệu (Ghi nhận kết quả từ Geometry Engine)
5. Thảo luận nhóm (So sánh dự đoán và kết quả)
6. Kết luận & Khái quát hóa (Rút ra định lý/công thức)
7. Củng cố & Đánh giá (Câu hỏi nhanh)

Trả về JSON có cấu trúc:
{
  "title": "Kịch bản dạy học: ...",
  "grade": 9,
  "topic": "...",
  "totalDuration": ${duration},
  "learningObjectives": ["Mục tiêu 1", "Mục tiêu 2"],
  "stages": [
    {
      "stepNumber": 1,
      "name": "Khởi động",
      "durationMinutes": 2,
      "teacherAction": "Giáo viên làm gì...",
      "studentAction": "Học sinh làm gì...",
      "mathLabOperation": "Thao tác trên Math Lab...",
      "guidingQuestion": "Câu hỏi giáo viên đặt ra..."
    },
    ...
  ],
  "summary": "Tóm tắt kết quả sư phạm đạt được..."
}`;

    const userPrompt = `${contextPrompt}\n\nHãy tạo kịch bản dạy học chuẩn sư phạm.`;

    const completion = await this.executeCompletion({
      systemPrompt,
      userPrompt,
      temperature: 0.3,
    });

    if (completion.success) {
      try {
        const cleanJson = completion.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed && parsed.stages) {
          return { success: true, plan: parsed };
        }
      } catch (err) {
        console.warn('[Lesson Plan Generator] JSON parse failed, returning template:', err);
      }
    }

    const g = params.context?.geometryState || {};
    const topic = params.context?.topic || 'Khám phá Thiết diện Hình học 3D';

    return {
      success: true,
      plan: {
        title: `Kịch bản Dạy học 15 phút: ${topic}`,
        grade: params.context?.grade || 9,
        topic,
        totalDuration: duration,
        learningObjectives: [
          'Học sinh nhận biết và mô tả được các dạng thiết diện khi cắt khối 3D.',
          'Rèn luyện kỹ năng quan sát không gian và phán đoán hình học.',
          'Biết áp dụng định lý để tính diện tích thiết diện thực tế.',
        ],
        stages: [
          {
            stepNumber: 1,
            name: '1. Khởi động & Đặt vấn đề',
            durationMinutes: 2,
            teacherAction: 'Chiếu mô hình 3D lên màn hình lớn, giới thiệu bài toán cắt vật thể.',
            studentAction: 'Quan sát vật thể 3D, liên hệ với các hình khối trong đời sống (lon sữa, khúc gỗ).',
            mathLabOperation: 'Xoay mô hình 360 độ để cả lớp quan sát toàn diện.',
            guidingQuestion: 'Nếu dùng một con dao phẳng cắt ngang thân hình trụ thì mặt cắt có dạng hình gì?',
          },
          {
            stepNumber: 2,
            name: '2. Dự đoán nhận thức',
            durationMinutes: 2,
            teacherAction: 'Yêu cầu học sinh ghi nhanh dự đoán vào phiếu học tập hoặc trả lời nhanh.',
            studentAction: 'Đưa ra các phương án: Hình tròn, hình chữ nhật, hình elip, hình parabol.',
            mathLabOperation: 'Bật tính năng "Dự Đoán Thiết Diện" trên thanh công cụ.',
            guidingQuestion: 'Nếu cắt nghiêng một góc 30 độ thì mặt cắt có còn tròn không?',
          },
          {
            stepNumber: 3,
            name: '3. Thao tác thực nghiệm số',
            durationMinutes: 3,
            teacherAction: 'Chuyển quyền điều khiển hoặc hướng dẫn học sinh thao tác trên máy tính/máy tính bảng.',
            studentAction: 'Kéo thanh trượt Góc nghiêng (Pitch/Yaw) và Vị trí (Position) mặt phẳng cắt.',
            mathLabOperation: 'Bật chế độ "Cắt Lát Mặt Phẳng" và điều chỉnh thanh trượt.',
            guidingQuestion: 'Hãy điều chỉnh mặt phẳng cắt nghiêng 45 độ và quan sát đường bao giao tuyến.',
          },
          {
            stepNumber: 4,
            name: '4. Quan sát & Thu thập số liệu',
            durationMinutes: 3,
            teacherAction: 'Mở cửa sổ "Thanh Tra 2D" hiển thị số đo chính xác từ Geometry Engine.',
            studentAction: 'Ghi lại dạng hình học (Elip) và diện tích thiết diện do Engine tính toán.',
            mathLabOperation: 'Mở modal "Chi Tiết Thiết Diện 2D" xem kích thước trục lớn, trục bé.',
            guidingQuestion: 'Diện tích thiết diện khi cắt nghiêng lớn hơn hay nhỏ hơn diện tích đáy?',
          },
          {
            stepNumber: 5,
            name: '5. Thảo luận & Đối chiếu',
            durationMinutes: 2,
            teacherAction: 'Tổ chức cho các nhóm so sánh giữa kết quả dự đoán ban đầu và thực nghiệm trên Math Lab.',
            studentAction: 'Giải thích nguyên nhân vì sao thiết diện lại có dạng elip.',
            mathLabOperation: 'Bật tách rời 2 nửa hình khối để nhìn rõ bề mặt cắt.',
            guidingQuestion: 'Tại sao khi góc cắt càng nghiêng thì trục lớn của elip càng dài ra?',
          },
          {
            stepNumber: 6,
            name: '6. Kết luận & Khái quát hóa',
            durationMinutes: 2,
            teacherAction: 'Chốt kiến thức chuẩn SGK: Mặt cắt song song đáy (Tròn), vuông góc đáy (Chữ nhật), nghiêng (Elip).',
            studentAction: 'Ghi nhớ định lý và vẽ phác thảo vào vở ghi bài.',
            mathLabOperation: 'Đặt lại trạng thái chuẩn và hiển thị công thức tổng quát.',
            guidingQuestion: 'Quy luật tổng quát cho mọi góc cắt là gì?',
          },
          {
            stepNumber: 7,
            name: '7. Củng cố & Giao nhiệm vụ',
            durationMinutes: 1,
            teacherAction: 'Gửi link chia sẻ bài tập tương tác cho học sinh thực hành về nhà.',
            studentAction: 'Quét mã QR hoặc nhận link để mở bài tập trên thiết bị cá nhân.',
            mathLabOperation: 'Bấm nút "Chia Sẻ Cho Học Sinh" để tạo mã phòng luyện tập.',
            guidingQuestion: 'Hãy về nhà thử nghiệm cắt hình nón và hình cầu để xem có gì khác biệt!',
          },
        ],
        summary: 'Học sinh hiểu sâu bản chất hình học không gian qua thực nghiệm trực quan, khắc sâu kiến thức mà không cần học vẹt.',
      },
    };
  }
}
