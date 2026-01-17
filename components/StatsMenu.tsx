
import React from 'react';
import { PlayerStats, WeaponType } from '../types';
import { powerUpManager } from '../core/systems/PowerUpManager';

interface StatsMenuProps {
  stats: PlayerStats;
  onClose: () => void;
  gameTime?: number; // Needed to check active buffs
}

const StatRow: React.FC<{ label: string; value: string | number; subValue?: string; icon: string; highlight?: boolean }> = ({ label, value, subValue, icon, highlight }) => (
  <div className={`flex justify-between items-center p-3 rounded-xl border ${highlight ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700 ${highlight ? 'text-emerald-400' : 'text-slate-400'}`}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <span className="text-slate-300 text-xs font-bold uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-right">
      <div className={`font-black text-lg ${highlight ? 'text-emerald-400' : 'text-white'}`}>{value}</div>
      {subValue && <div className="text-[10px] text-slate-500 font-bold uppercase">{subValue}</div>}
    </div>
  </div>
);

const StatsMenu: React.FC<StatsMenuProps> = ({ stats, onClose, gameTime = performance.now() }) => {

  // Calculate Effective Stats (Including Buffs)
  const isSpeedBuff = powerUpManager.isBuffActive(stats, 'SPEED', gameTime);
  const isFireRateBuff = powerUpManager.isBuffActive(stats, 'OVERDRIVE', gameTime);

  const effectiveSpeed = stats.speed * (isSpeedBuff ? 1.5 : 1.0);
  const effectiveFireRate = stats.fireRate * (isFireRateBuff ? 2.5 : 1.0);

  const dps = Math.round(stats.damage * effectiveFireRate * stats.bulletCount);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[450] p-6 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-cyan-400 text-3xl font-black italic uppercase tracking-tighter">System Diagnostic</h2>
            <p className="text-slate-400 text-sm">Real-time vessel performance telemetry</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-slate-700 transition-colors border border-slate-700">
            <i className="fa-solid fa-times text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* DEFENSE */}
            <div className="col-span-full text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Integrity Systems</div>

            <StatRow
              label="Hull Integrity"
              value={`${Math.round(stats.currentHealth)} / ${Math.round(stats.maxHealth)}`}
              icon="fa-heart-pulse"
            />
            <StatRow
              label="Plasma Shield"
              value={`${Math.round(stats.currentShield)} / ${Math.round(stats.maxShield)}`}
              subValue={`Regen: ${stats.shieldRegen.toFixed(1)}/sec`}
              icon="fa-shield-halved"
            />

            {/* OFFENSE */}
            <div className="col-span-full text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">Weapons Systems</div>

            <StatRow
              label="Damage Output"
              value={Math.round(stats.damage)}
              subValue={`~${dps} DPS (Est.)`}
              icon="fa-burst"
            />
            <StatRow
              label="Fire Cycle"
              value={`${effectiveFireRate.toFixed(2)} /s`}
              subValue={isFireRateBuff ? "OVERDRIVE ACTIVE" : "Standard Cycle"}
              icon="fa-bolt"
              highlight={isFireRateBuff}
            />
            <StatRow
              label="Critical Hit"
              value={`${(stats.critChance * 100).toFixed(0)}%`}
              subValue={`Multiplier: x${stats.critMultiplier.toFixed(1)}`}
              icon="fa-crosshairs"
            />
            <StatRow
              label="Projectiles"
              value={stats.bulletCount}
              subValue={stats.weaponType === WeaponType.LASER ? 'Beam Emitters' : 'Per Shot'}
              icon="fa-clone"
            />

            {/* MOBILITY & UTILITY */}
            <div className="col-span-full text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">Navigation & Utility</div>

            <StatRow
              label="Thruster Output"
              value={Math.round(effectiveSpeed)}
              subValue={isSpeedBuff ? "NITRO INJECTION" : "Standard Cruise"}
              icon="fa-gauge-high"
              highlight={isSpeedBuff}
            />
            <StatRow
              label="Magnet Field"
              value={`${Math.round(stats.magnetRange)}m`}
              icon="fa-magnet"
            />
            <StatRow
              label="Salvage Efficiency"
              value={`x${stats.creditMultiplier.toFixed(2)}`}
              icon="fa-coins"
            />

            {/* WEAPON SPECIFICS */}
            {stats.weaponType !== WeaponType.PLASMA && (
              <>
                <div className="col-span-full text-slate-500 text-[10px] font-black uppercase tracking-widest mt-4">Class Specifics ({stats.weaponType})</div>

                {stats.weaponType === WeaponType.MISSILE && (
                  <StatRow label="Blast Radius" value={`${Math.round(stats.areaSize)}px`} icon="fa-bomb" />
                )}
                {stats.weaponType === WeaponType.ENERGY_ORB && (
                  <>
                    <StatRow label="Pulse Radius" value={`${Math.round(stats.areaSize)}px`} icon="fa-circle-dot" />
                    <StatRow label="Flight Time" value={`${(stats.duration / 1000).toFixed(1)}s`} icon="fa-hourglass-half" />
                  </>
                )}
                {stats.weaponType === WeaponType.FLAMETHROWER && (
                  <>
                    <StatRow label="Flame Width" value={`${Math.round(stats.areaSize)}px`} icon="fa-ruler-vertical" />
                    <StatRow label="Flame Range" value={`${(stats.duration / 1000).toFixed(1)}s`} icon="fa-ruler-horizontal" />
                  </>
                )}
                {stats.weaponType === WeaponType.ARC_CASTER && (
                  <>
                    <StatRow label="Chain Range" value={`${Math.round(stats.chainRange)}px`} icon="fa-share-nodes" />
                    <StatRow label="Jump Count" value={stats.pierceCount} icon="fa-bolt" />
                  </>
                )}
                {stats.weaponType === WeaponType.SWARM_LAUNCHER && (
                  <>
                    <StatRow label="Burst Count" value={stats.swarmCount} icon="fa-layer-group" />
                    <StatRow label="Homing Agility" value={stats.swarmAgility.toFixed(1)} icon="fa-paper-plane" />
                  </>
                )}
                {stats.weaponType === WeaponType.LASER && (
                  <StatRow label="Beam Duration" value={`${stats.laserDuration.toFixed(2)}s`} icon="fa-stopwatch" />
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsMenu;
