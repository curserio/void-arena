import { PlayerStats } from './player';

// Re-export MetaUpgrade from upgrades.ts
export type { MetaUpgrade, UpgradeEffect, UpgradeStatKey, UpgradeOperation } from './upgrades';

export enum UpgradeType {
    STAT = 'STAT',
    CONSUMABLE = 'CONSUMABLE'
}

export interface Upgrade {
    id: string;
    type: UpgradeType;
    name: string;
    description: string;
    icon: string;
    rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
    maxStacks: number; // 1 for Unique, Infinity for stackable/consumable
    weight: number; // Relative chance to appear in pool
    // For STAT upgrades: The function to modify stats permanently
    effect?: (stats: PlayerStats) => PlayerStats;
}
