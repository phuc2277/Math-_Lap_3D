/**
 * EXPERIMENT GRADER - Pedagogy, prediction evaluation, and Law of Large Numbers analysis.
 */

export interface PredictionGradeResult {
  prediction: string;
  actualSummary: string;
  isClose: boolean;
  explanation: string;
}

export class ExperimentGrader {
  public static evaluatePrediction(
    experimentType: 'coin_1' | 'coin_2' | 'dice_1' | 'dice_2',
    prediction: string,
    completedTrials: number,
    actualData: any
  ): PredictionGradeResult {
    if (completedTrials === 0 || !prediction) {
      return {
        prediction: prediction || 'Chưa dự đoán',
        actualSummary: 'Chưa có dữ liệu thực nghiệm',
        isClose: false,
        explanation: 'Hãy tiến hành thử nghiệm để so sánh dự đoán với kết quả thực tế.',
      };
    }

    if (experimentType === 'dice_1') {
      const face6Count = actualData?.frequencies?.[6] || 0;
      const pct = (face6Count / completedTrials) * 100;
      const actualSummary = `Mặt 6 xuất hiện ${face6Count}/${completedTrials} lần (${pct.toFixed(1)}%)`;

      return {
        prediction,
        actualSummary,
        isClose: true,
        explanation: `Theo lý thuyết mặt 6 có xác suất 1/6 (~16.7%). Trong thực nghiệm của em, mặt 6 xuất hiện ${pct.toFixed(1)}%.`,
      };
    }

    if (experimentType === 'dice_2') {
      const sum7Count = actualData?.sumFrequencies?.[7] || 0;
      const pct = (sum7Count / completedTrials) * 100;
      const actualSummary = `Tổng 7 xuất hiện ${sum7Count}/${completedTrials} lần (${pct.toFixed(1)}%)`;

      return {
        prediction,
        actualSummary,
        isClose: true,
        explanation: `Tổng 7 có 6/36 = 16.67% khả năng xuất hiện, là tổng có xác suất cao nhất. Kết quả thực nghiệm của em đạt ${pct.toFixed(1)}%.`,
      };
    }

    if (experimentType === 'coin_1') {
      const heads = actualData?.heads || 0;
      const pct = (heads / completedTrials) * 100;
      const actualSummary = `Mặt Ngửa xuất hiện ${heads}/${completedTrials} lần (${pct.toFixed(1)}%)`;

      return {
        prediction,
        actualSummary,
        isClose: true,
        explanation: `Xác suất lý thuyết mặt Ngửa là 50%. Tần suất thực nghiệm của em đạt ${pct.toFixed(1)}%.`,
      };
    }

    // coin_2
    const hhCount = actualData?.outcomes?.HH || 0;
    const pct = (hhCount / completedTrials) * 100;
    const actualSummary = `2 mặt Ngửa (HH) xuất hiện ${hhCount}/${completedTrials} lần (${pct.toFixed(1)}%)`;

    return {
      prediction,
      actualSummary,
      isClose: true,
      explanation: `Lý thuyết cho 2 mặt Ngửa là 1/4 = 25%. Kết quả thực nghiệm của em đạt ${pct.toFixed(1)}%.`,
    };
  }

  /**
   * Compute percentage point diff between relative frequency and theoretical probability
   */
  public static computePercentageDiff(empRelFreq: number, theoProb: number): string {
    const diffPct = Math.abs((empRelFreq - theoProb) * 100);
    return `${diffPct.toFixed(2)} điểm %`;
  }
}
