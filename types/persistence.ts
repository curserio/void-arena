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

    // Modules (up to 3 equipped)
    equippedModules: ModuleType[];
    unlockedModules: ModuleType[];

    // RPG Progression Fields
    currentLevel: number;
    currentXp: number;
    xpToNextLevel: number;
    acquiredUpgradeIds: string[]; // Store IDs to reconstruct upgrades

    highScores: HighScoreEntry[];

    // Settings
    settings: {
        controlScheme: ControlScheme.KEYBOARD_MOUSE,
        zoomLevel: 1,
        autoShowLevelUp: true,
        showDpsMeter: false
    };
}

export const DEFAULT_PERSISTENT_DATA: PersistentData = {
    credits: 0,
    metaLevels: {},
    unlockedShips: [ShipType.INTERCEPTOR],
    equippedShip: ShipType.INTERCEPTOR,
    equippedWeapon: WeaponType.PLASMA,
    unlockedWeapons: [WeaponType.PLASMA],
    equippedModules: [],
    unlockedModules: [],
    currentLevel: 1,
    currentXp: 0,
    xpToNextLevel: 100,
    acquiredUpgradeIds: [],
    highScores: [],
    settings: {
        controlScheme: ControlScheme.KEYBOARD_MOUSE,
        zoomLevel: 1,
        autoShowLevelUp: true,
        showDpsMeter: false
    }
};
