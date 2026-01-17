/**
 * WeaponSelector
 * Weapons list with collapsible meta upgrades
 */

import React, { useState } from 'react';
import { WeaponType } from '../../types';
import { META_UPGRADES, WEAPON_PRICES } from '../../constants';
import { useGarage } from './GarageContext';
import { UpgradeCard } from './UpgradeCard';

const WEAPONS = [
    { type: WeaponType.PLASMA, name: 'Plasma Cannon', icon: 'fa-fire-burner', description: 'Fast fire rate, moderate damage' },
    { type: WeaponType.MISSILE, name: 'Missile Launcher', icon: 'fa-rocket', description: 'Slow but powerful AOE explosions' },
    { type: WeaponType.LASER, name: 'Beam Laser', icon: 'fa-sun', description: 'Charge to unleash devastating beam' },
    { type: WeaponType.SWARM_LAUNCHER, name: 'Swarm Launcher', icon: 'fa-hive', description: 'Homing rockets, scales late game' },
    { type: WeaponType.RAILGUN, name: 'Railgun', icon: 'fa-bolt', description: 'Pierces all enemies. Charge, aim, devastate.' },
    { type: WeaponType.FLAK_CANNON, name: 'Flak Cannon', icon: 'fa-spray-can', description: 'Shotgun spread. 8 pellets, short range destruction.' },
    { type: WeaponType.ENERGY_ORB, name: 'Energy Orb', icon: 'fa-atom', description: 'Slow pulsating orb. Area damage + final explosion.' },
    { type: WeaponType.ARC_CASTER, name: 'Arc Caster', icon: 'fa-bolt-lightning', description: 'Chain lightning. Zaps multiple targets.' },
    { type: WeaponType.FLAMETHROWER, name: 'Flamethrower', icon: 'fa-fire', description: 'Short range cone of fire. Infinite pierce, rapid damage.' },
];

export const WeaponSelector: React.FC = () => {
    const { data, totalCredits, sessionCredits, onUpdate, formatCredits } = useGarage();

    const [expandedWeapon, setExpandedWeapon] = useState<WeaponType | null>(
        data.equippedWeapon || WeaponType.PLASMA
    );

    const handleWeaponAction = (weapon: WeaponType) => {
        const unlocked = (data.unlockedWeapons || [WeaponType.PLASMA]).includes(weapon);
        const price = WEAPON_PRICES[weapon] || 0;

        if (unlocked) {
            onUpdate({ ...data, equippedWeapon: weapon }, 0);
            setExpandedWeapon(weapon);
        } else if (totalCredits >= price) {
            const spentFromSession = Math.min(sessionCredits, price);
            const newPersistentCredits = data.credits - (price - spentFromSession);
            onUpdate(
                { ...data, credits: newPersistentCredits, unlockedWeapons: [...(data.unlockedWeapons || [WeaponType.PLASMA]), weapon], equippedWeapon: weapon },
                spentFromSession
            );
            setExpandedWeapon(weapon);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {WEAPONS.map(weapon => {
                const isUnlocked = (data.unlockedWeapons || [WeaponType.PLASMA]).includes(weapon.type);
                const isEquipped = (data.equippedWeapon || WeaponType.PLASMA) === weapon.type;
                const price = WEAPON_PRICES[weapon.type];
                const canAfford = totalCredits >= price;
                const specificMetas = META_UPGRADES.filter(m => m.weaponType === weapon.type);
                const isExpanded = expandedWeapon === weapon.type;

                return (
                    <div
                        key={weapon.type}
                        className={`p-5 sm:p-6 border rounded-2xl flex flex-col gap-4 transition-all 
                            ${isEquipped
                                ? 'border-amber-500 bg-amber-500/5'
                                : 'border-slate-800 bg-slate-900/40'}`}
                    >
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div
                                className={`flex items-center gap-4 ${isUnlocked ? 'cursor-pointer' : ''}`}
                                onClick={() => isUnlocked && setExpandedWeapon(isExpanded ? null : weapon.type)}
                            >
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border 
                                    ${isEquipped
                                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                >
                                    <i className={`fa-solid ${weapon.icon}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-white text-lg sm:text-xl font-black uppercase tracking-tight">{weapon.name}</h3>
                                        {isUnlocked && (
                                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-500 text-sm`} />
                                        )}
                                    </div>
                                    <div className="text-slate-400 text-xs">{weapon.description}</div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex flex-col items-end gap-1">
                                {!isUnlocked && (
                                    <div className="text-amber-400 text-sm font-bold">
                                        <i className="fa-solid fa-coins mr-1" />
                                        {formatCredits(price)} C
                                    </div>
                                )}
                                <button
                                    disabled={!isUnlocked && !canAfford}
                                    onClick={() => handleWeaponAction(weapon.type)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider
                                        ${isEquipped
                                            ? 'bg-amber-500 text-slate-950 cursor-default'
                                            : isUnlocked
                                                ? 'bg-slate-700 text-white hover:bg-slate-600'
                                                : canAfford
                                                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {isEquipped
                                        ? 'EQUIPPED'
                                        : isUnlocked
                                            ? 'EQUIP'
                                            : canAfford
                                                ? 'UNLOCK'
                                                : 'LOCKED'}
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Upgrades */}
                        {isUnlocked && isExpanded && specificMetas.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {specificMetas.map(upgrade => (
                                    <UpgradeCard key={upgrade.id} upgrade={upgrade} accentColor="amber" />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
