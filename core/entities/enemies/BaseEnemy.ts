/**
 * BaseEnemy
 * Abstract base class for all enemy types
 * Contains shared logic for damage, slow effects, and legacy compatibility
 */

import {
    Vector2D,
    UpdateContext,
    EnemyUpdateResult,
    DamageResult,
    IProjectileSpawn
} from '../../../types/entities';
import {
    EnemyType,
    EnemyTier,
    IEnemy,
    EnemyDefinition
} from '../../../types/enemies';
import { EntityType } from '../../../types';

export abstract class BaseEnemy implements IEnemy {
    // Identity
    readonly id: string;
    abstract readonly enemyType: EnemyType;
    readonly tier: EnemyTier;

    // Position & Physics
    pos: Vector2D;
    vel: Vector2D;
    radius: number;

    // Health
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;

    // State
    get isAlive(): boolean {
        return this.health > 0;
    }
    level: number;
    color: string;

    // Flags
    isElite: boolean;
    isLegendary: boolean;
    isMiniboss: boolean;
    isBoss: boolean;

    // Combat tracking
    lastHitTime: number = 0;
    lastShieldHitTime: number = 0;
    lastShotTime: number = 0;

    // Damage scaling
    readonly damageMult: number;

    // Slow effect
    slowUntil: number = 0;
    slowFactor: number = 0;

    // Shield aura protection (set by updateShieldedStatus)
    isShielded: boolean = false;

    // AI state
    aiPhase: number;
    aiSeed: number;

    // For subclass-specific state
    public isCharging: boolean = false;
    public isFiring: boolean = false;
    public chargeProgress: number = 0;
    public angle: number = 0;

    constructor(
        id: string,
        pos: Vector2D,
        definition: EnemyDefinition,
        tier: EnemyTier,
        finalHealth: number,
        finalRadius: number,
        shield: number,
        color: string,
        level: number,
        damageMult: number
    ) {
        this.id = id;
        this.pos = { ...pos };
        this.vel = { x: 0, y: 0 };
        this.tier = tier;

        this.radius = finalRadius;
        this.health = finalHealth;
        this.maxHealth = finalHealth;
        this.shield = shield;
        this.maxShield = shield;

        this.color = color;
        this.level = level;

        this.isElite = tier === EnemyTier.ELITE;
        this.isLegendary = tier === EnemyTier.LEGENDARY;
        this.isMiniboss = tier === EnemyTier.MINIBOSS;
        this.isBoss = definition.isBoss ?? false;

        this.aiPhase = Math.random() * Math.PI * 2;
        this.aiSeed = Math.random();
        this.damageMult = damageMult;
    }

    /**
     * Update enemy state - implemented by subclasses
     */
    abstract update(context: UpdateContext): EnemyUpdateResult;

    /**
     * Apply damage to this enemy
     * Applies 50% damage reduction if under Shielder aura
     */
    takeDamage(amount: number, time: number): DamageResult {
        // Apply shielder damage reduction (50%)
        const SHIELDER_DAMAGE_REDUCTION = 0.5;
        const effectiveDamage = this.isShielded ? amount * (1 - SHIELDER_DAMAGE_REDUCTION) : amount;

        let remaining = effectiveDamage;
        let shieldDamage = 0;
        let healthDamage = 0;

        // Apply to shield first
        if (this.shield > 0) {
            shieldDamage = Math.min(this.shield, remaining);
            this.shield -= shieldDamage;
            remaining -= shieldDamage;
            this.lastShieldHitTime = time;
        }

        // Apply remaining to health
        if (remaining > 0) {
            healthDamage = Math.min(this.health, remaining);
            this.health -= healthDamage;
            remaining -= healthDamage;
            this.lastHitTime = time;
        }

        const isKilled = this.health <= 0;


        return {
            actualDamage: shieldDamage + healthDamage,
            shieldDamage,
            healthDamage,
            isKilled,
            overkill: remaining,
        };
    }

    /**
     * Apply slow effect
     */
    applySlowEffect(factor: number, until: number): void {
        this.slowFactor = factor;
        this.slowUntil = until;
    }

    /**
     * Get current speed multiplier (affected by slow)
     */
    protected getSpeedMultiplier(time: number): number {
        if (this.slowUntil && this.slowUntil > time) {
            return 1.0 - this.slowFactor;
        }
        return 1.0;
    }

    /**
     * Calculate effective speed with game scaling and slow effects
     * Centralizes the speed formula: baseSpeed * timeScale * slowMult
     * 
     * @param baseSpeed - The enemy's base movement speed
     * @param time - Current game time (for slow effect)
     * @param gameTime - Total elapsed game time in seconds
     * @param scaleFactor - How much speed increases per 10 minutes (default 0.2 = +20%)
     */
    protected calculateEffectiveSpeed(
        baseSpeed: number,
        time: number,
        gameTime: number,
        scaleFactor: number = 0.2
    ): number {
        const slowMult = this.getSpeedMultiplier(time);
        const timeScale = 1 + (gameTime / 600) * scaleFactor;
        return baseSpeed * timeScale * slowMult;
    }

    /**
     * Calculate separation force from other enemies
     */
    protected calculateSeparation(enemies: BaseEnemy[]): Vector2D {
        let sepX = 0;
        let sepY = 0;

        for (const other of enemies) {
            if (other.id === this.id) continue;

            // Quick distance check
            if (Math.abs(other.pos.x - this.pos.x) > this.radius + other.radius + 50) continue;

            const dx = this.pos.x - other.pos.x;
            const dy = this.pos.y - other.pos.y;
            const d = Math.hypot(dx, dy);

            if (d < this.radius + other.radius + 10) {
                sepX += (dx / d) * 150;
                sepY += (dy / d) * 150;
            }
        }

        return { x: sepX, y: sepY };
    }

    /**
     * Create empty update result
     */
    protected emptyResult(): EnemyUpdateResult {
        return {
            bulletsToSpawn: [],
            enemiesToSpawn: [],
        };
    }

    /**
     * Helper to create projectile spawn data
     */
    protected createProjectile(
        angle: number,
        speed: number,
        radius: number,
        color: string,
        baseDamage: number,
        offsetX: number = 0,
        offsetY: number = 0
    ): IProjectileSpawn {
        return {
            pos: {
                x: this.pos.x + offsetX,
                y: this.pos.y + offsetY
            },
            vel: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            },
            radius,
            color,
            damage: baseDamage * this.damageMult,
            level: this.level,
            isElite: this.isElite,
            isLegendary: this.isLegendary
        };
    }

}

