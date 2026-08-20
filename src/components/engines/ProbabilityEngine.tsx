import React, { useState, useEffect, useRef } from 'react';
import { ModelParams } from '../../types/geometry';
import { RandomEngine } from '../../engine/RandomEngine';
import { MathEngine } from '../../engine/MathEngine';
import { CoinEngine } from '../../engine/CoinEngine';
import { DiceEngine } from '../../engine/DiceEngine';
import { PhysicsAnimationEngine, ExperimentState } from '../../engine/PhysicsAnimationEngine';
import { ExperimentGrader } from '../../engine/ExperimentGrader';
import { Dice3DVisual } from './visuals/Dice3DVisual';
import { Coin3DVisual } from './visuals/Coin3DVisual';
import { SpinnerVisual } from './visuals/SpinnerVisual';
import { MarblesVisual } from './visuals/MarblesVisual';
import { PostMessageBridge } from '../../integration/postMessage';
import {
  Dices,
  Disc,
  Sparkles,
  RefreshCw,
  Layers,
  HelpCircle,
  Activity,
  Play,
  Zap,
  CheckCircle2,
  Eye,
  EyeOff,
  BarChart3,
  BookOpen,
  Volume2,
  VolumeX,
  Settings,
  Trophy,
  History,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Copy,
  Save,
  CircleDot,
  Package,
} from 'lucide-react';

interface ProbabilityEngineProps {
  params: ModelParams;
  onParamChange?: (key: keyof ModelParams, value: number) => void;
  probabilityConfig?: {
    mode?: 'coin' | 'dice' | 'two_dice' | 'marbles' | 'spinner';
    defaultTrials?: number;
    withReplacement?: boolean;
  };
}

type MainType = 'coin' | 'dice' | 'spinner' | 'marbles';
type CoinSubMode = '1_coin' | '2_coin';
type DiceSubMode = '1_dice' | '2_dice';

export const ProbabilityEngine: React.FC<ProbabilityEngineProps> = ({
  params,
  probabilityConfig,
}) => {
  const postMessageBridge = PostMessageBridge.getInstance();

  // ----------------------------------------------------
  // EXPERIMENT CONFIGURATION (TEACHER & SYSTEM)
  // ----------------------------------------------------
  const [mainType, setMainType] = useState<MainType>(() => {
    if (probabilityConfig?.mode === 'coin') return 'coin';
    if (probabilityConfig?.mode === 'marbles') return 'marbles';
    return 'dice';
  });

  const [coinSubMode, setCoinSubMode] = useState<CoinSubMode>('1_coin');
  const [diceSubMode, setDiceSubMode] = useState<DiceSubMode>(
    probabilityConfig?.mode === 'two_dice' ? '2_dice' : '1_dice'
  );

  // Target trial count set by teacher (default 50)
  const [trialCount, setTrialCount] = useState<number>(probabilityConfig?.defaultTrials || 50);
  const [customTrialInput, setCustomTrialInput] = useState<string>('50');

  // Teacher permission toggle: allow student to choose trial count
  const [allowStudentTrialCount, setAllowStudentTrialCount] = useState<boolean>(true);
  const [minTrialLimit, setMinTrialLimit] = useState<number>(10);
  const [maxTrialLimit, setMaxTrialLimit] = useState<number>(1000);

  // View role: 'student' or 'teacher'
  const [viewRole, setViewRole] = useState<'student' | 'teacher'>('student');
  const [showTeacherConfig, setShowTeacherConfig] = useState<boolean>(false);

  // Fullscreen mode state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(!isFullscreen);
        });
      } else {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Simulation settings
  const [fastSimulation, setFastSimulation] = useState<boolean>(false);
  const [enableSound, setEnableSound] = useState<boolean>(true);
  const [showTheoretical, setShowTheoretical] = useState<boolean>(true);

  // Animation & Physics Lifecycle State
  const [experimentState, setExperimentState] = useState<ExperimentState>('IDLE');
  const isRolling = ['TOSSING', 'FLYING', 'ROTATING', 'FALLING', 'SETTLING'].includes(experimentState);

  // Completed trials progress counter
  const [completedTrials, setCompletedTrials] = useState<number>(0);

  // ----------------------------------------------------
  // DATA STATES FOR EXPERIMENTS
  // ----------------------------------------------------
  // 1 Coin
  const [coin1Value, setCoin1Value] = useState<'head' | 'tail'>('head');
  const [coin1Counts, setCoin1Counts] = useState<{ head: number; tail: number }>({ head: 0, tail: 0 });
  const [coin1History, setCoin1History] = useState<{ trial: number; val: 'head' | 'tail' }[]>([]);

  // 2 Coins
  const [twoCoinsValues, setTwoCoinsValues] = useState<{
    coin1: 'head' | 'tail';
    coin2: 'head' | 'tail';
    outcome: 'HH' | 'HT' | 'TH' | 'TT';
    headsCount: number;
  }>({
    coin1: 'head',
    coin2: 'tail',
    outcome: 'HT',
    headsCount: 1,
  });
  const [twoCoinsOutcomes, setTwoCoinsOutcomes] = useState<{ HH: number; HT: number; TH: number; TT: number }>({
    HH: 0, HT: 0, TH: 0, TT: 0,
  });
  const [twoCoinsHistory, setTwoCoinsHistory] = useState<
    { trial: number; outcome: 'HH' | 'HT' | 'TH' | 'TT'; headsCount: number }[]
  >([]);

  // 1 Die
  const [die1Value, setDie1Value] = useState<number>(5);
  const [die1Frequencies, setDie1Frequencies] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
  });
  const [die1History, setDie1History] = useState<{ trial: number; val: number }[]>([]);

  // 2 Dice
  const [twoDiceValues, setTwoDiceValues] = useState<{ die1: number; die2: number; sum: number }>({
    die1: 3,
    die2: 5,
    sum: 8,
  });
  const [twoDiceSumFreq, setTwoDiceSumFreq] = useState<Record<number, number>>({
    2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0,
  });
  const [twoDiceHistory, setTwoDiceHistory] = useState<
    { trial: number; die1: number; die2: number; sum: number }[]
  >([]);

  // Spinner Wheel State
  const [spinnerSectorsCount, setSpinnerSectorsCount] = useState<number>(4);
  const [spinnerCurrentSector, setSpinnerCurrentSector] = useState<number>(1);
  const [spinnerFrequencies, setSpinnerFrequencies] = useState<Record<number, number>>({
    1: 0, 2: 0, 3: 0, 4: 0,
  });

  // Marbles Draw State
  const [marblesRed, setMarblesRed] = useState<number>(params.red || 4);
  const [marblesBlue, setMarblesBlue] = useState<number>(params.blue || 3);
  const [marblesYellow, setMarblesYellow] = useState<number>(params.yellow || 3);
  const [lastDrawnMarble, setLastDrawnMarble] = useState<'red' | 'blue' | 'yellow' | null>(null);
  const [marblesFrequencies, setMarblesFrequencies] = useState<{ red: number; blue: number; yellow: number }>({
    red: 0, blue: 0, yellow: 0,
  });

  // Saved Experiments & Duplicate Feature
  const [savedExperiments, setSavedExperiments] = useState<
    { id: string; name: string; mainType: MainType; trials: number; date: string }[]
  >(() => {
    try {
      const saved = localStorage.getItem('mathlab_saved_experiments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [newExpNameInput, setNewExpNameInput] = useState<string>('');

  const saveCurrentExperiment = (name?: string) => {
    const expName = name || newExpNameInput || `Thí nghiệm ${mainType.toUpperCase()} - ${trialCount} lần`;
    const newExp = {
      id: `exp-${Date.now()}`,
      name: expName,
      mainType,
      trials: trialCount,
      date: new Date().toLocaleDateString('vi-VN'),
    };
    const updated = [newExp, ...savedExperiments];
    setSavedExperiments(updated);
    try {
      localStorage.setItem('mathlab_saved_experiments', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewExpNameInput('');
  };

  const duplicateExperiment = (exp: { id: string; name: string; mainType: MainType; trials: number; date: string }) => {
    const dupExp = {
      id: `exp-${Date.now()}`,
      name: `${exp.name} (Bản sao)`,
      mainType: exp.mainType,
      trials: exp.trials,
      date: new Date().toLocaleDateString('vi-VN'),
    };
    const updated = [dupExp, ...savedExperiments];
    setSavedExperiments(updated);
    try {
      localStorage.setItem('mathlab_saved_experiments', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Convergence Log for Law of Large Numbers
  const [convergenceLog, setConvergenceLog] = useState<{ n: number; freq: number }[]>([]);

  // Prediction & Pedagogy
  const [prediction, setPrediction] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState<boolean>(false);
  const [teacherShowAnswer, setTeacherShowAnswer] = useState<boolean>(false);

  // ----------------------------------------------------
  // LOG ACTIVITY HELPER
  // ----------------------------------------------------
  const logEvent = (type: string, details: Record<string, any> = {}) => {
    postMessageBridge.logActivity({
      type: type as any,
      labId: 'prob-sim-001',
      details,
      timestamp: new Date().toISOString(),
    });
  };

  useEffect(() => {
    logEvent('EXPERIMENT_OPENED', { mainType, coinSubMode, diceSubMode, trialCount });
  }, []);

  // Log Mode changes
  useEffect(() => {
    logEvent(mainType === 'dice' ? 'DICE_SELECTED' : 'COIN_SELECTED', {
      mainType,
      subMode: mainType === 'dice' ? diceSubMode : coinSubMode,
    });
  }, [mainType, diceSubMode, coinSubMode]);

  // Reset experiment statistics and progress
  const handleReset = () => {
    setExperimentState('IDLE');
    setCompletedTrials(0);
    setConvergenceLog([]);
    setPrediction(null);
    setSelectedAnswer(null);
    setAnswerSubmitted(false);

    setCoin1Counts({ head: 0, tail: 0 });
    setCoin1History([]);

    setTwoCoinsOutcomes({ HH: 0, HT: 0, TH: 0, TT: 0 });
    setTwoCoinsHistory([]);

    setDie1Frequencies({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
    setDie1History([]);

    setTwoDiceSumFreq({ 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 });
    setTwoDiceHistory([]);

    logEvent('EXPERIMENT_RESET', { mainType });
  };

  // ----------------------------------------------------
  // EXECUTE SIMULATION / TRIAL
  // ----------------------------------------------------
  const executeTrialBatch = (count: number) => {
    if (isRolling || completedTrials >= trialCount) return;

    // Cap remaining trials to not exceed trialCount
    const actualBatch = Math.min(count, trialCount - completedTrials);
    if (actualBatch <= 0) return;

    const isSingleVisual = actualBatch === 1 && !fastSimulation;

    if (isSingleVisual) {
      // ------------------------------------------------
      // VISUAL SINGLE TRIAL (ANIMATION LIFECYCLE)
      // ------------------------------------------------
      setExperimentState('READY');
      logEvent(mainType === 'dice' ? 'ROLL_STARTED' : 'COIN_FLIP_STARTED', { batchCount: 1 });

      // Step 1: RandomEngine determines result FIRST
      let outcomeData: any = null;

      if (mainType === 'coin') {
        if (coinSubMode === '1_coin') {
          outcomeData = RandomEngine.flipCoin();
          setCoin1Value(outcomeData);
        } else {
          outcomeData = RandomEngine.flipTwoCoinsSingle();
          setTwoCoinsValues(outcomeData);
        }
      } else if (mainType === 'dice') {
        if (diceSubMode === '1_dice') {
          outcomeData = RandomEngine.rollDie();
          setDie1Value(outcomeData);
        } else {
          outcomeData = RandomEngine.rollTwoDiceSingle();
          setTwoDiceValues(outcomeData);
        }
      } else if (mainType === 'spinner') {
        outcomeData = Math.floor(Math.random() * spinnerSectorsCount) + 1;
        setSpinnerCurrentSector(outcomeData);
      } else if (mainType === 'marbles') {
        const pool: ('red' | 'blue' | 'yellow')[] = [];
        for (let i = 0; i < marblesRed; i++) pool.push('red');
        for (let i = 0; i < marblesBlue; i++) pool.push('blue');
        for (let i = 0; i < marblesYellow; i++) pool.push('yellow');
        outcomeData = pool[Math.floor(Math.random() * (pool.length || 1))] || 'red';
        setLastDrawnMarble(outcomeData);
      }

      // Step 2: PhysicsAnimationEngine runs physical animation lifecycle
      PhysicsAnimationEngine.runAnimationSequence(
        mainType === 'coin' ? 'coin' : 'dice',
        enableSound,
        (state) => setExperimentState(state),
        () => {
          // Step 3: Record result AFTER animation settles
          setCompletedTrials((prev) => {
            const nextTrial = prev + 1;

            if (mainType === 'coin') {
              if (coinSubMode === '1_coin') {
                const val = outcomeData as 'head' | 'tail';
                setCoin1Counts((c) => {
                  const nextC = { ...c, [val]: c[val] + 1 };
                  const relH = Number((nextC.head / nextTrial).toFixed(4));
                  setConvergenceLog((log) => [...log, { n: nextTrial, freq: relH }]);
                  return nextC;
                });
                setCoin1History((h) => [{ trial: nextTrial, val }, ...h].slice(0, 30));
                logEvent('COIN_FLIP_COMPLETED', { outcome: val, trial: nextTrial });
              } else {
                const res = outcomeData as { coin1: 'head' | 'tail'; coin2: 'head' | 'tail'; outcome: 'HH' | 'HT' | 'TH' | 'TT'; headsCount: number };
                setTwoCoinsOutcomes((out) => ({ ...out, [res.outcome]: out[res.outcome] + 1 }));
                setTwoCoinsHistory((h) => [{ trial: nextTrial, outcome: res.outcome, headsCount: res.headsCount }, ...h].slice(0, 30));
                logEvent('COIN_FLIP_COMPLETED', { outcome: res.outcome, trial: nextTrial });
              }
            } else if (mainType === 'dice') {
              if (diceSubMode === '1_dice') {
                const face = outcomeData as number;
                setDie1Frequencies((f) => {
                  const nextF = { ...f, [face]: f[face] + 1 };
                  const rel6 = Number((nextF[6] / nextTrial).toFixed(4));
                  setConvergenceLog((log) => [...log, { n: nextTrial, freq: rel6 }]);
                  return nextF;
                });
                setDie1History((h) => [{ trial: nextTrial, val: face }, ...h].slice(0, 30));
                logEvent('ROLL_COMPLETED', { outcome: face, trial: nextTrial });
              } else {
                const res = outcomeData as { die1: number; die2: number; sum: number };
                setTwoDiceSumFreq((sf) => {
                  const nextSF = { ...sf, [res.sum]: sf[res.sum] + 1 };
                  const rel7 = Number((nextSF[7] / nextTrial).toFixed(4));
                  setConvergenceLog((log) => [...log, { n: nextTrial, freq: rel7 }]);
                  return nextSF;
                });
                setTwoDiceHistory((h) => [{ trial: nextTrial, die1: res.die1, die2: res.die2, sum: res.sum }, ...h].slice(0, 30));
                logEvent('ROLL_COMPLETED', { outcome: res.sum, trial: nextTrial });
              }
            } else if (mainType === 'spinner') {
              const sec = outcomeData as number;
              setSpinnerFrequencies((sf) => ({ ...sf, [sec]: (sf[sec] || 0) + 1 }));
            } else if (mainType === 'marbles') {
              const color = outcomeData as 'red' | 'blue' | 'yellow';
              setMarblesFrequencies((mf) => ({ ...mf, [color]: mf[color] + 1 }));
            }

            if (nextTrial >= trialCount) {
              setExperimentState('COMPLETED');
              logEvent('EXPERIMENT_COMPLETED', { trialCount: nextTrial });
            }

            return nextTrial;
          });
        }
      );
    } else {
      // ------------------------------------------------
      // FAST / BATCH SIMULATION
      // ------------------------------------------------
      logEvent('SIMULATION_STARTED', { batchCount: actualBatch });

      setCompletedTrials((prev) => {
        const nextTrial = prev + actualBatch;

        if (mainType === 'coin') {
          if (coinSubMode === '1_coin') {
            const res = RandomEngine.simulateCoin(actualBatch);
            setCoin1Counts((c) => {
              const nextC = { head: c.head + res.heads, tail: c.tail + res.tails };
              const relH = Number((nextC.head / nextTrial).toFixed(4));
              setConvergenceLog((log) => [...log, { n: nextTrial, freq: relH }]);
              return nextC;
            });
          } else {
            const res = RandomEngine.simulateTwoCoins(actualBatch);
            setTwoCoinsOutcomes((out) => ({
              HH: out.HH + res.outcomes.HH,
              HT: out.HT + res.outcomes.HT,
              TH: out.TH + res.outcomes.TH,
              TT: out.TT + res.outcomes.TT,
            }));
          }
        } else if (mainType === 'spinner') {
          setSpinnerFrequencies((sf) => {
            const nextSF = { ...sf };
            for (let i = 0; i < actualBatch; i++) {
              const sec = Math.floor(Math.random() * spinnerSectorsCount) + 1;
              nextSF[sec] = (nextSF[sec] || 0) + 1;
            }
            return nextSF;
          });
        } else if (mainType === 'marbles') {
          setMarblesFrequencies((mf) => {
            const pool: ('red' | 'blue' | 'yellow')[] = [];
            for (let i = 0; i < marblesRed; i++) pool.push('red');
            for (let i = 0; i < marblesBlue; i++) pool.push('blue');
            for (let i = 0; i < marblesYellow; i++) pool.push('yellow');

            const nextMF = { ...mf };
            for (let i = 0; i < actualBatch; i++) {
              const picked = pool[Math.floor(Math.random() * (pool.length || 1))] || 'red';
              nextMF[picked] = nextMF[picked] + 1;
            }
            return nextMF;
          });
        } else if (mainType === 'dice') {
          if (diceSubMode === '1_dice') {
            const res = RandomEngine.simulateDice(actualBatch);
            setDie1Frequencies((f) => {
              const nextF = { ...f };
              for (let d = 1; d <= 6; d++) {
                nextF[d] = (nextF[d] || 0) + res.frequencies[d];
              }
              const rel6 = Number((nextF[6] / nextTrial).toFixed(4));
              setConvergenceLog((log) => [...log, { n: nextTrial, freq: rel6 }]);
              return nextF;
            });
          } else {
            const res = RandomEngine.simulateTwoDice(actualBatch);
            setTwoDiceSumFreq((sf) => {
              const nextSF = { ...sf };
              for (let s = 2; s <= 12; s++) {
                nextSF[s] = (nextSF[s] || 0) + res.sumFrequencies[s];
              }
              const rel7 = Number((nextSF[7] / nextTrial).toFixed(4));
              setConvergenceLog((log) => [...log, { n: nextTrial, freq: rel7 }]);
              return nextSF;
            });
          }
        } else if (mainType === 'spinner') {
          setSpinnerFrequencies((sf) => {
            const nextSF = { ...sf };
            for (let i = 0; i < actualBatch; i++) {
              const sec = Math.floor(Math.random() * spinnerSectorsCount) + 1;
              nextSF[sec] = (nextSF[sec] || 0) + 1;
            }
            return nextSF;
          });
        } else if (mainType === 'marbles') {
          setMarblesFrequencies((mf) => {
            const pool: ('red' | 'blue' | 'yellow')[] = [];
            for (let i = 0; i < marblesRed; i++) pool.push('red');
            for (let i = 0; i < marblesBlue; i++) pool.push('blue');
            for (let i = 0; i < marblesYellow; i++) pool.push('yellow');

            const nextMF = { ...mf };
            for (let i = 0; i < actualBatch; i++) {
              const picked = pool[Math.floor(Math.random() * (pool.length || 1))] || 'red';
              nextMF[picked] = nextMF[picked] + 1;
            }
            return nextMF;
          });
        }

        if (nextTrial >= trialCount) {
          setExperimentState('COMPLETED');
          logEvent('EXPERIMENT_COMPLETED', { trialCount: nextTrial });
        } else {
          setExperimentState('RESULT');
        }

        logEvent('SIMULATION_COMPLETED', { batchCount: actualBatch, total: nextTrial });
        return nextTrial;
      });
    }
  };

  const isCompleted = completedTrials >= trialCount;

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-3 md:p-4 gap-3 text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6 overflow-y-auto' : 'h-full'
      }`}
    >
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER CONTROL BAR */}
      {/* ---------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Main Experiment Type Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => {
              setMainType('coin');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              mainType === 'coin' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>🪙 Đồng xu</span>
          </button>
          <button
            onClick={() => {
              setMainType('dice');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              mainType === 'dice' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>🎲 Xúc xắc</span>
          </button>
          <button
            onClick={() => {
              setMainType('spinner');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              mainType === 'spinner' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CircleDot className="w-4 h-4" />
            <span>🎯 Vòng quay</span>
          </button>
          <button
            onClick={() => {
              setMainType('marbles');
              handleReset();
            }}
            className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1.5 ${
              mainType === 'marbles' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>🔮 Bốc bi</span>
          </button>

          <button
            onClick={() => setShowSavedModal(true)}
            className="px-2.5 py-1.5 rounded-md font-bold transition flex items-center gap-1 text-amber-400 hover:bg-slate-800 border border-amber-500/30 ml-2"
            title="Thí nghiệm đã lưu & Sao chép"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lưu / Sao chép ({savedExperiments.length})</span>
          </button>
        </div>

        {/* Submode Selection & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {mainType === 'coin' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  setCoinSubMode('1_coin');
                  handleReset();
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  coinSubMode === '1_coin' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
                }`}
              >
                1 Đồng xu
              </button>
              <button
                onClick={() => {
                  setCoinSubMode('2_coin');
                  handleReset();
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  coinSubMode === '2_coin' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
                }`}
              >
                2 Đồng xu
              </button>
            </div>
          )}

          {mainType === 'dice' && (
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  setDiceSubMode('1_dice');
                  handleReset();
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  diceSubMode === '1_dice' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
                }`}
              >
                1 Xúc xắc
              </button>
              <button
                onClick={() => {
                  setDiceSubMode('2_dice');
                  handleReset();
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                  diceSubMode === '2_dice' ? 'bg-slate-800 text-sky-400' : 'text-slate-400'
                }`}
              >
                2 Xúc xắc
              </button>
            </div>
          )}

          {/* Mode Toggle: Visual vs Fast */}
          <button
            onClick={() => setFastSimulation(!fastSimulation)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 transition ${
              fastSimulation
                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {fastSimulation ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-sky-400" />}
            <span>{fastSimulation ? '⚡ Mô phỏng nhanh' : '🎬 Thí nghiệm trực quan'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setEnableSound(!enableSound)}
            className={`p-1.5 rounded-lg border text-xs font-bold transition ${
              enableSound ? 'bg-slate-950 text-sky-400 border-slate-800' : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title={enableSound ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
          >
            {enableSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theoretical probability toggle */}
          <button
            onClick={() => setShowTheoretical(!showTheoretical)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
              showTheoretical
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
          >
            {showTheoretical ? '✓ Xác suất lý thuyết' : 'Ẩn lý thuyết'}
          </button>

          {/* Teacher Config Modal Button */}
          <button
            onClick={() => {
              setShowTeacherConfig(!showTeacherConfig);
              setViewRole('teacher');
            }}
            className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
              showTeacherConfig
                ? 'bg-purple-900 text-white border-purple-500'
                : 'bg-slate-950 text-purple-300 border-slate-800 hover:border-purple-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cấu hình Giáo viên</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition flex items-center gap-1"
            title="Làm lại thí nghiệm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm lại</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${
              isFullscreen
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-sky-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình thí nghiệm'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TEACHER CONFIGURATION PANEL (TEACHER MODE) */}
      {/* ---------------------------------------------------- */}
      {showTeacherConfig && (
        <div className="bg-purple-950/40 border border-purple-800/80 rounded-xl p-4 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
            <span className="font-bold text-purple-200 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              🧪 CẤU HÌNH THÍ NGHIỆM (TEACHER MODE)
            </span>
            <button
              onClick={() => setShowTeacherConfig(false)}
              className="text-purple-400 hover:text-white font-bold"
            >
              ✕ Đóng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type & Objects */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-purple-900/50">
              <label className="font-bold text-purple-300 block">1. Loại & Số lượng vật thể:</label>
              <div className="space-y-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="expType"
                    checked={mainType === 'coin' && coinSubMode === '1_coin'}
                    onChange={() => {
                      setMainType('coin');
                      setCoinSubMode('1_coin');
                      handleReset();
                    }}
                  />
                  <span>1 Đồng xu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="expType"
                    checked={mainType === 'coin' && coinSubMode === '2_coin'}
                    onChange={() => {
                      setMainType('coin');
                      setCoinSubMode('2_coin');
                      handleReset();
                    }}
                  />
                  <span>2 Đồng xu</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="expType"
                    checked={mainType === 'dice' && diceSubMode === '1_dice'}
                    onChange={() => {
                      setMainType('dice');
                      setDiceSubMode('1_dice');
                      handleReset();
                    }}
                  />
                  <span>1 Xúc xắc</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="expType"
                    checked={mainType === 'dice' && diceSubMode === '2_dice'}
                    onChange={() => {
                      setMainType('dice');
                      setDiceSubMode('2_dice');
                      handleReset();
                    }}
                  />
                  <span>2 Xúc xắc</span>
                </label>
              </div>
            </div>

            {/* Presets & Trial Count */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-purple-900/50">
              <label className="font-bold text-purple-300 block">2. Số lần thí nghiệm quy định:</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 5000, 10000].map((num) => (
                  <button
                    key={`preset-${num}`}
                    onClick={() => {
                      setTrialCount(num);
                      setCustomTrialInput(String(num));
                      handleReset();
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition ${
                      trialCount === num
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Số lần tùy chỉnh:</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={customTrialInput}
                  onChange={(e) => {
                    setCustomTrialInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      setTrialCount(val);
                      handleReset();
                    }
                  }}
                  className="w-24 px-2 py-1 bg-slate-900 border border-purple-700 rounded text-amber-300 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* Student Permission Toggle */}
            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-purple-900/50 flex flex-col justify-between">
              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-300 mb-2">
                  <input
                    type="checkbox"
                    checked={allowStudentTrialCount}
                    onChange={(e) => setAllowStudentTrialCount(e.target.checked)}
                  />
                  <span>Cho phép học sinh tự chọn số lần</span>
                </label>
                {allowStudentTrialCount ? (
                  <div className="space-y-1 pl-5 text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Giới hạn tối thiểu:</span>
                      <input
                        type="number"
                        value={minTrialLimit}
                        onChange={(e) => setMinTrialLimit(parseInt(e.target.value, 10) || 1)}
                        className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Giới hạn tối đa:</span>
                      <input
                        type="number"
                        value={maxTrialLimit}
                        onChange={(e) => setMaxTrialLimit(parseInt(e.target.value, 10) || 1000)}
                        className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 pl-5">
                    🔒 Học sinh bắt buộc thực hiện đúng số lần quy định: <strong>{trialCount} lần</strong>.
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setShowTeacherConfig(false);
                  setViewRole('student');
                }}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-md shadow transition text-center"
              >
                LƯU & ÁP DỤNG THÍ NGHIỆM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN VIEW GRID */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 flex-1 overflow-y-auto">
        {/* LEFT COLUMN: INTERACTIVE VISUAL EXPERIMENT & ACTION CONTROLS */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Sparkles className="w-4 h-4" />
              Sàn Thử Nghiệm Trực Quan
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Trạng thái: {isRolling ? `⏳ ${experimentState}...` : isCompleted ? '🎉 Hoàn thành' : 'Sẵn sàng'}
            </span>
          </div>

          {/* 3D VISUAL STAGE */}
          <div className="w-full min-h-[220px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-4 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* 1 COIN VISUAL */}
            {mainType === 'coin' && coinSubMode === '1_coin' && (
              <Coin3DVisual
                value={coin1Value}
                isFlipping={isRolling}
                experimentState={experimentState}
                label="Đồng xu 1"
              />
            )}

            {/* 2 COINS VISUAL */}
            {mainType === 'coin' && coinSubMode === '2_coin' && (
              <div className="flex items-center justify-center gap-6">
                <Coin3DVisual
                  value={twoCoinsValues.coin1}
                  isFlipping={isRolling}
                  experimentState={experimentState}
                  label="Đồng xu 1"
                  coinIndex={0}
                />
                <Coin3DVisual
                  value={twoCoinsValues.coin2}
                  isFlipping={isRolling}
                  experimentState={experimentState}
                  label="Đồng xu 2"
                  coinIndex={1}
                />
              </div>
            )}

            {/* 1 DIE VISUAL */}
            {mainType === 'dice' && diceSubMode === '1_dice' && (
              <Dice3DVisual
                value={die1Value}
                isRolling={isRolling}
                experimentState={experimentState}
                label="Xúc xắc 1"
              />
            )}

            {/* 2 DICE VISUAL */}
            {mainType === 'dice' && diceSubMode === '2_dice' && (
              <div className="flex items-center justify-center gap-6">
                <Dice3DVisual
                  value={twoDiceValues.die1}
                  isRolling={isRolling}
                  experimentState={experimentState}
                  label="Xúc xắc 1"
                  diceIndex={0}
                />
                <div className="text-2xl font-bold text-slate-500 self-center">+</div>
                <Dice3DVisual
                  value={twoDiceValues.die2}
                  isRolling={isRolling}
                  experimentState={experimentState}
                  label="Xúc xắc 2"
                  diceIndex={1}
                />
              </div>
            )}

            {/* SPINNER VISUAL */}
            {mainType === 'spinner' && (
              <SpinnerVisual
                sectorsCount={spinnerSectorsCount}
                currentSector={spinnerCurrentSector}
                isSpinning={isRolling}
                label={`Hình quạt ${spinnerCurrentSector}`}
              />
            )}

            {/* MARBLES VISUAL */}
            {mainType === 'marbles' && (
              <MarblesVisual
                redCount={marblesRed}
                blueCount={marblesBlue}
                yellowCount={marblesYellow}
                lastDrawnColor={lastDrawnMarble}
                isDrawing={isRolling}
              />
            )}
          </div>

          {/* RESULT BADGE */}
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              KẾT QUẢ GẦN NHẤT
            </span>
            {mainType === 'coin' && coinSubMode === '1_coin' && (
              <span className="text-base font-bold text-amber-300">
                🪙 {coin1Value === 'head' ? 'NGỬA' : 'SẤP'}
              </span>
            )}
            {mainType === 'coin' && coinSubMode === '2_coin' && (
              <span className="text-sm font-bold text-amber-300">
                ({twoCoinsValues.coin1 === 'head' ? 'Ngửa' : 'Sấp'}, {twoCoinsValues.coin2 === 'head' ? 'Ngửa' : 'Sấp'}) ⇒ {twoCoinsValues.outcome}
              </span>
            )}
            {mainType === 'dice' && diceSubMode === '1_dice' && (
              <span className="text-base font-bold text-sky-300">
                🎲 = {die1Value}
              </span>
            )}
            {mainType === 'dice' && diceSubMode === '2_dice' && (
              <span className="text-sm font-bold text-sky-300">
                🎲₁({twoDiceValues.die1}) + 🎲₂({twoDiceValues.die2}) = <strong className="text-emerald-400 text-base">{twoDiceValues.sum}</strong>
              </span>
            )}
            <span className="text-[11px] font-mono text-slate-400">
              Lần thí nghiệm: {completedTrials} / {trialCount}
            </span>
          </div>

          {/* PROGRESS BAR & ENFORCED TRIAL COUNT */}
          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-bold">Tiến trình thí nghiệm:</span>
              <span className="text-amber-400 font-bold">{completedTrials} / {trialCount} lần</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (completedTrials / trialCount) * 100)}%` }}
              />
            </div>
            {isCompleted ? (
              <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 justify-center pt-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>🎉 Đã hoàn thành thí nghiệm ({trialCount}/{trialCount}).</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 text-right">
                Còn lại: {trialCount - completedTrials} lần
              </div>
            )}
          </div>

          {/* WARNING IF LARGE TRIAL COUNT */}
          {trialCount >= 1000 && (
            <div className="p-2 bg-amber-950/60 border border-amber-800/80 rounded-lg text-[11px] text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Số lần mô phỏng lớn ({trialCount}). Quá trình có thể mất thêm thời gian.</span>
            </div>
          )}

          {/* ACTION BUTTON & BATCH BUTTONS */}
          <div className="space-y-2">
            <button
              disabled={isRolling || isCompleted}
              onClick={() => executeTrialBatch(1)}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                isRolling || isCompleted
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-80'
                  : mainType === 'coin'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-950'
                  : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isRolling
                  ? '⏳ Đang thực hiện...'
                  : isCompleted
                  ? 'ĐÃ HOÀN THÀNH TẤT CẢ LẦN THỬ'
                  : mainType === 'coin'
                  ? `TUNG ĐỒNG XU (1 LẦN)`
                  : `TUNG XÚC XẮC (1 LẦN)`}
              </span>
            </button>

            {/* Fast Batch Run Buttons */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Mô Phỏng Hàng Loạt N Lần:
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {[10, 50, 100, 500, 1000].map((num) => (
                  <button
                    key={`batch-${num}`}
                    disabled={isRolling || isCompleted}
                    onClick={() => executeTrialBatch(num)}
                    className="py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-sky-400 hover:text-white font-mono font-bold text-[11px] transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STUDENT PREDICTION STEP */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <HelpCircle className="w-4 h-4" />
              <span>Dự đoán của em trước khi thử nghiệm:</span>
            </div>
            <p className="text-[11px] text-slate-300">
              {mainType === 'coin' && coinSubMode === '1_coin' && 'Tần suất xuất hiện mặt Ngửa khi tung nhiều lần sẽ gần với:'}
              {mainType === 'coin' && coinSubMode === '2_coin' && 'Xác suất xuất hiện 2 mặt Ngửa (HH) khi tung 2 đồng xu là:'}
              {mainType === 'dice' && diceSubMode === '1_dice' && `Khi tung ${trialCount} lần, em dự đoán mặt 6 xuất hiện bao nhiêu %?`}
              {mainType === 'dice' && diceSubMode === '2_dice' && 'Khi tung 2 xúc xắc, tổng điểm nào dễ xuất hiện nhất?'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mainType === 'coin' && coinSubMode === '1_coin' &&
                ['~50% (0.50)', '~25% (0.25)', '~75% (0.75)'].map((opt) => (
                  <button
                    key={`pred-${opt}`}
                    onClick={() => setPrediction(opt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                      prediction === opt
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              {mainType === 'coin' && coinSubMode === '2_coin' &&
                ['1/4 (25%)', '1/2 (50%)', '1/3 (33%)'].map((opt) => (
                  <button
                    key={`pred-${opt}`}
                    onClick={() => setPrediction(opt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                      prediction === opt
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              {mainType === 'dice' && diceSubMode === '1_dice' &&
                ['~16.7% (1/6)', '~10%', '~25%'].map((opt) => (
                  <button
                    key={`pred-${opt}`}
                    onClick={() => setPrediction(opt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                      prediction === opt
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              {mainType === 'dice' && diceSubMode === '2_dice' &&
                ['Tổng 7', 'Tổng 2', 'Tổng 12'].map((opt) => (
                  <button
                    key={`pred-${opt}`}
                    onClick={() => setPrediction(opt)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition ${
                      prediction === opt
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STATISTICS, CHARTS, THEORETICAL COMPARISON & HISTORY */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
              Thống Kê Tần Suất & Xác Suất Lý Thuyết
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              N = {completedTrials} / {trialCount}
            </span>
          </div>

          {/* 1 COIN STATISTICS & CHART */}
          {mainType === 'coin' && coinSubMode === '1_coin' && (
            <div className="space-y-4 my-auto">
              {/* Heads Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-amber-300 font-bold">🔴 Mặt Ngửa (Heads): {coin1Counts.head} lần</span>
                  <span className="text-emerald-400 font-bold">
                    Tần suất f = {((coin1Counts.head / Math.max(1, completedTrials)) * 100).toFixed(1)}%{' '}
                    {showTheoretical && '(P = 50%)'}
                  </span>
                </div>
                <div className="w-full h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative flex">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300"
                    style={{ width: `${(coin1Counts.head / Math.max(1, completedTrials)) * 100}%` }}
                  />
                  {showTheoretical && (
                    <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-rose-400 z-10" />
                  )}
                </div>
              </div>

              {/* Tails Bar */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300 font-bold">⚪ Mặt Sấp (Tails): {coin1Counts.tail} lần</span>
                  <span className="text-emerald-400 font-bold">
                    Tần suất f = {((coin1Counts.tail / Math.max(1, completedTrials)) * 100).toFixed(1)}%{' '}
                    {showTheoretical && '(P = 50%)'}
                  </span>
                </div>
                <div className="w-full h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative flex">
                  <div
                    className="h-full bg-gradient-to-r from-slate-500 to-slate-300 transition-all duration-300"
                    style={{ width: `${(coin1Counts.tail / Math.max(1, completedTrials)) * 100}%` }}
                  />
                  {showTheoretical && (
                    <div className="absolute top-0 bottom-0 left-1/2 border-l-2 border-dashed border-rose-400 z-10" />
                  )}
                </div>
              </div>

              {/* Diff Calculation Table */}
              {showTheoretical && completedTrials > 0 && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lý thuyết P(Ngửa)</span>
                    <span className="font-mono font-bold text-rose-400">50.0%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Thực nghiệm f(Ngửa)</span>
                    <span className="font-mono font-bold text-amber-300">
                      {((coin1Counts.head / completedTrials) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sai lệch |f - P|</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {ExperimentGrader.computePercentageDiff(
                        coin1Counts.head / completedTrials,
                        0.5
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2 COINS STATISTICS */}
          {mainType === 'coin' && coinSubMode === '2_coin' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-300 block">Phân bố 4 khả năng (HH, HT, TH, TT):</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {(['HH', 'HT', 'TH', 'TT'] as const).map((outcome) => {
                  const cnt = twoCoinsOutcomes[outcome] || 0;
                  const pct = completedTrials > 0 ? (cnt / completedTrials) * 100 : 0;
                  return (
                    <div key={`2c-${outcome}`} className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[11px] font-bold">{outcome}</span>
                      <span className="text-amber-400 font-mono font-bold text-sm">{cnt} lần</span>
                      <span className="text-emerald-400 block font-mono text-[10px]">{pct.toFixed(1)}%</span>
                      {showTheoretical && (
                        <span className="text-[9px] text-rose-400 block mt-0.5">P = 25%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1 DIE STATISTICS & BAR CHART */}
          {mainType === 'dice' && diceSubMode === '1_dice' && (
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-2 items-end h-40 pt-6 pb-2 border-b border-slate-800 relative">
                {showTheoretical && (
                  <div className="absolute left-0 right-0 top-[33%] border-t border-dashed border-rose-400 z-10 flex justify-end">
                    <span className="text-[9px] text-rose-300 font-mono bg-slate-950 px-1 rounded -mt-2.5">
                      P_lý_thuyết = 1/6 (16.67%)
                    </span>
                  </div>
                )}

                {[1, 2, 3, 4, 5, 6].map((face) => {
                  const count = die1Frequencies[face] || 0;
                  const relFreq = completedTrials > 0 ? count / completedTrials : 0;
                  const heightPercent = Math.min(100, Math.max(4, relFreq * 350));

                  return (
                    <div key={`d1-bar-${face}`} className="flex flex-col items-center h-full justify-end">
                      <span className="text-[9px] font-mono text-sky-300 mb-1">
                        {(relFreq * 100).toFixed(1)}%
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-indigo-500 rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <span className="absolute inset-x-0 top-1 text-center text-[9px] font-mono text-white font-bold">
                          {count}
                        </span>
                      </div>
                      <div className="mt-2 w-7 h-7 bg-slate-950 border border-slate-800 rounded-md flex items-center justify-center font-bold text-xs text-white shadow">
                        {face}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2 DICE SUMS STATISTICS */}
          {mainType === 'dice' && diceSubMode === '2_dice' && (
            <div className="space-y-3">
              <div className="grid grid-cols-11 gap-1 items-end h-36 pt-6 pb-2 border-b border-slate-800 relative">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sum) => {
                  const count = twoDiceSumFreq[sum] || 0;
                  const relFreq = completedTrials > 0 ? count / completedTrials : 0;
                  const heightPercent = Math.min(100, Math.max(4, relFreq * 380));

                  return (
                    <div key={`d2-bar-${sum}`} className="flex flex-col items-center h-full justify-end">
                      <span className="text-[8px] font-mono text-sky-300 mb-0.5">
                        {(relFreq * 100).toFixed(1)}%
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md transition-all duration-300 relative"
                        style={{ height: `${heightPercent}%` }}
                      >
                        <span className="absolute inset-x-0 top-0.5 text-center text-[8px] font-mono text-white font-bold">
                          {count}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-300 font-bold">{sum}</div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison for sum = 7 */}
              {showTheoretical && (
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">P(Tổng = 7) Lý thuyết</span>
                    <span className="font-mono font-bold text-rose-400">6/36 = 16.67%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tần suất Thực nghiệm f(7)</span>
                    <span className="font-mono font-bold text-sky-300">
                      {completedTrials > 0 ? ((twoDiceSumFreq[7] / completedTrials) * 100).toFixed(2) : '0'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Sai lệch |f - P|</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {completedTrials > 0
                        ? ExperimentGrader.computePercentageDiff(
                            twoDiceSumFreq[7] / completedTrials,
                            6 / 36
                          )
                        : '0 điểm %'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LAW OF LARGE NUMBERS CONVERGENCE GRAPH */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Đường cong hội tụ tần suất (Luật số lớn):
            </span>
            <div className="w-full h-24 bg-slate-950 rounded-xl border border-slate-800 relative p-2 overflow-hidden">
              <svg className="w-full h-full overflow-visible">
                <line
                  x1="0"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x="5" y="45%" className="fill-rose-400 text-[8px] font-mono">
                  P_lý_thuyết
                </text>

                {convergenceLog.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    points={convergenceLog
                      .map((pt, idx) => {
                        const x = (idx / (convergenceLog.length - 1)) * 100;
                        const y = Math.max(0, Math.min(100, 100 - pt.freq * 100));
                        return `${x}%,${y}%`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* HISTORY LOG TABLE */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
              <History className="w-3.5 h-3.5 text-sky-400" />
              Lịch sử các lần tung vừa thực hiện:
            </span>
            <div className="max-h-24 overflow-y-auto font-mono text-[11px] text-slate-300 divide-y divide-slate-800">
              {mainType === 'coin' && coinSubMode === '1_coin' && coin1History.map((h, idx) => (
                <div key={`h-c1-${h.trial}-${idx}`} className="py-0.5 flex justify-between">
                  <span>Lần {h.trial}:</span>
                  <span className={h.val === 'head' ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                    {h.val === 'head' ? 'Ngửa' : 'Sấp'}
                  </span>
                </div>
              ))}
              {mainType === 'coin' && coinSubMode === '2_coin' && twoCoinsHistory.map((h, idx) => (
                <div key={`h-c2-${h.trial}-${idx}`} className="py-0.5 flex justify-between">
                  <span>Lần {h.trial}:</span>
                  <span className="text-amber-300 font-bold">{h.outcome}</span>
                </div>
              ))}
              {mainType === 'dice' && diceSubMode === '1_dice' && die1History.map((h, idx) => (
                <div key={`h-d1-${h.trial}-${idx}`} className="py-0.5 flex justify-between">
                  <span>Lần {h.trial}:</span>
                  <span className="text-sky-300 font-bold">Mặt {h.val}</span>
                </div>
              ))}
              {mainType === 'dice' && diceSubMode === '2_dice' && twoDiceHistory.map((h, idx) => (
                <div key={`h-d2-${h.trial}-${idx}`} className="py-0.5 flex justify-between">
                  <span>Lần {h.trial}:</span>
                  <span className="text-sky-300 font-bold">🎲₁={h.die1}, 🎲₂={h.die2} ⇒ Tổng {h.sum}</span>
                </div>
              ))}
              {completedTrials === 0 && (
                <p className="text-slate-500 italic text-center py-2">Chưa có lượt thử nào.</p>
              )}
            </div>
          </div>

          {/* PEDAGOGICAL QUESTION & EXPLORATION */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-sky-400">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Câu hỏi khám phá:
              </span>
              {viewRole === 'teacher' && (
                <button
                  onClick={() => setTeacherShowAnswer(!teacherShowAnswer)}
                  className="text-[10px] bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-amber-300 flex items-center gap-1"
                >
                  {teacherShowAnswer ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{teacherShowAnswer ? 'Ẩn đáp án' : 'Hiển thị đáp án'}</span>
                </button>
              )}
            </div>

            <p className="text-slate-300 text-[11px]">
              Khi số lần thử N ngày càng tăng, mối quan hệ giữa Tần suất thực nghiệm $f$ và Xác suất lý thuyết $P$ là gì?
            </p>

            <div className="space-y-1.5">
              {[
                'A. Tần suất thực nghiệm luôn đúng bằng xác suất lý thuyết trong mọi lượt thử ngắn.',
                'B. Tần suất thực nghiệm có xu hướng dao động và ổn định tiến gần đến xác suất lý thuyết (Luật số lớn).',
                'C. Tần suất thực nghiệm thay đổi ngẫu nhiên không có tính quy luật nào.',
              ].map((ansText, idx) => (
                <button
                  key={`ans-opt-${idx}`}
                  onClick={() => {
                    setSelectedAnswer(idx);
                    setAnswerSubmitted(true);
                    logEvent('QUESTION_ANSWERED', { selectedOption: idx });
                  }}
                  className={`w-full p-2 rounded-lg text-left text-[11px] font-medium border transition ${
                    selectedAnswer === idx
                      ? idx === 1
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : 'bg-rose-950 border-rose-500 text-rose-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {ansText}
                </button>
              ))}
            </div>

            {(answerSubmitted || (viewRole === 'teacher' && teacherShowAnswer)) && (
              <div className="p-2 bg-emerald-950/80 border border-emerald-800 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  <strong>Chính xác!</strong> Theo Luật số lớn (Law of Large Numbers), khi số lần thử $N$ càng lớn, tần suất thực nghiệm $f$ sẽ càng ổn định và tiến sát về giá trị Xác suất lý thuyết $P$.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SAVED EXPERIMENTS & DUPLICATE MODAL */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-amber-300 text-sm flex items-center gap-2">
                <Save className="w-4 h-4 text-amber-400" />
                💾 QUẢN LÝ THÍ NGHIỆM ĐÃ LƯU
              </span>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Save Current Form */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-200">Lưu thí nghiệm hiện tại:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tên thí nghiệm (VD: Lớp 8A1 - Tung xu)..."
                  value={newExpNameInput}
                  onChange={(e) => setNewExpNameInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
                <button
                  onClick={() => saveCurrentExperiment()}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu ngay</span>
                </button>
              </div>
            </div>

            {/* Saved Experiments List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <span className="text-xs font-bold text-slate-300">Danh sách thí nghiệm đã lưu:</span>
              {savedExperiments.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs italic bg-slate-950 rounded-xl">
                  Chưa có thí nghiệm nào được lưu.
                </div>
              ) : (
                savedExperiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-white">{exp.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {exp.mainType.toUpperCase()} • {exp.trials} lần thử • Ngày: {exp.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => duplicateExperiment(exp)}
                        className="px-2 py-1 bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 rounded-md font-bold transition flex items-center gap-1"
                        title="Sao chép thí nghiệm này sang bản mới"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Sao chép</span>
                      </button>
                      <button
                        onClick={() => {
                          setMainType(exp.mainType);
                          setTrialCount(exp.trials);
                          handleReset();
                          setShowSavedModal(false);
                        }}
                        className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 rounded-md font-bold transition"
                      >
                        Mở
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
