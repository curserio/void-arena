
import { BaseProjectile } from '../entities/projectiles/BaseProjectile';
import { ProjectileConfig, ProjectileType, WeaponEffect } from '../../types/projectiles';
import { Vector2D, EntityType, WeaponType } from '../../types';

export class ProjectileFactory {

    static createPlayerProjectile(
        pos: Vector2D,
        dir: Vector2D,
        stats: {
            damage: number,
            speed: number,
            color: string,
            pierce: number,
            critChance: number,
            critMult: number,
            duration: number,
            radius: number,
            weaponType?: WeaponType
        },
        time: number,
        ownerId: string = 'player',
        effect: WeaponEffect = WeaponEffect.NONE
    ): BaseProjectile {
        const config: ProjectileConfig = {
            pos,
            dir,
            speed: stats.speed,
            damage: stats.damage,
            type: EntityType.PLAYER_BULLET,
            ownerId,
            color: stats.color,
            radius: stats.radius,
            pierce: stats.pierce,
            critChance: stats.critChance,
            critMult: stats.critMult,
            duration: stats.duration,
            weaponEffect: effect,
            weaponType: stats.weaponType
        };

        return new BaseProjectile(config, time);
    }

    static createEnemyProjectile(
        pos: Vector2D,
        dir: Vector2D, // or calculate from target
        stats: {
            damage: number,
            speed: number,
            color: string,
            radius?: number,
            lifetime?: number,
            isHoming?: boolean,
            turnRate?: number,
            level?: number,
            isElite?: boolean,
            isMiniboss?: boolean,
            isLegendary?: boolean
        },
        time: number,
        targetId?: string
    ): BaseProjectile {
        const config: ProjectileConfig = {
            pos,
            dir,
            speed: stats.speed,
            damage: stats.damage,
            type: EntityType.ENEMY_BULLET,
            ownerId: 'enemy',
            color: stats.color,
            radius: stats.radius ?? 6,
            duration: stats.lifetime ?? 4000,
            weaponEffect: stats.isHoming ? WeaponEffect.HOMING : WeaponEffect.NONE,
            targetId,
            turnRate: stats.turnRate,
            level: stats.level,
            isElite: stats.isElite,
            isMiniboss: stats.isMiniboss,
            isLegendary: stats.isLegendary
        };

        return new BaseProjectile(config, time);
    }
}
