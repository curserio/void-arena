
import { ModuleType, WeaponType } from '../../types';

export const MODULE_PRICES: Record<ModuleType, number> = {
    [ModuleType.NONE]: 0,
    [ModuleType.AFTERBURNER]: 5000,
    [ModuleType.SHIELD_BURST]: 12000,
    [ModuleType.PHASE_SHIFT]: 25000,
    [ModuleType.TIME_WARP]: 40000
};

export const WEAPON_PRICES: Record<WeaponType, number> = {
    [WeaponType.PLASMA]: 0,
    [WeaponType.MISSILE]: 15000,
    [WeaponType.LASER]: 30000,
    [WeaponType.SWARM_LAUNCHER]: 28000,
    [WeaponType.RAILGUN]: 45000,
    [WeaponType.FLAK_CANNON]: 25000,
    [WeaponType.ENERGY_ORB]: 40000,
    [WeaponType.ARC_CASTER]: 35000,
    [WeaponType.FLAMETHROWER]: 18000
};
