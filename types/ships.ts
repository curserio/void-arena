import { PlayerStats } from './player';

export enum ShipType {
    INTERCEPTOR = 'INTERCEPTOR',
    CRUISER = 'CRUISER',
    DREADNOUGHT = 'DREADNOUGHT'
}

export interface ShipConfig {
    type: ShipType;
    name: string;
    description: string;
    baseStats: Partial<PlayerStats>;
    cost: number;
    color: string;
}
