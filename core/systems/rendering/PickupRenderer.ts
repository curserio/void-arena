/**
 * Pickup Renderer
 * Renders XP gems, credits, and power-ups
 */

import { Entity, EntityType } from '../../../types';
import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { POWERUP_CONFIGS } from '../../../data/powerups';

export class PickupRenderer implements IRenderer {
    readonly order = 10;

    render(rCtx: RenderContext): void {
        const { ctx, pickups, time } = rCtx;

        for (const e of pickups) {
            ctx.save();
            ctx.translate(e.pos.x, e.pos.y);

            if (e.type === EntityType.XP_GEM) {
                this.renderXpGem(ctx, time);
            } else if (e.type === EntityType.CREDIT) {
                this.renderCredit(ctx, time);
            } else if (e.type === EntityType.POWERUP && e.powerUpId) {
                this.renderPowerUp(ctx, e.powerUpId, time);
            }

            ctx.restore();
        }
    }

    private renderXpGem(ctx: CanvasRenderingContext2D, time: number): void {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        ctx.rotate(time / 150);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-9, -9, 18, 18);
        ctx.fillStyle = '#06b6d4';
        ctx.fillRect(-6, -6, 12, 12);
    }

    private renderCredit(ctx: CanvasRenderingContext2D, time: number): void {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.rotate(time / 100);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -14);
        ctx.lineTo(14, 0);
        ctx.lineTo(0, 14);
        ctx.lineTo(-14, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    private renderPowerUp(ctx: CanvasRenderingContext2D, powerUpId: string, time: number): void {
        const config = POWERUP_CONFIGS[powerUpId as keyof typeof POWERUP_CONFIGS];
        if (!config) return;

        const pulse = 1 + Math.sin(time * 0.01) * 0.15;
        ctx.rotate(time * 0.002);
        ctx.shadowBlur = 25;
        ctx.shadowColor = config.color;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.rect(-18 * pulse, -18 * pulse, 36 * pulse, 36 * pulse);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.label, 0, 0);
    }
}

export const pickupRenderer = new PickupRenderer();
