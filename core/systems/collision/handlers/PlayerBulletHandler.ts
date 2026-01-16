/**
 * Player Bullet Handler
 * Handles player projectiles (Plasma, Laser, Missile) hitting enemies
 */

import { EntityType, WeaponType } from '../../../../types';
import { WeaponEffect } from '../../../../types/projectiles';
import { ICollisionHandler } from './ICollisionHandler';
import { CollisionContext, applyDamageToEnemy } from '../CollisionContext';
import { checkCircleCollision, distToSegmentSq } from '../CollisionHelpers';
import { LASER_LENGTH } from '../../../../constants';

export class PlayerBulletHandler implements ICollisionHandler {
    handle(ctx: CollisionContext): void {
        const { projectiles, enemies, playerPos, playerStats, grid, callbacks, persistentData, time } = ctx;

        for (const p of projectiles) {
            if (!p.isAlive) continue;
            if (p.type === EntityType.ENEMY_BULLET) continue;

            // Use weaponEffect for laser check, or fallback to any cast for legacy weaponType
            const weaponType = (p as any).weaponType;
            if (p.weaponEffect === WeaponEffect.LASER || weaponType === WeaponType.LASER) {
                this.handleLaser(p, ctx);
            } else {
                this.handleStandardProjectile(p, ctx);
            }
        }
    }

    private handleLaser(p: any, ctx: CollisionContext): void {
        const { enemies, playerPos, playerStats, callbacks, time } = ctx;

        if (!p.isFiring) return;

        const angle = p.angle || 0;
        const startX = playerPos.x;
        const startY = playerPos.y;
        const endX = startX + Math.cos(angle) * LASER_LENGTH;
        const endY = startY + Math.sin(angle) * LASER_LENGTH;

        for (const e of enemies) {
            if (!e.isAlive) continue;

            const distSq = distToSegmentSq(e.pos, { x: startX, y: startY }, { x: endX, y: endY });
            if (distSq < (e.radius + 20) ** 2) {
                if (time - (e.lastHitTime || 0) > 100) {
                    callbacks.onEnemyHit();

                    let dmg = playerStats.damage * 0.2;
                    const isCrit = Math.random() < playerStats.critChance;
                    if (isCrit) dmg *= playerStats.critMultiplier;

                    applyDamageToEnemy(e, dmg, isCrit, ctx);
                }
            }
        }
    }

    private handleStandardProjectile(p: any, ctx: CollisionContext): void {
        const { enemies, playerStats, grid, callbacks, persistentData, time } = ctx;

        const candidates = grid.retrieve(p.pos);

        for (const e of candidates) {
            if (e.health <= 0) continue;

            if (checkCircleCollision(p, e)) {
                callbacks.onEnemyHit();

                let damage = playerStats.damage;
                const isCrit = Math.random() < playerStats.critChance;
                if (isCrit) damage *= playerStats.critMultiplier;

                if (p.weaponType === WeaponType.MISSILE || p.weaponType === WeaponType.SWARM_LAUNCHER) {
                    this.handleMissileImpact(p, e, damage, isCrit, ctx);
                } else {
                    this.handlePlasmaImpact(p, e, damage, isCrit, ctx);
                }
                break; // One hit per projectile per frame
            }
        }
    }

    private handleMissileImpact(p: any, target: any, damage: number, isCrit: boolean, ctx: CollisionContext): void {
        const { enemies, playerStats, callbacks } = ctx;

        const isSwarm = p.weaponType === WeaponType.SWARM_LAUNCHER;
        const explosionRad = isSwarm ? 150 : playerStats.missileRadius;
        const boomColor = isSwarm ? '#e879f9' : '#fb923c';

        callbacks.spawnExplosion(p.pos, explosionRad, boomColor);

        // Splash damage
        for (const subE of enemies) {
            if (!subE.isAlive) continue;
            const dist = Math.hypot(subE.pos.x - p.pos.x, subE.pos.y - p.pos.y);
            if (dist < explosionRad) {
                let subDmg = damage;
                if (dist > explosionRad * 0.4) subDmg *= 0.7;
                applyDamageToEnemy(subE, subDmg, isCrit, ctx, boomColor);
            }
        }

        p.isAlive = false;
        p.health = 0;
    }

    private handlePlasmaImpact(p: any, e: any, damage: number, isCrit: boolean, ctx: CollisionContext): void {
        const { playerStats, persistentData, callbacks, time } = ctx;

        // Plasma chill effect
        if (playerStats.weaponType === WeaponType.PLASMA) {
            const chillLvl = persistentData.metaLevels['meta_plas_area'] || 0;
            if (chillLvl > 0) {
                e.slowUntil = time + 2000;
                e.slowFactor = 0.3;
            }
        }

        applyDamageToEnemy(e, damage, isCrit, ctx);
        callbacks.spawnExplosion(p.pos, 20, '#22d3ee');

        if (p.pierceCount !== undefined) {
            p.pierceCount -= 1;
            if (p.pierceCount <= 0) {
                p.isAlive = false;
                p.health = 0;
            }
        } else {
            p.isAlive = false;
            p.health = 0;
        }
    }
}

export const playerBulletHandler = new PlayerBulletHandler();
