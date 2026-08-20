/**
 * DICE ENGINE - Domain logic & statistics for 1-die and 2-dice experiments.
 */

export interface DiceSingleStats {
  total: number;
  frequencies: Record<number, number>; // 1..6
  relFrequencies: Record<number, number>;
  theoFrequencies: Record<number, number>; // 1/6 each (~0.1667)
}

export interface DiceTwoStats {
  total: number;
  sumFrequencies: Record<number, number>; // 2..12
  relSumFrequencies: Record<number, number>;
  theoSumFrequencies: Record<number, number>; // 2=1/36, 3=2/36, ... 7=6/36, ... 12=1/36
}

export class DiceEngine {
  /**
   * Theoretical probabilities for single die (1..6)
   */
  public static getTheoreticalSingle(): Record<number, number> {
    const theo: Record<number, number> = {};
    for (let f = 1; f <= 6; f++) {
      theo[f] = Number((1 / 6).toFixed(4));
    }
    return theo;
  }

  /**
   * Theoretical probabilities for two dice sums (2..12)
   */
  public static getTheoreticalTwoDiceSums(): Record<number, number> {
    const combinations: Record<number, number> = {
      2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
    };
    const theo: Record<number, number> = {};
    for (let s = 2; s <= 12; s++) {
      theo[s] = Number((combinations[s] / 36).toFixed(4));
    }
    return theo;
  }

  public static computeSingleStats(frequencies: Record<number, number>): DiceSingleStats {
    let total = 0;
    for (let f = 1; f <= 6; f++) {
      total += frequencies[f] || 0;
    }
    const safeTotal = Math.max(1, total);
    const relFrequencies: Record<number, number> = {};
    for (let f = 1; f <= 6; f++) {
      relFrequencies[f] = Number(((frequencies[f] || 0) / safeTotal).toFixed(4));
    }

    return {
      total,
      frequencies,
      relFrequencies,
      theoFrequencies: DiceEngine.getTheoreticalSingle(),
    };
  }

  public static computeTwoStats(sumFrequencies: Record<number, number>): DiceTwoStats {
    let total = 0;
    for (let s = 2; s <= 12; s++) {
      total += sumFrequencies[s] || 0;
    }
    const safeTotal = Math.max(1, total);
    const relSumFrequencies: Record<number, number> = {};
    for (let s = 2; s <= 12; s++) {
      relSumFrequencies[s] = Number(((sumFrequencies[s] || 0) / safeTotal).toFixed(4));
    }

    return {
      total,
      sumFrequencies,
      relSumFrequencies,
      theoSumFrequencies: DiceEngine.getTheoreticalTwoDiceSums(),
    };
  }

  public static getTwoDiceCombinationsExplanation(sum: number): string {
    const ways: string[] = [];
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (d1 + d2 === sum) {
          ways.push(`(${d1},${d2})`);
        }
      }
    }
    return `Tổng ${sum} có ${ways.length}/36 khả năng: ${ways.join(', ')}`;
  }
}
