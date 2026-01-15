
import { WeaponType } from '../../types';

export const WEAPON_BASE_STATS: Record<WeaponType, { fireRate: number; damage: number; bulletSpeed: number }> = {
    // Plasma: Fast, crowd control (slows), moderate damage
    [WeaponType.PLASMA]: { fireRate: 4.0, damage: 35, bulletSpeed: 900 },
    // Missile: Slow fire, huge AOE damage, good for clearing packs
    [WeaponType.MISSILE]: { fireRate: 0.8, damage: 180, bulletSpeed: 600 },
    // Laser: Charge mechanic. High damage tick.
    [WeaponType.LASER]: { fireRate: 1.0, damage: 250, bulletSpeed: 0 },
    // Swarm Launcher: Burst fire (3-9 rockets), homing.
    [WeaponType.SWARM_LAUNCHER]: { fireRate: 0.5, damage: 75, bulletSpeed: 550 }
};
