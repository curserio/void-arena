
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
  HEAL_PICKUP = 'HEAL_PICKUP',
  EXPLOSION = 'EXPLOSION',
  DAMAGE_NUMBER = 'DAMAGE_NUMBER'
}

export enum WeaponType {
  PLASMA = 'PLASMA',
  MISSILE = 'MISSILE',
  LASER = 'LASER'
}

export enum PowerUpType {
  OVERDRIVE = 'OVERDRIVE',
  OMNI_SHOT = 'OMNI_SHOT',
  SUPER_PIERCE = 'SUPER_PIERCE'
}

export enum ShipType {
  INTERCEPTOR = 'INTERCEPTOR',
  CRUISER = 'CRUISER',
  DREADNOUGHT = 'DREADNOUGHT'
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
  powerUpType?: PowerUpType;
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
  // New AI & Status properties
  slowUntil?: number; 
  slowFactor?: number;
  isDashing?: boolean;
  dashUntil?: number;
  isElite?: boolean; // Explicit elite flag
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
  costFactor: number; // Geometric growth factor
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
  // New Stats
  critChance: number;
  critMultiplier: number;
  creditMultiplier: number;
  buffs: {
    overdriveUntil: number;
    omniUntil: number;
    pierceUntil: number;
  };
}

export interface PersistentData {
  credits: number;
  metaLevels: Record<string, number>;
  unlockedShips: ShipType[];
  equippedShip: ShipType;
  equippedWeapon: WeaponType;
  unlockedWeapons: WeaponType[];
}
