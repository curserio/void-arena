
import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats, ShipType, ModuleType } from '../types';
import { SHIPS } from '../constants';
import { POWER_UPS, isBuffActive } from '../systems/PowerUpSystem';

interface HUDProps {
  stats: PlayerStats;
  score: number;
  autoAttack: boolean;
  setAutoAttack: (val: boolean) => void;
  totalCredits: number;
  onPause: () => void;
  onShowUpgrades: () => void;
  onOpenGarage: () => void;
  onLevelClick?: () => void;
  onActivateModule?: () => void;
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

const HUD: React.FC<HUDProps> = ({ stats, score, autoAttack, setAutoAttack, totalCredits, onPause, onShowUpgrades, onOpenGarage, onLevelClick, onActivateModule }) => {
  const healthPercent = Math.max(0, (stats.currentHealth / stats.maxHealth) * 100);
  const shieldPercent = Math.max(0, (stats.currentShield / stats.maxShield) * 100);
  const xpPercent = Math.max(0, Math.min(100, (stats.xp / stats.xpToNextLevel) * 100));
  const isInvulnerable = performance.now() < stats.invulnerableUntil;
  const hasPendingLevels = stats.pendingLevelUps > 0;

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

  // Module Cooldown Logic
  const [moduleState, setModuleState] = useState({ ready: false, progress: 0, active: false, timeLeft: 0 });
  useEffect(() => {
      const update = () => {
          const now = performance.now();
          if (stats.moduleType === ModuleType.NONE) {
              setModuleState({ ready: false, progress: 0, active: false, timeLeft: 0 });
              return;
          }
          
          const isActive = now < stats.moduleActiveUntil;
          const isReady = now >= stats.moduleReadyTime;
          
          let progress = 0;
          let timeLeft = 0;

          if (isActive) {
              const remaining = stats.moduleActiveUntil - now;
              progress = remaining / stats.moduleDuration;
              timeLeft = remaining;
          } else if (!isReady) {
              const remaining = stats.moduleReadyTime - now;
              progress = 1 - (remaining / stats.moduleCooldownMax);
          } else {
              progress = 1;
          }
          
          setModuleState({ ready: isReady, progress, active: isActive, timeLeft });
      };
      const interval = setInterval(update, 50);
      update();
      return () => clearInterval(interval);
  }, [stats.moduleType, stats.moduleReadyTime, stats.moduleActiveUntil, stats.moduleDuration, stats.moduleCooldownMax]);


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
    <div className="fixed top-0 left-0 w-full p-2 pointer-events-none z-50 flex flex-col gap-4">
      <div className="flex justify-between items-start w-full">
        {/* Left Stats Block (Compacted) */}
        <div className="flex flex-col gap-2 pointer-events-auto max-w-[45%]">
          
          {/* Ship Info & XP Bar */}
          <button 
            onClick={hasPendingLevels ? onLevelClick : undefined}
            className={`bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 rounded-xl p-2 flex flex-col shadow-2xl min-w-[110px] transition-all 
                ${hasPendingLevels ? 'animate-pulse ring-2 ring-cyan-400 cursor-pointer active:scale-95' : ''}`}
          >
             <div className="flex justify-between items-center mb-1">
                 <span className="text-cyan-400/70 text-[9px] font-black uppercase tracking-widest truncate">{currentShipName}</span>
                 <div className={`bg-cyan-500 text-slate-950 px-1.5 rounded text-[9px] font-black shrink-0 ${hasPendingLevels ? 'bg-white' : ''}`}>
                     {hasPendingLevels ? 'UPGRADE!' : `LV ${stats.level}`}
                 </div>
             </div>
             
             {/* Embedded XP Bar */}
             <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700/50 mb-1">
                <div className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-700" style={{ width: `${xpPercent}%` }} />
             </div>
          </button>
          
          {/* Credits (Compacted) */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-xl p-2 flex items-center gap-2 shadow-2xl min-w-[110px] w-fit">
            <i className="fa-solid fa-coins text-amber-400 text-xs" />
            <span className="text-amber-400 font-black text-sm leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]">{formatCredits(totalCredits)}</span>
          </div>

          {/* Active Power-ups */}
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

        {/* Right Controls Block (Simplified) */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setAutoAttack(!autoAttack); }}
              className={`w-12 h-12 bg-slate-900/90 border-2 rounded-xl flex items-center justify-center transition-all shadow-2xl active:scale-90 ${autoAttack ? 'border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-slate-700 text-slate-500 opacity-60'}`}
            >
              <i className={`fa-solid ${autoAttack ? 'fa-crosshairs' : 'fa-slash'} text-lg`} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onPause(); }} className="w-12 h-12 bg-slate-900/90 border-2 border-slate-700 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl">
              <i className="fa-solid fa-pause text-lg" />
            </button>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 flex flex-col items-end shadow-xl">
            <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">SCORE</span>
            <span className="text-white text-lg font-black italic leading-none tabular-nums">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* MODULE BUTTON (Left Side, above Joystick area) */}
      {stats.moduleType !== ModuleType.NONE && (
          <div className="fixed bottom-32 left-6 pointer-events-auto z-[60]">
              <button 
                  onClick={onActivateModule}
                  disabled={!moduleState.ready && !moduleState.active}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 overflow-hidden
                      ${moduleState.active 
                          ? 'bg-fuchsia-600 animate-pulse ring-2 ring-white' 
                          : moduleState.ready 
                              ? 'bg-slate-900 border-2 border-fuchsia-500 text-fuchsia-400' 
                              : 'bg-slate-900 border-2 border-slate-700 text-slate-600'}`}
              >
                  <i className={`fa-solid fa-forward-fast text-2xl z-10 ${moduleState.ready || moduleState.active ? 'text-white' : 'text-slate-600'}`} />
                  
                  {/* Charging Progress Ring */}
                  {!moduleState.ready && !moduleState.active && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
                          {/* Track */}
                          <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          
                          {/* Fill */}
                          <circle 
                              cx="32" cy="32" r="29" 
                              fill="none" stroke="#d946ef" strokeWidth="3" 
                              strokeOpacity="0.5"
                              strokeDasharray={182.2} 
                              strokeDashoffset={182.2 * (1 - moduleState.progress)}
                              strokeLinecap="round"
                          />
                      </svg>
                  )}

                  {/* Active Duration Ring */}
                  {moduleState.active && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 64 64">
                          <circle 
                              cx="32" cy="32" r="29" 
                              fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="3"
                              strokeDasharray={182.2} // 2 * PI * 29
                              strokeDashoffset={182.2 * (1 - moduleState.progress)}
                              strokeLinecap="round"
                          />
                      </svg>
                  )}
              </button>
              <div className="mt-1 text-center">
                  <span className="bg-slate-900/80 text-[9px] font-black uppercase text-fuchsia-400 px-2 py-0.5 rounded border border-fuchsia-500/30 shadow-lg">
                      {moduleState.active 
                        ? `${(moduleState.timeLeft / 1000).toFixed(1)}s` 
                        : (moduleState.ready ? 'READY' : 'CHARGING')}
                  </span>
              </div>
          </div>
      )}

      {/* BOTTOM HUD BARS (XP removed, only Health/Shield) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg flex flex-col gap-3 pointer-events-none">
        
        {/* Hull Health */}
        <div className="flex flex-col gap-1 relative">
            {/* Popups for Hull */}
            <div className="absolute bottom-full right-0 mb-2 flex flex-col items-end pointer-events-none">
                {popups.filter(p => p.type === 'HULL').map(p => (
                    <div key={p.id} className="text-red-500 font-black text-xl drop-shadow-md" style={{ animation: 'floatUp 0.8s ease-out forwards' }}>
                        -{p.value}
                    </div>
                ))}
            </div>

          <div className="flex justify-between items-end px-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${healthPercent < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
              <i className="fa-solid fa-shield-heart mr-2" />
              HULL
            </span>
            <span className="text-white text-[10px] font-black tabular-nums drop-shadow-md">
              {Math.round(stats.currentHealth)}/{Math.round(stats.maxHealth)}
            </span>
          </div>
          <div className="w-full h-4 bg-slate-950/90 rounded-lg border border-slate-800 overflow-hidden relative shadow-2xl">
            <div 
              className={`h-full transition-all duration-300 ${isInvulnerable ? 'bg-white opacity-40' : healthPercent < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-emerald-600 to-emerald-400'}`}
              style={{ width: `${healthPercent}%` }}
            >
                <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>
          </div>
        </div>

        {/* Shields */}
        <div className="flex flex-col gap-1 relative">
             {/* Popups for Shield */}
             <div className="absolute bottom-full right-0 mb-2 flex flex-col items-end pointer-events-none">
                {popups.filter(p => p.type === 'SHIELD').map(p => (
                    <div key={p.id} className="text-cyan-300 font-black text-lg drop-shadow-md" style={{ animation: 'floatUp 0.8s ease-out forwards' }}>
                        -{p.value}
                    </div>
                ))}
            </div>

          <div className="flex justify-between items-end px-1">
            <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest">
              <i className="fa-solid fa-shield-halved mr-2" />
              SHIELD
            </span>
            <span className="text-blue-200 text-[9px] font-black tabular-nums">
              {Math.round(stats.currentShield)}/{Math.round(stats.maxShield)}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950/90 rounded-full border border-slate-800 overflow-hidden shadow-2xl">
            <div 
              className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-200 relative" 
              style={{ width: `${shieldPercent}%` }} 
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
    </>
  );
};

export default HUD;
