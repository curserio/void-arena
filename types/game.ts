import { EnemyType } from './enemies';

export enum GameState {
    START = 'START',
    PLAYING = 'PLAYING',
    LEVELING = 'LEVELING',
    DYING = 'DYING',
    GAMEOVER = 'GAMEOVER',
    GARAGE = 'GARAGE',
    DEBUG_MENU = 'DEBUG_MENU'
}

export enum GameMode {
    STANDARD = 'STANDARD',
    DEBUG = 'DEBUG'
}

export enum GameDifficulty {
    NORMAL = 'NORMAL',
    HARD = 'HARD',
    NIGHTMARE = 'NIGHTMARE',
    HELL = 'HELL'
}

export interface DebugConfig {
    enemyType: EnemyType;
    level: number;
    count: number;
    tier?: 'NORMAL' | 'ELITE' | 'LEGENDARY' | 'MINIBOSS';
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

export interface HighScoreEntry {
    name: string;
    score: number;
    date: number;
    ship?: string; // Avoiding circular dependency, or use ShipType if moved
    difficulty?: GameDifficulty;
    accuracy?: number;
    enemiesKilled?: number;
    creditsEarned?: number;
    survivalTime?: number;
}
