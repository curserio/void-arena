/**
 * Pickup Handler
 * Handles XP gems, credits, and power-up collection
 */

import { EntityType } from '../../../../types';
import { ICollisionHandler } from './ICollisionHandler';
import { CollisionContext } from '../CollisionContext';
import { POWER_UPS } from '../../../systems/PowerUpSystem';

export class PickupHandler implements ICollisionHandler {
    private readonly COLLECTION_RANGE = 40;

    handle(ctx: CollisionContext): void {
        const { pickups, playerPos, playerStats, callbacks, time } = ctx;

        let xpGained = 0;
        let creditsGained = 0;

        for (const p of pickups) {
            const dist = Math.hypot(p.pos.x - playerPos.x, p.pos.y - playerPos.y);

            if (dist < this.COLLECTION_RANGE) {
                if (p.type === EntityType.XP_GEM) {
                    xpGained += (p.value || 1);
                } else if (p.type === EntityType.CREDIT) {
                    creditsGained += Math.floor((p.value || 0) * playerStats.creditMultiplier);
                } else if (p.type === EntityType.POWERUP && p.powerUpId) {
                    const config = POWER_UPS[p.powerUpId];
                    if (config) {
                        callbacks.setStats(prev => config.onPickup(prev, time));
                    }
                }
                p.health = 0; // Mark for removal
            }
        }

        // Apply credits
        if (creditsGained > 0) {
            callbacks.setStats(prev => ({ ...prev, credits: prev.credits + creditsGained }));
            callbacks.onCreditCollected(creditsGained);
        }

        // Apply XP and handle leveling
        if (xpGained > 0) {
            callbacks.setStats(prev => {
                let newXp = prev.xp + xpGained;
                let newLevel = prev.level;
                let newXpToNext = prev.xpToNextLevel;
                let actualLevelsGained = 0;

                while (newXp >= newXpToNext) {
                    newXp -= newXpToNext;
                    newLevel++;
                    newXpToNext = Math.floor(newXpToNext * 1.2);
                    actualLevelsGained++;
                }

                return {
                    ...prev,
                    xp: newXp,
                    level: newLevel,
                    xpToNextLevel: newXpToNext,
                    pendingLevelUps: prev.pendingLevelUps + actualLevelsGained
                };
            });
        }
    }
}

export const pickupHandler = new PickupHandler();
