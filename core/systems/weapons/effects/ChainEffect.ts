/**
 * Chain Effect
 * 
 * Logic for Arc Caster chain lightning
 */

import { IProjectileEffect } from './IProjectileEffect';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { CollisionContext, applyDamageToEnemy } from '../../collision/CollisionContext';
import { IEnemy } from '../../../../types/enemies';

export class ChainEffect implements IProjectileEffect {
    update(p: BaseProjectile, ctx: CollisionContext): void {
        // No update logic for chain, it's instantaneous on hit
    }

    onHit(p: BaseProjectile, target: IEnemy, ctx: CollisionContext): void {
        const { enemies, callbacks, playerStats } = ctx;

        // Initial Hit Logic
        const isCrit = Math.random() < playerStats.critChance;
        let damage = playerStats.damage;
        if (isCrit) damage *= playerStats.critMultiplier;

        applyDamageToEnemy(target, damage, isCrit, ctx, '#67e8f9');
        callbacks.spawnExplosion(p.pos, 20, '#67e8f9');

        // Chain Logic
        const chainCount = p.chainCount || 0;
        const range = p.chainRange || 200;

        if (chainCount > 0) {
            const hitIds = new Set<string>();
            hitIds.add(target.id);

            let lastPos = target.pos;
            let possibleTargets = enemies.filter(e => e.isAlive && !hitIds.has(e.id) && e.health > 0);

            // Perform jumps
            for (let i = 0; i < chainCount; i++) {
                let nearest: IEnemy | null = null;
                let minDistSq = range * range;

                for (const candidate of possibleTargets) {
                    const dSq = (candidate.pos.x - lastPos.x) ** 2 + (candidate.pos.y - lastPos.y) ** 2;
                    if (dSq < minDistSq) {
                        minDistSq = dSq;
                        nearest = candidate;
                    }
                }

                if (nearest) {
                    // Visual Effect: Lightning Bolt from current pos to next target
                    if (ctx.callbacks.spawnLightning) {
                        ctx.callbacks.spawnLightning(lastPos, nearest.pos, p.color || '#67e8f9');
                    }

                    // Jump and Damage
                    const jumpDmg = damage * 0.8; // Decay
                    applyDamageToEnemy(nearest, jumpDmg, isCrit, ctx, '#67e8f9');
                    callbacks.spawnExplosion(nearest.pos, 15, '#67e8f9');

                    hitIds.add(nearest.id);
                    possibleTargets = possibleTargets.filter(e => e.id !== nearest!.id);
                    lastPos = nearest.pos;
                } else {
                    break;
                }
            }
        }

        // Projectile consumed
        p.isAlive = false;
        p.health = 0;
    }
}
