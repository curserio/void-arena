/**
 * Railgun Weapon Behavior
 * 
 * High-damage piercing rail shots with elongated visual.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const RailgunBehavior: WeaponBehavior = {
    weaponType: WeaponType.RAILGUN,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni } = ctx;
        const projectiles: BaseProjectile[] = [];

        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed,
            color: '#60a5fa',
            pierce: 999,  // Always infinite pierce
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 1500,
            radius: 6,
            weaponType: WeaponType.RAILGUN
        };

        const angles = isOmni ? [-0.3, 0, 0.3] : [0];

        angles.forEach(spreadAngle => {
            const currentAngle = fireAngle + spreadAngle;
            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

            const p = ProjectileFactory.createPlayerProjectile(
                { x: playerPos.x, y: playerPos.y },
                dir,
                baseStats,
                time
            );
            projectiles.push(p);
        });

        return projectiles;
    }
};

registerWeaponBehavior(RailgunBehavior);
export { RailgunBehavior };
