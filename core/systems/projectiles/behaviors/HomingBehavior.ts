/**
 * Homing Behavior
 * Handles target tracking and steering for missiles and swarm projectiles
 * 
 * Smart targeting:
 * - Prefers targets in forward cone
 * - Retargets if current target becomes too hard to hit (behind missile)
 * - Considers distance + angle for target scoring
 */

import { Entity, Vector2D } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { IProjectileBehavior, ProjectileBehaviorContext, ExplosionData } from './IProjectileBehavior';
import { ProjectileType } from '../../../../types/projectiles';

// Constants for targeting
const RETARGET_ANGLE_THRESHOLD = Math.PI * 0.7; // 126 degrees - if target is more than this behind, retarget
const FORWARD_CONE_BONUS = 1.5; // Targets in front get 1.5x priority
const MAX_TARGETING_RANGE = 800;
const MIN_RETARGET_INTERVAL = 200; // ms - don't retarget too frequently

export class HomingBehavior implements IProjectileBehavior {
    update(projectile: BaseProjectile, ctx: ProjectileBehaviorContext): void {
        const { dt, playerPos, targets, time } = ctx;

        let target: Entity | undefined;

        // Enemy missiles always target player
        if (projectile.type === 'ENEMY_BULLET') {
            target = { id: 'player', pos: playerPos, health: 1 } as Entity;
        } else {
            // Player missiles - smart targeting
            target = this.findBestTarget(projectile, targets, time);
        }

        // Steer towards target
        if (target) {
            this.steerTowards(projectile, target.pos, dt);
        }
    }

    /**
     * Find the best target considering direction and distance
     */
    private findBestTarget(projectile: BaseProjectile, targets: Entity[], time: number): Entity | undefined {
        // Check current target first
        let currentTarget: Entity | undefined;
        if (projectile.targetId) {
            currentTarget = targets.find(t => t.id === projectile.targetId && t.health > 0);
        }

        // Calculate angle to current target (if exists)
        if (currentTarget) {
            const angleToTarget = this.getAngleDiff(projectile, currentTarget.pos);

            // If target is reasonably in front, keep it
            if (Math.abs(angleToTarget) < RETARGET_ANGLE_THRESHOLD) {
                return currentTarget;
            }

            // Target is too far behind - consider retargeting
            // But only if we haven't retargeted recently
            const lastRetarget = (projectile as any).__lastRetarget || 0;
            if (time - lastRetarget < MIN_RETARGET_INTERVAL) {
                return currentTarget; // Keep current, wait for cooldown
            }
        }

        // Find best new target
        let bestTarget: Entity | undefined;
        let bestScore = -Infinity;

        const missileAngle = Math.atan2(projectile.vel.y, projectile.vel.x);

        for (const t of targets) {
            if (t.health <= 0) continue;

            const dx = t.pos.x - projectile.pos.x;
            const dy = t.pos.y - projectile.pos.y;
            const dist = Math.hypot(dx, dy);

            if (dist > MAX_TARGETING_RANGE) continue;

            // Calculate angle difference
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - missileAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // Skip targets that are too far behind
            if (Math.abs(angleDiff) > Math.PI * 0.85) continue; // 153 degrees

            // Score: closer is better, forward is better
            let score = (MAX_TARGETING_RANGE - dist) / MAX_TARGETING_RANGE; // 0-1 distance score

            // Bonus for targets in front (within 60 degree cone)
            if (Math.abs(angleDiff) < Math.PI / 3) {
                score *= FORWARD_CONE_BONUS;
            }

            // Penalty for targets behind (90-153 degrees)
            if (Math.abs(angleDiff) > Math.PI / 2) {
                score *= 0.5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = t;
            }
        }

        // Update target if found a better one
        if (bestTarget && bestTarget.id !== projectile.targetId) {
            projectile.targetId = bestTarget.id;
            (projectile as any).__lastRetarget = time;
        }

        return bestTarget || currentTarget;
    }

    /**
     * Get angle difference between missile direction and target
     */
    private getAngleDiff(projectile: BaseProjectile, targetPos: Vector2D): number {
        const dx = targetPos.x - projectile.pos.x;
        const dy = targetPos.y - projectile.pos.y;
        const targetAngle = Math.atan2(dy, dx);
        const missileAngle = Math.atan2(projectile.vel.y, projectile.vel.x);

        let diff = targetAngle - missileAngle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return diff;
    }

    /**
     * Steer missile towards target position
     */
    private steerTowards(projectile: BaseProjectile, targetPos: Vector2D, dt: number): void {
        const dx = targetPos.x - projectile.pos.x;
        const dy = targetPos.y - projectile.pos.y;
        const targetAngle = Math.atan2(dy, dx);

        let currentAngle = Math.atan2(projectile.vel.y, projectile.vel.x);
        let diff = targetAngle - currentAngle;

        // Normalize to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        const turnStep = (projectile.turnRate || 1.5) * dt;

        if (Math.abs(diff) < turnStep) {
            currentAngle = targetAngle;
        } else {
            currentAngle += Math.sign(diff) * turnStep;
        }

        // Update velocity direction (maintain speed)
        const speed = Math.hypot(projectile.vel.x, projectile.vel.y);
        projectile.vel.x = Math.cos(currentAngle) * speed;
        projectile.vel.y = Math.sin(currentAngle) * speed;
    }

    onDeath(projectile: BaseProjectile): ExplosionData | null {
        // Homing missiles explode on death (timeout)
        if (projectile.elapsedTime > projectile.duration) {
            return {
                pos: { ...projectile.pos },
                radius: projectile.type === 'PLAYER_BULLET' ? 150 : 80,
                color: projectile.color,
            };
        }
        return null;
    }
}

// Singleton instance
export const homingBehavior = new HomingBehavior();
