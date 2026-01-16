/**
 * ModuleSelector
 * Modules list with multi-slot equipping (up to 3 modules)
 */

import React, { useState } from 'react';
import { ModuleType } from '../../types';
import { META_UPGRADES, MODULE_PRICES, SHIPS } from '../../constants';
import { useGarage } from './GarageContext';
import { UpgradeCard } from './UpgradeCard';

const MAX_EQUIPPED_MODULES = 3;

const MODULES = [
    {
        type: ModuleType.AFTERBURNER,
        name: 'Afterburner',
        icon: 'fa-forward-fast',
        description: 'Temporary speed boost. Dodge attacks and reposition quickly.'
    },
    {
        type: ModuleType.SHIELD_BURST,
        name: 'Shield Burst',
        icon: 'fa-shield-heart',
        description: 'Instantly restores shield and grants brief invulnerability.'
    },
    {
        type: ModuleType.PHASE_SHIFT,
        name: 'Phase Shift',
        icon: 'fa-ghost',
        description: 'Phase through attacks. Pure invulnerability, no healing.'
    },
];

export const ModuleSelector: React.FC = () => {
    const { data, totalCredits, sessionCredits, onUpdate, formatCredits } = useGarage();

    const equippedModules = data.equippedModules || [];
    const [expandedModule, setExpandedModule] = useState<ModuleType | null>(
        equippedModules[0] || null
    );

    // Get intrinsic module for current ship (if any)
    const currentShipConfig = SHIPS.find(s => s.type === data.equippedShip);
    const intrinsicModule = currentShipConfig?.intrinsicModule;

    // Collect ALL intrinsic modules from ALL ships (these are never purchasable)
    const allIntrinsicModules = SHIPS
        .map(s => s.intrinsicModule)
        .filter((m): m is ModuleType => m !== undefined);

    // Filter out ALL intrinsic modules from purchasable list
    const purchasableModules = MODULES.filter(m => !allIntrinsicModules.includes(m.type));

    const isModuleEquipped = (module: ModuleType) => equippedModules.includes(module);
    const isIntrinsic = (module: ModuleType) => module === intrinsicModule;
    const canEquipMore = equippedModules.length < MAX_EQUIPPED_MODULES;

    const handleModuleAction = (module: ModuleType) => {
        const unlocked = (data.unlockedModules || []).includes(module);
        const price = MODULE_PRICES[module] || 0;

        if (unlocked) {
            // Toggle equip/unequip
            let newEquipped: ModuleType[];
            if (isModuleEquipped(module)) {
                // Unequip
                newEquipped = equippedModules.filter(m => m !== module);
            } else if (canEquipMore) {
                // Equip (add to list)
                newEquipped = [...equippedModules, module];
                setExpandedModule(module);
            } else {
                // Already at max, can't equip more
                return;
            }
            onUpdate({ ...data, equippedModules: newEquipped }, 0);
        } else if (totalCredits >= price) {
            // Purchase and equip
            const spentFromSession = Math.min(sessionCredits, price);
            const newPersistentCredits = data.credits - (price - spentFromSession);
            const newEquipped = canEquipMore
                ? [...equippedModules, module]
                : equippedModules;
            onUpdate(
                {
                    ...data,
                    credits: newPersistentCredits,
                    unlockedModules: [...(data.unlockedModules || []), module],
                    equippedModules: newEquipped
                },
                spentFromSession
            );
            setExpandedModule(module);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Slot indicator */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <i className="fa-solid fa-puzzle-piece text-fuchsia-400" />
                <span>Module Slots: <strong className="text-white">{equippedModules.length}/{MAX_EQUIPPED_MODULES}</strong></span>
            </div>

            {purchasableModules.map(module => {
                const isUnlocked = (data.unlockedModules || []).includes(module.type);
                const isEquipped = isModuleEquipped(module.type);
                const price = MODULE_PRICES[module.type];
                const canAfford = totalCredits >= price;
                const specificMetas = META_UPGRADES.filter(m => m.moduleType === module.type);
                const isExpanded = expandedModule === module.type;

                // Slot number badge (1, 2, or 3)
                const slotNumber = isEquipped ? equippedModules.indexOf(module.type) + 1 : null;

                return (
                    <div
                        key={module.type}
                        className={`p-5 sm:p-6 border rounded-2xl flex flex-col gap-4 transition-all 
                            ${isEquipped
                                ? 'border-fuchsia-500 bg-fuchsia-500/5'
                                : 'border-slate-800 bg-slate-900/40'}`}
                    >
                        {/* Header */}
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div
                                className={`flex items-center gap-4 ${isUnlocked ? 'cursor-pointer' : ''}`}
                                onClick={() => isUnlocked && setExpandedModule(isExpanded ? null : module.type)}
                            >
                                <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border 
                                    ${isEquipped
                                        ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-400'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                >
                                    <i className={`fa-solid ${module.icon}`} />
                                    {/* Slot number badge */}
                                    {slotNumber && (
                                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-slate-950 text-xs font-black rounded-full flex items-center justify-center">
                                            {slotNumber}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-white text-lg sm:text-xl font-black uppercase tracking-tight">{module.name}</h3>
                                        {isUnlocked && (
                                            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-500 text-sm`} />
                                        )}
                                    </div>
                                    <div className="text-slate-400 text-xs">{module.description}</div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex flex-col items-end gap-1">
                                {!isUnlocked && (
                                    <div className="text-fuchsia-400 text-sm font-bold">
                                        <i className="fa-solid fa-coins mr-1" />
                                        {formatCredits(price)} C
                                    </div>
                                )}
                                <button
                                    disabled={!isUnlocked && !canAfford}
                                    onClick={() => handleModuleAction(module.type)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider
                                        ${isEquipped
                                            ? 'bg-slate-700 text-fuchsia-400 border border-fuchsia-500 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500'
                                            : isUnlocked
                                                ? canEquipMore
                                                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : canAfford
                                                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {isEquipped
                                        ? 'UNEQUIP'
                                        : isUnlocked
                                            ? canEquipMore
                                                ? 'EQUIP'
                                                : 'SLOTS FULL'
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
                                    <UpgradeCard key={upgrade.id} upgrade={upgrade} accentColor="fuchsia" />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
