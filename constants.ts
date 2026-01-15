
// Re-export constants from new modular locations
// This maintains backward compatibility while we migrate imports

export * from './data/config/game_settings';
export * from './data/config/difficulty';
export * from './data/weapons/stats';
export * from './data/items/upgrades';
export * from './data/items/prices';
export * from './data/items/ships';

export const DEBUG_CONFIG = {
    enableManualLevelUp: true,
    infiniteHealth: false,
    showHitboxes: false
};

