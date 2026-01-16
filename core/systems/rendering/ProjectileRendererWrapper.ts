/**
 * Projectile Renderer Wrapper
 * Wraps existing renderProjectiles function as IRenderer
 */

import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { renderProjectiles } from '../renderers/ProjectileRenderer';

export class ProjectileRendererWrapper implements IRenderer {
    readonly order = 30;

    render(rCtx: RenderContext): void {
        renderProjectiles(rCtx.ctx, rCtx.projectiles, rCtx.playerStats, rCtx.time);
    }
}

export const projectileRendererWrapper = new ProjectileRendererWrapper();
