/**
 * UpgradeMenu
 * Level-up upgrade selection screen with rarity badges
 */

import React from 'react';
import { Upgrade } from '../types';

interface UpgradeMenuProps {
  upgrades: Upgrade[];
  onSelect: (upgrade: Upgrade) => void;
}

// Rarity color configuration
const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  LEGENDARY: {
    bg: 'bg-amber-900/30',
    border: 'border-amber-500',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
  },
  RARE: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]'
  },
  COMMON: {
    bg: 'bg-slate-800',
    border: 'border-slate-600',
    text: 'text-slate-400',
    glow: ''
  }
};

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ upgrades, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[500] p-4 sm:p-6">
      <div className="max-w-md w-full flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-cyan-400 text-2xl sm:text-3xl font-black italic tracking-tighter uppercase">
            Level Up!
          </h2>
          <p className="text-slate-400 text-sm">Select an enhancement for your vessel</p>
        </div>

        {/* Upgrade Cards */}
        <div className="flex flex-col gap-3">
          {upgrades.map((upgrade, idx) => {
            const rarity = upgrade.rarity || 'COMMON';
            const styles = RARITY_STYLES[rarity] || RARITY_STYLES.COMMON;

            return (
              <button
                key={`${upgrade.id}-${idx}`}
                onClick={() => onSelect(upgrade)}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all group text-left
                                    ${styles.bg} ${styles.border} ${styles.glow}
                                    hover:scale-[1.02] active:scale-[0.98]`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border 
                                    ${styles.bg} ${styles.border} group-hover:brightness-125 transition-all`}
                >
                  <i className={`fa-solid ${upgrade.icon} ${styles.text} text-xl`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-white font-bold text-base sm:text-lg truncate">
                      {upgrade.name}
                    </h3>
                    {/* Rarity Badge */}
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${styles.text} ${styles.bg} border ${styles.border}`}>
                      {rarity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-snug">
                    {upgrade.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <i className={`fa-solid fa-chevron-right ${styles.text}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;
