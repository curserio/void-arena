
import React, { useMemo } from 'react';
import { PersistentData, ShipConfig, MetaUpgrade, ShipType, WeaponType, PlayerStats } from '../types';
import { SHIPS, META_UPGRADES, WEAPON_PRICES } from '../constants';

interface GarageMenuProps {
  data: PersistentData;
  sessionCredits: number;
  onClose: () => void;
  onUpdate: (newData: PersistentData, spentSession: number) => void;
  onApplyEffect?: (effect: (s: PlayerStats) => PlayerStats) => void;
}

const formatCredits = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.floor(num).toLocaleString();
};

const GarageMenu: React.FC<GarageMenuProps> = ({ data, sessionCredits, onClose, onUpdate, onApplyEffect }) => {
  const totalCredits = useMemo(() => data.credits + sessionCredits, [data.credits, sessionCredits]);

  const getUpgradeCost = (upgrade: MetaUpgrade, currentLevel: number) => {
    // Geometric Progression: Base * (Factor ^ Level)
    return Math.floor(upgrade.costBase * Math.pow(upgrade.costFactor, currentLevel));
  };

  const buyMeta = (upgrade: MetaUpgrade) => {
    const currentLevel = data.metaLevels[upgrade.id] || 0;
    if (currentLevel >= upgrade.maxLevel) return;
    
    const cost = getUpgradeCost(upgrade, currentLevel);
    
    if (totalCredits >= cost) {
      let spentFromSession = Math.min(sessionCredits, cost);
      let newPersistentCredits = data.credits - (cost - spentFromSession);
      onUpdate({ ...data, credits: newPersistentCredits, metaLevels: { ...data.metaLevels, [upgrade.id]: currentLevel + 1 } }, spentFromSession);
    }
  };

  const buyShip = (ship: ShipConfig) => {
    if (data.unlockedShips.includes(ship.type)) { onUpdate({ ...data, equippedShip: ship.type }, 0); return; }
    if (totalCredits >= ship.cost) {
      let spentFromSession = Math.min(sessionCredits, ship.cost);
      let newPersistentCredits = data.credits - (ship.cost - spentFromSession);
      onUpdate({ ...data, credits: newPersistentCredits, unlockedShips: [...data.unlockedShips, ship.type], equippedShip: ship.type }, spentFromSession);
    }
  };

  const handleWeaponAction = (w: WeaponType) => {
    const unlocked = (data.unlockedWeapons || [WeaponType.PLASMA]).includes(w);
    if (unlocked) { onUpdate({ ...data, equippedWeapon: w }, 0); } 
    else {
      const price = WEAPON_PRICES[w] || 0;
      if (totalCredits >= price) {
        let spentFromSession = Math.min(sessionCredits, price);
        let newPersistentCredits = data.credits - (price - spentFromSession);
        onUpdate({ ...data, credits: newPersistentCredits, unlockedWeapons: [...(data.unlockedWeapons || [WeaponType.PLASMA]), w], equippedWeapon: w }, spentFromSession);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-[300] p-6 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-cyan-400 text-3xl font-black italic uppercase tracking-tighter">Command Garage</h2>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <i className="fa-solid fa-coins" />
              <span>{formatCredits(totalCredits)} CREDITS</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-black uppercase shadow-lg shadow-cyan-600/30 active:scale-95 transition-all">Resume Mission</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <h3 className="text-white font-bold uppercase tracking-widest text-xs opacity-50 px-2">Vessel Hangar</h3>
          <div className="flex flex-col gap-4">
            {SHIPS.map(s => {
              const isUnlocked = data.unlockedShips.includes(s.type);
              const isEquipped = data.equippedShip === s.type;
              return (
                <div key={s.type} className={`p-4 bg-slate-900/60 border rounded-2xl flex flex-col gap-3 transition-all ${isEquipped ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-slate-800 opacity-80'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-white text-lg font-black italic uppercase leading-tight">{s.name}</h4>
                      <p className="text-slate-500 text-[10px] mt-1 leading-relaxed">{s.description}</p>
                    </div>
                    <div className="w-6 h-6 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: s.color }} />
                  </div>
                  {!isUnlocked && <div className="text-amber-500 text-[10px] font-black">PRICE: {formatCredits(s.cost)} C</div>}
                  <button 
                    disabled={!isUnlocked && totalCredits < s.cost} 
                    onClick={() => buyShip(s)} 
                    className={`w-full py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all 
                        ${isEquipped ? 'bg-cyan-500 text-slate-950' : 
                          isUnlocked ? 'bg-slate-700 text-white' : 
                          'bg-amber-600 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none'}`}
                  >
                    {isEquipped ? 'ACTIVE' : 
                     isUnlocked ? 'SELECT' : 
                     (totalCredits < s.cost ? `MISSING ${formatCredits(s.cost - totalCredits)} C` : 'PURCHASE')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4">
          <h3 className="text-white font-bold uppercase tracking-widest text-xs opacity-50 px-2">Tech Systems</h3>
          <div className="flex flex-col gap-6">
            {[WeaponType.PLASMA, WeaponType.MISSILE, WeaponType.LASER].map(w => {
              const isUnlocked = (data.unlockedWeapons || [WeaponType.PLASMA]).includes(w);
              const isEquipped = (data.equippedWeapon || WeaponType.PLASMA) === w;
              const price = WEAPON_PRICES[w];
              const specificMetas = META_UPGRADES.filter(m => m.weaponType === w);
              return (
                <div key={w} className={`p-6 border rounded-3xl flex flex-col gap-4 transition-all ${isEquipped ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
                   <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <span className="text-white text-xl font-black italic uppercase tracking-tighter">{w} SYSTEM</span>
                    </div>
                    <button 
                        disabled={!isUnlocked && totalCredits < price} 
                        onClick={() => handleWeaponAction(w)} 
                        className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all shrink-0 
                            ${isEquipped ? 'bg-amber-500 text-slate-950' : 
                              isUnlocked ? 'bg-slate-700 text-white' : 
                              'bg-cyan-600 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed'}`}
                    >
                      {isEquipped ? 'EQUIPPED' : isUnlocked ? 'SELECT' : (totalCredits < price ? 'LOCKED' : `UNLOCK: ${formatCredits(price)} C`)}
                    </button>
                   </div>
                   {isUnlocked && (
                     <div className="mt-2 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {specificMetas.map(mu => {
                         const level = data.metaLevels[mu.id] || 0;
                         const cost = getUpgradeCost(mu, level);
                         const isMax = level >= mu.maxLevel;
                         const percent = Math.min(100, (level / mu.maxLevel) * 100);

                         return (
                           <div key={mu.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col gap-2 shadow-inner">
                              <div className="flex justify-between items-center">
                                <span className="text-cyan-400 text-[10px] font-black uppercase tracking-tight truncate max-w-[100px]">{mu.name}</span>
                                <span className="text-slate-500 text-[9px] font-black shrink-0">{level}/{mu.maxLevel}</span>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_5px_rgba(6,182,212,0.8)]" 
                                    style={{ width: `${percent}%` }}
                                  />
                              </div>

                              <p className="text-slate-500 text-[9px] leading-tight h-8 overflow-hidden">{mu.description}</p>
                              <button 
                                disabled={isMax || totalCredits < cost} 
                                onClick={() => buyMeta(mu)} 
                                className={`w-full py-2 rounded-lg font-black text-[10px] transition-all 
                                    ${isMax ? 'bg-slate-800 text-slate-500 cursor-default' : 
                                      totalCredits < cost ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed opacity-50' :
                                      'bg-slate-800 text-cyan-400 border border-cyan-400/20 active:bg-cyan-900/40 hover:border-cyan-400/50'}`}
                              >
                                {isMax ? 'MAXED' : `${formatCredits(cost)} C`}
                              </button>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <h3 className="text-white font-bold uppercase tracking-widest text-xs opacity-50 px-2">Core Avionics</h3>
          <div className="flex flex-col gap-4">
            {META_UPGRADES.filter(m => !m.weaponType).map(u => {
              const level = data.metaLevels[u.id] || 0;
              const cost = getUpgradeCost(u, level);
              const isMax = level >= u.maxLevel;
              const percent = Math.min(100, (level / u.maxLevel) * 100);

              return (
                <div key={u.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)] border border-slate-700">
                      <i className={`fa-solid ${u.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                          <h4 className="text-white font-black text-[11px] uppercase truncate tracking-tight">{u.name}</h4>
                          <div className="text-slate-500 text-[8px] font-bold">LV {level} / {u.maxLevel}</div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                        <div 
                            className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                            style={{ width: `${percent}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-500 text-[9px] leading-tight">{u.description}</p>
                  
                  <button 
                    disabled={isMax || totalCredits < cost} 
                    onClick={() => buyMeta(u)} 
                    className={`w-full py-2.5 rounded-xl flex items-center justify-center font-black text-[10px] transition-all 
                        ${isMax ? 'bg-slate-800 text-slate-500 cursor-default' : 
                          totalCredits < cost ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50 border border-slate-700' :
                          'bg-cyan-600 text-white shadow-lg active:scale-95 hover:bg-cyan-500'}`}
                  >
                    {isMax ? 'MAXED' : `UPGRADE: ${formatCredits(cost)} C`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GarageMenu;
