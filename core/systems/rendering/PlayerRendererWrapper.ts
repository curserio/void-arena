/**
 * Player Renderer Wrapper
 * Wraps existing renderPlayer function as IRenderer
 */

import { IRenderer } from './IRenderer';
import { RenderContext } from './RenderContext';
import { renderPlayer } from '../renderers/PlayerRenderer';

export class PlayerRendererWrapper implements IRenderer {
    readonly order = 50;

    render(rCtx: RenderContext): void {
        renderPlayer(
            rCtx.ctx,
            rCtx.playerPos,
            rCtx.joystickDir,
            rCtx.aimDir,
            rCtx.playerStats,
            rCtx.time,
            rCtx.lastPlayerHitTime,
            rCtx.gameState
        );
    }
}

export const playerRendererWrapper = new PlayerRendererWrapper();
