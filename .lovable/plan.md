

# Workflow View: Proper Scrollable Canvas with Clean Layering

## Problem

The current Workflow view has layering issues -- arrows and cards compete for z-index, and the layout doesn't behave like a true visual graph canvas. The SVG coordinates also break when the container scrolls because `getBoundingClientRect()` doesn't account for scroll offset.

## Approach

Restructure `WorkflowFlowView.tsx` into a two-layer canvas architecture inside a scrollable outer container. Add optional mouse-wheel zoom.

## Architecture

```text
Outer container (overflow: auto, catches scroll)
  Inner canvas (min-width: 2400px, position: relative)
    Layer 1: SVG (absolute, full canvas size, z-index: 1, pointer-events: none)
    Layer 2: Step cards (relative, z-index: 2)
```

## Technical Changes

### File: `src/components/scenario/WorkflowFlowView.tsx`

**1. Two-ref architecture**

- `scrollRef` -- the outer scrollable div (`overflow: auto`, clips the viewport)
- `canvasRef` -- the inner wide div (`min-width: 2400px`, `position: relative`)

**2. Fix SVG coordinate calculation**

Replace `getBoundingClientRect()` math with `offsetLeft`/`offsetTop` relative to `canvasRef`, which is scroll-independent. This fixes the root cause of arrows misaligning when scrolled.

**3. Correct layering (arrows behind cards)**

- SVG layer: `position: absolute`, `inset: 0`, `z-index: 1`, `pointer-events: none`
- Cards layer: `position: relative`, `z-index: 2`

Arrows render *behind* cards -- the opposite of the previous fix. Since cards are `z-index: 2`, they always sit on top. Arrow paths route between card anchor points (bottom-center to top-center) but never overlap card content.

**4. SVG sized to canvas, not viewport**

Instead of `w-full h-full` (which sizes to the visible area), the SVG dimensions are set to match the actual canvas scroll dimensions (`canvasRef.scrollWidth` x `canvasRef.scrollHeight`). This ensures arrows render correctly across the full canvas even when scrolled.

**5. Column layout**

- Three columns evenly spaced across the wide canvas (each `flex-1`, with `min-w-[300px]`)
- Generous gap between columns (`gap-16`) so branch arrows have room to curve

**6. Optional zoom**

- Track a `zoom` state (default `1`, range `0.5`--`1.5`)
- Apply `transform: scale(zoom)` + `transform-origin: top left` to the inner canvas
- Listen for `wheel` events with Ctrl/Cmd held on the outer container to adjust zoom
- Display a small zoom indicator badge in the corner

**7. Recompute on scroll**

- Listen for `scroll` events on the outer container to recompute SVG paths (since `getBoundingClientRect` shifts with scroll)
- Or better: use offset-based coordinates so scroll doesn't affect path math at all (preferred)

### No other files change

- `Index.tsx` -- unchanged
- `useWorkflow.ts` -- unchanged
- `workflow.ts` types -- unchanged
- Design view -- unchanged

## What the user will see

- A wide, horizontally scrollable canvas
- Cards clearly on top of any connection lines
- Branch arrows curve cleanly between cards without overlapping card content
- Ctrl+scroll to zoom in/out
- Small zoom level indicator in the corner
