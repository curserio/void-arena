/**
 * Plasma Weapon Behavior
 * 
 * Standard rapid-fire plasma bolts with multi-projectile support.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const PlasmaBehavior: WeaponBehavior = {
    weaponType: WeaponType.PLASMA,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni, isPierce } = ctx;
        const projectiles: BaseProjectile[] = [];

        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed,
            color: '#22d3ee',
            pierce: isPierce ? 99 : stats.pierceCount,
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 2000,
            radius: 8
        };

        const angles = isOmni ? [-0.3, 0, 0.3] : [0];

        angles.forEach(spreadAngle => {
            const currentAngle = fireAngle + spreadAngle;
            const spacing = 15;
            const startOffset = -(stats.bulletCount - 1) * spacing / 2;

            for (let i = 0; i < stats.bulletCount; i++) {
                const offset = startOffset + i * spacing;
                const px = playerPos.x + Math.cos(currentAngle + Math.PI / 2) * offset;
                const py = playerPos.y + Math.sin(currentAngle + Math.PI / 2) * offset;
                const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

                const p = ProjectileFactory.createPlayerProjectile(
                    { x: px, y: py },
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

registerWeaponBehavior(PlasmaBehavior);
export { PlasmaBehavior };
