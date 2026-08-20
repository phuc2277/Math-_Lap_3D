import { Experiment } from '../types/geometry';

export const experimentsData: Experiment[] = [
  // =========================================================================
  // 1. CÁC THÍ NGHIỆM HÌNH HỌC 3D (3D ENGINE)
  // =========================================================================
  {
    id: 'exp-cylinder-001',
    labId: 'cylinder-001',
    title: 'Khám phá sự phụ thuộc thể tích hình trụ vào bán kính & chiều cao',
    description: 'Thực hành tương tác để khám phá bản chất tỉ lệ bình phương của bán kính đáy tới thể tích.',
    modelType: 'cylinder',
    visualizationType: '3d',
    engine: '3d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát trạng thái ban đầu',
        instruction: 'Đặt bán kính r = 3 cm và chiều cao h = 5 cm. Quan sát thể tích V hiện tại của hình trụ.',
        suggestedParams: { r: 3, h: 5 },
        observationInsight: 'Thể tích ban đầu: V = π × 3² × 5 = 45π ≈ 141.37 cm³.',
        formulaHighlight: 'V = π r² h',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Tăng gấp đôi bán kính đáy (r = 6 cm)',
        instruction: 'Hãy kéo thanh trượt bán kính r từ 3 cm lên 6 cm (giữ nguyên chiều cao h = 5 cm).',
        targetParam: 'r',
        targetValue: 6,
        suggestedParams: { r: 6, h: 5 },
        observationInsight: 'Khi r tăng gấp 2 (từ 3 lên 6 cm), r² tăng gấp 2² = 4 lần! Thể tích V tăng gấp 4 lần: V = 180π ≈ 565.49 cm³.',
        formulaHighlight: 'V ~ r²',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Tăng gấp đôi chiều cao (h = 10 cm)',
        instruction: 'Bây giờ hãy trả r về 3 cm và kéo chiều cao h từ 5 cm lên 10 cm.',
        targetParam: 'h',
        targetValue: 10,
        suggestedParams: { r: 3, h: 10 },
        observationInsight: 'Khi h tăng gấp 2 (từ 5 lên 10 cm), thể tích V tăng đúng 2 lần: V = 90π ≈ 282.74 cm³.',
        formulaHighlight: 'V ~ h',
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Kết luận thí nghiệm',
        instruction: 'So sánh mức độ tác động của bán kính r và chiều cao h đối với thể tích V.',
        observationInsight: '💡 Bán kính r có ảnh hưởng mạnh hơn nhiều so với chiều cao h vì thể tích tỉ lệ với BÌNH PHƯƠNG bán kính (r²).',
        formulaHighlight: 'V = π r² h',
      },
    ],
    conclusionStep: {
      title: 'Em rút ra kết luận gì về thể tích hình trụ?',
      options: [
        'Thể tích tỉ lệ thuận bậc nhất với bán kính r',
        'Thể tích tỉ lệ thuận với BÌNH PHƯƠNG bán kính r (r²)',
        'Bán kính r và chiều cao h có mức độ tác động hoàn toàn giống nhau',
      ],
      correctAnswerIndex: 1,
      summary: 'Thể tích hình trụ tỉ lệ với bình phương bán kính đáy r² và tỉ lệ thuận với chiều cao h.',
    },
  },

  {
    id: 'exp-cuboid-001',
    labId: 'cuboid-001',
    title: 'Khám phá thể tích và diện tích xung quanh hình hộp chữ nhật',
    description: 'Tìm hiểu mối liên hệ giữa diện tích đáy S_đáy, chiều cao h và thể tích V.',
    modelType: 'cuboid',
    visualizationType: '3d',
    engine: '3d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Khái niệm thể tích',
        instruction: 'Điều chỉnh chiều dài a = 5 cm, chiều rộng b = 3 cm, chiều cao h = 4 cm.',
        suggestedParams: { a: 5, b: 3, h: 4 },
        observationInsight: 'Diện tích đáy S_đáy = a × b = 15 cm². Thể tích V = S_đáy × h = 15 × 4 = 60 cm³.',
        formulaHighlight: 'V = a × b × h',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Thay đổi diện tích đáy',
        instruction: 'Tăng chiều dài a = 8 cm. Quan sát sự thay đổi của S_đáy và V.',
        targetParam: 'a',
        targetValue: 8,
        suggestedParams: { a: 8, b: 3, h: 4 },
        observationInsight: 'Khi chiều dài a tăng, diện tích đáy tăng kéo theo thể tích tăng tương ứng.',
        formulaHighlight: 'V = S_đáy × h',
      },
    ],
  },

  {
    id: 'exp-cone-001',
    labId: 'cone-001',
    title: 'So sánh thể tích Hình Nón và Hình Trụ cùng đáy, cùng chiều cao',
    description: 'Khám phá tại sao thể tích hình nón lại bằng 1/3 thể tích hình trụ.',
    modelType: 'cone',
    visualizationType: '3d',
    engine: '3d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát thể tích hình nón',
        instruction: 'Đặt bán kính đáy r = 3 cm và chiều cao h = 6 cm.',
        suggestedParams: { r: 3, h: 6 },
        observationInsight: 'Thể tích hình nón V_nón = 1/3 × π × 3² × 6 = 18π ≈ 56.55 cm³.',
        formulaHighlight: 'V_nón = (1/3) π r² h',
      },
    ],
  },

  // =========================================================================
  // 2. CÁC THÍ NGHIỆM ĐỒ THỊ HÀM SỐ (GRAPH ENGINE)
  // =========================================================================
  {
    id: 'exp-graph-slope-001',
    labId: 'graph-linear-001',
    title: 'Thí nghiệm 1: Khám phá Hệ số góc a của đường thẳng y = ax + b',
    description: 'Dự đoán và thay đổi hệ số a để tìm hiểu về độ dốc, tính đồng biến/nghịch biến của đường thẳng.',
    modelType: 'graph_linear',
    visualizationType: 'graph',
    engine: 'graph',
    graphConfig: {
      mode: 'linear_slope',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Dự đoán trước khi thao tác',
        instruction: 'Nếu hệ số a > 0 và tăng dần từ 1 lên 3, đường thẳng y = ax + b sẽ biến đổi như thế nào?',
        prediction: {
          question: 'Khi hệ số a dương và tăng dần, độ dốc của đường thẳng sẽ:',
          options: ['Dốc hơn (nghiêng nhiều hơn về trục Oy)', 'Thoải hơn (gần với trục Ox)', 'Không thay đổi độ dốc'],
          correctAnswerIndex: 0,
          explanation: 'Giá trị tuyệt đối |a| đại diện cho độ dốc. |a| càng lớn thì đường thẳng càng dốc.',
        },
        observationInsight: 'Hãy kéo thanh trượt a để kiểm tra dự đoán của em!',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Kéo hệ số a từ 1 lên 3 (a > 0)',
        instruction: 'Hãy thay đổi thanh trượt a1 = 3 và giữ b1 = 1.',
        targetParam: 'a1',
        targetValue: 3,
        suggestedParams: { a1: 3, b1: 1 },
        observationInsight: 'Đường thẳng đi lên từ trái sang phải (đồng biến) và có độ dốc tăng lên đáng kể!',
        formulaHighlight: 'a > 0 ⇒ Hàm số đồng biến',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Đổi dấu hệ số a sang âm (a = -2)',
        instruction: 'Hãy kéo hệ số a1 xuống -2.',
        targetParam: 'a1',
        targetValue: -2,
        suggestedParams: { a1: -2, b1: 1 },
        observationInsight: 'Khi a < 0, đường thẳng đi xuống từ trái sang phải (hàm số nghịch biến)!',
        formulaHighlight: 'a < 0 ⇒ Hàm số nghịch biến',
      },
    ],
    guidingQuestions: [
      { id: 'gq1', question: 'Hệ số a có ý nghĩa gì với độ dốc của đường thẳng?', answer: 'a quyết định độ dốc và hướng đi của đường thẳng (a > 0 đi lên, a < 0 đi xuống).' },
    ],
    conclusionStep: {
      title: 'Kết luận về hệ số góc a:',
      options: [
        'Hệ số a quyết định độ dốc và tính đồng biến/nghịch biến của hàm số',
        'Hệ số a quyết định vị trí cắt trục tung Oy',
        'Hệ số a không có ảnh hưởng gì tới hình dạng đường thẳng',
      ],
      correctAnswerIndex: 0,
      summary: 'Hệ số a được gọi là hệ số góc. a > 0 hàm số đồng biến, a < 0 hàm số nghịch biến, |a| càng lớn đường thẳng càng dốc.',
    },
  },

  {
    id: 'exp-graph-parallel-002',
    labId: 'graph-linear-001',
    title: 'Thí nghiệm 2: Giữ nguyên a, thay đổi b (Đường thẳng song song)',
    description: 'Quan sát các đường thẳng khi có cùng hệ số góc a nhưng khác tung độ gốc b.',
    modelType: 'graph_linear',
    visualizationType: 'graph',
    engine: 'graph',
    graphConfig: {
      mode: 'parallel_lines',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Cài đặt hai đường thẳng cùng hệ số góc a',
        instruction: 'Đặt a₁ = 2, b₁ = -1 và a₂ = 2, b₂ = 3.',
        suggestedParams: { a1: 2, b1: -1, a2: 2, b2: 3 },
        observationInsight: 'Hai đường thẳng (d₁): y = 2x - 1 và (d₂): y = 2x + 3 có cùng độ dốc a = 2.',
        formulaHighlight: 'a₁ = a₂ và b₁ ≠ b₂ ⇒ Song song',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Thay đổi b₂ và quan sát',
        instruction: 'Kéo thanh trượt b₂ từ 3 lên 5.',
        targetParam: 'b2',
        targetValue: 5,
        suggestedParams: { a1: 2, b1: -1, a2: 2, b2: 5 },
        observationInsight: 'Đường thẳng (d₂) tịnh tiến dịch chuyển lên trên nhưng luôn giữ khoảng cách song song tuyệt đối với (d₁)!',
        formulaHighlight: '(d₁) // (d₂)',
      },
    ],
    conclusionStep: {
      title: 'Điều kiện để hai đường thẳng song song là gì?',
      options: [
        'a₁ = a₂ và b₁ ≠ b₂',
        'a₁ ≠ a₂',
        'a₁ × a₂ = -1',
      ],
      correctAnswerIndex: 0,
      summary: 'Hai đường thẳng y = a₁x + b₁ và y = a₂x + b₂ song song khi và chỉ khi a₁ = a₂ và b₁ ≠ b₂.',
    },
  },

  {
    id: 'exp-graph-perpendicular-004',
    labId: 'graph-linear-001',
    title: 'Thí nghiệm 3: Hai đường thẳng vuông góc (a₁ × a₂ = -1)',
    description: 'Kiểm chứng điều kiện tích hai hệ số góc bằng -1 để hai đường thẳng vuông góc nhau.',
    modelType: 'graph_linear',
    visualizationType: 'graph',
    engine: 'graph',
    graphConfig: {
      mode: 'perpendicular_lines',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Cài đặt a₁ = 2 và a₂ = -0.5',
        instruction: 'Quan sát hai đường thẳng (d₁): y = 2x + 1 và (d₂): y = -0.5x + 3.',
        suggestedParams: { a1: 2, b1: 1, a2: -0.5, b2: 3 },
        observationInsight: 'Tích hệ số góc: a₁ × a₂ = 2 × (-0.5) = -1. Góc giao giữa hai đường thẳng đúng bằng 90° (Vuông góc)!',
        formulaHighlight: 'a₁ · a₂ = -1 ⇒ Vuông góc',
      },
    ],
  },

  {
    id: 'exp-graph-parabola-006',
    labId: 'graph-parabola-001',
    title: 'Thí nghiệm 4: Khám phá Parabol y = ax²',
    description: 'Thay đổi hệ số a để quan sát độ rộng mở và hướng bề lõm của Parabol.',
    modelType: 'graph_parabola',
    visualizationType: 'graph',
    engine: 'graph',
    graphConfig: {
      mode: 'parabola_basic',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Parabol với a > 0 (a = 1)',
        instruction: 'Quan sát đồ thị y = x². Bề lõm quay lên trên, O(0,0) là điểm thấp nhất.',
        suggestedParams: { a: 1 },
        observationInsight: 'Với a > 0, hàm số đạt giá trị nhỏ nhất y = 0 tại x = 0.',
        formulaHighlight: 'a > 0 ⇒ Bề lõm quay lên',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Tăng a = 3 (a > 0)',
        instruction: 'Kéo hệ số a từ 1 lên 3.',
        targetParam: 'a',
        targetValue: 3,
        suggestedParams: { a: 3 },
        observationInsight: 'Khi |a| tăng, đồ thị parabol hẹp lại và ôm sát hơn vào trục tung Oy!',
        formulaHighlight: '|a| tăng ⇒ Parabol hẹp hơn',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Đổi a = -1 (a < 0)',
        instruction: 'Kéo hệ số a xuống -1.',
        targetParam: 'a',
        targetValue: -1,
        suggestedParams: { a: -1 },
        observationInsight: 'Khi a < 0, đồ thị bị lật ngược: Bề lõm quay xuống dưới, O(0,0) trở thành điểm cao nhất!',
        formulaHighlight: 'a < 0 ⇒ Bề lõm quay xuống',
      },
    ],
  },

  {
    id: 'exp-graph-parabola-line-007',
    labId: 'graph-parabola-001',
    title: 'Thí nghiệm 5: Số giao điểm giữa Parabol (P) và Đường thẳng (d)',
    description: 'Xét sự tương quan vị trí giữa y = ax² và y = mx + n thông qua biệt thức Δ = m² + 4an.',
    modelType: 'graph_parabola',
    visualizationType: 'graph',
    engine: 'graph',
    graphConfig: {
      mode: 'parabola_line',
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Trường hợp Δ > 0 (Cắt nhau tại 2 điểm)',
        instruction: 'Đặt (P): y = x² và (d): y = x + 2. Tính Δ = 1² + 4(1)(2) = 9 > 0.',
        suggestedParams: { a: 1, m: 1, n: 2 },
        observationInsight: 'Đường thẳng cắt parabol tại đúng 2 điểm phân biệt G₁(-1, 1) và G₂(2, 4)!',
        formulaHighlight: 'Δ > 0 ⇒ 2 giao điểm',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Trường hợp tiếp xúc Δ = 0',
        instruction: 'Thay n = -0.25 và m = 1 sao cho Δ = 1² + 4(1)(-0.25) = 0.',
        suggestedParams: { a: 1, m: 1, n: -0.25 },
        observationInsight: 'Δ = 0: Đường thẳng tiếp xúc với parabol tại duy nhất 1 điểm (0.5, 0.25)!',
        formulaHighlight: 'Δ = 0 ⇒ Tiếp xúc (1 giao điểm)',
      },
    ],
  },

  // =========================================================================
  // 3. CÁC THÍ NGHIỆM XÁC SUẤT (PROBABILITY ENGINE)
  // =========================================================================
  {
    id: 'exp-prob-coin-008',
    labId: 'prob-sim-001',
    title: 'Thí nghiệm 6: Tung đồng xu & Kiểm chứng Luật số lớn',
    description: 'Tung đồng xu 10, 100, 1000, 10000 lần và quan sát sự hội tụ của Tần suất thực nghiệm f về P = 0.5.',
    modelType: 'probability_sim',
    visualizationType: 'probability',
    engine: 'probability',
    probabilityConfig: {
      mode: 'coin',
      defaultTrials: 100,
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Dự đoán kết quả với số lần thử ít (N = 10)',
        instruction: 'Khi tung đồng xu chỉ 10 lần, tần suất mặt ngửa f có chắc chắn đúng bằng 0.50 (5 lần) không?',
        prediction: {
          question: 'Khi số lần thử N còn nhỏ (N = 10):',
          options: ['Tần suất thực nghiệm f có thể dao động lệch nhiều so với 0.50', 'Tần suất f chắc chắn luôn luôn bằng chính xác 0.50'],
          correctAnswerIndex: 0,
          explanation: 'Với N nhỏ, biến động ngẫu nhiên lớn nên f có thể lệch khá xa so với P = 0.5.',
        },
        observationInsight: 'Bấm button "+10 lần" vài lần để quan sát độ biến động!',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Tăng số lần thử lên N = 10,000 lần',
        instruction: 'Bấm button "+10000 lần" vài lần để quan sát biểu đồ hội tụ.',
        suggestedParams: { trials: 10000 },
        observationInsight: '💡 Khi N rất lớn (10,000+ lần), tần suất f hội tụ cực kỳ sát về đường ngang lý thuyết 0.50! Đây chính là Luật Số Lớn.',
        formulaHighlight: 'f → P = 0.5 khi N → ∞',
      },
    ],
  },

  {
    id: 'exp-prob-dice-009',
    labId: 'prob-sim-001',
    title: 'Thí nghiệm 7: Tung xúc xắc 6 mặt & Tần suất tương đối',
    description: 'Khám phá xác suất xuất hiện từng mặt (1 đến 6) của một con xúc xắc đồng chất.',
    modelType: 'probability_sim',
    visualizationType: 'probability',
    engine: 'probability',
    probabilityConfig: {
      mode: 'dice',
      defaultTrials: 600,
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát tần suất 6 mặt',
        instruction: 'Thực hiện 1,000 lượt tung xúc xắc và so sánh chiều cao các cột.',
        suggestedParams: { trials: 1000 },
        observationInsight: 'Xác suất lý thuyết xuất hiện mỗi mặt P = 1/6 ≈ 16.67%. Chiều cao 6 cột dần bằng nhau!',
        formulaHighlight: 'P(k) = 1/6 ≈ 16.67%',
      },
    ],
  },

  // =========================================================================
  // 4. CÁC THÍ NGHIỆM THỐNG KÊ (STATISTICS ENGINE)
  // =========================================================================
  {
    id: 'exp-stat-metrics-012',
    labId: 'stat-sim-001',
    title: 'Thí nghiệm 8: Khám phá Trung bình, Trung vị, Mốt và Khoảng biến thiên',
    description: 'Thực hành thay đổi các giá trị trong tập dữ liệu để hiểu cách từng đại lượng phản ánh đặc trưng tập dữ liệu.',
    modelType: 'statistics_sim',
    visualizationType: 'statistics',
    engine: 'statistics',
    statisticsConfig: {
      mode: 'basic_metrics',
      initialDataset: [5, 6, 6, 7, 7, 8, 8, 9],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát tập dữ liệu ban đầu',
        instruction: 'Xét tập dữ liệu điểm số: [5, 6, 6, 7, 7, 8, 8, 9].',
        observationInsight: 'Trung bình x̄ = 7.00, Trung vị Me = 7.00, Mốt Mo = [6, 7, 8], Khoảng biến thiên R = 4.',
        formulaHighlight: 'x̄ = (∑x_i) / N',
      },
    ],
  },

  {
    id: 'exp-stat-outlier-013',
    labId: 'stat-sim-001',
    title: 'Thí nghiệm 9: Tác động của Giá trị Ngoại lai (Outlier) lên Trung bình & Trung vị',
    description: 'Thêm điểm ngoại lai dị biệt (50) để kiểm chứng lý do tại sao Trung vị bền vững hơn Trung bình.',
    modelType: 'statistics_sim',
    visualizationType: 'statistics',
    engine: 'statistics',
    statisticsConfig: {
      mode: 'outlier_effect',
      initialDataset: [5, 6, 6, 7, 7, 8, 8, 9],
    },
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Bấm thêm giá trị Ngoại lai (50)',
        instruction: 'Bấm button "+ Thêm Ngoại lai (50)" và so sánh mức độ biến động giữa Mean và Median.',
        observationInsight: '💡 Trung bình (Mean) tăng vọt từ 7.00 lên 11.78 (bị méo mạnh), trong khi Trung vị (Median) vẫn cực kỳ bền vững ở mức 7.00!',
        formulaHighlight: 'Median bền vững với Outlier',
      },
    ],
    conclusionStep: {
      title: 'Đại lượng nào bền vững hơn khi tập dữ liệu có điểm ngoại lai?',
      options: [
        'Trung vị (Median)',
        'Trung bình cộng (Mean)',
        'Cả hai đều bị ảnh hưởng giống hệt nhau',
      ],
      correctAnswerIndex: 0,
      summary: 'Trung vị (Median) bền vững hơn nhiều so với Trung bình (Mean) khi dữ liệu chứa giá trị ngoại lai dị biệt.',
    },
  },

  // =========================================================================
  // 5. CÁC THÍ NGHIỆM HÌNH HỌC 2D (2D GEOMETRY ENGINE)
  // =========================================================================
  {
    id: 'exp-line-circle-001',
    labId: 'line-circle-001',
    title: 'Thí nghiệm: Vị trí tương đối của Đường thẳng và Đường tròn',
    description: 'Thực hành tương tác thay đổi khoảng cách h từ tâm O tới đường thẳng d để rút ra quy luật số giao điểm.',
    modelType: 'line_circle',
    visualizationType: 'geometry2d',
    engine: 'geometry2d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát h > R',
        instruction: 'Đặt R = 5 cm và kéo đường thẳng d xa tâm O sao cho h = 7 cm.',
        suggestedParams: { r: 5, h: 7 },
        observationInsight: 'Khi h (7 cm) > R (5 cm), đường thẳng d không cắt đường tròn (0 giao điểm).',
        formulaHighlight: 'h > R ⟹ 0 giao điểm',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Di chuyển h = R',
        instruction: 'Kéo đường thẳng d chạm viền đường tròn sao cho h = 5 cm.',
        suggestedParams: { r: 5, h: 5 },
        observationInsight: 'Khi h (5 cm) = R (5 cm), đường thẳng tiếp xúc với đường tròn tại 1 tiếp điểm T (OT ⟂ d).',
        formulaHighlight: 'h = R ⟹ 1 tiếp điểm T',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Đưa h < R',
        instruction: 'Kéo đường thẳng d vào sâu trong đường tròn sao cho h = 3 cm.',
        suggestedParams: { r: 5, h: 3 },
        observationInsight: 'Khi h (3 cm) < R (5 cm), đường thẳng cắt đường tròn tại 2 điểm A, B (dây cung AB = 8 cm, OH ⟂ AB).',
        formulaHighlight: 'h < R ⟹ 2 giao điểm A, B',
      },
    ],
    conclusionStep: {
      title: 'Mối quan hệ giữa h và R quyết định số giao điểm như thế nào?',
      options: [
        'h > R: 0 giao điểm; h = R: 1 tiếp điểm; h < R: 2 giao điểm',
        'h luôn luôn cắt đường tròn tại 2 điểm trong mọi trường hợp',
        'Số giao điểm phụ thuộc vào góc nghiêng θ chứ không phụ thuộc h',
      ],
      correctAnswerIndex: 0,
      summary: 'Số giao điểm giữa đường thẳng và đường tròn được quyết định bởi so sánh khoảng cách h = d(O, d) với bán kính R.',
    },
  },

  {
    id: 'exp-two-circles-001',
    labId: 'two-circles-001',
    title: 'Thí nghiệm: Vị trí tương đối của Hai đường tròn',
    description: 'Thay đổi khoảng cách nối tâm d = OO\' và hai bán kính R, r để khám phá 6 vị trí tương đối.',
    modelType: 'two_circles',
    visualizationType: 'geometry2d',
    engine: 'geometry2d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Hai đường tròn ở ngoài nhau',
        instruction: 'Cho R = 5 cm, r = 3 cm và đặt khoảng cách nối tâm d = 9 cm.',
        suggestedParams: { r1: 5, r2: 3, d: 9 },
        observationInsight: 'Khi d (9 cm) > R + r (8 cm), hai đường tròn ở ngoài nhau (0 giao điểm).',
        formulaHighlight: 'd > R + r',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Tiếp xúc ngoài',
        instruction: 'Giảm khoảng cách d về đúng d = 8 cm.',
        suggestedParams: { r1: 5, r2: 3, d: 8 },
        observationInsight: 'Khi d (8 cm) = R + r (8 cm), hai đường tròn tiếp xúc ngoài tại 1 tiếp điểm T.',
        formulaHighlight: 'd = R + r',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Cắt nhau tại 2 điểm',
        instruction: 'Đưa d về d = 5 cm (giữa |R - r| = 2 cm và R + r = 8 cm).',
        suggestedParams: { r1: 5, r2: 3, d: 5 },
        observationInsight: 'Khi 2 cm < d (5 cm) < 8 cm, hai đường tròn cắt nhau tại 2 điểm A, B (OO\' ⟂ AB tại trung điểm).',
        formulaHighlight: '|R - r| < d < R + r',
      },
    ],
    conclusionStep: {
      title: 'Khoảng cách nối tâm d = OO\' so với R và r quyết định điều gì?',
      options: [
        'Vị trí tương đối và số giao điểm giữa hai đường tròn',
        'Diện tích hình tròn',
        'Góc nghiêng của hai đường tròn',
      ],
      correctAnswerIndex: 0,
      summary: 'So sánh d với tổng R + r và hiệu |R - r| xác định chính xác 6 vị trí tương đối của hai đường tròn.',
    },
  },

  // =========================================================================
  // 6. THÍ NGHIỆM ĐỊNH LÝ PYTHAGORE (PYTHAGOREAN THEOREM)
  // =========================================================================
  {
    id: 'exp-pythagorean-theorem',
    labId: 'pythagorean-theorem-001',
    lessonId: 'lop8-dinh-ly-pythagore',
    title: 'Khám phá và Xây dựng Định lý Pythagore',
    description: 'Quan sát 3 hình vuông trên các cạnh tam giác vuông, thực hiện ghép/tách diện tích và phát hiện quy luật a² + b² = c².',
    modelType: 'pythagorean_theorem',
    visualizationType: 'geometry2d',
    engine: 'geometry2d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát tam giác vuông ban đầu',
        instruction: 'Đặt hai cạnh góc vuông a = 3 cm và b = 4 cm. Quan sát cạnh huyền c và 3 hình vuông dựng trên 3 cạnh.',
        suggestedParams: { a: 3, b: 4 },
        observationInsight: 'Hình vuông trên a có S₁ = 9 cm², hình vuông trên b có S₂ = 16 cm², hình vuông trên cạnh huyền c có S₃ = 25 cm².',
        formulaHighlight: 'S₁ = a², S₂ = b², S₃ = c²',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: So sánh tổng diện tích S₁ + S₂ với S₃',
        instruction: 'Tính tổng S₁ + S₂ = 9 + 16 = 25 cm². So sánh với diện tích hình vuông trên cạnh huyền S₃ = 25 cm².',
        suggestedParams: { a: 3, b: 4 },
        observationInsight: 'Nhận xét: S₁ + S₂ = 9 + 16 = 25 = S₃! Tổng diện tích hai hình vuông nhỏ bằng đúng diện tích hình vuông lớn.',
        formulaHighlight: 'a² + b² = c²',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Thay đổi kích thước sang bộ ba 6 - 8 - 10',
        instruction: 'Kéo thanh trượt a = 6 cm và b = 8 cm. Kiểm tra lại mối quan hệ giữa tổng diện tích hai hình vuông nhỏ và hình vuông lớn.',
        targetParam: 'a',
        targetValue: 6,
        suggestedParams: { a: 6, b: 8 },
        observationInsight: 'Với a = 6, b = 8: S₁ = 36 cm², S₂ = 64 cm² ⇒ S₁ + S₂ = 100 cm² = 10² = c²!',
        formulaHighlight: '6² + 8² = 10²',
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Thí nghiệm Ghép diện tích',
        instruction: 'Chuyển sang tab "🧩 Ghép diện tích" và bấm nút [ Ghép ] để quan sát animation diện tích a² + b² lấp đầy hình vuông c².',
        observationInsight: 'Hai phần diện tích a² và b² ghép lại vừa khít phủ kín toàn bộ hình vuông c² trên cạnh huyền.',
        formulaHighlight: 'a² + b² = c²',
      },
      {
        stepNumber: 5,
        title: 'Bước 5: Kết luận Định lý Pythagore',
        instruction: 'Đọc và ghi nhớ định lý hình học nổi tiếng nhất của nhân loại.',
        observationInsight: '💡 Trong một tam giác vuông, bình phương độ dài cạnh huyền bằng tổng bình phương độ dài hai cạnh góc vuông.',
        formulaHighlight: 'a² + b² = c²',
      },
    ],
    conclusionStep: {
      title: 'Trong một tam giác vuông có hai cạnh góc vuông a, b và cạnh huyền c, hệ thức nào sau đây luôn đúng?',
      options: [
        'a + b = c',
        'a² + b² = c²',
        'a² - b² = c²',
        'a × b = c²',
      ],
      correctAnswerIndex: 1,
      summary: 'Định lý Pythagore: a² + b² = c² (Bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông).',
    },
  },

  // =========================================================================
  // 6. THÍ NGHIỆM HAI TAM GIÁC BẰNG NHAU (CONGRUENT TRIANGLES)
  // =========================================================================
  {
    id: 'exp-congruent-triangles',
    labId: 'congruent-triangles-001',
    slug: 'hai-tam-giac-bang-nhau',
    title: 'Khám phá và Chồng khít Hai tam giác bằng nhau',
    description: 'Thực hành tương tác: quan sát, đo đạc, xoay, tịnh tiến, đối xứng và chồng khít hai tam giác để khám phá 3 trường hợp bằng nhau C-C-C, C-G-C, G-C-G.',
    modelType: 'congruent_triangles',
    visualizationType: 'geometry2d',
    engine: 'geometry2d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát vị trí ban đầu',
        instruction: 'Quan sát hai tam giác △ABC và △A\'B\'C\' ở hai vị trí khác nhau trong mặt phẳng.',
        observationInsight: 'Hai tam giác có thể có vị trí và hướng quay khác nhau.',
        formulaHighlight: '△ABC vs △A\'B\'C\'',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Đo độ dài các cạnh tương ứng',
        instruction: 'Đọc bảng số đo độ dài: AB ↔ A\'B\', BC ↔ B\'C\', CA ↔ C\'A\'.',
        observationInsight: 'Ba cặp cạnh tương ứng đều bằng nhau từng đôi một: AB = A\'B\', BC = B\'C\', CA = C\'A\'.',
        formulaHighlight: 'AB = A\'B\', BC = B\'C\', CA = C\'A\'',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Đo số đo các góc tương ứng',
        instruction: 'So sánh số đo 3 góc: ∠A ↔ ∠A\', ∠B ↔ ∠B\', ∠C ↔ ∠C\'.',
        observationInsight: 'Ba cặp góc tương ứng bằng nhau: ∠A = ∠A\', ∠B = ∠B\', ∠C = ∠C\'.',
        formulaHighlight: '∠A = ∠A\', ∠B = ∠B\', ∠C = ∠C\'',
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Thao tác Xoay & Tịnh tiến',
        instruction: 'Xoay và kéo tam giác △A\'B\'C\' lại gần △ABC.',
        observationInsight: 'Các phép dời hình (quay, tịnh tiến, đối xứng) bảo toàn khoảng cách và góc, không làm biến dạng hình học.',
        formulaHighlight: 'Phép dời hình bảo toàn kích thước',
      },
      {
        stepNumber: 5,
        title: 'Bước 5: Thao tác Chồng khít hoàn toàn',
        instruction: 'Bấm nút [ 🎯 Chồng khít ] để quan sát quá trình hai tam giác trùng khít lên nhau.',
        observationInsight: '💡 Hai tam giác hoàn toàn chồng khít lên nhau, chứng minh tính bằng nhau tuyệt đối.',
        formulaHighlight: '△ABC = △A\'B\'C\'',
      },
    ],
    conclusionStep: {
      title: 'Hai tam giác bằng nhau khi nào?',
      options: [
        'Khi chúng có vị trí và màu sắc giống hệt nhau',
        'Khi các cạnh tương ứng bằng nhau và các góc tương ứng bằng nhau (chồng khít lên nhau)',
        'Chỉ cần diện tích của chúng bằng nhau',
      ],
      correctAnswerIndex: 1,
      summary: 'Hai tam giác bằng nhau là hai tam giác có các cạnh tương ứng bằng nhau và các góc tương ứng bằng nhau. Ký hiệu: △ABC = △A\'B\'C\'.',
    },
  },

  // =========================================================================
  // 7. THÍ NGHIỆM TAM GIÁC ĐỒNG DẠNG VÀ HÌNH ĐỒNG DẠNG (SIMILAR SHAPES)
  // =========================================================================
  {
    id: 'exp-similar-triangles',
    labId: 'similar-triangles-001',
    slug: 'tam-giac-dong-dang',
    title: 'Khám phá Tam giác Đồng dạng và Hình Đồng dạng',
    description: 'Thực hành trực quan: quan sát, phóng to/thu nhỏ, đo góc, so sánh tỉ số cạnh, quan sát diện tích k², kiểm tra 3 trường hợp đồng dạng G-G, C-C-C, C-G-C và mở rộng hình vuông, hình tròn.',
    modelType: 'similar_triangles',
    visualizationType: 'geometry2d',
    engine: 'geometry2d',
    steps: [
      {
        stepNumber: 1,
        title: 'Bước 1: Quan sát hai hình và Phóng to/Thu nhỏ',
        instruction: 'Quan sát hai tam giác △ABC và △A\'B\'C\'. Thử kéo thanh trượt tỉ số k để phóng to/thu nhỏ △A\'B\'C\'.',
        observationInsight: 'Hình dạng của tam giác được giữ nguyên dù kích thước thay đổi.',
        formulaHighlight: 'k = A\'B\' / AB',
      },
      {
        stepNumber: 2,
        title: 'Bước 2: Đo và so sánh các góc tương ứng',
        instruction: 'Đo số đo các góc: ∠A ↔ ∠A\', ∠B ↔ ∠B\', ∠C ↔ ∠C\'.',
        observationInsight: 'Các góc tương ứng luôn bằng nhau dù tam giác bị phóng to hay thu nhỏ: ∠A = ∠A\', ∠B = ∠B\', ∠C = ∠C\'.',
        formulaHighlight: '∠A = ∠A\', ∠B = ∠B\', ∠C = ∠C\'',
      },
      {
        stepNumber: 3,
        title: 'Bước 3: Đo và tính tỉ số các cạnh tương ứng',
        instruction: 'Tính các tỉ số: A\'B\'/AB, B\'C\'/BC, C\'A\'/CA.',
        observationInsight: 'Ba tỉ số luôn bằng nhau và đúng bằng hệ số tỉ số k: A\'B\'/AB = B\'C\'/BC = C\'A\'/CA = k.',
        formulaHighlight: 'A\'B\'/AB = B\'C\'/BC = C\'A\'/CA = k',
      },
      {
        stepNumber: 4,
        title: 'Bước 4: Quan sát quan hệ Diện tích (k²)',
        instruction: 'So sánh diện tích S(A\'B\'C\') và S(ABC) khi thay đổi k.',
        observationInsight: 'Khi độ dài cạnh tăng k lần thì diện tích tăng k² lần: S\'/S = k².',
        formulaHighlight: 'S\'/S = k²',
      },
      {
        stepNumber: 5,
        title: 'Bước 5: Co về k = 1 và Chồng khít',
        instruction: 'Bấm nút [ 🎯 Co về k=1 & Chồng khít ] để chứng minh hai hình đồng dạng có cùng hình dạng.',
        observationInsight: '💡 Hai hình đồng dạng khi thu nhỏ về cùng kích thước sẽ hoàn toàn chồng khít lên nhau.',
        formulaHighlight: '△ABC ∼ △A\'B\'C\'',
      },
    ],
    conclusionStep: {
      title: 'Hai tam giác đồng dạng khi nào?',
      options: [
        'Khi chúng có diện tích và chu vi bằng nhau',
        'Khi các góc tương ứng bằng nhau và các cạnh tương ứng tỉ lệ',
        'Chỉ cần các cạnh bằng nhau từng đôi một',
      ],
      correctAnswerIndex: 1,
      summary: 'Hai tam giác đồng dạng là hai tam giác có các góc tương ứng bằng nhau và các cạnh tương ứng tỉ lệ. Ký hiệu: △ABC ∼ △A\'B\'C\'. Tỉ số diện tích bằng k².',
    },
  },
];

export const getExperimentForModel = (modelType: string, labId?: string): Experiment | undefined => {
  if (labId) {
    const found = experimentsData.find((e) => e.labId === labId);
    if (found) return found;
  }
  return experimentsData.find((e) => e.modelType === modelType);
};
