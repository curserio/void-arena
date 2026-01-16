/**
 * Homing Behavior
 * Handles target tracking and steering for missiles and swarm projectiles
 */

import { Entity, Vector2D } from '../../../../types';
import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { IProjectileBehavior, ProjectileBehaviorContext, ExplosionData } from './IProjectileBehavior';
import { ProjectileType } from '../../../../types/projectiles';

export class HomingBehavior implements IProjectileBehavior {
    update(projectile: BaseProjectile, ctx: ProjectileBehaviorContext): void {
        const { dt, playerPos, targets } = ctx;

        let target: Entity | undefined;

        // Find current target
        if (projectile.targetId) {
            if (projectile.type === 'ENEMY_BULLET') {
                // Enemy missiles always target player
                target = { id: 'player', pos: playerPos, health: 1 } as Entity;
            } else {
                // Player missiles look for target in enemies list
                target = targets.find(t => t.id === projectile.targetId && t.health > 0);
            }
        }

        // Retargeting for player missiles that lost their target
        if (!target && projectile.type === 'PLAYER_BULLET') {
            let nearest: Entity | null = null;
            let minDist = 600;

            for (const t of targets) {
                const d = Math.hypot(t.pos.x - projectile.pos.x, t.pos.y - projectile.pos.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = t;
                }
            }

            if (nearest) {
                projectile.targetId = nearest.id;
                target = nearest;
            }
        }

        // Steer towards target
        if (target) {
            const dx = target.pos.x - projectile.pos.x;
            const dy = target.pos.y - projectile.pos.y;
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
    }

    onDeath(projectile: BaseProjectile): ExplosionData | null {
        // Homing missiles explode on death (timeout)
        // Check if died naturally (elapsed > duration) vs hit something
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
