/**
 * UpgradeCard
 * Reusable card for displaying meta upgrades
 */

import React from 'react';
import { MetaUpgrade } from '../../types';
import { useGarage } from './GarageContext';

interface UpgradeCardProps {
    upgrade: MetaUpgrade;
    accentColor?: 'amber' | 'fuchsia' | 'emerald' | 'cyan';
}

export const UpgradeCard: React.FC<UpgradeCardProps> = ({
    upgrade,
    accentColor = 'emerald'
}) => {
    const { data, totalCredits, getUpgradeCost, buyMeta, formatCredits } = useGarage();

    const level = data.metaLevels[upgrade.id] || 0;
    const cost = getUpgradeCost(upgrade, level);
    const isMax = level >= upgrade.maxLevel;
    const canAfford = totalCredits >= cost;
    const percent = Math.min(100, (level / upgrade.maxLevel) * 100);

    const colorClasses = {
        amber: {
            icon: 'text-amber-400',
            bar: 'bg-amber-500',
            button: 'text-amber-400 border-amber-400/20 hover:bg-amber-400/10',
            glow: 'shadow-[0_0_15px_rgba(251,191,36,0.1)]'
        },
        fuchsia: {
            icon: 'text-fuchsia-400',
            bar: 'bg-fuchsia-500',
            button: 'text-fuchsia-400 border-fuchsia-400/20 hover:bg-fuchsia-400/10',
            glow: 'shadow-[0_0_15px_rgba(217,70,239,0.1)]'
        },
        emerald: {
            icon: 'text-emerald-400',
            bar: 'bg-emerald-500',
            button: 'text-white bg-emerald-600 hover:bg-emerald-500',
            glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]'
        },
        cyan: {
            icon: 'text-cyan-400',
            bar: 'bg-cyan-500',
            button: 'text-cyan-400 border-cyan-400/20 hover:bg-cyan-400/10',
            glow: 'shadow-[0_0_15px_rgba(6,182,212,0.1)]'
        }
    };

    const colors = colorClasses[accentColor];

    return (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col gap-3 hover:border-slate-700 transition-colors">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center ${colors.icon} ${colors.glow} border border-slate-700`}>
                    <i className={`fa-solid ${upgrade.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-white font-bold text-xs uppercase truncate tracking-tight">{upgrade.name}</h4>
                        <div className="text-slate-400 text-[10px] font-bold ml-2">LV {level}/{upgrade.maxLevel}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                        <div
                            className={`h-full ${colors.bar} transition-all duration-300`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-[11px] leading-snug min-h-[2.5em]">{upgrade.description}</p>

            {/* Buy Button */}
            <button
                disabled={isMax || !canAfford}
                onClick={() => buyMeta(upgrade)}
                className={`w-full py-2.5 rounded-xl flex items-center justify-center font-bold text-xs transition-all uppercase tracking-wide
                    ${isMax
                        ? 'bg-slate-950 text-emerald-500 cursor-default border border-emerald-900/20'
                        : !canAfford
                            ? 'bg-slate-950 text-slate-500 cursor-not-allowed border border-slate-800'
                            : `bg-slate-800 ${colors.button} border active:scale-95`}`}
            >
                {isMax ? 'MAXED' : `${formatCredits(cost)} C`}
            </button>
        </div>
    );
};
