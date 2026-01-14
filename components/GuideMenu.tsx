
import React, { useState } from 'react';
import { UPGRADES, WEAPON_BASE_STATS } from '../constants';
import { WeaponType } from '../types';

interface GuideMenuProps {
  onClose: () => void;
}

const GuideMenu: React.FC<GuideMenuProps> = ({ onClose }) => {
  const [tab, setTab] = useState<'UPGRADES' | 'WEAPONS' | 'ENEMIES' | 'HELP'>('UPGRADES');
  const [viewLevel, setViewLevel] = useState(1);

  const getWeaponIcon = (w: string) => {
    switch (w) {
      case WeaponType.PLASMA: return 'fa-fire-burner';
      case WeaponType.MISSILE: return 'fa-rocket';
      case WeaponType.LASER: return 'fa-sun';
      case WeaponType.SWARM_LAUNCHER: return 'fa-hive';
      default: return 'fa-gun';
    }
  };

  const getWeaponName = (w: string) => {
      switch (w) {
          case WeaponType.PLASMA: return 'Plasma Cannon';
          case WeaponType.MISSILE: return 'Havoc Missile';
          case WeaponType.LASER: return 'Phase Laser';
          case WeaponType.SWARM_LAUNCHER: return 'Swarm Launcher';
          default: return w;
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[400] p-4 md:p-8 animate-in fade-in zoom-in duration-200">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-cyan-400 text-3xl md:text-4xl font-black italic uppercase tracking-tighter">Database</h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                  { id: 'UPGRADES', label: 'Upgrades', icon: 'fa-microchip' },
                  { id: 'WEAPONS', label: 'Arsenal', icon: 'fa-crosshairs' },
                  { id: 'ENEMIES', label: 'Intel', icon: 'fa-eye' },
                  { id: 'HELP', label: 'Help', icon: 'fa-circle-question' }
              ].map(t => (
                  <button 
                    key={t.id}
                    onClick={() => setTab(t.id as any)}
                    className={`px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2
                        ${tab === t.id 
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <i className={`fa-solid ${t.icon}`} />
                    {t.label}
                  </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-red-500 transition-colors shrink-0">
            <i className="fa-solid fa-times text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* UPGRADES TAB */}
          {tab === 'UPGRADES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 px-1">Available System Enhancements</div>
              {UPGRADES.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-cyan-500/50 transition-all">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-cyan-400 border border-slate-800 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-all">
                    <i className={`fa-solid ${u.icon} text-xl`} />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm uppercase tracking-tight">{u.name}</h3>
                    <p className="text-slate-400 text-xs leading-snug">{u.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* WEAPONS TAB */}
          {tab === 'WEAPONS' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.values(WeaponType).map(w => {
                    const stats = WEAPON_BASE_STATS[w];
                    // Manual overrides for displayed stats that aren't in BASE_STATS but hardcoded in logic
                    let extraInfo = [];
                    if (w === WeaponType.SWARM_LAUNCHER) {
                        extraInfo.push({ label: 'Burst Count', val: '3 - 9' });
                        extraInfo.push({ label: 'Blast Radius', val: '150px' });
                        extraInfo.push({ label: 'Homing', val: 'Active' });
                    } else if (w === WeaponType.MISSILE) {
                        extraInfo.push({ label: 'Blast Radius', val: '195px' });
                        extraInfo.push({ label: 'Pierce', val: 'No' });
                    } else if (w === WeaponType.LASER) {
                        extraInfo.push({ label: 'Beam Duration', val: '0.3s' });
                        extraInfo.push({ label: 'Tick Rate', val: '10/sec' });
                        extraInfo.push({ label: 'Pierce', val: 'Infinite' });
                    } else if (w === WeaponType.PLASMA) {
                        extraInfo.push({ label: 'Effect', val: 'Slows Enemies' });
                    }

                    return (
                        <div key={w} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition-colors">
                            <div className="flex items-center gap-4 mb-4 border-b border-slate-800 pb-4">
                                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 border border-slate-800">
                                    <i className={`fa-solid ${getWeaponIcon(w)} text-xl`} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-lg uppercase tracking-tight">{getWeaponName(w)}</h3>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{w} CLASS</div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                                <div className="flex justify-between items-baseline border-b border-slate-800/50 pb-1">
                                    <span className="text-slate-400 text-xs font-bold uppercase">Base Damage</span>
                                    <span className="text-white font-black text-sm">{stats.damage}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-slate-800/50 pb-1">
                                    <span className="text-slate-400 text-xs font-bold uppercase">Fire Rate</span>
                                    <span className="text-white font-black text-sm">{stats.fireRate}/s</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-slate-800/50 pb-1">
                                    <span className="text-slate-400 text-xs font-bold uppercase">Velocity</span>
                                    <span className="text-white font-black text-sm">{stats.bulletSpeed}</span>
                                </div>
                                {extraInfo.map((info, i) => (
                                     <div key={i} className="flex justify-between items-baseline border-b border-slate-800/50 pb-1">
                                        <span className="text-amber-500/80 text-xs font-bold uppercase">{info.label}</span>
                                        <span className="text-white font-black text-sm">{info.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
             </div>
          )}

          {/* ENEMIES TAB */}
          {tab === 'ENEMIES' && (
              <div className="flex flex-col gap-6">
                  {/* Level Slider */}
                  <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl sticky top-0 z-10 shadow-xl">
                      <div className="flex justify-between items-end mb-4">
                          <label className="text-cyan-400 font-black uppercase text-sm tracking-widest">
                              <i className="fa-solid fa-calculator mr-2" />
                              Threat Level Simulator
                           </label>
                          <span className="text-3xl font-black text-white tabular-nums">LV {viewLevel}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="100" 
                        value={viewLevel} 
                        onChange={(e) => setViewLevel(parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mt-2">
                          <span>Rank 1 (Cadet)</span>
                          <span>Rank 50 (Elite)</span>
                          <span>Rank 100 (Voidwalker)</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Scout */}
                      <EnemyCard 
                        name="Void Scout" 
                        role="Swarm / Fodder" 
                        baseHp={80 * viewLevel} 
                        speed="Fast" 
                        desc="Basic fast unit. Colors vary by speed."
                        icon="fa-shuttle-space"
                        color="#a5b4fc"
                      />
                      {/* Striker */}
                      <EnemyCard 
                        name="Crimson Striker" 
                        role="Melee Rusher" 
                        baseHp={220 * viewLevel} 
                        speed="V. Fast" 
                        desc="Tries to ram the player. High damage collision."
                        icon="fa-jet-fighter"
                        color="#f87171"
                      />
                      {/* Laser Scout */}
                      <EnemyCard 
                        name="Sniper Drone" 
                        role="Ranged Support" 
                        baseHp={150 * viewLevel} 
                        speed="Medium" 
                        desc="Orbits at distance. Charges a laser beam."
                        icon="fa-satellite"
                        color="#c084fc"
                      />
                      {/* Boss */}
                      <EnemyCard 
                        name="Dreadnought Boss" 
                        role="Capital Ship" 
                        baseHp={5000 * viewLevel} 
                        speed="Slow" 
                        desc="Spawns every 3 minutes. Massive laser cannon."
                        icon="fa-skull"
                        color="#4ade80"
                        isBoss
                      />
                  </div>
              </div>
          )}

          {/* HELP TAB */}
          {tab === 'HELP' && (
            <div className="flex flex-col gap-8 text-slate-300">
              <section>
                <h3 className="text-cyan-400 font-black uppercase text-sm mb-3">Controls</h3>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
                  <p><span className="text-white font-bold">Movement:</span> Use Right Stick / WASD / Arrows</p>
                  <p><span className="text-white font-bold">Aiming:</span> Use Left Stick / Mouse / Touch Screen</p>
                  <p><span className="text-white font-bold">Firing:</span> Automatic when aiming at enemies, or hold Trigger/Mouse Click</p>
                </div>
              </section>

              <section>
                <h3 className="text-cyan-400 font-black uppercase text-sm mb-3">Gameplay</h3>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3 text-sm">
                  <p>Survive endless waves of enemies in deep space. Collect <span className="text-cyan-400 font-bold italic">Neural XP Sync</span> gems to level up and acquire random upgrades.</p>
                  <p>Collect <span className="text-amber-400 font-bold italic">Credits</span> during missions to unlock permanent ship upgrades in the <span className="text-white font-bold">Command Garage</span>.</p>
                  <p>Watch out for <span className="text-red-500 font-bold italic">Elite Enemies</span> marked with a magenta glow—they are tougher but drop better loot.</p>
                </div>
              </section>

              <section>
                <h3 className="text-cyan-400 font-black uppercase text-sm mb-3">Ship Systems</h3>
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-3 text-sm">
                  <p><span className="text-emerald-400 font-bold">Integrity Hull:</span> Your primary health. If this reaches zero, mission ends.</p>
                  <p><span className="text-blue-400 font-bold">Plasma Shields:</span> Recharges after not taking damage for 3 seconds.</p>
                </div>
              </section>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-4 bg-slate-800 text-white font-black text-xl rounded-2xl uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-slate-700 shrink-0"
        >
          Close Database
        </button>
      </div>
    </div>
  );
};

const EnemyCard: React.FC<{ name: string; role: string; baseHp: number; speed: string; desc: string; icon: string; color: string; isBoss?: boolean }> = ({ name, role, baseHp, speed, desc, icon, color, isBoss }) => {
    return (
        <div className={`p-4 rounded-2xl border bg-slate-950/40 flex flex-col gap-3 ${isBoss ? 'border-emerald-500/50 bg-emerald-900/10 col-span-1 md:col-span-2' : 'border-slate-800'}`}>
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700" style={{ color: color }}>
                        <i className={`fa-solid ${icon} text-lg`} />
                    </div>
                    <div>
                        <h4 className="text-white font-black uppercase text-sm" style={{ color: isBoss ? '#4ade80' : undefined }}>{name}</h4>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">{role}</div>
                    </div>
                </div>
                {isBoss && <div className="px-2 py-1 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded">Boss Class</div>}
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                 <div className="text-center border-r border-slate-800">
                     <div className="text-[9px] text-slate-500 uppercase font-bold">Normal HP</div>
                     <div className="text-white font-bold text-xs">{baseHp.toLocaleString()}</div>
                 </div>
                 <div className="text-center border-r border-slate-800">
                     <div className="text-[9px] text-fuchsia-400 uppercase font-bold">Elite HP</div>
                     <div className="text-fuchsia-200 font-bold text-xs">{(baseHp * 3).toLocaleString()}</div>
                 </div>
                 <div className="text-center">
                     <div className="text-[9px] text-red-500 uppercase font-bold">{isBoss ? 'Shield' : 'MiniBoss'}</div>
                     <div className="text-red-300 font-bold text-xs">{isBoss ? (baseHp * 0.25).toLocaleString() : (baseHp * 12).toLocaleString()}</div>
                 </div>
            </div>

            <p className="text-slate-400 text-xs italic">{desc}</p>
        </div>
    );
};

export default GuideMenu;
