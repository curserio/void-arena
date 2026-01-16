/**
 * Dreadnought Boss
 * Standard boss with charged beam attack
 * 
 * Uses: ChargedBeamPhase
 */

import { BaseBoss } from './BaseBoss';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../../types/enemies';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';
import { AIContext } from '../../../systems/ai/AIContext';
import { IBossPhase, ChargedBeamPhase } from '../../../systems/ai/phases';

export class Dreadnought extends BaseBoss {
    readonly enemyType = EnemyType.BOSS_DREADNOUGHT;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;

    // Boss phases
    private readonly attackPhases: IBossPhase[];

    constructor(
        id: string,
        pos: Vector2D,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        initialTime: number,
        damageMult: number,
        tierEquiv: EnemyTier = EnemyTier.NORMAL
    ) {
        const definition = getEnemyDefinition(EnemyType.BOSS_DREADNOUGHT);
        super(id, pos, definition, finalHealth, finalRadius, shield, color, level, damageMult, tierEquiv);

        this.definition = definition;
        this.baseSpeed = definition.baseSpeed;

        // Initialize attack phases
        this.attackPhases = [
            new ChargedBeamPhase({
                cooldown: definition.attackCooldown,
                chargeSpeed: 0.4,
                fireSpeed: 0.25,
            }),
        ];

        // Initialize cooldowns
        this.lastShotTime = initialTime + 2000;
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

        // Movement: Chase until 400 range, then slow down
        if (distToPlayer > 400 && !this.isFiring) {
            this.vel.x = (dx / distToPlayer) * speed;
            this.vel.y = (dy / distToPlayer) * speed;
        } else {
            this.vel.x *= 0.95;
            this.vel.y *= 0.95;
        }

        // Apply velocity
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;

        // Rotation towards player
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const turnRate = 0.3;
        const maxTurn = turnRate * dt;
        if (Math.abs(angleDiff) > maxTurn) {
            this.angle += Math.sign(angleDiff) * maxTurn;
        } else {
            this.angle += angleDiff;
        }

        // Execute attack phases
        const aiCtx: AIContext = { enemy: this, playerPos, dt, time, gameTime };
        for (const phase of this.attackPhases) {
            if (phase.shouldExecute(aiCtx, this)) {
                const phaseResult = phase.execute(aiCtx, this);
                result.bulletsToSpawn.push(...phaseResult.bulletsToSpawn);
                result.enemiesToSpawn.push(...phaseResult.enemiesToSpawn);
            }
        }

        return result;
    }
}
