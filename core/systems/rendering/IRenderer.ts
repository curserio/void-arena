/**
 * Renderer Interface
 * Unified contract for all render layers
 */

import { RenderContext } from './RenderContext';

export interface IRenderer {
    /**
     * Render layer order (lower = behind)
     * 0 = Background
     * 10 = Pickups
     * 20 = Enemies
     * 30 = Projectiles
     * 40 = Particles (damage numbers, explosions)
     * 50 = Player
     */
    readonly order: number;

    /**
     * Render this layer
     */
    render(ctx: RenderContext): void;
}
