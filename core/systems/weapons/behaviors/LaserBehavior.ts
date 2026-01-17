/**
 * Laser Weapon Behavior
 * 
 * Charging beam weapon with piercing capability.
 */

import { WeaponType, EntityType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponEffect } from '../../../../types/projectiles';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const LaserBehavior: WeaponBehavior = {
    weaponType: WeaponType.LASER,

    canFire(ctx: FireContext, existingProjectiles: BaseProjectile[]): boolean {
        // Prevent stacking lasers
        return !existingProjectiles.some(p =>
            p.type === EntityType.PLAYER_BULLET && p.weaponEffect === WeaponEffect.LASER
        );
    },

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isPierce } = ctx;

        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed,
            color: '#a855f7',
            pierce: 999,  // Laser always pierces
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 5000,
            radius: 20
        };

        const p = ProjectileFactory.createPlayerProjectile(
            { x: playerPos.x, y: playerPos.y },
            { x: 0, y: 0 },  // Direction managed by update
            baseStats,
            time,
            'player',
            WeaponEffect.LASER
        );

        // Set laser-specific properties
        p.angle = fireAngle;
        p.isCharging = true;
        p.chargeProgress = 0;

        return [p];
    }
};

registerWeaponBehavior(LaserBehavior);
export { LaserBehavior };
