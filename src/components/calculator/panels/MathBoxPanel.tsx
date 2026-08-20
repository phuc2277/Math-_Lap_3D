import React, { useState } from 'react';
import { Dices, Coins, CircleDot, Play, Sparkles, RefreshCw } from 'lucide-react';
import { CasioEngine, DiceSimulationResult, CoinSimulationResult, UnitCircleResult } from '../casioEngine';

interface MathBoxPanelProps {
  onAskAI?: (prompt: string) => void;
  playClickSound?: () => void;
}

export const MathBoxPanel: React.FC<MathBoxPanelProps> = ({ onAskAI, playClickSound }) => {
  const [subTab, setSubTab] = useState<'dice' | 'coin' | 'circle'>('dice');

  // Dice state
  const [diceCount, setDiceCount] = useState<1 | 2 | 3>(2);
  const [diceTrials, setDiceTrials] = useState<number>(50);
  const [diceResult, setDiceResult] = useState<DiceSimulationResult | null>(null);

  // Coin state
  const [coinCount, setCoinCount] = useState<1 | 2 | 3>(2);
  const [coinTrials, setCoinTrials] = useState<number>(50);
  const [coinResult, setCoinResult] = useState<CoinSimulationResult | null>(null);

  // Unit Circle state
  const [circleAngle, setCircleAngle] = useState<number>(45);
  const [circleResult, setCircleResult] = useState<UnitCircleResult>(() => CasioEngine.unitCircle(45));

  const handleRollDice = () => {
    playClickSound?.();
    const res = CasioEngine.rollDice(diceCount, diceTrials);
    setDiceResult(res);
  };

  const handleTossCoins = () => {
    playClickSound?.();
    const res = CasioEngine.tossCoins(coinCount, coinTrials);
    setCoinResult(res);
  };

  const handleAngleChange = (deg: number) => {
    setCircleAngle(deg);
    setCircleResult(CasioEngine.unitCircle(deg));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-pink-400" />
          <h3 className="font-extrabold text-sm text-white">
            Hộp Toán Học Độc Quyền (Math Box - Dòng fx-880BTG)
          </h3>
        </div>
        <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold">
          Casio fx-880BTG
        </span>
      </div>

      {/* Sub Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'dice', label: '🎲 Tung Xúc Xắc', icon: Dices },
          { id: 'coin', label: '🪙 Tung Đồng Xu', icon: Coins },
          { id: 'circle', label: '⭕ Đường Tròn L.Giác', icon: CircleDot },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound?.();
                setSubTab(tab.id as any);
              }}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                subTab === tab.id
                  ? 'bg-pink-600 text-white border-pink-400 shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. DICE SIMULATION */}
      {subTab === 'dice' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số con xúc xắc:</label>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDiceCount(num as any)}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      diceCount === num ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số lần gieo:</label>
              <select
                value={diceTrials}
                onChange={(e) => setDiceTrials(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
              >
                <option value={20}>20 lần</option>
                <option value={50}>50 lần</option>
                <option value={100}>100 lần</option>
                <option value={250}>250 lần</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRollDice}
            className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>MÔ PHỎNG GIEO XÚC XẮC (=)</span>
          </button>

          {diceResult && (
            <div className="p-4 bg-pink-950/30 border border-pink-500/30 rounded-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-pink-300 font-bold">
                <span>Tổng số lần: {diceResult.trials}</span>
                <span>Trung bình (Mean): {diceResult.mean}</span>
                <span>Mốt (Mode): {diceResult.mode.join(', ')}</span>
              </div>

              {/* Frequency histogram bars */}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(diceResult.frequencies).map(([sumVal, count]) => {
                  const prob = diceResult.probabilities[parseInt(sumVal)] || 0;
                  return (
                    <div key={sumVal} className="flex items-center gap-2 text-[11px]">
                      <span className="w-8 text-right font-bold text-slate-300">Tổng {sumVal}:</span>
                      <div className="flex-1 bg-slate-900 h-4 rounded-full overflow-hidden flex">
                        <div
                          className="bg-pink-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, prob * 3)}%` }}
                        ></div>
                      </div>
                      <span className="w-16 text-right text-slate-400">{count} lần ({prob}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. COIN TOSS SIMULATION */}
      {subTab === 'coin' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số đồng xu:</label>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCoinCount(num as any)}
                    className={`py-1.5 rounded-lg text-xs font-bold ${
                      coinCount === num ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold block mb-1">Số lần tung:</label>
              <select
                value={coinTrials}
                onChange={(e) => setCoinTrials(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
              >
                <option value={20}>20 lần</option>
                <option value={50}>50 lần</option>
                <option value={100}>100 lần</option>
                <option value={200}>200 lần</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleTossCoins}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-extrabold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>MÔ PHỎNG TUNG ĐỒNG XU (=)</span>
          </button>

          {coinResult && (
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">MẶT NGỬA (HEADS)</span>
                  <span className="text-lg font-extrabold text-amber-400">{coinResult.headsTotal} lần</span>
                  <span className="text-xs text-slate-500 block">{coinResult.headsProb}%</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">MẶT SẤP (TAILS)</span>
                  <span className="text-lg font-extrabold text-sky-400">{coinResult.tailsTotal} lần</span>
                  <span className="text-xs text-slate-500 block">{coinResult.tailsProb}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. UNIT CIRCLE */}
      {subTab === 'circle' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Góc lượng giác α:</span>
              <span className="text-xs font-mono font-extrabold text-pink-400">
                {circleResult.angleDeg}° = {circleResult.angleRadStr}
              </span>
            </div>

            {/* Angle slider */}
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={circleAngle}
              onChange={(e) => handleAngleChange(parseFloat(e.target.value))}
              className="w-full accent-pink-500"
            />

            {/* Quick angle buttons */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[0, 30, 45, 60, 90, 120, 135, 150, 180, 270, 360].map((deg) => (
                <button
                  key={deg}
                  onClick={() => handleAngleChange(deg)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    circleAngle === deg ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Results for Sin, Cos, Tan, Cot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs">
            <div className="p-2 bg-slate-900 rounded-xl text-center">
              <span className="text-slate-400 text-[10px] block font-bold">sin(α)</span>
              <span className="text-sm font-extrabold text-sky-400">
                {circleResult.exactSin || circleResult.sin}
              </span>
            </div>
            <div className="p-2 bg-slate-900 rounded-xl text-center">
              <span className="text-slate-400 text-[10px] block font-bold">cos(α)</span>
              <span className="text-sm font-extrabold text-emerald-400">
                {circleResult.exactCos || circleResult.cos}
              </span>
            </div>
            <div className="p-2 bg-slate-900 rounded-xl text-center">
              <span className="text-slate-400 text-[10px] block font-bold">tan(α)</span>
              <span className="text-sm font-extrabold text-pink-400">
                {circleResult.tan !== null ? circleResult.tan : 'Không xác định'}
              </span>
            </div>
            <div className="p-2 bg-slate-900 rounded-xl text-center">
              <span className="text-slate-400 text-[10px] block font-bold">cot(α)</span>
              <span className="text-sm font-extrabold text-amber-400">
                {circleResult.cot !== null ? circleResult.cot : 'Không xác định'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
