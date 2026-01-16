/**
 * ShipSelector
 * Ships grid with purchase/equip functionality
 */

import React from 'react';
import { ShipConfig, ShipType } from '../../types';
import { SHIPS } from '../../constants';
import { useGarage } from './GarageContext';

export const ShipSelector: React.FC = () => {
    const { data, totalCredits, sessionCredits, onUpdate, formatCredits } = useGarage();

    const buyShip = (ship: ShipConfig) => {
        if (data.unlockedShips.includes(ship.type)) {
            onUpdate({ ...data, equippedShip: ship.type }, 0);
            return;
        }
        if (totalCredits >= ship.cost) {
            const spentFromSession = Math.min(sessionCredits, ship.cost);
            const newPersistentCredits = data.credits - (ship.cost - spentFromSession);
            onUpdate(
                { ...data, credits: newPersistentCredits, unlockedShips: [...data.unlockedShips, ship.type], equippedShip: ship.type },
                spentFromSession
            );
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {SHIPS.map(ship => {
                const isUnlocked = data.unlockedShips.includes(ship.type);
                const isEquipped = data.equippedShip === ship.type;
                const canAfford = totalCredits >= ship.cost;

                return (
                    <div
                        key={ship.type}
                        className={`p-6 bg-slate-900/40 border rounded-3xl flex flex-col gap-4 transition-all 
                            ${isEquipped
                                ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)] bg-cyan-900/10'
                                : 'border-slate-800 opacity-90 hover:opacity-100'}`}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-white text-xl sm:text-2xl font-black italic uppercase leading-tight">{ship.name}</h4>
                                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-1">Class: {ship.type}</div>
                            </div>
                            <div
                                className="w-10 h-10 rounded-full shrink-0 shadow-lg border-2 border-white/20"
                                style={{ backgroundColor: ship.color }}
                            />
                        </div>

                        {/* Description */}
                        <p className="text-slate-400 text-sm leading-relaxed">{ship.description}</p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-400 uppercase">
                            <div><i className="fa-solid fa-heart mr-1 text-red-400" /> HP: {ship.baseStats.maxHealth}</div>
                            <div><i className="fa-solid fa-shield mr-1 text-cyan-400" /> SH: {ship.baseStats.maxShield}</div>
                            <div><i className="fa-solid fa-bolt mr-1 text-yellow-400" /> SPD: {ship.baseStats.speed}</div>
                            {ship.baseStats.bulletCount && ship.baseStats.bulletCount > 1 && (
                                <div><i className="fa-solid fa-clone mr-1 text-purple-400" /> x{ship.baseStats.bulletCount}</div>
                            )}
                        </div>

                        {/* Action */}
                        <div className="mt-auto pt-2">
                            {!isUnlocked && (
                                <div className="text-amber-400 text-sm font-bold mb-2 text-center">
                                    <i className="fa-solid fa-coins mr-1" />
                                    {formatCredits(ship.cost)} C
                                </div>
                            )}
                            <button
                                disabled={!isUnlocked && !canAfford}
                                onClick={() => buyShip(ship)}
                                className={`w-full py-3 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all uppercase tracking-wide
                                    ${isEquipped
                                        ? 'bg-cyan-500 text-slate-950'
                                        : isUnlocked
                                            ? 'bg-slate-700 text-white hover:bg-slate-600'
                                            : canAfford
                                                ? 'bg-amber-600 text-white hover:bg-amber-500'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                            >
                                {isEquipped
                                    ? 'SYSTEMS ONLINE'
                                    : isUnlocked
                                        ? 'DEPLOY VESSEL'
                                        : canAfford
                                            ? 'PURCHASE'
                                            : `NEED ${formatCredits(ship.cost - totalCredits)} MORE`}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
