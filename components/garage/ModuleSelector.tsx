/**
 * ModuleSelector
 * Modules list with collapsible meta upgrades
 */

import React, { useState } from 'react';
import { ModuleType } from '../../types';
import { META_UPGRADES, MODULE_PRICES } from '../../constants';
import { useGarage } from './GarageContext';
import { UpgradeCard } from './UpgradeCard';

const MODULES = [
    {
        type: ModuleType.AFTERBURNER,
        name: 'Afterburner',
        icon: 'fa-forward-fast',
        description: 'Temporary speed boost. Dodge attacks and reposition quickly.'
    },
    // Future modules can be added here
];

export const ModuleSelector: React.FC = () => {
    const { data, totalCredits, sessionCredits, onUpdate, formatCredits } = useGarage();

    const [expandedModule, setExpandedModule] = useState<ModuleType | null>(
        data.equippedModule || null
    );

    const handleModuleAction = (module: ModuleType) => {
        const unlocked = (data.unlockedModules || []).includes(module);
        const price = MODULE_PRICES[module] || 0;

        if (unlocked) {
            // Toggle equip
            const newEquipped = data.equippedModule === module ? ModuleType.NONE : module;
            onUpdate({ ...data, equippedModule: newEquipped }, 0);
            if (newEquipped === module) setExpandedModule(module);
        } else if (totalCredits >= price) {
            const spentFromSession = Math.min(sessionCredits, price);
            const newPersistentCredits = data.credits - (price - spentFromSession);
            onUpdate(
                { ...data, credits: newPersistentCredits, unlockedModules: [...(data.unlockedModules || []), module], equippedModule: module },
                spentFromSession
            );
            setExpandedModule(module);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {MODULES.map(module => {
                const isUnlocked = (data.unlockedModules || []).includes(module.type);
                const isEquipped = data.equippedModule === module.type;
                const price = MODULE_PRICES[module.type];
                const canAfford = totalCredits >= price;
                const specificMetas = META_UPGRADES.filter(m => m.moduleType === module.type);
                const isExpanded = expandedModule === module.type;

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
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl border 
                                    ${isEquipped
                                        ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-400'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                >
                                    <i className={`fa-solid ${module.icon}`} />
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
                                            ? 'bg-slate-700 text-fuchsia-400 border border-fuchsia-500 hover:bg-slate-600'
                                            : isUnlocked
                                                ? 'bg-slate-700 text-white hover:bg-slate-600'
                                                : canAfford
                                                    ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                >
                                    {isEquipped
                                        ? 'UNEQUIP'
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
                                    <UpgradeCard key={upgrade.id} upgrade={upgrade} accentColor="fuchsia" />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Empty state for future modules */}
            <div className="p-6 border border-dashed border-slate-700 rounded-2xl text-center">
                <i className="fa-solid fa-flask text-slate-600 text-3xl mb-3" />
                <p className="text-slate-500 text-sm">More modules coming soon...</p>
            </div>
        </div>
    );
};
