/**
 * Missile Weapon Behavior
 * 
 * Explosive missiles with area damage.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponEffect } from '../../../../types/projectiles';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const MissileBehavior: WeaponBehavior = {
    weaponType: WeaponType.MISSILE,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni, isPierce } = ctx;
        const projectiles: BaseProjectile[] = [];

        const baseStats = {
            damage: stats.damage * 1.5,  // Missiles hit harder
            speed: stats.bulletSpeed,
            color: '#fb923c',
            pierce: isPierce ? 99 : stats.pierceCount,
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 2000,
            radius: 14
        };

        const angles = isOmni ? [-0.3, 0, 0.3] : [0];

        angles.forEach(spreadAngle => {
            const currentAngle = fireAngle + spreadAngle;
            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

            const p = ProjectileFactory.createPlayerProjectile(
                { x: playerPos.x, y: playerPos.y },
                dir,
                baseStats,
                time,
                'player',
                WeaponEffect.EXPLOSIVE
            );
            projectiles.push(p);
        });

        return projectiles;
    }
};

registerWeaponBehavior(MissileBehavior);
export { MissileBehavior };
