/**
 * Enemy Renderer Wrapper
 * Wraps existing renderEnemies function as IRenderer
 */

import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { renderEnemies } from '../renderers/EnemyRenderer';

export class EnemyRendererWrapper implements IRenderer {
    readonly order = 20;

    render(rCtx: RenderContext): void {
        renderEnemies(rCtx.ctx, rCtx.enemies, rCtx.time);
    }
}

export const enemyRendererWrapper = new EnemyRendererWrapper();
