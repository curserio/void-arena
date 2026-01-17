/**
 * Flak Cannon Weapon Behavior
 * 
 * Shotgun-style spread weapon with scaling spread angle.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const FlakBehavior: WeaponBehavior = {
    weaponType: WeaponType.FLAK_CANNON,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni, isPierce } = ctx;
        const projectiles: BaseProjectile[] = [];

        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed,
            color: '#fbbf24',
            pierce: isPierce ? 99 : stats.pierceCount,
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 560,  // Reduced range
            radius: 5
        };

        const angles = isOmni ? [-0.3, 0, 0.3] : [0];

        angles.forEach(omniSpread => {
            const currentAngle = fireAngle + omniSpread;
            const pelletCount = stats.bulletCount;
            // Spread scales: ~6.9° per pellet (8 = 55°, 16 = 110°)
            const spreadAngle = pelletCount * (Math.PI / 26);
            const startAngle = currentAngle - spreadAngle / 2;
            const angleStep = pelletCount > 1 ? spreadAngle / (pelletCount - 1) : 0;

            for (let i = 0; i < pelletCount; i++) {
                const pAngle = startAngle + i * angleStep;
                const dir = { x: Math.cos(pAngle), y: Math.sin(pAngle) };

                const p = ProjectileFactory.createPlayerProjectile(
                    { x: playerPos.x, y: playerPos.y },
                    dir,
                    baseStats,
                    time
                );
                projectiles.push(p);
            }
        });

        return projectiles;
    }
};

registerWeaponBehavior(FlakBehavior);
export { FlakBehavior };
