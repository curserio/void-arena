
import { IProjectile, ProjectileType, WeaponEffect, ProjectileConfig } from '../../../types/projectiles';
import { Vector2D, WeaponType, EntityType } from '../../../types';
import { projectileIdGen } from '../../utils/IdGenerator';

export class BaseProjectile implements IProjectile {
    id: string;
    pos: Vector2D;
    vel: Vector2D;
    radius: number;
    isAlive: boolean = true;
    health: number = 1; // Collision system checks health
    color: string;

    type: EntityType; // Aligned with IProjectile
    weaponEffect: WeaponEffect;
    // Compatibility with useCollision
    weaponType: WeaponType;
    ownerId: string;

    damage: number;
    pierceCount: number;
    isCritical: boolean;

    direction: Vector2D;
    speed: number;
    angle?: number;

    spawnTime: number;
    duration: number;
    elapsedTime: number = 0;

    // Laser
    isCharging?: boolean;
    chargeProgress?: number;
    isFiring?: boolean;

    // Homing
    // Homing
    targetId?: string;
    turnRate?: number;

    // Variant Info
    level?: number;
    isElite?: boolean;
    isMiniboss?: boolean;
    isLegendary?: boolean;

    constructor(config: ProjectileConfig, time: number) {
        this.id = projectileIdGen.next();
        this.pos = { ...config.pos };
        this.direction = { ...config.dir };
        this.speed = config.speed ?? 0;

        // Calculate velocity
        this.vel = {
            x: this.direction.x * this.speed,
            y: this.direction.y * this.speed
        };

        this.radius = config.radius ?? 5;
        this.color = config.color ?? '#fff';

        this.type = config.type;
        this.weaponEffect = config.weaponEffect ?? WeaponEffect.NONE;
        // Use explicit weaponType from config if provided, otherwise infer from effect
        if (config.weaponType) {
            this.weaponType = config.weaponType;
        } else {
            this.weaponType = WeaponType.PLASMA; // Default
            if (this.weaponEffect === WeaponEffect.LASER) this.weaponType = WeaponType.LASER;
            if (this.weaponEffect === WeaponEffect.EXPLOSIVE || this.weaponEffect === WeaponEffect.HOMING) this.weaponType = WeaponType.MISSILE;
            if (this.type === EntityType.ENEMY_BULLET) this.weaponType = WeaponType.PLASMA; // Enemy bullets default to plasma
        }

        this.ownerId = config.ownerId;

        this.damage = config.damage;
        this.pierceCount = config.pierce ?? 1;

        // Crit Logic
        const isCrit = Math.random() < (config.critChance ?? 0);
        if (isCrit) {
            this.damage *= (config.critMult ?? 2.0);
            this.isCritical = true;
            // Visual feedback for crit (maybe larger?)
            this.radius *= 1.5;
        } else {
            this.isCritical = false;
        }

        this.spawnTime = time;
        this.duration = config.duration ?? 2000; // Default 2s

        // Homing
        this.targetId = config.targetId;
        this.turnRate = config.turnRate;

        // Variant Info
        this.level = config.level;
        this.isElite = config.isElite;
        this.isMiniboss = config.isMiniboss;
        this.isLegendary = config.isLegendary;
    }

    update(dt: number, time: number): void {
        // Sync health from Collision system
        if (this.health <= 0) {
            this.isAlive = false;
        }

        this.elapsedTime += dt * 1000; // time in ms, dt is in seconds

        if (this.elapsedTime > this.duration) {
            this.isAlive = false;
            return;
        }



        // Homing Logic would go here in subclass or check
        if (this.weaponEffect === WeaponEffect.HOMING && this.targetId) {
            // Basic Homing placeholder - ideally this needs access to enemies list
            // For now, we assume external system handles homing steering 
            // OR we update velocity based on target pos passed in?
            // Since we don't have enemies list here, we just move linearly.
            // *Correction*: We can steer if we assume 'direction' is updated externally
            // or if we just move by velocity.
        }

        // Move (dt is in seconds, vel is in pixels/sec)
        this.pos.x += this.vel.x * dt;
        this.pos.y += this.vel.y * dt;
    }

    onHit(targetId: string): void {
        if (this.pierceCount > 0) {
            this.pierceCount--;
        }

        if (this.pierceCount <= 0) {
            this.isAlive = false;
            this.health = 0;
        }
    }
}
