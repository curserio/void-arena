/**
 * Pulsing Effect
 * 
 * Logic for Energy Orb pulsing damage
 */

import { IProjectileEffect } from './IProjectileEffect';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { CollisionContext, applyDamageToEnemy } from '../../collision/CollisionContext';
import { IEnemy } from '../../../../types/enemies';
import { EntityType } from '../../../../types';

export class PulsingEffect implements IProjectileEffect {
    update(p: BaseProjectile, ctx: CollisionContext): void {
        const { time, grid, callbacks, playerStats } = ctx;

        // Ensure props initialized (or rely on them being there)
        const radius = p.pulseRadius || 100;
        const interval = p.pulseInterval || 500;
        let lastTime = p.lastPulseTime || 0;

        if (time - lastTime >= interval) {
            p.lastPulseTime = time; // Update state on projectile

            // Query nearby
            const candidates = grid.retrieve(p.pos);
            let hitCount = 0;

            for (const e of candidates) {
                if (!e.isAlive || e.health <= 0) continue;

                const distSq = (e.pos.x - p.pos.x) ** 2 + (e.pos.y - p.pos.y) ** 2;
                if (distSq < radius * radius) {
                    // Apply Pulse Damage
                    // Pulse deals 50% dmg typically
                    let dmg = playerStats.damage * 0.5;
                    applyDamageToEnemy(e, dmg, false, ctx, '#c084fc');

                    // Visual
                    callbacks.spawnExplosion(e.pos, 10, '#c084fc');
                    hitCount++;
                }
            }

            if (hitCount > 0) {
                callbacks.spawnExplosion(p.pos, radius, '#c084fc');
            }
        }
    }

    onHit(p: BaseProjectile, target: IEnemy, ctx: CollisionContext): void {
        // Direct hit behavior for Orb
        // Deals Double Damage on impact/crash
        const { playerStats } = ctx;
        const isCrit = Math.random() < playerStats.critChance;
        let damage = playerStats.damage * 2;
        if (isCrit) damage *= playerStats.critMultiplier;

        applyDamageToEnemy(target, damage, isCrit, ctx, '#c084fc');
    }
}
