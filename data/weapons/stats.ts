
import { WeaponType } from '../../types';

export const WEAPON_BASE_STATS: Record<WeaponType, { fireRate: number; damage: number; bulletSpeed: number }> = {
    // Plasma: Fast, moderate damage - balanced for early game
    [WeaponType.PLASMA]: { fireRate: 4.0, damage: 28, bulletSpeed: 900 },
    // Missile: Slow fire, huge AOE damage, good for clearing packs
    [WeaponType.MISSILE]: { fireRate: 0.8, damage: 200, bulletSpeed: 600 },
    // Laser: Charge mechanic. High sustained damage.
    [WeaponType.LASER]: { fireRate: 1.0, damage: 200, bulletSpeed: 0 },
    // Swarm Launcher: Burst fire (3-20 rockets), homing - buffed for late game
    [WeaponType.SWARM_LAUNCHER]: { fireRate: 0.6, damage: 90, bulletSpeed: 650 }
};
