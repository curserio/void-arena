/**
 * Energy Orb Behavior
 * 
 * Fires a large, slow-moving orb that pulses damage to nearby enemies 
 * and explodes on impact.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponEffect } from '../../../../types/projectiles';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const EnergyOrbBehavior: WeaponBehavior = {
    weaponType: WeaponType.ENERGY_ORB,

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isOmni, isPierce } = ctx;
        const projectiles: BaseProjectile[] = [];

        // Base Stats
        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed || 150, // Slow
            color: '#c084fc', // Purple/Pink
            pierce: 999, // Infinite Pierce (User request)
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: stats.duration || 5000, // Use upgraded duration
            radius: 20, // Large physical body
            weaponType: WeaponType.ENERGY_ORB
        };

        const angles = isOmni ? [-2.5, 0, 2.5] : [0]; // Omni fires more orbs? Or just 1? Omni usually just adds rear shot or similar. Let's stick to standard behavior logic.

        angles.forEach(offset => {
            const currentAngle = fireAngle + offset;
            const dir = { x: Math.cos(currentAngle), y: Math.sin(currentAngle) };

            const p = ProjectileFactory.createPlayerProjectile(
                { x: playerPos.x, y: playerPos.y },
                dir,
                baseStats,
                time,
                'player',
                WeaponEffect.PULSING
            );

            // Special Properties for Pulsing
            p.pulseRadius = stats.areaSize || 150; // Use calculated generic area size

            p.pulseInterval = 300; // 300ms pulses
            p.lastPulseTime = time;

            projectiles.push(p);
        });

        return projectiles;
    }
};

registerWeaponBehavior(EnergyOrbBehavior);
export { EnergyOrbBehavior };
