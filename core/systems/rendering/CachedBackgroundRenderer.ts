/**
 * Cached Background Renderer
 * Pre-renders static star layers to offscreen canvases
 * Only needs to composite cached layers each frame instead of re-drawing all stars
 */

import { WORLD_SIZE } from '../../../constants';
import { BackgroundStar } from '../BackgroundManager';

export class CachedBackgroundRenderer {
    private cache: OffscreenCanvas[] = [];
    private cacheCtx: OffscreenCanvasRenderingContext2D[] = [];
    private isInitialized: boolean = false;

    // Layer parallax speeds
    private readonly speeds = [0.1, 0.2, 0.4];
    private readonly colors = ['#475569', '#475569', '#fff'];

    /**
     * Initialize cache with star data
     * Call once when stars are generated
     */
    initialize(stars: BackgroundStar[], width: number, height: number): void {
        // Create 3 offscreen canvases for each layer
        for (let i = 0; i < 3; i++) {
            const canvas = new OffscreenCanvas(width, height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                this.cache[i] = canvas;
                this.cacheCtx[i] = ctx;
            }
        }

        // Group stars by layer
        const layers: BackgroundStar[][] = [[], [], []];
        for (const star of stars) {
            layers[star.layer].push(star);
        }

        // Pre-render each layer
        for (let i = 0; i < 3; i++) {
            const ctx = this.cacheCtx[i];
            if (!ctx) continue;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = this.colors[i];

            for (const star of layers[i]) {
                ctx.globalAlpha = star.opacity;

                // Normalize position to screen space
                const sx = star.x % width;
                const sy = star.y % height;

                if (star.size <= 1.5) {
                    ctx.fillRect(sx - star.size, sy - star.size, star.size * 2, star.size * 2);
                } else {
                    ctx.beginPath();
                    ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.globalAlpha = 1.0;
        }

        this.isInitialized = true;
    }

    /**
     * Draw background using cached layers
     */
    draw(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        vOX: number,
        vOY: number
    ): void {
        // Background color
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, width, height);

        if (!this.isInitialized) return;

        // Draw each cached layer with parallax offset
        for (let i = 0; i < 3; i++) {
            const cache = this.cache[i];
            if (!cache) continue;

            // Calculate parallax offset - ensure positive modulo for wrapping
            let offsetX = (vOX * this.speeds[i]) % width;
            let offsetY = (vOY * this.speeds[i]) % height;

            // Handle negative values (when moving left/up)
            if (offsetX < 0) offsetX += width;
            if (offsetY < 0) offsetY += height;

            // Use integer coordinates for performance
            const ox = offsetX | 0;
            const oy = offsetY | 0;

            // Draw 2x2 tiled grid to handle all scroll directions
            ctx.drawImage(cache, ox, oy);
            ctx.drawImage(cache, ox - width, oy);
            ctx.drawImage(cache, ox, oy - height);
            ctx.drawImage(cache, ox - width, oy - height);
        }

        // Subtle grid (still drawn dynamically - it's cheap)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 400;
        ctx.beginPath();
        for (let x = vOX % gridSize; x < width; x += gridSize) {
            ctx.moveTo(x | 0, 0);
            ctx.lineTo(x | 0, height);
        }
        for (let y = vOY % gridSize; y < height; y += gridSize) {
            ctx.moveTo(0, y | 0);
            ctx.lineTo(width, y | 0);
        }
        ctx.stroke();
    }

    /**
     * Check if cache is ready
     */
    get ready(): boolean {
        return this.isInitialized;
    }
}

// Singleton instance
export const cachedBackgroundRenderer = new CachedBackgroundRenderer();
