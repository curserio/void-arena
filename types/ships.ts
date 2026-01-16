import { PlayerStats, ModuleType } from './player';

export enum ShipType {
    INTERCEPTOR = 'INTERCEPTOR',
    CRUISER = 'CRUISER',
    DREADNOUGHT = 'DREADNOUGHT',
    PHANTOM = 'PHANTOM'
}

export interface ShipConfig {
    type: ShipType;
    name: string;
    description: string;
    baseStats: Partial<PlayerStats>;
    cost: number;
    color: string;
    intrinsicModule?: ModuleType; // Module that comes with ship, cannot be removed
}
