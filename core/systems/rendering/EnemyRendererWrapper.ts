/**
 * Enemy Renderer Wrapper
 * Wraps existing renderEnemies function as IRenderer
 * Includes viewport culling for performance
 */

import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { renderEnemies } from '../renderers/EnemyRenderer';
import { isInViewport } from '../../utils/renderUtils';

export class EnemyRendererWrapper implements IRenderer {
    readonly order = 20;

    render(rCtx: RenderContext): void {
        const { cameraPos, screenWidth, screenHeight, zoom, enemies, ctx, time } = rCtx;

        // Filter to only visible enemies (with margin for large sprites)
        const visibleEnemies = enemies.filter(e =>
            isInViewport(e.pos, cameraPos.x, cameraPos.y, screenWidth, screenHeight, e.radius + 400, zoom)
        );

        renderEnemies(ctx, visibleEnemies, time);
    }
}

export const enemyRendererWrapper = new EnemyRendererWrapper();
