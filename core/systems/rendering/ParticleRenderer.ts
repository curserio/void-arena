/**
 * Particle Renderer
 * Renders damage numbers, explosions, and spawn flashes
 * Includes viewport culling for performance
 */

import { Entity, EntityType } from '../../../types';
import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { isInViewport } from '../../utils/renderUtils';

export class ParticleRenderer implements IRenderer {
    readonly order = 40;

    render(rCtx: RenderContext): void {
        const { ctx, particles, cameraPos, screenWidth, screenHeight, zoom } = rCtx;

        for (const e of particles) {
            // Skip offscreen particles
            if (!isInViewport(e.pos, cameraPos.x, cameraPos.y, screenWidth, screenHeight, 250, zoom)) {
                continue;
            }

            ctx.save();
            ctx.translate(e.pos.x, e.pos.y);

            if (e.type === EntityType.DAMAGE_NUMBER) {
                this.renderDamageNumber(ctx, e);
            } else if (e.type === EntityType.EXPLOSION) {
                this.renderExplosion(ctx, e);
            } else if (e.type === EntityType.SPAWN_FLASH) {
                this.renderSpawnFlash(ctx, e);
            }

            ctx.restore();
        }
    }

    private renderDamageNumber(ctx: CanvasRenderingContext2D, e: Entity): void {
        const prog = (e.duration || 0) / (e.maxDuration || 0.8);
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(prog, 2));
        ctx.scale(1 + (1 - prog) * 0.5, 1 + (1 - prog) * 0.5);
        ctx.fillStyle = e.color || '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.font = '900 36px Arial, sans-serif';
        ctx.textAlign = 'center';
        const txt = e.value?.toString() || '0';
        ctx.strokeText(txt, 0, 0);
        ctx.fillText(txt, 0, 0);
    }

    private renderExplosion(ctx: CanvasRenderingContext2D, e: Entity): void {
        const prog = (e.duration || 0) / (e.maxDuration || 0.5);
        const fade = Math.max(0, 1 - prog);
        const seed = (e.id.charCodeAt(0) || 0) + (e.id.charCodeAt(e.id.length - 1) || 0);

        // 1. Shockwave Ring
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * (0.2 + prog * 1.2), 0, Math.PI * 2);
        ctx.strokeStyle = e.color;
        ctx.lineWidth = (1 - prog) * 4;
        ctx.globalAlpha = fade;
        ctx.stroke();

        // 2. Central Flash (Quick)
        if (prog < 0.3) {
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = (0.3 - prog) * 3;
            ctx.beginPath();
            ctx.arc(0, 0, e.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Procedural Debris
        ctx.globalAlpha = fade;
        ctx.fillStyle = e.color;

        const shardCount = 6 + (seed % 4);
        const speed = e.radius * 2.5;

        for (let i = 0; i < shardCount; i++) {
            const angle = (i / shardCount) * Math.PI * 2 + (seed * 0.1);
            const dist = prog * speed * (0.8 + (i % 3) * 0.2);
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const size = (e.radius * 0.15) * fade;
            ctx.fillRect(dx - size / 2, dy - size / 2, size, size);
        }
    }

    private renderSpawnFlash(ctx: CanvasRenderingContext2D, e: Entity): void {
        const prog = (e.duration || 0) / (e.maxDuration || 0.5);

        // 1. Bright Core
        ctx.globalAlpha = Math.max(0, 1 - prog);
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * prog, 0, Math.PI * 2);
        ctx.fill();

        // 2. Cross Streak
        if (prog < 0.5) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#22d3ee';
            const w = e.radius * 2 * prog;
            const h = 4 * (1 - prog);
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.fillRect(-h / 2, -w / 2, h, w);
        }

        // 3. Shockwave Ring
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4 * (1 - prog);
        ctx.beginPath();
        ctx.arc(0, 0, e.radius * 1.5 * prog, 0, Math.PI * 2);
        ctx.stroke();
    }
}

export const particleRenderer = new ParticleRenderer();
