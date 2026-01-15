/**
 * Scout Enemy
 * Fast, weak enemy that orbits the player and shoots periodically
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';

export class Scout extends BaseEnemy {
    readonly enemyType = EnemyType.SCOUT;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    constructor(
        id: string,
        pos: Vector2D,
        tier: EnemyTier,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        baseSpeed: number,
        damageMult: number
    ) {
        const definition = getEnemyDefinition(EnemyType.SCOUT);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level, damageMult);
        this.definition = definition;
        this.baseSpeed = baseSpeed;
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime } = context;

        const speedMult = this.getSpeedMultiplier(time);
        const speedScale = 1 + (gameTime / 600) * 0.5; // Gradual speed increase
        let speed = this.baseSpeed * speedScale * speedMult;

        if (this.isMiniboss) speed *= 0.65;
        if (this.isElite) speed *= 0.8;

        // Calculate movement - orbit around player
        const orbitRadius = 320 + this.aiSeed * 100;
        const idealAngle = this.aiSeed * Math.PI * 2 + (time * 0.0003);

        const targetX = playerPos.x + Math.cos(idealAngle) * orbitRadius;
        const targetY = playerPos.y + Math.sin(idealAngle) * orbitRadius;

        const toTargetX = targetX - this.pos.x;
        const toTargetY = targetY - this.pos.y;
        const distToTarget = Math.hypot(toTargetX, toTargetY);

        // Separation from other enemies would need enemy list - handled externally
        this.vel.x = (toTargetX / distToTarget) * speed;
        this.vel.y = (toTargetY / distToTarget) * speed;

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Attack logic
        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        if (distToPlayer < 600) {
            const cooldown = this.definition.attackCooldown + this.aiSeed * 500;

            if (time - this.lastShotTime > cooldown) {
                this.lastShotTime = time;

                let bulletRadius = this.definition.projectileRadius ?? 7;
                let bulletColor = this.definition.projectileColor ?? '#f97316';
                let bulletSpeed = this.definition.projectileSpeed ?? 320;

                if (this.isMiniboss) {
                    bulletRadius = 14;
                    bulletColor = '#ef4444';
                    bulletSpeed = 400;
                } else if (this.isElite) {
                    bulletRadius = 9;
                    bulletColor = '#d946ef';
                    bulletSpeed = 350;
                }

                const aimAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.25;
                const baseDamage = this.definition.attacks?.projectile ?? 10;

                result.bulletsToSpawn.push(this.createProjectile(
                    aimAngle,
                    bulletSpeed,
                    bulletRadius,
                    bulletColor,
                    baseDamage
                ));
            }
        }

        return result;
    }
}
