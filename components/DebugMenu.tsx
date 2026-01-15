
import React, { useState } from 'react';
import { DebugConfig } from '../types';
import { EnemyType, EnemyTier, BossTier } from '../types/enemies';

interface DebugMenuProps {
  onStart: (config: DebugConfig) => void;
  onClose: () => void;
}

const DebugMenu: React.FC<DebugMenuProps> = ({ onStart, onClose }) => {
  const [selectedType, setSelectedType] = useState<EnemyType>(EnemyType.SCOUT);
  const [level, setLevel] = useState(1);
  const [count, setCount] = useState(5);
  const [selectedTier, setSelectedTier] = useState<'NORMAL' | 'ELITE' | 'LEGENDARY' | 'MINIBOSS'>('NORMAL');

  const ENEMY_TYPES = [
    { type: EnemyType.SCOUT, label: 'Void Scout', icon: 'fa-shuttle-space' },
    { type: EnemyType.STRIKER, label: 'Crimson Striker', icon: 'fa-jet-fighter' },
    { type: EnemyType.LASER_SCOUT, label: 'Sniper Drone', icon: 'fa-satellite' },
    { type: EnemyType.KAMIKAZE, label: 'Kamikaze Drone', icon: 'fa-bomb' },
    { type: EnemyType.BOSS_DREADNOUGHT, label: 'Dreadnought Boss', icon: 'fa-skull' },
    { type: EnemyType.BOSS_DESTROYER, label: 'Imperial Destroyer', icon: 'fa-shapes' },
  ];

  const isBoss = selectedType === EnemyType.BOSS_DREADNOUGHT || selectedType === EnemyType.BOSS_DESTROYER;

  // Regular enemies can be NORMAL/ELITE/LEGENDARY/MINIBOSS
  // Bosses can be NORMAL/ELITE/LEGENDARY (no MINIBOSS)
  const ENEMY_TIERS = [
    { tier: 'NORMAL' as const, label: 'Normal', color: 'slate' },
    { tier: 'ELITE' as const, label: 'Elite', color: 'fuchsia' },
    { tier: 'LEGENDARY' as const, label: 'Legendary', color: 'amber' },
    { tier: 'MINIBOSS' as const, label: 'Miniboss', color: 'red', enemyOnly: true },
  ];

  const availableTiers = isBoss
    ? ENEMY_TIERS.filter(t => !t.enemyOnly)
    : ENEMY_TIERS;

  const handleStart = () => {
    onStart({
      enemyType: selectedType,
      level,
      count,
      tier: selectedTier
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-emerald-400 text-3xl font-black italic uppercase tracking-tighter">Combat Sim</h2>
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Laboratory Mode</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-slate-700">
            <i className="fa-solid fa-times" />
          </button>
        </div>

        {/* Enemy Type Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Target Entity</label>
          <div className="grid grid-cols-2 gap-2">
            {ENEMY_TYPES.map((e) => (
              <button
                key={e.type}
                onClick={() => setSelectedType(e.type)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all
                  ${selectedType === e.type
                    ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'}`}
              >
                <i className={`fa-solid ${e.icon} w-5 text-center`} />
                <span className="text-xs font-bold uppercase">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tier Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Tier (Rarity)</label>
          <div className="grid grid-cols-4 gap-2">
            {availableTiers.map((t) => {
              const isSelected = selectedTier === t.tier;
              const colorMap: Record<string, string> = {
                slate: 'border-slate-500 bg-slate-800/40 text-slate-300',
                fuchsia: 'border-fuchsia-500 bg-fuchsia-900/40 text-fuchsia-400',
                amber: 'border-amber-500 bg-amber-900/40 text-amber-400',
                red: 'border-red-500 bg-red-900/40 text-red-400',
              };
              return (
                <button
                  key={t.tier}
                  onClick={() => setSelectedTier(t.tier)}
                  className={`p-2 rounded-xl border text-center transition-all text-[10px] font-bold uppercase
                    ${isSelected
                      ? colorMap[t.color]
                      : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Enemy Rank</label>
            <span className="text-emerald-400 font-black text-xl">LV {level}</span>
          </div>
          <input
            type="range" min="1" max="100"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Count Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <label className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Spawn Count</label>
            <span className="text-emerald-400 font-black text-xl">x{count}</span>
          </div>
          <input
            type="range" min="1" max="25"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-slate-600 text-[9px] font-bold">Note: Targets will auto-respawn upon destruction.</p>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-4 bg-emerald-600 text-white font-black text-xl rounded-xl uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-emerald-500 mt-2"
        >
          Initiate Simulation
        </button>
      </div>
    </div>
  );
};

export default DebugMenu;
