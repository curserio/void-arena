import { Upgrade, UpgradeType, PlayerStats } from '../../types';
import { UPGRADES } from '../../constants';

export class UpgradeManager {

    /**
     * Generates a set of 3 random upgrades based on the current pool and player state.
     */
    static generateOffers(currentUpgrades: Upgrade[], pool: Upgrade[] = UPGRADES): Upgrade[] {
        // 1. Filter Pool
        const validUpgrades = pool.filter(u => {
            // Consumables are always valid
            if (u.type === UpgradeType.CONSUMABLE) return true;

            // Check Max Stacks
            const count = currentUpgrades.filter(owned => owned.id === u.id).length;
            return count < u.maxStacks;
        });

        // 2. Weighted Random Selection
        const selection: Upgrade[] = [];
        const poolCopy = [...validUpgrades];

        for (let i = 0; i < 3; i++) {
            if (poolCopy.length === 0) break;

            const totalWeight = poolCopy.reduce((sum, u) => sum + u.weight, 0);
            let r = Math.random() * totalWeight;

            for (let j = 0; j < poolCopy.length; j++) {
                r -= poolCopy[j].weight;
                if (r <= 0) {
                    selection.push(poolCopy[j]);
                    // Remove from temp pool to avoid duplicates in the same hand
                    poolCopy.splice(j, 1);
                    break;
                }
            }
        }

        return selection;
    }

    /**
     * Applies a non-consumable upgrade to the player stats.
     * Consumables should be handled via ConsumableRegistry.
     */
    static applyUpgrade(upgrade: Upgrade, addUpgradeFn: (u: Upgrade) => void): void {
        if (upgrade.type !== UpgradeType.CONSUMABLE) {
            addUpgradeFn(upgrade);
        }
    }
}
