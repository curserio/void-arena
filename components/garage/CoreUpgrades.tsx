/**
 * CoreUpgrades
 * Core avionics upgrades grid (non-weapon, non-module upgrades)
 */

import React from 'react';
import { META_UPGRADES } from '../../constants';
import { UpgradeCard } from './UpgradeCard';

export const CoreUpgrades: React.FC = () => {
    const coreUpgrades = META_UPGRADES.filter(m => !m.weaponType && !m.moduleType);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {coreUpgrades.map(upgrade => (
                <UpgradeCard
                    key={upgrade.id}
                    upgrade={upgrade}
                    accentColor="emerald"
                />
            ))}
        </div>
    );
};
