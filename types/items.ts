import { PlayerStats } from './player';

// Re-export types from upgrades.ts
export type { MetaUpgrade, UpgradeEffect, UpgradeStatKey, UpgradeOperation, InGameEffect, InGameStatKey, InGameOperation } from './upgrades';

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
    maxStacks: number;
    weight: number;
    effects?: import('./upgrades').InGameEffect[];  // Declarative effects (replaces callback)
}
