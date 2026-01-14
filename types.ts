
export type Vector2D = { x: number; y: number };

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  LEVELING = 'LEVELING',
  GAMEOVER = 'GAMEOVER',
  GARAGE = 'GARAGE'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY_SCOUT = 'ENEMY_SCOUT',
  ENEMY_STRIKER = 'ENEMY_STRIKER',
  ENEMY_LASER_SCOUT = 'ENEMY_LASER_SCOUT',
  ASTEROID = 'ASTEROID',
  BULLET = 'BULLET',
  ENEMY_BULLET = 'ENEMY_BULLET',
  XP_GEM = 'XP_GEM',
  POWERUP = 'POWERUP',
  CREDIT = 'CREDIT',
  EXPLOSION = 'EXPLOSION',
  DAMAGE_NUMBER = 'DAMAGE_NUMBER'
}

export enum WeaponType {
  PLASMA = 'PLASMA',
  MISSILE = 'MISSILE',
  LASER = 'LASER'
}

export enum ShipType {
  INTERCEPTOR = 'INTERCEPTOR',
  CRUISER = 'CRUISER',
  DREADNOUGHT = 'DREADNOUGHT'
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
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: (stats: PlayerStats) => PlayerStats;
  rarity?: 'COMMON' | 'RARE' | 'LEGENDARY';
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
  weaponType: WeaponType;
  pierceCount: number;
  hasShield: boolean;
  credits: number;
  shipType: ShipType;
  acquiredUpgrades: Upgrade[];
  invulnerableUntil: number;
  critChance: number;
  critMultiplier: number;
  creditMultiplier: number;
  
  // Generic Active Buffs System
  // Key: PowerUpId, Value: Expiration Timestamp (ms)
  activeBuffs: Record<string, number>;
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
}
