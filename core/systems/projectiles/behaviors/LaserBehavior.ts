/**
 * Laser Behavior
 * Handles charge-fire state machine, position lock, and smooth aiming
 */

import { BaseProjectile } from '../../../entities/projectiles/BaseProjectile';
import { IProjectileBehavior, ProjectileBehaviorContext, ExplosionData } from './IProjectileBehavior';
import { TARGETING_RADIUS } from '../../../../constants';

export class LaserBehavior implements IProjectileBehavior {
    update(projectile: BaseProjectile, ctx: ProjectileBehaviorContext): void {
        const { dt, playerPos, targets, aimDir, autoAttack, playerStats } = ctx;

        // Lock laser position to player
        projectile.pos.x = playerPos.x;
        projectile.pos.y = playerPos.y;

        // Determine target angle
        let targetAngle = projectile.angle || 0;

        // Manual aim takes priority
        if (Math.abs(aimDir.x) > 0.1 || Math.abs(aimDir.y) > 0.1) {
            targetAngle = Math.atan2(aimDir.y, aimDir.x);
        } else if (targets.length > 0 && autoAttack) {
            // Auto-aim to nearest target
            let nearest = null;
            let minDist = TARGETING_RADIUS;

            for (const target of targets) {
                const d = Math.hypot(target.pos.x - playerPos.x, target.pos.y - playerPos.y);
                if (d < minDist) {
                    minDist = d;
                    nearest = target;
                }
            }

            if (nearest) {
                targetAngle = Math.atan2(nearest.pos.y - playerPos.y, nearest.pos.x - playerPos.x);
            }
        }

        // Smooth angle interpolation
        let currentAngle = projectile.angle || 0;
        let angleDiff = targetAngle - currentAngle;

        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Turn speed: faster when charging, slower when firing
        const turnSpeed = projectile.isFiring ? 3.0 : 8.0;
        const step = turnSpeed * dt;

        if (Math.abs(angleDiff) < step) {
            projectile.angle = targetAngle;
        } else {
            projectile.angle = currentAngle + Math.sign(angleDiff) * step;
        }

        // State machine: Charging → Firing
        if (projectile.isCharging) {
            projectile.chargeProgress = (projectile.chargeProgress || 0) + dt * 1.0;

            if (projectile.chargeProgress >= 1.0) {
                projectile.isCharging = false;
                projectile.isFiring = true;
                // Set duration to current elapsed + laser duration
                const laserDuration = playerStats?.laserDuration || 0.3;
                projectile.duration = projectile.elapsedTime + laserDuration * 1000;
            }
        }
        // When isFiring, BaseProjectile.update handles timeout via duration
    }

    onDeath(_projectile: BaseProjectile): ExplosionData | null {
        // Lasers don't explode
        return null;
    }
}

// Singleton instance
export const laserBehavior = new LaserBehavior();
