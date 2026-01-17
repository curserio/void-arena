/**
 * Enemy Definitions
 * Data-driven configuration for all enemy types
 */

import {
    EnemyType,
    EnemyDefinition,
    MovementBehavior,
    AttackPattern
} from '../../types/enemies';

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
    // =========================================================================
    // STANDARD ENEMIES
    // =========================================================================

    [EnemyType.SCOUT]: {
        type: EnemyType.SCOUT,
        baseHealth: 45,
        baseRadius: 22,
        baseSpeed: 80,

        name: 'Void Scout',
        role: 'Swarm / Fodder',
        guideIcon: 'fa-shuttle-space',
        description: 'Basic fast unit. Colors vary by speed.',

        color: {
            hueMin: 260,
            hueMax: 290,
            saturation: 80,
            lightness: 60,
        },

        movementBehavior: MovementBehavior.ORBIT,
        attackPattern: AttackPattern.SINGLE_SHOT,
        attackCooldown: 2500,

        projectileSpeed: 320,
        projectileRadius: 7,
        projectileColor: '#f97316',

        xpValue: 15,
        creditValue: 5,
        powerUpChance: 0.02,

        attacks: {
            projectile: 10,
        },
    },

    [EnemyType.STRIKER]: {
        type: EnemyType.STRIKER,
        baseHealth: 130,
        baseRadius: 26,
        baseSpeed: 110,

        name: 'Crimson Striker',
        role: 'Melee Rusher',
        guideIcon: 'fa-jet-fighter',
        description: 'Tries to ram the player. High damage collision.',

        color: {
            hueMin: 340,
            hueMax: 360,
            saturation: 80,
            lightness: 60,
        },

        movementBehavior: MovementBehavior.CHASE,
        attackPattern: AttackPattern.SINGLE_SHOT,
        attackCooldown: 2500,

        projectileSpeed: 320,
        projectileRadius: 7,
        projectileColor: '#f97316',

        xpValue: 25,
        creditValue: 10,
        powerUpChance: 0.03,

        attacks: {
            collision: 15,
        },
    },

    [EnemyType.LASER_SCOUT]: {
        type: EnemyType.LASER_SCOUT,
        baseHealth: 90,
        baseRadius: 24,
        baseSpeed: 80,

        name: 'Sniper Drone',
        role: 'Ranged Support',
        guideIcon: 'fa-satellite',
        description: 'Orbits at distance. Charges a laser beam.',

        color: '#a855f7', // Purple

        movementBehavior: MovementBehavior.KITE,
        attackPattern: AttackPattern.CHARGED_BEAM,
        attackCooldown: 4000,

        xpValue: 35,
        creditValue: 15,
        powerUpChance: 0.04,

        attacks: {
            beam: 12,
        },
    },

    [EnemyType.KAMIKAZE]: {
        type: EnemyType.KAMIKAZE,
        baseHealth: 25,
        baseRadius: 18,
        baseSpeed: 350,

        name: 'Kamikaze Drone',
        role: 'Suicide Bomber',
        guideIcon: 'fa-bomb',
        description: 'Drifts fast and explodes on contact. Elite has shield gate.',

        color: '#f97316', // Orange

        movementBehavior: MovementBehavior.CHARGE,
        attackPattern: AttackPattern.NONE, // Collision damage only
        attackCooldown: 0,

        xpValue: 20,
        creditValue: 8,
        powerUpChance: 0.02,

        attacks: {
            explosion: 40,
        },
    },

    [EnemyType.SHIELDER]: {
        type: EnemyType.SHIELDER,
        baseHealth: 80,
        baseRadius: 24,
        baseSpeed: 60,

        name: 'Shield Drone',
        role: 'Support Unit',
        guideIcon: 'fa-shield',
        description: 'Creates protective shield bubble around nearby enemies. Priority target.',

        color: '#22d3ee', // Cyan

        movementBehavior: MovementBehavior.SHIELDING,
        attackPattern: AttackPattern.NONE, // No attacks, just shield aura
        attackCooldown: 0,

        xpValue: 50, // High XP - priority target
        creditValue: 25,
        powerUpChance: 0.08, // Higher drop chance

        attacks: {},
    },

    [EnemyType.CARRIER]: {
        type: EnemyType.CARRIER,
        baseHealth: 400,
        baseRadius: 35,
        baseSpeed: 50,

        name: 'Drone Carrier',
        role: 'Spawner',
        guideIcon: 'fa-shuttle-space',
        description: 'Slow, tanky unit that periodically deploys Scout drones.',

        color: '#64748b', // Slate gray

        movementBehavior: MovementBehavior.KITE,
        attackPattern: AttackPattern.NONE, // Spawns enemies instead
        attackCooldown: 8000, // Spawn cooldown

        xpValue: 80,
        creditValue: 40,
        powerUpChance: 0.10,

        spawning: {
            spawnType: EnemyType.SCOUT,
            count: 3,
            spread: Math.PI / 3,  // 60° spread
            maxWaves: 9,          // 27 scouts total
        },

        attacks: {},
    },

    [EnemyType.ASTEROID]: {
        type: EnemyType.ASTEROID,
        baseHealth: 120, // Base HP, scaled by radius
        baseRadius: 40, // Will vary 40-80
        baseSpeed: 40,

        name: 'Asteroid Field',
        role: 'Environmental Hazard',
        guideIcon: 'fa-meteor',
        description: 'Drifting space debris. Rich in minerals (Credits).',

        color: '#475569', // Slate

        movementBehavior: MovementBehavior.DRIFT,
        attackPattern: AttackPattern.NONE,
        attackCooldown: 0,

        xpValue: 10,
        creditValue: 20, // "Money Rocks"
        powerUpChance: 0.05,

        attacks: {
            collision: 10,
        },
    },

    // =========================================================================
    // BOSSES
    // =========================================================================

    [EnemyType.BOSS_DREADNOUGHT]: {
        type: EnemyType.BOSS_DREADNOUGHT,
        baseHealth: 4000,
        baseRadius: 70,
        baseSpeed: 40,

        name: 'Dreadnought Boss',
        role: 'Capital Ship',
        guideIcon: 'fa-skull',
        description: 'Common Boss. Massive laser cannon.',

        color: '#4ade80', // Green

        movementBehavior: MovementBehavior.BOSS_STANDARD,
        attackPattern: AttackPattern.BOSS_BEAM,
        attackCooldown: 6000,

        isBoss: true,

        phases: [
            { healthPercent: 100, abilities: ['beam'] },
            { healthPercent: 50, abilities: ['beam', 'enrage'] },
        ],

        xpValue: 500,
        creditValue: 1000,
        powerUpChance: 1.0, // Guaranteed drop

        attacks: {
            beam: 20,
        },
    },

    [EnemyType.BOSS_DESTROYER]: {
        type: EnemyType.BOSS_DESTROYER,
        baseHealth: 3500,
        baseRadius: 75,
        baseSpeed: 35,

        name: 'Imperial Destroyer',
        role: 'Heavy Carrier',
        guideIcon: 'fa-shapes',
        description: 'Rare Boss. Deploys Drones, Homing Missiles, and Twin Plasma.',

        color: '#334155', // Dark slate

        movementBehavior: MovementBehavior.BOSS_DESTROYER,
        attackPattern: AttackPattern.TWIN_PLASMA,
        attackCooldown: 1200,

        isBoss: true,

        projectileSpeed: 480,
        projectileRadius: 12,
        projectileColor: '#f43f5e',

        phases: [
            { healthPercent: 100, abilities: ['plasma', 'missiles', 'spawn_kamikaze'] },
            { healthPercent: 30, abilities: ['plasma', 'missiles', 'spawn_kamikaze', 'enrage'] },
        ],

        xpValue: 600,
        creditValue: 1200,
        powerUpChance: 1.0,

        attacks: {
            projectile: 15,
            missile: 25,
        },
    },
};

/**
 * Get enemy definition by type
 */
export function getEnemyDefinition(type: EnemyType): EnemyDefinition {
    return ENEMY_DEFINITIONS[type];
}

/**
 * Generate color from config
 */
export function generateEnemyColor(def: EnemyDefinition, seed: number): string {
    if (typeof def.color === 'string') {
        return def.color;
    }

    const { hueMin, hueMax, saturation, lightness } = def.color;
    const hue = hueMin + seed * (hueMax - hueMin);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
