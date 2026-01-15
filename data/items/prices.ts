
import { ModuleType, WeaponType } from '../../types';

export const MODULE_PRICES: Record<ModuleType, number> = {
    [ModuleType.NONE]: 0,
    [ModuleType.AFTERBURNER]: 10000,
};

export const WEAPON_PRICES: Record<WeaponType, number> = {
    [WeaponType.PLASMA]: 0,
    [WeaponType.MISSILE]: 15000,
    [WeaponType.LASER]: 35000,
    [WeaponType.SWARM_LAUNCHER]: 40000
};
