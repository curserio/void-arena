
import { GameDifficulty, DifficultyConfig } from '../../types';

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
