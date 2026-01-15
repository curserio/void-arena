/**
 * Destroyer Boss
 * Heavy boss with twin plasma, homing missiles, and Kamikaze spawning
 */

import { BaseBoss } from './BaseBoss';
import { Vector2D, UpdateContext, EnemyUpdateResult, IProjectileSpawn } from '../../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition, } from '../../../../types/enemies';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';

export class Destroyer extends BaseBoss {
    readonly enemyType = EnemyType.BOSS_DESTROYER;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;
    private readonly desiredDist: number = 600;

    constructor(
        id: string,
        pos: Vector2D,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        initialTime: number,
        damageMult: number
    ) {
        const definition = getEnemyDefinition(EnemyType.BOSS_DESTROYER);
        super(id, pos, definition, finalHealth, finalRadius, shield, color, level, damageMult);

        this.definition = definition;
        this.baseSpeed = definition.baseSpeed;

        // Initialize cooldowns
        this.lastShotTime = initialTime + 2000;
        this.lastMissileTime = initialTime + 5000;
        this.lastSpawnTime = initialTime + 8000;
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime } = context;

        // Update phase based on health
        this.updatePhase();

        const speedMult = this.getSpeedMultiplier(time);
        const speed = this.baseSpeed * speedMult;

        const dx = playerPos.x - this.pos.x;
        const dy = playerPos.y - this.pos.y;
        const distToPlayer = Math.hypot(dx, dy);

        // Movement: Maintain range ~600
        let moveX = 0;
        let moveY = 0;

        if (distToPlayer > this.desiredDist + 100) {
            moveX = (dx / distToPlayer) * speed;
            moveY = (dy / distToPlayer) * speed;
        } else if (distToPlayer < this.desiredDist - 100) {
            moveX = -(dx / distToPlayer) * speed * 0.5;
            moveY = -(dy / distToPlayer) * speed * 0.5;
        } else {
            // Orbit slowly when in sweet spot
            moveX = -(dy / distToPlayer) * speed * 0.5;
            moveY = (dx / distToPlayer) * speed * 0.5;
        }

        this.vel.x = moveX;
        this.vel.y = moveY;

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Rotation towards player (slow)
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.angle += angleDiff * 1.5 * dt;

        // Weapon 1: Twin Plasma (Rapid)
        if (time - this.lastShotTime > 1200) {
            this.lastShotTime = time;

            const aim = this.angle;
            const offset = 25;
            const plasmaColor = this.definition.projectileColor ?? '#f43f5e';
            const plasmaRadius = this.definition.projectileRadius ?? 12;
            const plasmaSpeed = this.definition.projectileSpeed ?? 480;
            const plasmaDamage = (this.definition.attacks?.projectile ?? 15) * this.damageMult;

            // Left cannon
            result.bulletsToSpawn.push({
                pos: {
                    x: this.pos.x + Math.cos(aim + Math.PI / 2) * offset,
                    y: this.pos.y + Math.sin(aim + Math.PI / 2) * offset
                },
                vel: { x: Math.cos(aim) * plasmaSpeed, y: Math.sin(aim) * plasmaSpeed },
                radius: plasmaRadius,
                color: plasmaColor,
                damage: plasmaDamage,
                isElite: true,
                level: this.level,
            });

            // Right cannon
            result.bulletsToSpawn.push({
                pos: {
                    x: this.pos.x + Math.cos(aim - Math.PI / 2) * offset,
                    y: this.pos.y + Math.sin(aim - Math.PI / 2) * offset
                },
                vel: { x: Math.cos(aim) * plasmaSpeed, y: Math.sin(aim) * plasmaSpeed },
                radius: plasmaRadius,
                color: plasmaColor,
                damage: plasmaDamage,
                isElite: true,
                level: this.level,
            });
        }

        // Weapon 2: Homing Missile Salvo
        if (time - this.lastMissileTime > 4000) {
            this.lastMissileTime = time;

            const salvoCount = 4 + Math.floor(Math.random() * 3);
            const missileDamage = (this.definition.attacks?.missile ?? 25) * this.damageMult;

            for (let i = 0; i < salvoCount; i++) {
                const spread = (Math.random() - 0.5) * 1.5;
                const launchAngle = this.angle + spread;

                result.bulletsToSpawn.push({
                    pos: { x: this.pos.x, y: this.pos.y },
                    vel: { x: Math.cos(launchAngle) * 200, y: Math.sin(launchAngle) * 200 },
                    radius: 10,
                    color: '#f97316',
                    damage: missileDamage,
                    isHoming: true,
                    turnRate: 0.6,
                    maxDuration: 4.0,
                    isElite: true,
                    level: this.level,
                });
            }
        }

        // Ability: Spawn Kamikaze Drones
        if (time - this.lastSpawnTime > 8000) {
            this.lastSpawnTime = time;

            const droneCount = 2 + Math.floor(Math.random() * 3);

            for (let i = 0; i < droneCount; i++) {
                const ejectAngle = this.angle + Math.PI + (Math.random() - 0.5);

                result.enemiesToSpawn.push({
                    type: EnemyType.KAMIKAZE,
                    pos: {
                        x: this.pos.x + (Math.random() - 0.5) * 50,
                        y: this.pos.y + (Math.random() - 0.5) * 50
                    },
                    vel: {
                        x: Math.cos(ejectAngle) * 300,
                        y: Math.sin(ejectAngle) * 300,
                    },
                    difficultyMult: Math.max(0.5, this.level * 0.2),
                });
            }
        }

        return result;
    }
}
