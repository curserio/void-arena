/**
 * Enemy Registry
 * Auto-derived lists of spawnable enemies for use in spawning logic and debug menus.
 * 
 * Adding a new enemy to ENEMY_DEFINITIONS auto-includes it here.
 */

import { EnemyType } from '../../types/enemies';
import { ENEMY_DEFINITIONS } from './definitions';

/**
 * List of enemy types that can be spawned via createEnemy (excludes bosses and asteroids)
 */
export const SPAWNABLE_ENEMY_TYPES: EnemyType[] = Object.values(EnemyType)
    .filter(t => !t.startsWith('BOSS_') && t !== EnemyType.ASTEROID);

/**
 * Check if an enemy type is spawnable via createEnemy
 */
export function isSpawnableEnemy(type: EnemyType): boolean {
    return SPAWNABLE_ENEMY_TYPES.includes(type);
}

/**
 * Options for debug menu enemy selector (auto-derived from definitions)
 */
export const DEBUG_ENEMY_OPTIONS = [
    ...SPAWNABLE_ENEMY_TYPES.map(type => ({
        type,
        label: ENEMY_DEFINITIONS[type].name,
        icon: ENEMY_DEFINITIONS[type].guideIcon,
    })),
    // Bosses at the end
    {
        type: EnemyType.BOSS_DREADNOUGHT,
        label: ENEMY_DEFINITIONS[EnemyType.BOSS_DREADNOUGHT].name,
        icon: 'fa-skull',
    },
    {
        type: EnemyType.BOSS_DESTROYER,
        label: ENEMY_DEFINITIONS[EnemyType.BOSS_DESTROYER].name,
        icon: 'fa-shapes',
    },
];
