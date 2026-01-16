/**
 * Render Manager
 * Orchestrates all renderers with layer ordering
 */

import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';

// Import all renderers
import { pickupRenderer } from './PickupRenderer';
import { enemyRendererWrapper } from './EnemyRendererWrapper';
import { projectileRendererWrapper } from './ProjectileRendererWrapper';
import { particleRenderer } from './ParticleRenderer';
import { playerRendererWrapper } from './PlayerRendererWrapper';

export class RenderManager {
    private renderers: IRenderer[] = [];
    private sorted = false;

    constructor() {
        // Register default renderers
        this.register(pickupRenderer);
        this.register(enemyRendererWrapper);
        this.register(projectileRendererWrapper);
        this.register(particleRenderer);
        this.register(playerRendererWrapper);
    }

    /**
     * Register a renderer
     */
    register(renderer: IRenderer): void {
        this.renderers.push(renderer);
        this.sorted = false;
    }

    /**
     * Render all layers in order
     */
    renderAll(ctx: RenderContext): void {
        if (!this.sorted) {
            this.renderers.sort((a, b) => a.order - b.order);
            this.sorted = true;
        }

        for (const renderer of this.renderers) {
            renderer.render(ctx);
        }
    }
}

// Singleton instance
export const renderManager = new RenderManager();
