
import { PlayerStats, WeaponType, ModuleType } from '../../types';
import { WEAPON_BASE_STATS } from '../weapons/stats';

export const WORLD_SIZE = 4000;
export const CAMERA_LERP = 0.08;
export const TARGETING_RADIUS = 450;
export const BULLET_MAX_DIST = 1200;
export const LASER_LENGTH = 1800;
export const GAME_ZOOM = 0.65; // Deprecated in favor of dynamic setting, kept for fallback
export const DEFAULT_ZOOM = 0.65;
export const XP_PER_GEM = 15;

export const ZOOM_PRESETS = [
    { label: 'Close', value: 1.0, icon: 'fa-magnifying-glass-plus' },
    { label: 'Standard', value: 0.65, icon: 'fa-eye' },
    { label: 'Far', value: 0.45, icon: 'fa-binoculars' },
    { label: 'Ultra', value: 0.35, icon: 'fa-earth-americas' }
];

export const INITIAL_STATS: PlayerStats = {
    maxHealth: 100,
    currentHealth: 100,
    maxShield: 20,
    currentShield: 20,
    shieldRegen: 3,
    lastShieldHitTime: 0,
    speed: 240,
    fireRate: WEAPON_BASE_STATS[WeaponType.PLASMA].fireRate,
    damage: WEAPON_BASE_STATS[WeaponType.PLASMA].damage,
    bulletSpeed: WEAPON_BASE_STATS[WeaponType.PLASMA].bulletSpeed,
    bulletCount: 1,
    magnetRange: 200,
    xp: 0,
    level: 1,
    xpToNextLevel: 250,
    pendingLevelUps: 0,
    weaponType: WeaponType.PLASMA,
    pierceCount: 1,
    hasShield: true,
    credits: 5000,
    shipType: 'INTERCEPTOR' as any, // Temporary cast until ShipType enum is strictly imported or accessible if it was in types
    acquiredUpgrades: [],
    invulnerableUntil: 0,
    critChance: 0.05,
    critMultiplier: 1.5,
    creditMultiplier: 1.0,
    missileRadius: 195,
    laserDuration: 0.3,
    swarmCount: 3,
    swarmAgility: 1.5,

    // Module
    moduleType: ModuleType.NONE,
    moduleCooldownMax: 0,
    moduleDuration: 0,
    modulePower: 0,
    moduleReadyTime: 0,
    moduleActiveUntil: 0,

    // Refactored Buffer System
    activeBuffs: {},

    // Combat Log
    combatLog: []
};
