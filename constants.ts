
import { PlayerStats, Upgrade, WeaponType, ShipType, MetaUpgrade, ShipConfig } from './types';

export const WORLD_SIZE = 4000;
export const CAMERA_LERP = 0.08;
export const TARGETING_RADIUS = 600; 
export const BULLET_MAX_DIST = 1200;
export const GAME_ZOOM = 0.65; 

// Rebalanced Weapons
export const WEAPON_BASE_STATS: Record<WeaponType, { fireRate: number; damage: number; bulletSpeed: number }> = {
  // Plasma: Fast, crowd control (slows), moderate damage
  [WeaponType.PLASMA]: { fireRate: 6.0, damage: 35, bulletSpeed: 900 },
  // Missile: Slow fire, huge AOE damage, good for clearing packs
  [WeaponType.MISSILE]: { fireRate: 0.8, damage: 180, bulletSpeed: 600 },
  // Laser: Railgun style. Pierces everything. High damage per shot, precision needed.
  [WeaponType.LASER]: { fireRate: 0.6, damage: 400, bulletSpeed: 4500 }
};

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
  weaponType: WeaponType.PLASMA,
  pierceCount: 1,
  hasShield: true,
  credits: 5000, 
  shipType: ShipType.INTERCEPTOR,
  acquiredUpgrades: [],
  invulnerableUntil: 0,
  // New Base Stats
  critChance: 0.05, // 5% base
  critMultiplier: 1.5, // 150% crit dmg
  creditMultiplier: 1.0,
  buffs: {
    overdriveUntil: 0,
    omniUntil: 0,
    pierceUntil: 0
  }
};

export const XP_PER_GEM = 15; 

export const WEAPON_PRICES: Record<WeaponType, number> = {
  [WeaponType.PLASMA]: 0,
  [WeaponType.MISSILE]: 15000,
  [WeaponType.LASER]: 35000
};

// In-Game Upgrades (Roguelike Elements)
export const UPGRADES: Upgrade[] = [
  {
    id: 'dmg_boost',
    name: 'Core Reactor',
    description: '+15% Damage Output',
    icon: 'fa-burst',
    effect: (s) => ({ ...s, damage: s.damage * 1.15 })
  },
  {
    id: 'fire_rate',
    name: 'Rapid Cycler',
    description: '+12% Fire Rate',
    icon: 'fa-bolt',
    effect: (s) => ({ ...s, fireRate: s.fireRate * 1.12 })
  },
  {
    id: 'crit_chance',
    name: 'Targeting AI',
    description: '+10% Crit Chance',
    icon: 'fa-crosshairs',
    effect: (s) => ({ ...s, critChance: Math.min(1.0, s.critChance + 0.1) })
  },
  {
    id: 'crit_dmg',
    name: 'Plasma Spikes',
    description: '+30% Crit Damage',
    icon: 'fa-skull',
    effect: (s) => ({ ...s, critMultiplier: s.critMultiplier + 0.3 })
  },
  {
    id: 'multishot',
    name: 'Split Chamber',
    description: '+1 Projectile (Plasma/Missile)',
    icon: 'fa-clone',
    effect: (s) => ({ ...s, bulletCount: s.bulletCount + 1 })
  },
  {
    id: 'speed_boost',
    name: 'Ion Thrusters',
    description: '+10% Movement Speed',
    icon: 'fa-forward',
    effect: (s) => ({ ...s, speed: s.speed * 1.1 })
  },
  {
    id: 'magnet',
    name: 'Gravity Field',
    description: '+30% Pickup Range',
    icon: 'fa-magnet',
    effect: (s) => ({ ...s, magnetRange: s.magnetRange * 1.3 })
  },
  {
    id: 'health_pack',
    name: 'Nanite Cloud',
    description: 'Heal 50% HP & +20 Max HP',
    icon: 'fa-heart-pulse',
    effect: (s) => ({ ...s, maxHealth: s.maxHealth + 20, currentHealth: Math.min(s.maxHealth + 20, s.currentHealth + (s.maxHealth * 0.5)) })
  }
];

// Meta Progression - Geometric Cost Scaling
// Cost = costBase * (costFactor ^ Level)
export const META_UPGRADES: MetaUpgrade[] = [
  // --- SURVIVAL ---
  { 
    id: 'meta_hp', 
    name: 'Titanium Hull', 
    description: 'Increases hull integrity by +10% per level.', 
    icon: 'fa-shield-heart', 
    maxLevel: 50, 
    costBase: 100, 
    costFactor: 1.3 // 100, 130, 169, 219...
  },
  { 
    id: 'meta_shield', 
    name: 'Shield Generator', 
    description: 'Boosts shield capacity by +15% per level.', 
    icon: 'fa-shield-halved', 
    maxLevel: 30, 
    costBase: 150, 
    costFactor: 1.35 
  },
  { 
    id: 'meta_regen', 
    name: 'Auto-Repair', 
    description: 'Shield recharges +10% faster per level.', 
    icon: 'fa-rotate', 
    maxLevel: 20, 
    costBase: 300, 
    costFactor: 1.4 
  },

  // --- OFFENSE ---
  { 
    id: 'meta_dmg', 
    name: 'Weapon Overclock', 
    description: 'Global +5% Damage multiplier per level.', 
    icon: 'fa-fire', 
    maxLevel: 100, 
    costBase: 200, 
    costFactor: 1.25 
  },
  { 
    id: 'meta_crit_chance', 
    name: 'Predictive Algo', 
    description: '+1% Critical Hit Chance per level.', 
    icon: 'fa-crosshairs', 
    maxLevel: 25, 
    costBase: 500, 
    costFactor: 1.5 
  },
  { 
    id: 'meta_crit_dmg', 
    name: 'Lethal Frequency', 
    description: '+5% Critical Hit Damage per level.', 
    icon: 'fa-skull-crossbones', 
    maxLevel: 50, 
    costBase: 400, 
    costFactor: 1.3 
  },

  // --- UTILITY ---
  { 
    id: 'meta_magnet', 
    name: 'Tractor Beam', 
    description: '+15% Pickup Radius per level.', 
    icon: 'fa-magnet', 
    maxLevel: 20, 
    costBase: 100, 
    costFactor: 1.25 
  },
  { 
    id: 'meta_salvage', 
    name: 'Salvage Protocols', 
    description: '+5% Credits earned per level.', 
    icon: 'fa-coins', 
    maxLevel: 50, 
    costBase: 500, 
    costFactor: 1.2 
  },

  // --- WEAPON SPECIFIC: PLASMA ---
  { id: 'meta_plas_area', name: 'Cryo-Plasma', description: 'Plasma slows enemies effectively (Chill).', icon: 'fa-snowflake', maxLevel: 10, costBase: 1000, costFactor: 1.6, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_dmg', name: 'Plasma Intensity', description: '+5% Damage per level. Long-term upgrade.', icon: 'fa-fire-burner', maxLevel: 100, costBase: 200, costFactor: 1.12, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_speed', name: 'Velocity Coil', description: '+8% Projectile Speed per level.', icon: 'fa-wind', maxLevel: 30, costBase: 400, costFactor: 1.2, weaponType: WeaponType.PLASMA },

  // --- WEAPON SPECIFIC: MISSILE ---
  { id: 'meta_msl_rad', name: 'Warhead Yield', description: 'Increases missile explosion radius.', icon: 'fa-bomb', maxLevel: 20, costBase: 1500, costFactor: 1.4, weaponType: WeaponType.MISSILE },
  { id: 'meta_msl_dmg', name: 'Payload Potency', description: '+5% Damage per level. Long-term upgrade.', icon: 'fa-explosion', maxLevel: 100, costBase: 500, costFactor: 1.12, weaponType: WeaponType.MISSILE },
  { id: 'meta_msl_reload', name: 'Auto-Loader', description: '+5% Fire Rate per level.', icon: 'fa-repeat', maxLevel: 40, costBase: 1000, costFactor: 1.25, weaponType: WeaponType.MISSILE },

  // --- WEAPON SPECIFIC: LASER ---
  { id: 'meta_lsr_recharge', name: 'Capacitor Banks', description: 'Reduces Laser recharge time.', icon: 'fa-battery-full', maxLevel: 20, costBase: 2000, costFactor: 1.45, weaponType: WeaponType.LASER },
  { id: 'meta_lsr_dmg', name: 'Beam Focus', description: '+5% Damage per level. Long-term upgrade.', icon: 'fa-sun', maxLevel: 100, costBase: 800, costFactor: 1.12, weaponType: WeaponType.LASER }
];

export const SHIPS: ShipConfig[] = [
  {
    type: ShipType.INTERCEPTOR,
    name: 'Ghost-7',
    description: 'Agile scout. Fast shield regen.',
    baseStats: { speed: 260, maxHealth: 80, maxShield: 30, shieldRegen: 4, critChance: 0.10 },
    cost: 0,
    color: '#22d3ee'
  },
  {
    type: ShipType.CRUISER,
    name: 'Valkyrie',
    description: 'Heavy armor. High sustain.',
    baseStats: { speed: 200, maxHealth: 250, maxShield: 50, shieldRegen: 2, damage: 40 }, // Slightly higher base dmg
    cost: 50000,
    color: '#a855f7'
  },
  {
    type: ShipType.DREADNOUGHT,
    name: 'Behemoth',
    description: 'Mobile fortress. Huge firepower.',
    baseStats: { speed: 160, maxHealth: 500, maxShield: 120, shieldRegen: 1, bulletCount: 2 }, // Base +1 bullet
    cost: 250000,
    color: '#facc15'
  }
];
