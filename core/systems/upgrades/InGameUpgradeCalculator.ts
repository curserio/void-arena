/**
 * InGameUpgradeCalculator
 * 
 * Applies in-game upgrade effects (one-time pickups during runs)
 * using declarative InGameEffect definitions.
 */

import { PlayerStats } from '../../../types';
import type { InGameEffect } from '../../../types/upgrades';
import type { Upgrade } from '../../../types/items';

/**
 * Apply a single in-game effect to stats
 */
function applyInGameEffect(stats: PlayerStats, effect: InGameEffect): PlayerStats {
    const currentValue = (stats as unknown as Record<string, number>)[effect.stat] ?? 0;
    let newValue: number;

    switch (effect.operation) {
        case 'addFlat':
            newValue = currentValue + effect.value;
            break;
        case 'addPercent':
            newValue = currentValue * (1 + effect.value);
            break;
        case 'setMultiply':
            newValue = currentValue * effect.value;
            break;
        default:
            newValue = currentValue;
    }

    // Apply cap if specified
    if (effect.cap !== undefined) {
        newValue = Math.min(newValue, effect.cap);
    }

    return {
        ...stats,
        [effect.stat]: newValue
    };
}

/**
 * Apply all effects from an in-game upgrade to player stats
 */
export function applyInGameUpgrade(stats: PlayerStats, upgrade: Upgrade): PlayerStats {
    if (!upgrade.effects || upgrade.effects.length === 0) {
        return stats;
    }

    let newStats = { ...stats };
    for (const effect of upgrade.effects) {
        newStats = applyInGameEffect(newStats, effect);
    }

    return newStats;
}
