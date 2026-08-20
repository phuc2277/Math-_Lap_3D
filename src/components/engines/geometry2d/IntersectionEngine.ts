import { LineCircleAnalysis, TwoCirclesAnalysis } from './GeometryMath';

export interface PositionSummary {
  badgeColor: string;
  badgeText: string;
  conditionMath: string;
  pointsText: string;
  explanation: string;
}

export class IntersectionEngine {
  /**
   * Formats Line-Circle analysis into pedagogical display elements.
   */
  static getLineCircleSummary(analysis: LineCircleAnalysis): PositionSummary {
    const { status, h, R, chordLength } = analysis;

    switch (status) {
      case 'outside':
        return {
          badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800',
          badgeText: 'ĐƯỜNG THẲNG KHÔNG CẮT ĐƯỜNG TRÒN',
          conditionMath: `h (${h.toFixed(2)}) > R (${R.toFixed(2)})`,
          pointsText: '0 giao điểm',
          explanation: `Khoảng cách từ tâm O đến đường thẳng d (h = ${h.toFixed(2)} cm) LỚN HƠN bán kính R (${R.toFixed(2)} cm), nên đường thẳng và đường tròn không có điểm chung.`,
        };

      case 'tangent':
        return {
          badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
          badgeText: 'ĐƯỜNG THẲNG TIẾP XÚC ĐƯỜNG TRÒN',
          conditionMath: `h (${h.toFixed(2)}) = R (${R.toFixed(2)})`,
          pointsText: '1 tiếp điểm T',
          explanation: `Khoảng cách h BẰNG BÁN KÍNH R (${R.toFixed(2)} cm). Đường thẳng d là tiếp tuyến của đường tròn tại duy nhất 1 tiếp điểm T, và bán kính OT ⟂ d.`,
        };

      case 'secant':
        return {
          badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          badgeText: 'ĐƯỜNG THẲNG CẮT ĐƯỜNG TRÒN TẠI 2 ĐIỂM',
          conditionMath: `h (${h.toFixed(2)}) < R (${R.toFixed(2)})`,
          pointsText: '2 giao điểm A, B',
          explanation: `Khoảng cách h (${h.toFixed(2)} cm) NHỎ HƠN bán kính R (${R.toFixed(2)} cm). Đường thẳng d cắt đường tròn tạo thành dây cung AB = ${chordLength.toFixed(2)} cm. Chân đường vuông góc H là trung điểm của AB (OH ⟂ AB).`,
        };
    }
  }

  /**
   * Formats Two-Circles analysis into pedagogical display elements.
   */
  static getTwoCirclesSummary(analysis: TwoCirclesAnalysis): PositionSummary {
    const { status, d, R1, R2, chordLength } = analysis;
    const Rsum = R1 + R2;
    const Rdiff = Math.abs(R1 - R2);

    switch (status) {
      case 'outside':
        return {
          badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
          badgeText: 'HAI ĐƯỜNG TRÒN Ở NGOÀI NHAU',
          conditionMath: `d (${d.toFixed(2)}) > R + r (${Rsum.toFixed(2)})`,
          pointsText: '0 giao điểm',
          explanation: `Khoảng cách hai tâm d = ${d.toFixed(2)} cm lớn hơn tổng hai bán kính R + r = ${Rsum.toFixed(2)} cm. Hai đường tròn nằm hoàn toàn tách biệt ngoài nhau.`,
        };

      case 'tangent_external':
        return {
          badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800',
          badgeText: 'HAI ĐƯỜNG TRÒN TIẾP XÚC NGOÀI',
          conditionMath: `d (${d.toFixed(2)}) = R + r (${Rsum.toFixed(2)})`,
          pointsText: '1 tiếp điểm T',
          explanation: `Khoảng cách nối tâm d đúng bằng tổng hai bán kính R + r = ${Rsum.toFixed(2)} cm. Tiếp điểm T nằm giữa O và O' trên đường nối tâm.`,
        };

      case 'intersecting':
        return {
          badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
          badgeText: 'HAI ĐƯỜNG TRÒN CẮT NHAU TẠI 2 ĐIỂM',
          conditionMath: `|R - r| (${Rdiff.toFixed(2)}) < d (${d.toFixed(2)}) < R + r (${Rsum.toFixed(2)})`,
          pointsText: '2 giao điểm A, B',
          explanation: `Khoảng cách hai tâm d = ${d.toFixed(2)} cm nằm giữa hiệu và tổng hai bán kính. Hai đường tròn cắt nhau tại A và B, đoạn AB là dây chung có độ dài = ${chordLength.toFixed(2)} cm (OO' ⟂ AB tại trung điểm).`,
        };

      case 'tangent_internal':
        return {
          badgeColor: 'bg-sky-950/80 text-sky-300 border-sky-800',
          badgeText: 'HAI ĐƯỜNG TRÒN TIẾP XÚC TRONG',
          conditionMath: `d (${d.toFixed(2)}) = |R - r| (${Rdiff.toFixed(2)})`,
          pointsText: '1 tiếp điểm T',
          explanation: `Khoảng cách nối tâm d bằng hiệu hai bán kính |R - r| = ${Rdiff.toFixed(2)} cm. Đường tròn nhỏ nằm trong đường tròn lớn và chạm nhau tại duy nhất tiếp điểm T.`,
        };

      case 'inside':
        return {
          badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800',
          badgeText: 'MỘT ĐƯỜNG TRÒN NẰM TRONG ĐƯỜNG TRÒN KIA',
          conditionMath: `d (${d.toFixed(2)}) < |R - r| (${Rdiff.toFixed(2)})`,
          pointsText: '0 giao điểm',
          explanation: `Khoảng cách hai tâm d = ${d.toFixed(2)} cm nhỏ hơn hiệu hai bán kính |R - r| = ${Rdiff.toFixed(2)} cm. Đường tròn nhỏ nằm hoàn toàn bên trong đường tròn lớn không chạm nhau.`,
        };

      case 'concentric':
        return {
          badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-800',
          badgeText: 'HAI ĐƯỜNG TRÒN ĐỒNG TÂM',
          conditionMath: `d = 0 (O ≡ O') và R ≠ r`,
          pointsText: '0 giao điểm',
          explanation: `Tâm O và O' trùng nhau (d = 0 cm), nhưng hai bán kính khác nhau (R = ${R1} cm, r = ${R2} cm), tạo thành hai vòng tròn đồng tâm.`,
        };

      case 'coincident':
        return {
          badgeColor: 'bg-teal-950/80 text-teal-300 border-teal-800',
          badgeText: 'HAI ĐƯỜNG TRÒN TRÙNG NHAU',
          conditionMath: `d = 0 và R = r`,
          pointsText: 'Vô số điểm chung',
          explanation: `Tâm O ≡ O' và hai bán kính bằng nhau (R = r = ${R1} cm). Hai đường tròn hoàn toàn trùng khít lên nhau.`,
        };
    }
  }

  /**
   * Comparative conceptual structure mapping for classroom comparisons.
   */
  static getComparisonMatrix() {
    return [
      {
        aspect: 'Yếu tố chính xác định',
        lineCircle: 'Khoảng cách h từ tâm O đến đường thẳng d vs Bán kính R',
        twoCircles: 'Khoảng cách nối tâm d = OO\' vs Bán kính R và r',
      },
      {
        aspect: 'Trường hợp không có điểm chung',
        lineCircle: 'h > R (Đường thẳng ở ngoài)',
        twoCircles: 'd > R + r (Ở ngoài nhau) HOẶC d < |R - r| (Nằm trong nhau)',
      },
      {
        aspect: 'Trường hợp 1 điểm chung (Tiếp xúc)',
        lineCircle: 'h = R (Tiếp tuyến tại T, OT ⟂ d)',
        twoCircles: 'd = R + r (Tiếp xúc ngoài) HOẶC d = |R - r| (Tiếp xúc trong)',
      },
      {
        aspect: 'Trường hợp 2 điểm chung (Cắt nhau)',
        lineCircle: 'h < R (Cắt tại A, B; dây cung AB, OH ⟂ AB)',
        twoCircles: '|R - r| < d < R + r (Cắt tại A, B; dây chung AB, OO\' ⟂ AB)',
      },
    ];
  }
}
