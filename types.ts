
export type Vector2D = { x: number; y: number };

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  LEVELING = 'LEVELING',
  DYING = 'DYING',
  GAMEOVER = 'GAMEOVER',
  GARAGE = 'GARAGE'
}

export enum GameDifficulty {
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  NIGHTMARE = 'NIGHTMARE',
  HELL = 'HELL'
}

export interface DifficultyConfig {
  id: GameDifficulty;
  name: string;
  description: string;
  minRank: number; // Required player level to unlock
  enemyLevelBonus: number; // Start enemies at this level
  statMultiplier: number; // Multiply HP/Dmg
  lootMultiplier: number; // Multiply XP/Credits
  color: string;
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY_SCOUT = 'ENEMY_SCOUT',
  ENEMY_STRIKER = 'ENEMY_STRIKER',
  ENEMY_LASER_SCOUT = 'ENEMY_LASER_SCOUT',
  ENEMY_KAMIKAZE = 'ENEMY_KAMIKAZE',
  ENEMY_BOSS = 'ENEMY_BOSS',
  ASTEROID = 'ASTEROID',
  BULLET = 'BULLET',
  ENEMY_BULLET = 'ENEMY_BULLET',
  XP_GEM = 'XP_GEM',
  POWERUP = 'POWERUP',
  CREDIT = 'CREDIT',
  EXPLOSION = 'EXPLOSION',
  DAMAGE_NUMBER = 'DAMAGE_NUMBER',
  SPAWN_FLASH = 'SPAWN_FLASH'
}

export enum WeaponType {
  PLASMA = 'PLASMA',
  MISSILE = 'MISSILE',
  LASER = 'LASER',
  SWARM_LAUNCHER = 'SWARM_LAUNCHER'
}

export enum ShipType {
  INTERCEPTOR = 'INTERCEPTOR',
  CRUISER = 'CRUISER',
  DREADNOUGHT = 'DREADNOUGHT'
}

export enum ControlScheme {
  TWIN_STICK = 'TWIN_STICK',
  TAP_TO_AIM = 'TAP_TO_AIM',
  KEYBOARD_MOUSE = 'KEYBOARD_MOUSE'
}

// PowerUp ID strings for flexibility
export type PowerUpId = 'OVERDRIVE' | 'OMNI' | 'PIERCE' | 'SPEED' | 'HEALTH' | 'SHIELD';

export interface PowerUpConfig {
  id: PowerUpId;
  name: string;
  type: 'DURATION' | 'INSTANT';
  duration?: number; // ms
  weight: number; // For drop chance
  color: string;
  icon: string; // FontAwesome class
  label: string; // Short char for pickup render
  onPickup: (stats: PlayerStats, time: number) => PlayerStats;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2D;
  vel: Vector2D;
  radius: number;
  health: number;
  maxHealth: number;
  shield?: number;      
  maxShield?: number;   
  color: string;
  value?: number;
  level?: number;
  powerUpId?: PowerUpId; // Changed from enum to string ID
  pierceCount?: number;
  lastShotTime?: number;
  lastMeleeHitTime?: number;
  lastHitTime?: number; 
  lastShieldHitTime?: number;
  isMelee?: boolean;
  aiPhase?: number;
  aiSeed?: number;
  duration?: number;
  maxDuration?: number;
  weaponType?: WeaponType;
  seed?: number; 
  isCharging?: boolean;
  chargeProgress?: number;
  angle?: number;
  isFiring?: boolean;
  slowUntil?: number; 
  slowFactor?: number;
  isDashing?: boolean;
  dashUntil?: number;
  isElite?: boolean;
  isMiniboss?: boolean; 
  isBoss?: boolean;
  targetId?: string; // For Homing Missiles
  hasDeathDefiance?: boolean; // For Elite Kamikaze (Shield Gate)
}

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

export interface MetaUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costBase: number;
  costFactor: number; 
  weaponType?: WeaponType;
}

export interface ShipConfig {
  type: ShipType;
  name: string;
  description: string;
  baseStats: Partial<PlayerStats>;
  cost: number;
  color: string;
}

export interface CombatLogEntry {
    timestamp: number;
    damage: number;
    source: string;
    isFatal: boolean;
    enemyLevel?: number;
}

export interface PlayerStats {
  maxHealth: number;
  currentHealth: number;
  maxShield: number;
  currentShield: number;
  shieldRegen: number;
  lastShieldHitTime: number;
  speed: number;
  fireRate: number; 
  damage: number;
  bulletSpeed: number;
  bulletCount: number;
  magnetRange: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  pendingLevelUps: number; // Stored levels waiting to be spent
  weaponType: WeaponType;
  pierceCount: number;
  hasShield: boolean;
  credits: number;
  shipType: ShipType;
  
  // Stored upgrade history (Only STAT upgrades)
  acquiredUpgrades: Upgrade[];
  
  invulnerableUntil: number;
  critChance: number;
  critMultiplier: number;
  creditMultiplier: number;
  
  // Weapon specific calculated stats
  missileRadius: number;
  laserDuration: number;
  swarmCount: number;
  swarmAgility: number; // Turn speed in radians per sec
  
  // Generic Active Buffs System
  // Key: PowerUpId, Value: Expiration Timestamp (ms)
  activeBuffs: Record<string, number>;

  // Death Recap
  combatLog: CombatLogEntry[];
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: number;
  ship?: ShipType;
  difficulty?: GameDifficulty;
  // New Stats
  accuracy?: number; // Percentage 0-100
  enemiesKilled?: number;
  creditsEarned?: number;
}

export interface PersistentData {
  credits: number;
  metaLevels: Record<string, number>;
  unlockedShips: ShipType[];
  equippedShip: ShipType;
  equippedWeapon: WeaponType;
  unlockedWeapons: WeaponType[];
  
  // RPG Progression Fields
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  acquiredUpgradeIds: string[]; // Store IDs to reconstruct upgrades
  
  highScores: HighScoreEntry[];

  // Settings
  settings: {
    controlScheme: ControlScheme;
    zoomLevel?: number;
    autoShowLevelUp?: boolean;
  };
}
