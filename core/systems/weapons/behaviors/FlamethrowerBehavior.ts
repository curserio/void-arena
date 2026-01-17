/**
 * Flamethrower Behavior
 * 
 * Fires a rapid stream of short-range, infinite-pierce projectiles.
 * Simulates a cone of fire using random angle jitter.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponEffect } from '../../../../types/projectiles';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const FlamethrowerBehavior: WeaponBehavior = {
    weaponType: WeaponType.FLAMETHROWER,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni, isPierce } = ctx;
        const projectiles: BaseProjectile[] = [];

        // Flamethrower uses stats.areaSize for projectile size
        // stats.duration for flame lifetime (range)

        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed,
            color: '#fb923c', // Orange
            pierce: 999, // Infinite pierce (flames go through everything)
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: stats.duration || 600,
            radius: stats.areaSize || 40,
            weaponType: WeaponType.FLAMETHROWER
        };

        // If Omni, fire in 4 directions? Or just 360 spray?
        // Standard behavior: Cone in front.
        // Omni: 4 Cones? Let's do 4 directions for Omni for now.
        const baseAngles = isOmni ? [0, Math.PI / 2, Math.PI, -Math.PI / 2] : [0];

        baseAngles.forEach(baseOffset => {
            // Add random jitter for "Cone" effect
            // Jitter +/- 15 degrees (approx 0.26 rad)
            const jitter = (Math.random() - 0.5) * 0.5;
            const currentAngle = fireAngle + baseOffset + jitter;

            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

            const p = ProjectileFactory.createPlayerProjectile(
                { x: playerPos.x, y: playerPos.y },
                dir,
                baseStats,
                time,
                'player',
                WeaponEffect.NONE // Standard projectile logic, just custom visuals
            );

            // Variation in speed and duration for natural look
            p.speed *= 0.9 + Math.random() * 0.2;
            p.duration *= 0.8 + Math.random() * 0.4;

            projectiles.push(p);
        });

        return projectiles;
    }
};

registerWeaponBehavior(FlamethrowerBehavior);
export { FlamethrowerBehavior };
