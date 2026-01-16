/**
 * GarageTabs
 * Tab navigation for garage sections
 */

import React from 'react';

export type GarageTab = 'SHIPS' | 'WEAPONS' | 'MODULES' | 'CORE';

interface GarageTabsProps {
    activeTab: GarageTab;
    onTabChange: (tab: GarageTab) => void;
}

const TABS = [
    { id: 'SHIPS' as const, label: 'Vessels', icon: 'fa-shuttle-space' },
    { id: 'WEAPONS' as const, label: 'Armory', icon: 'fa-crosshairs' },
    { id: 'MODULES' as const, label: 'Modules', icon: 'fa-puzzle-piece' },
    { id: 'CORE' as const, label: 'Avionics', icon: 'fa-microchip' }
];

// Color mappings for active state
const TAB_COLORS: Record<GarageTab, string> = {
    SHIPS: 'text-cyan-400',
    WEAPONS: 'text-amber-400',
    MODULES: 'text-fuchsia-400',
    CORE: 'text-emerald-400'
};

export const GarageTabs: React.FC<GarageTabsProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex gap-1 mt-6">
            {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-4 sm:px-6 py-3 rounded-t-xl font-bold text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap
                            ${isActive
                                ? `bg-slate-950 ${TAB_COLORS[tab.id]} border-t-2 border-x border-t-current border-x-slate-700/50`
                                : 'text-slate-500 hover:text-white hover:bg-slate-800/50 border-b border-slate-700/50'}`}
                    >
                        <i className={`fa-solid ${tab.icon} mr-2`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                );
            })}
            {/* Fill remaining space with border */}
            <div className="flex-1 border-b border-slate-700/50" />
        </div>
    );
};
