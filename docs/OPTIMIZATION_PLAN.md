# Performance Optimization Plan

## Completed ✅

| Optimization | Files | Impact |
|-------------|-------|--------|
| **Object Pooling** | `useParticles.ts`, `ObjectPool.ts` | Reduced GC pressure for particles |
| **Spatial Hash Grid** | `useCollision.ts`, `SpatialHashGrid.ts` | O(N*K) collision detection |
| **Pre-rendered Background** | `CachedBackgroundRenderer.ts` | 3 offscreen canvases for stars |
| **Garbage-free IDs** | `IdGenerator.ts` | Incremental IDs, no string allocation |
| **Particle Aggregation** | `DamageAggregator.ts`, `ExplosionBatcher.ts` | Reduce damage/explosion spawns |
| **Viewport Culling** | `renderUtils.ts`, all Renderers | Skip offscreen entities |
| **Zoom-aware Culling** | `isInViewport()` | Correct culling at all zoom levels |

---

## Future Optimizations

### 1. Integer Coordinates (Low Effort, Medium Impact)
**Status:** Partially implemented in CachedBackgroundRenderer  
**What:** Use `| 0` for all coordinate calculations before drawing  
**Files:** All renderer files  
**Impact:** Avoid sub-pixel anti-aliasing overhead

```typescript
ctx.drawImage(sprite, x | 0, y | 0);
ctx.fillRect(x | 0, y | 0, w, h);
```

---

### 2. Sprite Caching / Texture Atlas (Medium Effort, High Impact)
**What:** Pre-render enemy sprites to offscreen canvases, draw cached images instead of paths  
**Files:** `EnemyRenderer.ts`, new `SpriteCache.ts`  
**Impact:** Reduce `beginPath()`, `moveTo()`, `fill()` calls per frame

**Implementation:**
- Create offscreen canvas per enemy type/tier combination
- Render once at game start
- Use `drawImage()` instead of path drawing

---

### 3. Layer Canvases (Medium Effort, High Impact)
**What:** Separate canvases for Background / Game / UI  
**Files:** `App.tsx`, new canvas layers  
**Impact:** UI doesn't need to redraw game, background is static

**Layers:**
1. `<canvas id="bg">` - Stars (rarely updates)
2. `<canvas id="game">` - Entities (60fps)
3. `<canvas id="ui">` - HUD (updates on state change only)

---

### 4. Web Worker Physics (High Effort, High Impact)
**What:** Move collision detection to Web Worker  
**Files:** New `collision.worker.ts`, `useCollision.ts`  
**Impact:** Main thread only renders, physics in background

**Challenges:**
- Entity data transfer (SharedArrayBuffer or postMessage)
- Synchronization complexity

---

### 5. Frame Skip / Adaptive Quality (Low Effort, Low Impact)
**What:** Skip render frames if behind, reduce particles at low FPS  
**Files:** `App.tsx` game loop  
**Impact:** Maintain logic tick rate even when rendering lags

```typescript
if (frameDelta > 32) { // 2 frames behind
  skipRender = true;
  particleQuality = 'low';
}
```

---

### 6. LOD (Level of Detail) (Medium Effort, Medium Impact)
**What:** Far enemies = simple circles, near = detailed shapes  
**Files:** `EnemyRenderer.ts`  
**Impact:** Reduce draw complexity for distant entities

```typescript
const distToCamera = distance(enemy.pos, cameraPos);
if (distToCamera > 800) {
  // Simple circle
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
} else {
  // Full detailed ship
}
```

---

### 7. Reduce ctx.save()/restore() (Low Effort, Low Impact)
**What:** Batch state changes, avoid save/restore per entity  
**Files:** All renderers  
**Impact:** Reduce canvas context state stack operations

---

## Priority Order

| Priority | Optimization | Effort | Impact |
|----------|--------------|--------|--------|
| 1 | Integer Coordinates | Low | Medium |
| 2 | Sprite Caching | Medium | High |
| 3 | LOD for distant entities | Medium | Medium |
| 4 | Layer Canvases | Medium | High |
| 5 | Frame Skip | Low | Low |
| 6 | Reduce save/restore | Low | Low |
| 7 | Web Worker Physics | High | High |
