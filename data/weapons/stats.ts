
import { WeaponType } from '../../types';

export const WEAPON_BASE_STATS: Record<WeaponType, { fireRate: number; damage: number; bulletSpeed: number; areaSize: number; duration: number }> = {
    // Plasma: Fast, moderate damage - balanced for early game
    [WeaponType.PLASMA]: { fireRate: 4.0, damage: 28, bulletSpeed: 900, areaSize: 0, duration: 2000 },
    // Missile: Slow fire, huge AOE damage, good for clearing packs
    [WeaponType.MISSILE]: { fireRate: 0.8, damage: 200, bulletSpeed: 600, areaSize: 195, duration: 2000 },
    // Laser: Charge mechanic. High sustained damage.
    [WeaponType.LASER]: { fireRate: 1.0, damage: 200, bulletSpeed: 0, areaSize: 0, duration: 0 },
    // Swarm Launcher: Burst fire (3-20 rockets), homing - buffed for late game
    [WeaponType.SWARM_LAUNCHER]: { fireRate: 0.6, damage: 90, bulletSpeed: 650, areaSize: 150, duration: 3000 },
    // Railgun: Pierces ALL enemies, high damage, slow fire, fast projectile
    [WeaponType.RAILGUN]: { fireRate: 0.5, damage: 350, bulletSpeed: 2800, areaSize: 0, duration: 2000 },
    // Flak Cannon: Shotgun spread (8 pellets), short range but devastating
    [WeaponType.FLAK_CANNON]: { fireRate: 1.2, damage: 40, bulletSpeed: 700, areaSize: 0, duration: 600 },
    // Energy Orb: Slow, pulsing area damage, explodes on impact
    [WeaponType.ENERGY_ORB]: { fireRate: 0.5, damage: 60, bulletSpeed: 150, areaSize: 150, duration: 5000 },
    // Arc Caster: Chain lightning, hits multiple enemies
    [WeaponType.ARC_CASTER]: { fireRate: 1.5, damage: 35, bulletSpeed: 1200, areaSize: 0, duration: 500 },
    // Flamethrower: High fire rate, short range cone, infinite pierce
    [WeaponType.FLAMETHROWER]: { fireRate: 15.0, damage: 12, bulletSpeed: 450, areaSize: 45, duration: 650 }
};
