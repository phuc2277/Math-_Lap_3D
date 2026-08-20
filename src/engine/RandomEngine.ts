/**
 * RANDOM ENGINE - Controlled random simulation engine for probability experiments.
 */

export interface CoinFlipResult {
  heads: number;
  tails: number;
  total: number;
  history: ('head' | 'tail')[];
  relativeFrequencyHeads: number;
}

export interface DiceRollResult {
  total: number;
  frequencies: Record<number, number>; // 1 -> count, 2 -> count, ...
  relativeFrequencies: Record<number, number>;
}

export interface TwoDiceResult {
  total: number;
  sumFrequencies: Record<number, number>; // 2..12 -> count
  relativeFrequencies: Record<number, number>;
}

export interface MarbleDrawResult {
  drawnColors: ('red' | 'blue' | 'yellow')[];
  counts: { red: number; blue: number; yellow: number };
  relativeFrequencies: { red: number; blue: number; yellow: number };
  remainingInBox: { red: number; blue: number; yellow: number };
}

export interface TwoCoinsResult {
  total: number;
  outcomes: { HH: number; HT: number; TH: number; TT: number };
  headsDistribution: { 0: number; 1: number; 2: number };
  relativeOutcomes: { HH: number; HT: number; TH: number; TT: number };
  relativeHeads: { 0: number; 1: number; 2: number };
  history: ('HH' | 'HT' | 'TH' | 'TT')[];
}

export class RandomEngine {
  /**
   * Single Die Roll (1..6)
   */
  public static rollDie(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  /**
   * Two Dice Roll
   */
  public static rollTwoDiceSingle(): { die1: number; die2: number; sum: number } {
    const die1 = this.rollDie();
    const die2 = this.rollDie();
    return { die1, die2, sum: die1 + die2 };
  }

  /**
   * Single Coin Flip
   */
  public static flipCoin(): 'head' | 'tail' {
    return Math.random() < 0.5 ? 'head' : 'tail';
  }

  /**
   * Two Coins Flip
   */
  public static flipTwoCoinsSingle(): {
    coin1: 'head' | 'tail';
    coin2: 'head' | 'tail';
    outcome: 'HH' | 'HT' | 'TH' | 'TT';
    headsCount: number;
  } {
    const c1 = this.flipCoin();
    const c2 = this.flipCoin();
    let outcome: 'HH' | 'HT' | 'TH' | 'TT' = 'TT';
    let headsCount = 0;

    if (c1 === 'head' && c2 === 'head') {
      outcome = 'HH';
      headsCount = 2;
    } else if (c1 === 'head' && c2 === 'tail') {
      outcome = 'HT';
      headsCount = 1;
    } else if (c1 === 'tail' && c2 === 'head') {
      outcome = 'TH';
      headsCount = 1;
    } else {
      outcome = 'TT';
      headsCount = 0;
    }

    return { coin1: c1, coin2: c2, outcome, headsCount };
  }

  /**
   * Fast simulation for 1 Dice Roll (1 to 6)
   */
  public static simulateDice(count: number): DiceRollResult {
    return this.rollDice(count);
  }

  public static rollDice(count: number): DiceRollResult {
    const frequencies: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (let i = 0; i < count; i++) {
      const face = this.rollDie();
      frequencies[face]++;
    }

    const relativeFrequencies: Record<number, number> = {};
    for (let f = 1; f <= 6; f++) {
      relativeFrequencies[f] = Number((frequencies[f] / Math.max(1, count)).toFixed(4));
    }

    return {
      total: count,
      frequencies,
      relativeFrequencies,
    };
  }

  /**
   * Fast simulation for Two Dice Sum (2 to 12)
   */
  public static simulateTwoDice(count: number): TwoDiceResult {
    return this.rollTwoDice(count);
  }

  public static rollTwoDice(count: number): TwoDiceResult {
    const sumFrequencies: Record<number, number> = {};
    for (let s = 2; s <= 12; s++) {
      sumFrequencies[s] = 0;
    }

    for (let i = 0; i < count; i++) {
      const d1 = this.rollDie();
      const d2 = this.rollDie();
      const sum = d1 + d2;
      sumFrequencies[sum]++;
    }

    const relativeFrequencies: Record<number, number> = {};
    for (let s = 2; s <= 12; s++) {
      relativeFrequencies[s] = Number((sumFrequencies[s] / Math.max(1, count)).toFixed(4));
    }

    return {
      total: count,
      sumFrequencies,
      relativeFrequencies,
    };
  }

  /**
   * Fast simulation for Coin Flips (up to 100,000 trials without freezing main thread)
   */
  public static simulateCoin(count: number): CoinFlipResult {
    return this.flipCoins(count);
  }

  public static flipCoins(count: number): CoinFlipResult {
    let heads = 0;
    const historyLength = Math.min(count, 50);
    const history: ('head' | 'tail')[] = [];

    for (let i = 0; i < count; i++) {
      const result = this.flipCoin();
      if (result === 'head') heads++;
      if (i < historyLength) {
        history.push(result);
      }
    }

    const tails = count - heads;
    return {
      heads,
      tails,
      total: count,
      history,
      relativeFrequencyHeads: Number((heads / Math.max(1, count)).toFixed(4)),
    };
  }

  /**
   * Fast simulation for Two Coins Flip
   */
  public static simulateTwoCoins(count: number): TwoCoinsResult {
    const outcomes = { HH: 0, HT: 0, TH: 0, TT: 0 };
    const headsDistribution = { 0: 0, 1: 0, 2: 0 };
    const history: ('HH' | 'HT' | 'TH' | 'TT')[] = [];
    const historyLength = Math.min(count, 50);

    for (let i = 0; i < count; i++) {
      const res = this.flipTwoCoinsSingle();
      outcomes[res.outcome]++;
      headsDistribution[res.headsCount as 0 | 1 | 2]++;
      if (i < historyLength) {
        history.push(res.outcome);
      }
    }

    const maxCount = Math.max(1, count);
    return {
      total: count,
      outcomes,
      headsDistribution,
      relativeOutcomes: {
        HH: Number((outcomes.HH / maxCount).toFixed(4)),
        HT: Number((outcomes.HT / maxCount).toFixed(4)),
        TH: Number((outcomes.TH / maxCount).toFixed(4)),
        TT: Number((outcomes.TT / maxCount).toFixed(4)),
      },
      relativeHeads: {
        0: Number((headsDistribution[0] / maxCount).toFixed(4)),
        1: Number((headsDistribution[1] / maxCount).toFixed(4)),
        2: Number((headsDistribution[2] / maxCount).toFixed(4)),
      },
      history,
    };
  }

  /**
   * Marble Drawing Simulation (with or without replacement)
   */
  public static drawMarbles(
    red: number,
    blue: number,
    yellow: number,
    drawCount: number,
    withReplacement: boolean
  ): MarbleDrawResult {
    let currentBox = { red, blue, yellow };
    const counts = { red: 0, blue: 0, yellow: 0 };
    const drawnColors: ('red' | 'blue' | 'yellow')[] = [];

    for (let i = 0; i < drawCount; i++) {
      const totalInBox = currentBox.red + currentBox.blue + currentBox.yellow;
      if (totalInBox === 0) break;

      const rand = Math.random() * totalInBox;
      let chosen: 'red' | 'blue' | 'yellow' = 'red';

      if (rand < currentBox.red) {
        chosen = 'red';
      } else if (rand < currentBox.red + currentBox.blue) {
        chosen = 'blue';
      } else {
        chosen = 'yellow';
      }

      counts[chosen]++;
      drawnColors.push(chosen);

      if (!withReplacement) {
        currentBox[chosen] = Math.max(0, currentBox[chosen] - 1);
      }
    }

    const totalDrawn = counts.red + counts.blue + counts.yellow;
    return {
      drawnColors: drawnColors.slice(0, 30), // keep recent 30 for animation
      counts,
      relativeFrequencies: {
        red: Number((counts.red / Math.max(1, totalDrawn)).toFixed(4)),
        blue: Number((counts.blue / Math.max(1, totalDrawn)).toFixed(4)),
        yellow: Number((counts.yellow / Math.max(1, totalDrawn)).toFixed(4)),
      },
      remainingInBox: currentBox,
    };
  }
}
