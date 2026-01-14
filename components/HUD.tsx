
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, ShipType } from '../types';
import { SHIPS } from '../constants';
import { POWER_UPS, isBuffActive } from '../systems/PowerUpSystem';

interface HUDProps {
  stats: PlayerStats;
  score: number;
  autoAttack: boolean;
  setAutoAttack: (val: boolean) => void;
  onPause: () => void;
  onShowUpgrades: () => void;
  onOpenGarage: () => void;
}

interface DamagePopup {
  id: number;
  value: number;
  type: 'HULL' | 'SHIELD';
}

const formatCredits = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.floor(num).toLocaleString();
};

const PowerUpIndicator: React.FC<{ 
  label: string; 
  until: number; 
  maxDuration: number; 
  color: string; 
  icon: string;
}> = ({ until, maxDuration, color, icon }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = performance.now();
      const remaining = Math.max(0, until - now);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [until]);

  if (timeLeft <= 0) return null;

  const size = 48; // Slightly smaller for side view
  const stroke = 4;
  const radius = (size / 2) - stroke;
  const circumference = radius * 2 * Math.PI;
  const progress = timeLeft / maxDuration;
  const offset = circumference - (progress * circumference);

  return (
    <div className="flex flex-col items-center gap-1 animate-in zoom-in fade-in duration-300 pointer-events-none">
      <div className="relative w-12 h-12 flex items-center justify-center bg-slate-900/80 rounded-full border border-slate-700 shadow-lg">
        <svg width={size} height={size} className="absolute -rotate-90">
          <circle 
            cx={size/2} cy={size/2} r={radius} 
            stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="none" 
          />
          <circle 
            cx={size/2} cy={size/2} r={radius} 
            stroke={color} strokeWidth={stroke} fill="none" 
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </svg>
        <div className={`text-lg drop-shadow-lg`} style={{ color }}>
          <i className={`fa-solid ${icon}`} />
        </div>
      </div>
      <span className="text-[9px] font-black uppercase text-white tracking-widest drop-shadow-md bg-slate-900/60 px-1 rounded">
        {(timeLeft / 1000).toFixed(1)}s
      </span>
    </div>
  );
};

const HUD: React.FC<HUDProps> = ({ stats, score, autoAttack, setAutoAttack, onPause, onShowUpgrades, onOpenGarage }) => {
  const healthPercent = Math.max(0, (stats.currentHealth / stats.maxHealth) * 100);
  const shieldPercent = Math.max(0, (stats.currentShield / stats.maxShield) * 100);
  const xpPercent = Math.max(0, Math.min(100, (stats.xp / stats.xpToNextLevel) * 100));
  const isInvulnerable = performance.now() < stats.invulnerableUntil;

  const currentShipName = SHIPS.find(s => s.type === stats.shipType)?.name || 'Vessel';

  // --- DAMAGE POPUP LOGIC ---
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const prevHealth = useRef(stats.currentHealth);
  const prevShield = useRef(stats.currentShield);

  useEffect(() => {
    // Detect Hull Damage
    if (stats.currentHealth < prevHealth.current) {
        const diff = Math.floor(prevHealth.current - stats.currentHealth);
        if (diff > 0) addPopup(diff, 'HULL');
    }
    prevHealth.current = stats.currentHealth;

    // Detect Shield Damage
    if (stats.currentShield < prevShield.current) {
        const diff = Math.floor(prevShield.current - stats.currentShield);
        if (diff > 0) addPopup(diff, 'SHIELD');
    }
    prevShield.current = stats.currentShield;
  }, [stats.currentHealth, stats.currentShield]);

  const addPopup = (value: number, type: 'HULL' | 'SHIELD') => {
      const id = Date.now() + Math.random();
      setPopups(prev => [...prev, { id, value, type }]);
      setTimeout(() => {
          setPopups(prev => prev.filter(p => p.id !== id));
      }, 800);
  };

  return (
    <>
    <style>
    {`
      @keyframes floatUp {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        50% { transform: translateY(-20px) scale(1.2); opacity: 1; }
        100% { transform: translateY(-40px) scale(1); opacity: 0; }
      }
    `}
    </style>
    <div className="fixed top-0 left-0 w-full p-4 pointer-events-none z-50 flex flex-col gap-4">
      <div className="flex justify-between items-start w-full">
        {/* Left Stats Block */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3 flex flex-col shadow-2xl min-w-[140px]">
            <span className="text-cyan-400/70 text-[10px] font-black uppercase tracking-widest mb-1">COMMAND VESSEL</span>
            <div className="flex items-baseline gap-2">
              <span className="text-cyan-400 text-2xl font-black italic uppercase leading-none drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">{currentShipName}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
                <div className="bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-black">RANK {stats.level}</div>
            </div>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 flex flex-col shadow-2xl min-w-[140px]">
            <span className="text-amber-400/70 text-[10px] font-black uppercase tracking-widest mb-1">BANK CREDITS</span>
            <div className="flex items-center gap-2 text-amber-400 font-black text-2xl leading-none drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
              <i className="fa-solid fa-coins text-sm" />
              <span>{formatCredits(stats.credits)}</span>
            </div>
          </div>

          {/* Active Power-ups (Moved Here) */}
          <div className="flex flex-col gap-2 mt-2 items-start">
            {Object.entries(stats.activeBuffs).map(([id, until]) => {
                // Assert until as number to avoid unknown type error
                if ((until as number) <= performance.now()) return null;
                const config = POWER_UPS[id as any];
                if (!config || config.type === 'INSTANT') return null;
                
                return (
                    <PowerUpIndicator 
                      key={id}
                      label={config.name}
                      until={until as number}
                      maxDuration={config.duration || 1000}
                      color={config.color}
                      icon={config.icon}
                    />
                );
            })}
          </div>
        </div>

        {/* Right Controls Block */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setAutoAttack(!autoAttack); }}
              className={`w-14 h-14 bg-slate-900/90 border-2 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90 ${autoAttack ? 'border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-700 text-slate-500 opacity-60'}`}
            >
              <i className={`fa-solid ${autoAttack ? 'fa-crosshairs' : 'fa-slash'} text-xl`} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onOpenGarage(); }} className="w-14 h-14 bg-slate-900/90 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-amber-400 active:scale-90 transition-all shadow-2xl">
              <i className="fa-solid fa-screwdriver-wrench text-xl" />
            </button>
             <button onClick={(e) => { e.stopPropagation(); onShowUpgrades(); }} className="w-14 h-14 bg-slate-900/90 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-cyan-400 active:scale-90 transition-all shadow-2xl">
              <i className="fa-solid fa-list text-xl" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPause(); }} className="w-14 h-14 bg-slate-900/90 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl">
              <i className="fa-solid fa-pause text-xl" />
            </button>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 flex flex-col items-end shadow-xl">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">MISSION SCORE</span>
            <span className="text-white text-2xl font-black italic leading-none tabular-nums">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM HUD BARS */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 flex flex-col gap-4 pointer-events-none">
        
        {/* Hull Health */}
        <div className="flex flex-col gap-1.5 relative">
            {/* Popups for Hull */}
            <div className="absolute bottom-full right-0 mb-2 flex flex-col items-end pointer-events-none">
                {popups.filter(p => p.type === 'HULL').map(p => (
                    <div key={p.id} className="text-red-500 font-black text-2xl drop-shadow-md" style={{ animation: 'floatUp 0.8s ease-out forwards' }}>
                        -{p.value}
                    </div>
                ))}
            </div>

          <div className="flex justify-between items-end px-1">
            <span className={`text-[11px] font-black uppercase tracking-widest ${healthPercent < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              <i className="fa-solid fa-shield-heart mr-2" />
              INTEGRITY HULL
            </span>
            <span className="text-white text-[11px] font-black tabular-nums drop-shadow-md">
              {Math.round(stats.currentHealth)} / {Math.round(stats.maxHealth)}
            </span>
          </div>
          <div className="w-full h-6 bg-slate-950/90 rounded-xl border-2 border-slate-800 overflow-hidden relative shadow-2xl">
            <div 
              className={`h-full transition-all duration-300 ${isInvulnerable ? 'bg-white opacity-40' : healthPercent < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
              style={{ width: `${healthPercent}%` }}
            >
                <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>
          </div>
        </div>

        {/* Shields */}
        <div className="flex flex-col gap-1.5 -mt-1 relative">
             {/* Popups for Shield */}
             <div className="absolute bottom-full right-0 mb-2 flex flex-col items-end pointer-events-none">
                {popups.filter(p => p.type === 'SHIELD').map(p => (
                    <div key={p.id} className="text-cyan-300 font-black text-xl drop-shadow-md" style={{ animation: 'floatUp 0.8s ease-out forwards' }}>
                        -{p.value}
                    </div>
                ))}
            </div>

          <div className="flex justify-between items-end px-1">
            <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-shield-halved mr-2" />
              PLASMA SHIELDS
            </span>
            <span className="text-blue-200 text-[10px] font-black tabular-nums">
              {Math.round(stats.currentShield)} / {Math.round(stats.maxShield)}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950/90 rounded-full border border-slate-800 overflow-hidden shadow-2xl">
            {/* Reduced transition duration from 500 to 200 for snappier feel */}
            <div 
              className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-200 relative" 
              style={{ width: `${shieldPercent}%` }} 
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between items-center px-1">
             <span className="text-cyan-400/60 text-[9px] font-black uppercase tracking-widest">NEURAL XP SYNC</span>
             <span className="text-cyan-400/60 text-[9px] font-black">{Math.round(xpPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950/90 rounded-full border border-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-700" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
        
      </div>
    </div>
    </>
  );
};

export default HUD;
