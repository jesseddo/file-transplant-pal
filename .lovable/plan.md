
# Fix Workflow Canvas Interaction Model

## Summary
Replace the "always grab" panning with a Space+drag / middle-mouse-drag model. Default cursor becomes normal, scroll/wheel passes through naturally, and node drag remains independent.

## Changes (single file: `WorkflowFlowView.tsx`)

### 1. Add `spaceHeld` state
- Track Space key via `keydown`/`keyup` listeners (set `spaceHeld` to true/false)
- On blur/visibilitychange, reset to false (safety)

### 2. Rewrite `handleCanvasMouseDown`
- Only start panning if `(spaceHeld && e.button === 0)` OR `e.button === 1` (middle-click)
- Otherwise, do nothing (no panning on plain left-click)

### 3. Update wheel handler
- Keep `Ctrl+scroll` for zoom with `preventDefault()`
- For normal scroll: remove `preventDefault()` entirely -- let the browser handle native scroll. This gives trackpad/wheel users natural horizontal scrolling when content overflows.

### 4. Update container overflow
- Change `overflow-hidden` to `overflow-auto` on the container so native scroll works when not zoomed/panned programmatically.

### 5. Update cursor logic
- Default: `cursor: default`
- Space held (not panning): `cursor: grab`
- Actively panning: `cursor: grabbing`
- Node hover: keep `cursor-grab` / `cursor-grabbing` on node cards (unchanged)

### 6. Remove background click-drag layer
- The `data-canvas-bg` div is no longer needed since plain left-click no longer pans. Remove it.

### 7. Mouse move/up guards
- The existing `if (panning)` check already guards the move handler, so no extra `preventDefault` needed when not panning. No changes needed here.

## Technical Detail

Key state additions:
```typescript
const [spaceHeld, setSpaceHeld] = useState(false);
```

Key event listener (new useEffect):
```typescript
useEffect(() => {
  const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) setSpaceHeld(true); };
  const up = (e: KeyboardEvent) => { if (e.code === "Space") setSpaceHeld(false); };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
}, []);
```

Updated mousedown:
```typescript
const handleCanvasMouseDown = (e: React.MouseEvent) => {
  const isCanvas = e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg;
  if (!isCanvas) return;
  if ((spaceHeld && e.button === 0) || e.button === 1) {
    e.preventDefault();
    setPanning({ startMouse: { x: e.clientX, y: e.clientY }, startPan: { ...pan } });
  }
};
```

Container style:
```typescript
style={{ cursor: panning ? "grabbing" : spaceHeld ? "grab" : "default" }}
```
