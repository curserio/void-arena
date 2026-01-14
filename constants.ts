
import { PlayerStats, Upgrade, WeaponType, ShipType, MetaUpgrade, ShipConfig } from './types';

export const WORLD_SIZE = 4000;
export const CAMERA_LERP = 0.08;
export const TARGETING_RADIUS = 500; 
export const BULLET_MAX_DIST = 1500;
export const GAME_ZOOM = 0.7; 

export const WEAPON_BASE_STATS: Record<WeaponType, { fireRate: number; damage: number; bulletSpeed: number }> = {
  [WeaponType.PLASMA]: { fireRate: 4.5, damage: 45, bulletSpeed: 850 },
  [WeaponType.MISSILE]: { fireRate: 0.8, damage: 280, bulletSpeed: 550 },
  [WeaponType.LASER]: { fireRate: 1.2, damage: 350, bulletSpeed: 4000 }
};

export const INITIAL_STATS: PlayerStats = {
  maxHealth: 100,
  currentHealth: 100,
  maxShield: 25,
  currentShield: 25,
  shieldRegen: 2.5,
  lastShieldHitTime: 0,
  speed: 230,
  fireRate: WEAPON_BASE_STATS[WeaponType.PLASMA].fireRate,
  damage: WEAPON_BASE_STATS[WeaponType.PLASMA].damage,
  bulletSpeed: WEAPON_BASE_STATS[WeaponType.PLASMA].bulletSpeed,
  bulletCount: 1,
  magnetRange: 180,
  xp: 0,
  level: 1,
  xpToNextLevel: 300, 
  weaponType: WeaponType.PLASMA,
  pierceCount: 1,
  hasShield: true,
  credits: 5000, 
  shipType: ShipType.INTERCEPTOR,
  acquiredUpgrades: [],
  invulnerableUntil: 0,
  buffs: {
    overdriveUntil: 0,
    omniUntil: 0,
    pierceUntil: 0
  }
};

export const XP_PER_GEM = 12; 

export const WEAPON_PRICES: Record<WeaponType, number> = {
  [WeaponType.PLASMA]: 0,
  [WeaponType.MISSILE]: 8500,
  [WeaponType.LASER]: 22000
};

export const UPGRADES: Upgrade[] = [
  {
    id: 'fire_rate_1',
    name: 'Overclock',
    description: '+15% Fire Rate',
    icon: 'fa-bolt-lightning',
    effect: (s) => ({ ...s, fireRate: s.fireRate * 1.15 })
  },
  {
    id: 'damage_1',
    name: 'Apex Charge',
    description: '+20% Damage',
    icon: 'fa-burst',
    effect: (s) => ({ ...s, damage: s.damage * 1.2 })
  },
  {
    id: 'speed_1',
    name: 'Nitro Flow',
    description: '+10% Speed',
    icon: 'fa-angles-up',
    effect: (s) => ({ ...s, speed: s.speed * 1.1 })
  },
  {
    id: 'magnet_1',
    name: 'Event Horizon',
    description: '+40% Collection',
    icon: 'fa-arrows-to-dot',
    effect: (s) => ({ ...s, magnetRange: s.magnetRange * 1.4 })
  },
  {
    id: 'health_1',
    name: 'Nano Repair',
    description: '+40 Max HP & Full Heal',
    icon: 'fa-heart-pulse',
    effect: (s) => ({ ...s, maxHealth: s.maxHealth + 40, currentHealth: s.maxHealth + 40 })
  }
];

export const META_UPGRADES: MetaUpgrade[] = [
  { id: 'meta_hp', name: 'Reinforced Hull', description: 'Increases hull integrity by +15% per level.', icon: 'fa-shield-heart', maxLevel: 100, costBase: 250, costStep: 150 },
  { id: 'meta_dmg', name: 'Reactor Sync', description: 'Global +10% DMG boost for all systems.', icon: 'fa-fire', maxLevel: 100, costBase: 400, costStep: 250 },
  { id: 'meta_speed', name: 'Engine Overclock', description: 'Increases vessel speed by +10% per level.', icon: 'fa-gauge-high', maxLevel: 30, costBase: 350, costStep: 200 },
  { id: 'meta_shield_max', name: 'Shield Capacitors', description: 'Increases energy shield capacity by +20% per level.', icon: 'fa-shield-halved', maxLevel: 50, costBase: 400, costStep: 300 },
  { id: 'meta_magnet', name: 'Gravity Well', description: 'Expands extraction radius by +25%.', icon: 'fa-magnet', maxLevel: 50, costBase: 300, costStep: 200 },
  
  { id: 'meta_plas_dmg', name: 'Ion Chambers', description: 'Refines plasma compression (+15% dmg).', icon: 'fa-burst', maxLevel: 100, costBase: 150, costStep: 100, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_count', name: 'Multi-Barrel', description: 'Additional weapon barrels (Max 3).', icon: 'fa-grip-lines-vertical', maxLevel: 2, costBase: 5000, costStep: 15000, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_spd', name: 'Rail Accelerators', description: 'Increases projectile velocity (+15%).', icon: 'fa-bolt', maxLevel: 10, costBase: 500, costStep: 800, weaponType: WeaponType.PLASMA },
  
  { id: 'meta_msl_dmg', name: 'Guidance Core', description: 'Increases missile yield (+20%).', icon: 'fa-bullseye', maxLevel: 100, costBase: 300, costStep: 200, weaponType: WeaponType.MISSILE },
  { id: 'meta_msl_rad', name: 'HE Warheads', description: 'Expands explosion radius (+30%).', icon: 'fa-circle-dot', maxLevel: 20, costBase: 1200, costStep: 1500, weaponType: WeaponType.MISSILE },
  
  { id: 'meta_lsr_burn', name: 'Gamma Pulses', description: 'Increases laser damage output (+25%).', icon: 'fa-sun', maxLevel: 100, costBase: 500, costStep: 350, weaponType: WeaponType.LASER },
  { id: 'meta_lsr_pierce', name: 'Focus Lens', description: 'Allows beam to burn through 1 extra enemy.', icon: 'fa-arrows-to-eye', maxLevel: 10, costBase: 3000, costStep: 4500, weaponType: WeaponType.LASER }
];

export const SHIPS: ShipConfig[] = [
  {
    type: ShipType.INTERCEPTOR,
    name: 'Ghost-7',
    description: 'Light scout. High shield recovery.',
    baseStats: { speed: 250, maxHealth: 80, maxShield: 30, shieldRegen: 3 },
    cost: 0,
    color: '#22d3ee'
  },
  {
    type: ShipType.CRUISER,
    name: 'Valkyrie',
    description: 'Military fleet standard. Balanced.',
    baseStats: { speed: 190, maxHealth: 200, maxShield: 60, shieldRegen: 5 },
    cost: 25000,
    color: '#a855f7'
  },
  {
    type: ShipType.DREADNOUGHT,
    name: 'Behemoth',
    description: 'Ultimate space fortress. Durable.',
    baseStats: { speed: 140, maxHealth: 600, maxShield: 150, shieldRegen: 10 },
    cost: 120000,
    color: '#facc15'
  }
];
