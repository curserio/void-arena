/**
 * Destroyer Boss
 * Heavy boss with twin plasma, homing missiles, and Kamikaze spawning
 * 
 * Uses: TwinPlasmaPhase, MissileSalvoPhase, DroneSpawnPhase
 */

import { BaseBoss } from './BaseBoss';
import { Vector2D, UpdateContext, EnemyUpdateResult } from '../../../../types/entities';
import { EnemyType, EnemyTier, EnemyDefinition } from '../../../../types/enemies';
import { getEnemyDefinition } from '../../../../data/enemies/definitions';
import { AIContext } from '../../../systems/ai/AIContext';
import {
    IBossPhase,
    TwinPlasmaPhase,
    MissileSalvoPhase,
    DroneSpawnPhase
} from '../../../systems/ai/phases';

export class Destroyer extends BaseBoss {
    readonly enemyType = EnemyType.BOSS_DESTROYER;

    private readonly definition: EnemyDefinition;
    private readonly baseSpeed: number;
    private readonly desiredDist: number = 600;

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
        const definition = getEnemyDefinition(EnemyType.BOSS_DESTROYER);
        super(id, pos, definition, finalHealth, finalRadius, shield, color, level, damageMult, tierEquiv);

        this.definition = definition;
        this.baseSpeed = definition.baseSpeed;

        // Initialize attack phases
        this.attackPhases = [
            new TwinPlasmaPhase({
                cooldown: 1200,
                projectileRadius: definition.projectileRadius ?? 12,
                projectileSpeed: definition.projectileSpeed ?? 480,
                baseDamage: definition.attacks?.projectile ?? 15,
            }),
            new MissileSalvoPhase({
                cooldown: 4000,
                baseDamage: definition.attacks?.missile ?? 25,
                turnRate: 1.2,
            }),
            new DroneSpawnPhase({
                cooldown: 8000,
                droneType: EnemyType.KAMIKAZE,
            }),
        ];

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
