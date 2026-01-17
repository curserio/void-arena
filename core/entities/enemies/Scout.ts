/**
 * Scout Enemy
 * Fast, weak enemy that orbits the player and shoots periodically
 * 
 * Uses: OrbitBehavior, ProjectileAttack
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { OrbitBehavior, ProjectileAttack, AIContext } from '../../systems/ai';

export class Scout extends BaseEnemy {
    readonly enemyType = EnemyType.SCOUT;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // AI Behaviors
    private readonly movement: OrbitBehavior;
    private readonly attack: ProjectileAttack;

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

        // Initialize behaviors
        this.movement = new OrbitBehavior({
            baseRadius: 320,
            radiusVariance: 100,
            orbitSpeed: 0.0003,
        });

        this.attack = new ProjectileAttack({
            cooldown: definition.attackCooldown,
            cooldownVariance: 500,
            range: 600,
            projectileSpeed: definition.projectileSpeed ?? 320,
            projectileRadius: definition.projectileRadius ?? 7,
            projectileColor: definition.projectileColor ?? '#f97316',
            baseDamage: definition.attacks?.projectile ?? 10,
            aimSpread: 0.25,
        });
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt, time, playerPos, gameTime } = context;

        // Build AI context
        const aiCtx: AIContext = {
            enemy: this,
            playerPos,
            dt,
            time,
            gameTime,
        };

        // Calculate speed using centralized helper
        const speed = this.calculateEffectiveSpeed(this.baseSpeed, time, gameTime);

        // Movement via behavior
        const direction = this.movement.calculateVelocity(aiCtx);
        this.vel.x = direction.x * speed;
        this.vel.y = direction.y * speed;

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Attack via behavior
        if (this.attack.shouldAttack(aiCtx)) {
            result.bulletsToSpawn.push(...this.attack.execute(aiCtx));
        }

        return result;
    }
}
