/**
 * Projectile Renderer Wrapper
 * Wraps existing renderProjectiles function as IRenderer
 * Includes viewport culling for performance
 */

import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { renderProjectiles } from '../renderers/ProjectileRenderer';
import { isInViewport } from '../../utils/renderUtils';

export class ProjectileRendererWrapper implements IRenderer {
    readonly order = 30;

    render(rCtx: RenderContext): void {
        const { cameraPos, screenWidth, screenHeight, zoom, projectiles, ctx, playerStats, time } = rCtx;

        // Filter to only visible projectiles
        const visibleProjectiles = projectiles.filter(p =>
            isInViewport(p.pos, cameraPos.x, cameraPos.y, screenWidth, screenHeight, 300, zoom)
        );

        renderProjectiles(ctx, visibleProjectiles, playerStats, time);
    }
}

export const projectileRendererWrapper = new ProjectileRendererWrapper();
