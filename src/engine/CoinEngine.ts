/**
 * COIN ENGINE - Domain logic & statistics for 1-coin and 2-coin experiments.
 */

export interface CoinSingleOutcome {
  val: 'head' | 'tail';
  trialNumber: number;
}

export interface CoinTwoOutcome {
  coin1: 'head' | 'tail';
  coin2: 'head' | 'tail';
  outcome: 'HH' | 'HT' | 'TH' | 'TT';
  headsCount: number;
  trialNumber: number;
}

export interface CoinSingleStats {
  heads: number;
  tails: number;
  total: number;
  relFrequencyHeads: number;
  relFrequencyTails: number;
  theoreticalHeads: number; // 0.5
  theoreticalTails: number; // 0.5
}

export interface CoinTwoStats {
  total: number;
  outcomes: { HH: number; HT: number; TH: number; TT: number };
  relOutcomes: { HH: number; HT: number; TH: number; TT: number };
  theoOutcomes: { HH: number; HT: number; TH: number; TT: number }; // 0.25 each
  headsDist: { 0: number; 1: number; 2: number };
  relHeadsDist: { 0: number; 1: number; 2: number };
  theoHeadsDist: { 0: number; 1: number; 2: number }; // 0: 0.25, 1: 0.50, 2: 0.25
}

export class CoinEngine {
  public static getTheoreticalSingle(): { head: number; tail: number } {
    return { head: 0.5, tail: 0.5 };
  }

  public static getTheoreticalTwoOutcomes(): { HH: number; HT: number; TH: number; TT: number } {
    return { HH: 0.25, HT: 0.25, TH: 0.25, TT: 0.25 };
  }

  public static getTheoreticalTwoHeadsDist(): { 0: number; 1: number; 2: number } {
    return { 0: 0.25, 1: 0.5, 2: 0.25 };
  }

  public static computeSingleStats(heads: number, tails: number): CoinSingleStats {
    const total = heads + tails;
    const safeTotal = Math.max(1, total);
    return {
      heads,
      tails,
      total,
      relFrequencyHeads: Number((heads / safeTotal).toFixed(4)),
      relFrequencyTails: Number((tails / safeTotal).toFixed(4)),
      theoreticalHeads: 0.5,
      theoreticalTails: 0.5,
    };
  }

  public static computeTwoStats(outcomes: { HH: number; HT: number; TH: number; TT: number }): CoinTwoStats {
    const total = outcomes.HH + outcomes.HT + outcomes.TH + outcomes.TT;
    const safeTotal = Math.max(1, total);

    const headsDist = {
      0: outcomes.TT,
      1: outcomes.HT + outcomes.TH,
      2: outcomes.HH,
    };

    return {
      total,
      outcomes,
      relOutcomes: {
        HH: Number((outcomes.HH / safeTotal).toFixed(4)),
        HT: Number((outcomes.HT / safeTotal).toFixed(4)),
        TH: Number((outcomes.TH / safeTotal).toFixed(4)),
        TT: Number((outcomes.TT / safeTotal).toFixed(4)),
      },
      theoOutcomes: CoinEngine.getTheoreticalTwoOutcomes(),
      headsDist,
      relHeadsDist: {
        0: Number((headsDist[0] / safeTotal).toFixed(4)),
        1: Number((headsDist[1] / safeTotal).toFixed(4)),
        2: Number((headsDist[2] / safeTotal).toFixed(4)),
      },
      theoHeadsDist: CoinEngine.getTheoreticalTwoHeadsDist(),
    };
  }

  public static formatOutcomeName(outcome: 'head' | 'tail' | 'HH' | 'HT' | 'TH' | 'TT'): string {
    switch (outcome) {
      case 'head':
        return 'Ngửa (H)';
      case 'tail':
        return 'Sấp (T)';
      case 'HH':
        return 'Ngửa - Ngửa';
      case 'HT':
        return 'Ngửa - Sấp';
      case 'TH':
        return 'Sấp - Ngửa';
      case 'TT':
        return 'Sấp - Sấp';
      default:
        return outcome;
    }
  }
}
