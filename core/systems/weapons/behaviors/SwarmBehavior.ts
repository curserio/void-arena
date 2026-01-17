/**
 * Swarm Launcher Weapon Behavior
 * 
 * Burst-fire homing missiles that fire in rapid succession.
 * Uses burst mode - queues multiple shots instead of firing all at once.
 */

import { WeaponType } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { ProjectileFactory } from '../../../factories/ProjectileFactory';
import { WeaponEffect } from '../../../../types/projectiles';
import { WeaponBehavior, FireContext, registerWeaponBehavior } from '../WeaponBehavior';

const SwarmBehavior: WeaponBehavior = {
    weaponType: WeaponType.SWARM_LAUNCHER,
    usesBurstMode: true,  // Signal that this weapon uses burst queuing

    fire(ctx: FireContext): BaseProjectile[] {
        const { playerPos, fireAngle, stats, time, isPierce } = ctx;

        // Create a single homing rocket
        const baseStats = {
            damage: stats.damage,
            speed: stats.bulletSpeed * 0.7,  // Slower initial speed
            color: '#f472b6',
            pierce: isPierce ? 99 : 1,
            critChance: stats.critChance,
            critMult: stats.critMultiplier,
            duration: 4000,
            radius: 8
        };

        // Add slight angle spread for visual variety
        const spreadRange = 0.3;
        const randomSpread = (Math.random() - 0.5) * spreadRange;
        const finalAngle = fireAngle + randomSpread;

        const dir = { x: Math.cos(finalAngle), y: Math.sin(finalAngle) };

        const p = ProjectileFactory.createPlayerProjectile(
            { x: playerPos.x, y: playerPos.y },
            dir,
            baseStats,
            time,
            'player',
            WeaponEffect.HOMING
        );

        // Set homing-specific properties
        p.turnRate = stats.swarmAgility || 1.5;

        return [p];
    }
};

registerWeaponBehavior(SwarmBehavior);
export { SwarmBehavior };
