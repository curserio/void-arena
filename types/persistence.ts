import { ShipType } from './ships';
import { WeaponType, ModuleType, ControlScheme } from './player';
import { HighScoreEntry, GameDifficulty } from './game';

export interface PersistentData {
    credits: number;
    metaLevels: Record<string, number>;
    unlockedShips: ShipType[];
    equippedShip: ShipType;
    equippedWeapon: WeaponType;
    unlockedWeapons: WeaponType[];

    // Modules
    equippedModule: ModuleType;
    unlockedModules: ModuleType[];

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
