
import { ShipConfig, ShipType } from '../../types';

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
        baseStats: { speed: 200, maxHealth: 250, maxShield: 50, shieldRegen: 2 },
        cost: 50000,
        color: '#a855f7'
    },
    {
        type: ShipType.DREADNOUGHT,
        name: 'Behemoth',
        description: 'Mobile fortress. Huge firepower.',
        baseStats: { speed: 175, maxHealth: 500, maxShield: 120, shieldRegen: 1, bulletCount: 2 },
        cost: 150000,
        color: '#facc15'
    }
];
