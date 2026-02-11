

# Smarter Node Layout for Complex Workflows

## What You'll See

When you open the Workflow tab, nodes will be neatly arranged in a grid-like structure instead of piled on one line. Each phase column (Intro, Simulation, Review) gets its own horizontal band, and branch targets fan out below their parent decision node without overlapping other nodes or edges.

## Changes

**Single file:** `src/components/scenario/WorkflowFlowView.tsx`

### 1. Increase spacing constants

- `NODE_X_GAP`: 320 -> 360 (more room between nodes horizontally)
- `NODE_Y_GAP`: 140 -> 180 (more room between rows)
- `COLUMN_GAP`: 120 -> 180 (clearer separation between Intro/Simulation/Review)

### 2. Rewrite the `autoPosition` function with proper vertical stacking

Current behavior: all main-path nodes sit at the same Y coordinate, creating a single horizontal line.

New behavior:
- **Within each column**, main-path nodes stack vertically (each node in the same column gets its own row)
- **Across columns**, the X position advances so the overall flow reads left-to-right and top-to-bottom
- **Branch targets** are placed below and to the right of their source decision node, each on its own row so they never overlap each other or the main path
- **Collision avoidance**: after initial placement, a simple sweep checks for overlapping bounding boxes and nudges nodes down if they collide

### 3. Add auto fit-to-view on first mount

- A `useRef(false)` flag called `hasAutoFitted` tracks whether the view has been centered
- After positions are set, a `requestAnimationFrame` triggers `handleFitToContent()` once to zoom/pan so all nodes are visible
- The flag resets on unmount so returning to the tab re-centers

### 4. Smarter end-node placement

- End nodes ("End Scenario" pills) are placed further away from their source (+200px right, +80px down) to avoid sitting on top of branch edges
- When multiple end nodes come from the same source, they are stacked vertically instead of overlapping

## Technical Details

### New `autoPosition` algorithm

```
1. Group steps by column, sorted by order
2. Build connections graph
3. Walk the main path (linear + first branch)
4. Place main-path nodes:
   - Track xCursor (advances per column group) and yCursor per column
   - Each column's nodes stack vertically: y = columnBaseY + (indexInColumn * NODE_Y_GAP)
   - When column changes, xCursor jumps by COLUMN_GAP + NODE_X_GAP
5. Place branch targets:
   - For each decision node, find branch targets NOT on the main path
   - Place them starting at (sourceX + NODE_X_GAP/2, sourceY + NODE_Y_GAP)
   - Multiple branch targets from the same source get stacked vertically
6. Collision pass:
   - Sort all placed nodes by Y, then X
   - For each pair, if bounding boxes (NODE_W+40 x NODE_H+40) overlap, push the lower node down
7. Place orphan nodes at the bottom
```

### Auto fit-to-view

```typescript
const hasAutoFitted = useRef(false);

useEffect(() => {
  if (Object.keys(positions).length > 0 && !hasAutoFitted.current) {
    requestAnimationFrame(() => {
      handleFitToContent();
      hasAutoFitted.current = true;
    });
  }
}, [positions]);
```

### Files changed

| File | Change |
|------|--------|
| `src/components/scenario/WorkflowFlowView.tsx` | Rewrite `autoPosition` with vertical stacking + collision avoidance; increase spacing constants; add auto fit-to-view on mount; improve end-node placement |

