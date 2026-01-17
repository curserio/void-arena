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
            } else if (e.type === EntityType.LIGHTNING) {
                this.renderLightning(ctx, e);
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
        ctx.stroke();
    }

    private renderLightning(ctx: CanvasRenderingContext2D, e: Entity): void {
        if (!e.targetPos) return;

        const prog = (e.duration || 0) / (e.maxDuration || 0.4);
        const fade = Math.max(0, 1 - prog);

        // We are translated to e.pos (0,0). Target is relative.
        const tx = e.targetPos.x - e.pos.x;
        const ty = e.targetPos.y - e.pos.y;
        const dist = Math.sqrt(tx * tx + ty * ty);

        // Jagged line parameters
        const segments = Math.max(4, Math.floor(dist / 20));
        const amp = 30 * fade;

        // Generate points
        const points: { x: number, y: number }[] = [{ x: 0, y: 0 }];
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const px = tx * t;
            const py = ty * t;
            const nx = -ty / dist;
            const ny = tx / dist;
            // Use random for jitter to make it "alive" every frame
            const jitter = (Math.random() - 0.5) * amp;
            points.push({ x: px + nx * jitter, y: py + ny * jitter });
        }
        points.push({ x: tx, y: ty });

        // 1. Draw Outer Glow (Thick, colored, blurred)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 20;
        ctx.shadowColor = e.color || '#67e8f9';
        ctx.strokeStyle = e.color || '#67e8f9';
        ctx.lineWidth = 6 * fade;
        ctx.globalAlpha = fade * 0.5;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        // 2. Draw Core (Thin, white, sharp)
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#fff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * fade;
        ctx.globalAlpha = fade;

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

export const particleRenderer = new ParticleRenderer();
