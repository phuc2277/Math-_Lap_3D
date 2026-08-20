/**
 * PHYSICS ANIMATION ENGINE - Controls experiment animation lifecycle phases
 * and audio feedback without altering random outcomes.
 */

export type ExperimentState =
  | 'IDLE'
  | 'READY'
  | 'TOSSING'
  | 'FLYING'
  | 'ROTATING'
  | 'FALLING'
  | 'SETTLING'
  | 'RESULT'
  | 'COMPLETED';

export interface PhysicsAnimationConfig {
  durationMs: number;
  enableSound: boolean;
}

export class PhysicsAnimationEngine {
  private static audioCtx: AudioContext | null = null;

  public static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Play realistic wooden/table impact sound using Web Audio API
   */
  public static playImpactSound(type: 'coin' | 'dice') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'coin') {
        // High metallic click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      } else {
        // Wooden thud / rattle
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore audio autoplay restrictions gracefully
    }
  }

  /**
   * Sequence callback steps for visual experiment phases
   */
  public static runAnimationSequence(
    type: 'coin' | 'dice',
    enableSound: boolean,
    onStateChange: (state: ExperimentState) => void,
    onComplete: () => void
  ) {
    onStateChange('TOSSING');

    setTimeout(() => {
      onStateChange('FLYING');
    }, 200);

    setTimeout(() => {
      onStateChange('ROTATING');
    }, 450);

    setTimeout(() => {
      onStateChange('FALLING');
    }, 850);

    setTimeout(() => {
      onStateChange('SETTLING');
      if (enableSound) {
        PhysicsAnimationEngine.playImpactSound(type);
      }
    }, 1150);

    setTimeout(() => {
      if (enableSound) {
        // Secondary soft bounce sound
        PhysicsAnimationEngine.playImpactSound(type);
      }
    }, 1300);

    setTimeout(() => {
      onStateChange('RESULT');
      onComplete();
    }, 1500);
  }
}
