

# Draggable Workflow Canvas (Typeform-style)

## Overview

Transform the Workflow tab from a static column-based view into a free-form, pan/zoom canvas where nodes can be dragged around -- similar to the Typeform screenshot you shared. The Design tab and all step/branching data structures remain untouched.

## What Changes

### 1. Extend the Step type with optional UI position

Add an optional `ui` field to the `Step` interface so each node can store its canvas position. If missing, nodes auto-layout into vertical lanes by phase.

```text
Step {
  ...existing fields...
  ui?: { position: { x: number; y: number } }
}
```

### 2. New draggable canvas component

Replace the current `WorkflowFlowView` internals with a pan/zoom canvas that:

- Renders each step as a draggable node at its `ui.position` (or auto-computed fallback)
- Supports mouse-drag to reposition nodes (updates `step.ui.position` via `onUpdate`)
- Supports canvas panning (middle-click or hold Space + drag)
- SVG connection lines render behind nodes (z-index 1 vs 2)

### 3. Canvas controls toolbar

A small floating toolbar in the bottom-left corner with:

- Zoom In / Zoom Out buttons
- Reset Zoom (back to 100%)
- Fit to Content (auto-zoom to show all nodes)
- Auto Arrange (re-computes lane positions without changing branching)

### 4. Connection lines

Same logic as today but on the free-form canvas:

- Linear connections: gray lines between consecutive steps
- Branch connections: colored per choice (existing color palette)
- End markers: dashed line to a red "End" pill
- SVG layer is `pointer-events: none`, always behind node cards

### 5. Auto-arrange algorithm

When clicked, computes positions in vertical lanes per column:

```text
INTRO column:     x = 100
SIMULATION column: x = 450
REVIEW column:     x = 800

Within each column: y = 80 + (index * 140)
```

This resets all `ui.position` values without changing step order or branching.

## Technical Details

### Files modified

| File | Change |
|------|--------|
| `src/types/workflow.ts` | Add `ui?: { position: { x: number; y: number } }` to `Step` interface |
| `src/components/scenario/WorkflowFlowView.tsx` | Full rewrite: free-form canvas with drag, pan, zoom |
| `src/hooks/useWorkflow.ts` | Add `updateNodePosition` callback; pass `onUpdate` to Workflow view |
| `src/pages/Index.tsx` | Pass `onUpdate` prop to `WorkflowFlowView` |

### Canvas implementation approach

- Track `canvasOffset` (pan) and `zoom` in local state
- Apply `transform: translate(panX, panY) scale(zoom)` to the inner canvas layer
- Node drag: `onMouseDown` on a node starts tracking, `onMouseMove` updates position (accounting for zoom), `onMouseUp` commits via `onUpdate`
- Canvas pan: `onMouseDown` on empty canvas area starts pan tracking
- All coordinates stored in "canvas space" (unscaled), rendering transforms handle display

### Node rendering

Each node is absolutely positioned at `(step.ui.position.x, step.ui.position.y)` inside the transformed canvas. Card content stays the same (title, badge, branch indicators).

### Fallback positioning

If a step has no `ui.position`, auto-place it using the lane algorithm on first render. This ensures backward compatibility with existing step data.

### Workflow tab remains editable for positions only

Node positions can be changed by dragging. Step content editing still happens via the Inspector panel (already wired up). Branching logic is unchanged.

## What the user will see

- A large open canvas with nodes floating freely
- Drag any node to reposition it
- Pan the canvas by clicking empty space and dragging
- Ctrl+scroll to zoom in/out
- Toolbar buttons for zoom controls, fit-to-content, and auto-arrange
- Connection lines clearly visible behind cards
- Clicking a node still opens the Inspector panel on the right
