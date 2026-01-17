/**
 * Arc Caster Behavior
 * 
 * Fires an electric bolt that chains between enemies.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponEffect } from '../../../../types/projectiles';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const ArcCasterBehavior: WeaponBehavior = {
    weaponType: WeaponType.ARC_CASTER,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni, isPierce } = ctx;
        const projectiles: BaseProjectile[] = [];

        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed || 1200, // Fast
            color: '#67e8f9', // Cyan
            pierce: 1, // Hits 1 then chains
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 1000,
            radius: 4,
            weaponType: WeaponType.ARC_CASTER
        };

        // Omni fires 3 bolts?
        const angles = isOmni ? [-0.5, 0, 0.5] : [0];

        angles.forEach(offset => {
            const currentAngle = fireAngle + offset;
            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

            const p = ProjectileFactory.createPlayerProjectile(
                { x: playerPos.x, y: playerPos.y },
                dir,
                baseStats,
                time,
                'player',
                WeaponEffect.CHAIN
            );

            // Chain Properties
            // We map 'pierceCount' stat to 'chainCount'
            p.chainCount = stats.pierceCount + 2; // Base 2 chains + upgrades
            p.chainCount = stats.pierceCount + 2; // Base 2 chains + upgrades
            p.chainRange = stats.chainRange; // Jump range from stats

            projectiles.push(p);
        });

        return projectiles;
    }
};

registerWeaponBehavior(ArcCasterBehavior);
export { ArcCasterBehavior };
