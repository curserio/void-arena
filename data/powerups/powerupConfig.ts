/**
 * PowerUp Configuration
 * Data-only definitions for all power-up types
 */

import { PlayerStats, PowerUpId } from '../../types';

export type PowerUpType = 'DURATION' | 'INSTANT';

export interface PowerUpConfig {
    id: PowerUpId;
    name: string;
    type: PowerUpType;
    duration?: number;  // For DURATION type
    weight: number;     // Spawn weight
    color: string;
    icon: string;
    label: string;
    description: string;
}

// ============================================================================
// PowerUp Definitions
// ============================================================================

export const POWERUP_CONFIGS: Record<PowerUpId, PowerUpConfig> = {
    // --- OFFENSIVE ---
    OVERDRIVE: {
        id: 'OVERDRIVE',
        name: 'Overdrive',
        type: 'DURATION',
        duration: 8000,
        weight: 10,
        color: '#d946ef',
        icon: 'fa-bolt-lightning',
        label: 'F',
        description: '2x fire rate for 8 seconds',
    },
    OMNI: {
        id: 'OMNI',
        name: 'Omni Shot',
        type: 'DURATION',
        duration: 10000,
        weight: 8,
        color: '#fbbf24',
        icon: 'fa-arrows-split-up-and-left',
        label: 'M',
        description: 'Fire in all directions for 10 seconds',
    },
    PIERCE: {
        id: 'PIERCE',
        name: 'Super Pierce',
        type: 'DURATION',
        duration: 7000,
        weight: 8,
        color: '#22d3ee',
        icon: 'fa-ghost',
        label: 'P',
        description: 'Projectiles pierce through enemies for 7 seconds',
    },

    // --- UTILITY / SURVIVAL ---
    SPEED: {
        id: 'SPEED',
        name: 'Nitro Boost',
        type: 'DURATION',
        duration: 6000,
        weight: 12,
        color: '#34d399',
        icon: 'fa-forward-fast',
        label: 'S',
        description: '+50% movement speed for 6 seconds',
    },
    HEALTH: {
        id: 'HEALTH',
        name: 'Repair Kit',
        type: 'INSTANT',
        weight: 5,
        color: '#ef4444',
        icon: 'fa-heart-pulse',
        label: '+',
        description: 'Restore 35% health',
    },
    SHIELD: {
        id: 'SHIELD',
        name: 'Shield Battery',
        type: 'INSTANT',
        weight: 5,
        color: '#3b82f6',
        icon: 'fa-shield-virus',
        label: 'B',
        description: 'Fully restore shield',
    },
};

// All power-up IDs for iteration
export const ALL_POWERUP_IDS = Object.keys(POWERUP_CONFIGS) as PowerUpId[];
