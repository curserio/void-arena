
import { PlayerStats, Upgrade, WeaponType, ShipType, MetaUpgrade, ShipConfig, GameDifficulty, DifficultyConfig, UpgradeType } from './types';

export const WORLD_SIZE = 4000;
export const CAMERA_LERP = 0.08;
export const TARGETING_RADIUS = 450; 
export const BULLET_MAX_DIST = 1200;
export const LASER_LENGTH = 1800;
export const GAME_ZOOM = 0.65; // Deprecated in favor of dynamic setting, kept for fallback
export const DEFAULT_ZOOM = 0.65;

export const ZOOM_PRESETS = [
  { label: 'Close', value: 1.0, icon: 'fa-magnifying-glass-plus' },
  { label: 'Standard', value: 0.65, icon: 'fa-eye' },
  { label: 'Far', value: 0.45, icon: 'fa-binoculars' },
  { label: 'Ultra', value: 0.35, icon: 'fa-earth-americas' }
];

// Difficulty Configurations
export const DIFFICULTY_CONFIGS: Record<GameDifficulty, DifficultyConfig> = {
  [GameDifficulty.NORMAL]: {
    id: GameDifficulty.NORMAL,
    name: 'CADET',
    description: 'Standard Operations',
    minRank: 1,
    enemyLevelBonus: 0,
    statMultiplier: 1.0,
    lootMultiplier: 1.0,
    color: '#38bdf8' // sky-400
  },
  [GameDifficulty.HARD]: {
    id: GameDifficulty.HARD,
    name: 'VETERAN',
    description: 'Enemies +LV 10 | Loot +50%',
    minRank: 1,
    enemyLevelBonus: 10,
    statMultiplier: 2.0,
    lootMultiplier: 1.5,
    color: '#fbbf24' // amber-400
  },
  [GameDifficulty.NIGHTMARE]: {
    id: GameDifficulty.NIGHTMARE,
    name: 'ELITE',
    description: 'Enemies +LV 30 | Loot +150%',
    minRank: 1,
    enemyLevelBonus: 30,
    statMultiplier: 5.0,
    lootMultiplier: 2.5,
    color: '#ef4444' // red-500
  },
  [GameDifficulty.HELL]: {
    id: GameDifficulty.HELL,
    name: 'VOIDWALKER',
    description: 'Enemies +LV 60 | Loot +400%',
    minRank: 1,
    enemyLevelBonus: 60,
    statMultiplier: 12.0,
    lootMultiplier: 5.0,
    color: '#d946ef' // fuchsia-500
  }
};

// Rebalanced Weapons
export const WEAPON_BASE_STATS: Record<WeaponType, { fireRate: number; damage: number; bulletSpeed: number }> = {
  // Plasma: Fast, crowd control (slows), moderate damage
  // Nerfed Base Fire Rate to 4.0 (was 6.0). Upgrades restore it.
  [WeaponType.PLASMA]: { fireRate: 4.0, damage: 35, bulletSpeed: 900 },
  // Missile: Slow fire, huge AOE damage, good for clearing packs
  [WeaponType.MISSILE]: { fireRate: 0.8, damage: 180, bulletSpeed: 600 },
  // Laser: Charge mechanic. High damage tick.
  [WeaponType.LASER]: { fireRate: 1.0, damage: 250, bulletSpeed: 0 }, // Speed 0 as it is attached to player
  // Swarm Launcher: Burst fire (3-9 rockets), homing. Long reload starts AFTER burst.
  // 0.5 fire rate = 2.0s reload time + burst time
  [WeaponType.SWARM_LAUNCHER]: { fireRate: 0.5, damage: 75, bulletSpeed: 550 } // Damage buffed 65 -> 75
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
  pendingLevelUps: 0, // NEW: Tracks stored levels
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
  missileRadius: 195, // Buffed Base Radius (150 -> 195)
  laserDuration: 0.3, // Seconds
  swarmCount: 3, // Base burst is 3
  swarmAgility: 1.5, // Reduced base agility (was 3.0)
  
  // Refactored Buffer System
  activeBuffs: {},

  // Combat Log
  combatLog: []
};

export const XP_PER_GEM = 15; 

export const WEAPON_PRICES: Record<WeaponType, number> = {
  [WeaponType.PLASMA]: 0,
  [WeaponType.MISSILE]: 15000,
  [WeaponType.LASER]: 35000,
  [WeaponType.SWARM_LAUNCHER]: 40000
};

// --- UPGRADE POOL ---

export const UPGRADES: Upgrade[] = [
    // --- UNIQUE UPGRADES (One Time Only, Strong Effects) ---
    {
        id: 'titan_gen',
        type: UpgradeType.STAT,
        name: 'Titan Generator',
        description: 'Significantly increases Max Shield capacity.',
        icon: 'fa-shield-halved',
        rarity: 'LEGENDARY',
        maxStacks: 1,
        weight: 3,
        effect: (s) => ({ ...s, maxShield: s.maxShield + 50, currentShield: s.currentShield + 50 })
    },
    {
        id: 'berserker_mod',
        type: UpgradeType.STAT,
        name: 'Berserker Module',
        description: '+35% Damage, but -20% Max Integrity.',
        icon: 'fa-skull',
        rarity: 'LEGENDARY',
        maxStacks: 1,
        weight: 3,
        effect: (s) => ({ 
            ...s, 
            damage: s.damage * 1.35,
            maxHealth: s.maxHealth * 0.8,
            currentHealth: Math.min(s.currentHealth, s.maxHealth * 0.8)
        })
    },
    {
        id: 'nano_repair',
        type: UpgradeType.STAT,
        name: 'Nanite Weaver',
        description: 'Triples Shield Regeneration rate.',
        icon: 'fa-rotate',
        rarity: 'RARE',
        maxStacks: 1,
        weight: 5,
        effect: (s) => ({ ...s, shieldRegen: s.shieldRegen * 3.0 })
    },

    // --- STACKABLE UPGRADES (Small boosts, unlimited or high limit) ---
    {
        id: 'hull_plate',
        type: UpgradeType.STAT,
        name: 'Hull Plating',
        description: '+10 Max Hull Integrity (Repairs 10 HP).',
        icon: 'fa-heart',
        rarity: 'COMMON',
        maxStacks: 20,
        weight: 15,
        effect: (s) => ({ ...s, maxHealth: s.maxHealth + 10, currentHealth: s.currentHealth + 10 })
    },
    {
        id: 'dmg_boost',
        type: UpgradeType.STAT,
        name: 'Core Reactor',
        description: '+10% Damage Output.',
        icon: 'fa-burst',
        rarity: 'COMMON',
        maxStacks: 99,
        weight: 12,
        effect: (s) => ({ ...s, damage: s.damage * 1.10 })
    },
    {
        id: 'fire_rate',
        type: UpgradeType.STAT,
        name: 'Rapid Cycler',
        description: '+5% Fire Rate.',
        icon: 'fa-bolt',
        rarity: 'COMMON',
        maxStacks: 99,
        weight: 12,
        effect: (s) => ({ ...s, fireRate: s.fireRate * 1.05 })
    },
    {
        id: 'speed_boost',
        type: UpgradeType.STAT,
        name: 'Ion Thrusters',
        description: '+5% Movement Speed.',
        icon: 'fa-forward',
        rarity: 'COMMON',
        maxStacks: 10,
        weight: 12,
        effect: (s) => ({ ...s, speed: s.speed * 1.05 })
    },
    {
        id: 'crit_mod',
        type: UpgradeType.STAT,
        name: 'Lens Polish',
        description: '+5% Critical Chance.',
        icon: 'fa-crosshairs',
        rarity: 'RARE',
        maxStacks: 10,
        weight: 8,
        effect: (s) => ({ ...s, critChance: Math.min(1.0, s.critChance + 0.05) })
    },
    {
        id: 'magnet_boost',
        type: UpgradeType.STAT,
        name: 'Gravity Field',
        description: '+15% Pickup Range.',
        icon: 'fa-magnet',
        rarity: 'COMMON',
        maxStacks: 5,
        weight: 10,
        effect: (s) => ({ ...s, magnetRange: s.magnetRange * 1.15 })
    },

    // --- CONSUMABLES (Infinite, Instant Effects, No Stats stored) ---
    {
        id: 'cons_heal',
        type: UpgradeType.CONSUMABLE,
        name: 'Emergency Repair',
        description: 'Instant: Restore 100% Hull Integrity.',
        icon: 'fa-heart-pulse',
        rarity: 'COMMON',
        maxStacks: 999,
        weight: 8,
        // Effect handled in Logic
    },
    {
        id: 'cons_shield',
        type: UpgradeType.CONSUMABLE,
        name: 'Shield Reboot',
        description: 'Instant: Fully Recharge Shields.',
        icon: 'fa-shield-virus',
        rarity: 'COMMON',
        maxStacks: 999,
        weight: 8,
        // Effect handled in Logic
    },
    {
        id: 'cons_emp',
        type: UpgradeType.CONSUMABLE,
        name: 'EMP Blast',
        description: 'Tactical: Destroy all active enemies and bullets on screen.',
        icon: 'fa-car-battery',
        rarity: 'RARE',
        maxStacks: 999,
        weight: 4,
        // Effect handled in Logic
    },
    {
        id: 'cons_nuke',
        type: UpgradeType.CONSUMABLE,
        name: 'Tactical Nuke',
        description: 'Tactical: Detonate a massive explosion around your ship.',
        icon: 'fa-radiation',
        rarity: 'RARE',
        maxStacks: 999,
        weight: 4,
        // Effect handled in Logic
    },
    {
        id: 'cons_score',
        type: UpgradeType.CONSUMABLE,
        name: 'Data Cache',
        description: 'Bonus: Instantly gain 2,500 Score.',
        icon: 'fa-database',
        rarity: 'COMMON',
        maxStacks: 999,
        weight: 10,
        // Effect handled in Logic
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
    description: '+5% Pickup Radius per level.', // Nerfed from 15%
    icon: 'fa-magnet', 
    maxLevel: 20, 
    costBase: 100, 
    costFactor: 1.25 
  },
  { 
    id: 'meta_speed', 
    name: 'Thruster Tuning', 
    description: '+2% Flight Speed per level.', 
    icon: 'fa-forward-fast', 
    maxLevel: 20, 
    costBase: 800, 
    costFactor: 1.4 
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
  { id: 'meta_plas_rate', name: 'Plasma Cycler', description: '+5% Fire Rate per level.', icon: 'fa-bolt', maxLevel: 10, costBase: 500, costFactor: 1.2, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_area', name: 'Cryo-Plasma', description: 'Plasma slows enemies effectively (Chill).', icon: 'fa-snowflake', maxLevel: 10, costBase: 1000, costFactor: 1.6, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_dmg', name: 'Plasma Intensity', description: '+5% Damage per level.', icon: 'fa-fire-burner', maxLevel: 100, costBase: 200, costFactor: 1.12, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_speed', name: 'Velocity Coil', description: '+8% Projectile Speed per level.', icon: 'fa-wind', maxLevel: 30, costBase: 400, costFactor: 1.2, weaponType: WeaponType.PLASMA },
  { id: 'meta_plas_count', name: 'Split Chamber', description: '+1 Projectile count.', icon: 'fa-clone', maxLevel: 2, costBase: 5000, costFactor: 2.5, weaponType: WeaponType.PLASMA },

  // --- WEAPON SPECIFIC: MISSILE ---
  // Nerfed: Increased costBase 1500->4000 and Factor 1.4->1.6
  { id: 'meta_msl_rad', name: 'Warhead Yield', description: 'Increases missile explosion radius.', icon: 'fa-bomb', maxLevel: 20, costBase: 4000, costFactor: 1.6, weaponType: WeaponType.MISSILE },
  { id: 'meta_msl_dmg', name: 'Payload Potency', description: '+5% Damage per level.', icon: 'fa-explosion', maxLevel: 100, costBase: 500, costFactor: 1.12, weaponType: WeaponType.MISSILE },
  { id: 'meta_msl_reload', name: 'Auto-Loader', description: '+5% Fire Rate per level.', icon: 'fa-repeat', maxLevel: 40, costBase: 1000, costFactor: 1.25, weaponType: WeaponType.MISSILE },

  // --- WEAPON SPECIFIC: LASER ---
  { id: 'meta_lsr_recharge', name: 'Capacitor Banks', description: 'Reduces Laser recharge time.', icon: 'fa-battery-full', maxLevel: 20, costBase: 2000, costFactor: 1.45, weaponType: WeaponType.LASER },
  { id: 'meta_lsr_dmg', name: 'Beam Focus', description: '+5% Damage per level.', icon: 'fa-sun', maxLevel: 100, costBase: 800, costFactor: 1.12, weaponType: WeaponType.LASER },
  { id: 'meta_lsr_duration', name: 'Heat Sinks', description: '+10% Beam Duration per level.', icon: 'fa-hourglass-start', maxLevel: 20, costBase: 1500, costFactor: 1.3, weaponType: WeaponType.LASER },

  // --- WEAPON SPECIFIC: SWARM LAUNCHER ---
  // Rebalanced: Removed Speed, Increased Count Cap to 20 total, Increased DMG cap, Increased CD reduction levels
  { id: 'meta_swarm_count', name: 'Extended Magazines', description: '+1 Rocket per salvo.', icon: 'fa-layer-group', maxLevel: 17, costBase: 10000, costFactor: 1.55, weaponType: WeaponType.SWARM_LAUNCHER },
  { id: 'meta_swarm_agility', name: 'Thrust Vectoring', description: 'Improves rocket homing turn rate.', icon: 'fa-paper-plane', maxLevel: 20, costBase: 2000, costFactor: 1.3, weaponType: WeaponType.SWARM_LAUNCHER },
  { id: 'meta_swarm_dmg', name: 'Micro-Warheads', description: '+5% Damage per level.', icon: 'fa-burst', maxLevel: 100, costBase: 600, costFactor: 1.15, weaponType: WeaponType.SWARM_LAUNCHER },
  // Speed Upgrade Removed
  { id: 'meta_swarm_cd', name: 'Reloader Mechanism', description: 'Reduces cooldown between salvos.', icon: 'fa-clock', maxLevel: 50, costBase: 3000, costFactor: 1.25, weaponType: WeaponType.SWARM_LAUNCHER },
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
    baseStats: { speed: 200, maxHealth: 250, maxShield: 50, shieldRegen: 2 }, // Damage 40 removed
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
