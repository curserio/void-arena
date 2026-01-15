
import React, { useMemo, useState } from 'react';
import { PersistentData, ShipConfig, MetaUpgrade, ShipType, WeaponType, PlayerStats, ModuleType } from '../types';
import { SHIPS, META_UPGRADES, WEAPON_PRICES, MODULE_PRICES } from '../constants';

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
  const [activeTab, setActiveTab] = useState<'SHIPS' | 'WEAPONS' | 'MODULES' | 'CORE'>('SHIPS');
  
  // Track collapsed state for weapons/modules
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => ({
    [WeaponType.PLASMA]: data.equippedWeapon === WeaponType.PLASMA,
    [WeaponType.MISSILE]: data.equippedWeapon === WeaponType.MISSILE,
    [WeaponType.LASER]: data.equippedWeapon === WeaponType.LASER,
    [WeaponType.SWARM_LAUNCHER]: data.equippedWeapon === WeaponType.SWARM_LAUNCHER,
    [ModuleType.AFTERBURNER]: (data.equippedModule || ModuleType.NONE) === ModuleType.AFTERBURNER
  }));

  const totalCredits = useMemo(() => data.credits + sessionCredits, [data.credits, sessionCredits]);

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
    if (unlocked) { 
        onUpdate({ ...data, equippedWeapon: w }, 0);
        setExpandedItems(prev => ({ ...prev, [w]: true }));
    } 
    else {
      const price = WEAPON_PRICES[w] || 0;
      if (totalCredits >= price) {
        let spentFromSession = Math.min(sessionCredits, price);
        let newPersistentCredits = data.credits - (price - spentFromSession);
        onUpdate({ ...data, credits: newPersistentCredits, unlockedWeapons: [...(data.unlockedWeapons || [WeaponType.PLASMA]), w], equippedWeapon: w }, spentFromSession);
        setExpandedItems(prev => ({ ...prev, [w]: true }));
      }
    }
  };

  const handleModuleAction = (m: ModuleType) => {
      const unlocked = (data.unlockedModules || []).includes(m);
      if (unlocked) {
          // Toggle equip
          const newEquipped = data.equippedModule === m ? ModuleType.NONE : m;
          onUpdate({ ...data, equippedModule: newEquipped }, 0);
          if (newEquipped === m) setExpandedItems(prev => ({ ...prev, [m]: true }));
      } else {
          const price = MODULE_PRICES[m] || 0;
          if (totalCredits >= price) {
              let spentFromSession = Math.min(sessionCredits, price);
              let newPersistentCredits = data.credits - (price - spentFromSession);
              onUpdate({ ...data, credits: newPersistentCredits, unlockedModules: [...(data.unlockedModules || []), m], equippedModule: m }, spentFromSession);
              setExpandedItems(prev => ({ ...prev, [m]: true }));
          }
      }
  };

  const getWeaponIcon = (w: WeaponType) => {
      switch(w) {
          case WeaponType.PLASMA: return 'fa-fire-burner';
          case WeaponType.MISSILE: return 'fa-rocket';
          case WeaponType.LASER: return 'fa-sun';
          case WeaponType.SWARM_LAUNCHER: return 'fa-hive';
          default: return 'fa-gun';
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col z-[300] overflow-hidden">
      {/* Header Section */}
      <div className="shrink-0 p-6 bg-slate-900 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-cyan-400 text-3xl font-black italic uppercase tracking-tighter">Command Garage</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <i className="fa-solid fa-coins" />
                <span>{formatCredits(totalCredits)} CREDITS</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-black uppercase shadow-lg shadow-cyan-600/30 active:scale-95 transition-all hover:bg-cyan-500">
             Resume
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-700/50 pb-0 overflow-x-auto">
            {[
                { id: 'SHIPS', label: 'Vessels', icon: 'fa-shuttle-space', color: 'cyan' },
                { id: 'WEAPONS', label: 'Armory', icon: 'fa-crosshairs', color: 'amber' },
                { id: 'MODULES', label: 'Modules', icon: 'fa-puzzle-piece', color: 'fuchsia' },
                { id: 'CORE', label: 'Avionics', icon: 'fa-microchip', color: 'emerald' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-t-xl font-black text-sm uppercase tracking-widest transition-all relative top-[1px] whitespace-nowrap
                        ${activeTab === tab.id 
                            ? `bg-slate-950 text-${tab.color}-400 border-x border-t border-slate-700` 
                            : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                    <i className={`fa-solid ${tab.icon} mr-2`} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-950">
        
        {/* SHIPS TAB */}
        {activeTab === 'SHIPS' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {SHIPS.map(s => {
                    const isUnlocked = data.unlockedShips.includes(s.type);
                    const isEquipped = data.equippedShip === s.type;
                    return (
                        <div key={s.type} className={`p-6 bg-slate-900/40 border rounded-3xl flex flex-col gap-4 transition-all ${isEquipped ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-cyan-900/10' : 'border-slate-800 opacity-90 hover:opacity-100'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-white text-2xl font-black italic uppercase leading-tight">{s.name}</h4>
                                    <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">Class: {s.type}</div>
                                </div>
                                <div className="w-10 h-10 rounded-full shrink-0 shadow-lg border-2 border-white/20" style={{ backgroundColor: s.color }} />
                            </div>
                            
                            <p className="text-slate-400 text-xs leading-relaxed h-8">{s.description}</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase">
                                <div><i className="fa-solid fa-heart mr-1" /> HP: {s.baseStats.maxHealth}</div>
                                <div><i className="fa-solid fa-shield mr-1" /> SH: {s.baseStats.maxShield}</div>
                                <div><i className="fa-solid fa-bolt mr-1" /> SPD: {s.baseStats.speed}</div>
                                {s.baseStats.damage && <div><i className="fa-solid fa-burst mr-1" /> DMG: {s.baseStats.damage}</div>}
                            </div>

                            <div className="mt-auto">
                                {!isUnlocked && <div className="text-amber-500 text-xs font-black mb-2 text-center">PRICE: {formatCredits(s.cost)} C</div>}
                                <button 
                                    disabled={!isUnlocked && totalCredits < s.cost} 
                                    onClick={() => buyShip(s)} 
                                    className={`w-full py-3 rounded-xl font-black text-sm shadow-md active:scale-95 transition-all uppercase tracking-wide
                                        ${isEquipped ? 'bg-cyan-500 text-slate-950' : 
                                        isUnlocked ? 'bg-slate-700 text-white hover:bg-slate-600' : 
                                        'bg-amber-600 text-white disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed disabled:shadow-none'}`}
                                >
                                    {isEquipped ? 'SYSTEMS ONLINE' : 
                                    isUnlocked ? 'DEPLOY VESSEL' : 
                                    (totalCredits < s.cost ? `MISSING ${formatCredits(s.cost - totalCredits)} C` : 'PURCHASE AUTHORIZATION')}
                                </button>
                            </div>
                        </div>
                    );
                })}
             </div>
        )}

        {/* WEAPONS TAB */}
        {activeTab === 'WEAPONS' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {[WeaponType.PLASMA, WeaponType.MISSILE, WeaponType.LASER, WeaponType.SWARM_LAUNCHER].map(w => {
                    const isUnlocked = (data.unlockedWeapons || [WeaponType.PLASMA]).includes(w);
                    const isEquipped = (data.equippedWeapon || WeaponType.PLASMA) === w;
                    const price = WEAPON_PRICES[w];
                    const specificMetas = META_UPGRADES.filter(m => m.weaponType === w);
                    const isExpanded = expandedItems[w];
                    
                    return (
                        <div key={w} className={`p-6 border rounded-3xl flex flex-col gap-6 transition-all ${isEquipped ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
                            {/* Header / Main Card Info */}
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div 
                                    className={`flex items-center gap-4 ${isUnlocked ? 'cursor-pointer' : ''}`}
                                    onClick={() => isUnlocked && toggleItem(w)}
                                >
                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${isEquipped ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                         <i className={`fa-solid ${getWeaponIcon(w)}`} />
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-3">
                                            <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter">{w.replace('_', ' ')}</h3>
                                            {isUnlocked && (
                                                <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-500 text-sm`} />
                                            )}
                                         </div>
                                         <div className="text-slate-500 text-xs font-bold uppercase">{isUnlocked ? (isEquipped ? 'Currently Active' : 'Ready to Equip') : 'Locked Pattern'}</div>
                                     </div>
                                </div>
                                <button 
                                    disabled={!isUnlocked && totalCredits < price} 
                                    onClick={() => handleWeaponAction(w)} 
                                    className={`px-8 py-3 rounded-xl text-xs font-black shadow-md transition-all shrink-0 uppercase tracking-widest
                                        ${isEquipped ? 'bg-amber-500 text-slate-950 cursor-default' : 
                                        isUnlocked ? 'bg-slate-700 text-white hover:bg-slate-600' : 
                                        'bg-cyan-600 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-cyan-500'}`}
                                >
                                {isEquipped ? 'EQUIPPED' : isUnlocked ? 'EQUIP' : (totalCredits < price ? 'INSUFFICIENT FUNDS' : `UNLOCK: ${formatCredits(price)} C`)}
                                </button>
                            </div>

                            {/* Collapsible Upgrades Section */}
                            {isUnlocked && isExpanded && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50 animate-in fade-in zoom-in duration-200 origin-top">
                                {specificMetas.map(mu => {
                                    const level = data.metaLevels[mu.id] || 0;
                                    const cost = getUpgradeCost(mu, level);
                                    const isMax = level >= mu.maxLevel;
                                    const percent = Math.min(100, (level / mu.maxLevel) * 100);

                                    return (
                                    <div key={mu.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-inner hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-amber-400 border border-slate-800">
                                                 <i className={`fa-solid ${mu.icon}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-slate-200 text-[11px] font-black uppercase tracking-tight truncate">{mu.name}</span>
                                                    <span className="text-slate-500 text-[9px] font-black">{level}/{mu.maxLevel}</span>
                                                </div>
                                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                                    <div className="h-full bg-amber-500" style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-slate-500 text-[10px] leading-tight min-h-[2.5em]">{mu.description}</p>
                                        
                                        <button 
                                            disabled={isMax || totalCredits < cost} 
                                            onClick={() => buyMeta(mu)} 
                                            className={`w-full py-2 rounded-lg font-black text-[10px] transition-all uppercase
                                                ${isMax ? 'bg-slate-900 text-emerald-500 border border-emerald-900/30' : 
                                                totalCredits < cost ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50' :
                                                'bg-slate-800 text-amber-400 border border-amber-400/20 hover:bg-amber-400/10'}`}
                                        >
                                            {isMax ? 'MAX LEVEL' : `${formatCredits(cost)} C`}
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
        )}

        {/* MODULES TAB */}
        {activeTab === 'MODULES' && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {[ModuleType.AFTERBURNER].map(m => {
                    const isUnlocked = (data.unlockedModules || []).includes(m);
                    const isEquipped = data.equippedModule === m;
                    const price = MODULE_PRICES[m];
                    const specificMetas = META_UPGRADES.filter(mu => mu.moduleType === m);
                    const isExpanded = expandedItems[m];

                    return (
                        <div key={m} className={`p-6 border rounded-3xl flex flex-col gap-6 transition-all ${isEquipped ? 'border-fuchsia-500 bg-fuchsia-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div 
                                    className={`flex items-center gap-4 ${isUnlocked ? 'cursor-pointer' : ''}`}
                                    onClick={() => isUnlocked && toggleItem(m)}
                                >
                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border ${isEquipped ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-400' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                         <i className="fa-solid fa-forward-fast" />
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-3">
                                            <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter">AFTERBURNER</h3>
                                            {isUnlocked && (
                                                <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-500 text-sm`} />
                                            )}
                                         </div>
                                         <div className="text-slate-500 text-xs font-bold uppercase">{isUnlocked ? (isEquipped ? 'Active Module' : 'In Storage') : 'Experimental Tech'}</div>
                                     </div>
                                </div>
                                <button 
                                    disabled={!isUnlocked && totalCredits < price} 
                                    onClick={() => handleModuleAction(m)} 
                                    className={`px-8 py-3 rounded-xl text-xs font-black shadow-md transition-all shrink-0 uppercase tracking-widest
                                        ${isEquipped ? 'bg-slate-700 text-fuchsia-400 border border-fuchsia-500 hover:bg-slate-600' : 
                                        isUnlocked ? 'bg-slate-700 text-white hover:bg-slate-600' : 
                                        'bg-cyan-600 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed hover:bg-cyan-500'}`}
                                >
                                {isEquipped ? 'UNEQUIP' : isUnlocked ? 'EQUIP' : (totalCredits < price ? 'INSUFFICIENT FUNDS' : `BUY: ${formatCredits(price)} C`)}
                                </button>
                            </div>

                            {isUnlocked && isExpanded && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50 animate-in fade-in zoom-in duration-200 origin-top">
                                    {specificMetas.map(mu => {
                                        const level = data.metaLevels[mu.id] || 0;
                                        const cost = getUpgradeCost(mu, level);
                                        const isMax = level >= mu.maxLevel;
                                        const percent = Math.min(100, (level / mu.maxLevel) * 100);

                                        return (
                                            <div key={mu.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-inner hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-fuchsia-400 border border-slate-800">
                                                        <i className={`fa-solid ${mu.icon}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="text-slate-200 text-[11px] font-black uppercase tracking-tight truncate">{mu.name}</span>
                                                            <span className="text-slate-500 text-[9px] font-black">{level}/{mu.maxLevel}</span>
                                                        </div>
                                                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                                            <div className="h-full bg-fuchsia-500" style={{ width: `${percent}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-slate-500 text-[10px] leading-tight min-h-[2.5em]">{mu.description}</p>
                                                <button 
                                                    disabled={isMax || totalCredits < cost} 
                                                    onClick={() => buyMeta(mu)} 
                                                    className={`w-full py-2 rounded-lg font-black text-[10px] transition-all uppercase
                                                        ${isMax ? 'bg-slate-900 text-emerald-500 border border-emerald-900/30' : 
                                                        totalCredits < cost ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50' :
                                                        'bg-slate-800 text-fuchsia-400 border border-fuchsia-400/20 hover:bg-fuchsia-400/10'}`}
                                                >
                                                    {isMax ? 'MAX LEVEL' : `${formatCredits(cost)} C`}
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
        )}

        {/* CORE AVIONICS TAB */}
        {activeTab === 'CORE' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {META_UPGRADES.filter(m => !m.weaponType && !m.moduleType).map(u => {
                    const level = data.metaLevels[u.id] || 0;
                    const cost = getUpgradeCost(u, level);
                    const isMax = level >= u.maxLevel;
                    const percent = Math.min(100, (level / u.maxLevel) * 100);

                    return (
                        <div key={u.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-slate-700">
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
                                        className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                                        style={{ width: `${percent}%` }} 
                                    />
                                </div>
                                </div>
                            </div>
                            
                            <p className="text-slate-500 text-[9px] leading-tight min-h-[2.5em]">{u.description}</p>
                            
                            <button 
                                disabled={isMax || totalCredits < cost} 
                                onClick={() => buyMeta(u)} 
                                className={`w-full py-2.5 rounded-xl flex items-center justify-center font-black text-[10px] transition-all uppercase tracking-wide
                                    ${isMax ? 'bg-slate-950 text-emerald-600 cursor-default border border-emerald-900/20' : 
                                    totalCredits < cost ? 'bg-slate-950 text-slate-600 cursor-not-allowed opacity-50 border border-slate-800' :
                                    'bg-emerald-600 text-white shadow-lg active:scale-95 hover:bg-emerald-500'}`}
                            >
                                {isMax ? 'MAXED' : `UPGRADE: ${formatCredits(cost)} C`}
                            </button>
                        </div>
                    );
                })}
             </div>
        )}
      </div>
    </div>
  );
};

export default GarageMenu;
