/**
 * Asteroid
 * Passive obstacle that drifts and bounces off world boundaries
 */

import { BaseEnemy } from './BaseEnemy';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../types/entities';
import { EnemyType, EnemyTier, IEnemy, EnemyDefinition } from '../../../types/enemies';
import { getEnemyDefinition } from '../../../data/enemies/definitions';
import { WORLD_SIZE } from '../../../constants';

export class Asteroid extends BaseEnemy {
    readonly enemyType = EnemyType.ASTEROID;

    private readonly definition: EnemyDefinition;
    private readonly seed: number;

    constructor(
        id: string,
        pos: Vector2D,
        radius: number,
        finalHealth: number,
        color: string,
        initialVel: Vector2D,
        seed: number
    ) {
        const definition = getEnemyDefinition(EnemyType.ASTEROID);
        super(
            id,
            pos,
            definition,
            EnemyTier.NORMAL,
            finalHealth,
            radius,
            0, // No shield 
            color,
            1,  // Level 1
            1.0 // Asteroids don't scale damage
        );

        this.definition = definition;
        this.vel = { ...initialVel };
        this.seed = seed;
    }

    update(context: UpdateContext): EnemyUpdateResult {
        const result = this.emptyResult();
        const { dt } = context;

        // Bounce off world boundaries
        if (this.pos.x < this.radius || this.pos.x > WORLD_SIZE - this.radius) {
            this.vel.x *= -1;
        }
        if (this.pos.y < this.radius || this.pos.y > WORLD_SIZE - this.radius) {
            this.vel.y *= -1;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Asteroids have no attack
        return result;
    }
}
