/**
 * Core Type Primitives
 * Base types with no dependencies - breaks circular imports
 */

// ============================================================================
// Vectors
// ============================================================================

export type Vector2D = { x: number; y: number };

// ============================================================================
// Entity Types
// ============================================================================

export enum EntityType {
    PLAYER = 'PLAYER',
    ASTEROID = 'ASTEROID',
    BULLET = 'BULLET', // Legacy, prefer specifics
    PLAYER_BULLET = 'PLAYER_BULLET',
    ENEMY_BULLET = 'ENEMY_BULLET',
    XP_GEM = 'XP_GEM',
    POWERUP = 'POWERUP',
    CREDIT = 'CREDIT',
    EXPLOSION = 'EXPLOSION',
    DAMAGE_NUMBER = 'DAMAGE_NUMBER',
    SPAWN_FLASH = 'SPAWN_FLASH',
    LIGHTNING = 'LIGHTNING'
}
