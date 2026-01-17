/**
 * Carrier Enemy
 * Slow, tanky spawner unit that periodically deploys Scout drones
 * 
 * Uses: KiteBehavior (maintains safe distance from player)
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult, IEnemySpawn } from '../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { KiteBehavior, AIContext } from '../../systems/ai';

// Spawn configuration
const SPAWN_COUNT = 3;              // Scouts per spawn wave
const SPAWN_SPREAD = Math.PI / 3;   // 60° spread for spawning
const MAX_SPAWN_WAVES = 9;          // Maximum spawn waves per carrier (27 scouts total)

export class Carrier extends BaseEnemy {
    readonly enemyType = EnemyType.CARRIER;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // AI Behaviors
    private readonly movement: KiteBehavior;

    // Spawning state
    public lastSpawnTime: number = 0;
    private readonly spawnCooldown: number;
    private spawnWavesRemaining: number = MAX_SPAWN_WAVES;

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
        const definition = getEnemyDefinition(EnemyType.CARRIER);
        super(id, pos, definition, tier, finalHealth, finalRadius, shield, color, level, damageMult);
        this.definition = definition;
        this.baseSpeed = baseSpeed;
        this.spawnCooldown = definition.attackCooldown; // 8000ms

        // Initialize behaviors - stay far from player
        this.movement = new KiteBehavior({
            optimalRange: 500,
            retreatSpeed: 1.0,
            strafeAmount: 0.4,
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

        // Calculate speed using centralized helper (slow scaling)
        const speed = this.calculateEffectiveSpeed(this.baseSpeed, time, gameTime, 0.15);

        // Movement via behavior
        const direction = this.movement.calculateVelocity(aiCtx);
        this.vel.x = direction.x * speed;
        this.vel.y = direction.y * speed;

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Spawn logic (limited waves)
        if (this.spawnWavesRemaining > 0 && time - this.lastSpawnTime > this.spawnCooldown) {
            this.lastSpawnTime = time;
            this.spawnWavesRemaining--;

            // Calculate angle to player for spawn direction
            const angleToPlayer = Math.atan2(
                playerPos.y - this.pos.y,
                playerPos.x - this.pos.x
            );

            // Spawn scouts in a spread pattern
            for (let i = 0; i < SPAWN_COUNT; i++) {
                const spawnAngle = angleToPlayer - SPAWN_SPREAD / 2 + (SPAWN_SPREAD * i / (SPAWN_COUNT - 1 || 1));
                const spawnDist = this.radius + 30;

                const spawn: IEnemySpawn = {
                    type: EnemyType.SCOUT,
                    pos: {
                        x: this.pos.x + Math.cos(spawnAngle) * spawnDist,
                        y: this.pos.y + Math.sin(spawnAngle) * spawnDist,
                    },
                    // Inherit tier from parent (elite carrier spawns elite scouts)
                    tier: this.tier === EnemyTier.MINIBOSS ? EnemyTier.ELITE : this.tier,
                    level: this.level,  // Inherit parent's level
                };

                result.enemiesToSpawn.push(spawn);
            }
        }

        return result;
    }
}
