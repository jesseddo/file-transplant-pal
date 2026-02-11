

# Branch-Aware Horizontal Layout

## What changes

The Workflow tab will display a clean, organized horizontal layout where decision nodes "reserve" extra space for their branches. Branch targets will fan out with generous horizontal spacing so nothing overlaps, matching the spatial clarity shown in the reference image.

## Current problem

All main-path nodes sit at `y = 60` on a single horizontal line. Branch targets are centered below their parent but can overlap neighboring main-path nodes or each other because the algorithm doesn't account for how much horizontal room branches need.

## New layout behavior

1. **Main path flows left-to-right** -- same as now, but decision nodes reserve extra horizontal space proportional to their branch count
2. **Branch targets spread wide below their parent** -- each branch target gets its own horizontal lane with enough gap that it never overlaps a main-path node or another branch target
3. **Back-references (loops)** -- connections that point backward (like "Startup denied -- recheck" pointing back to an earlier step) are rendered as edges only; they don't create duplicate nodes
4. **End nodes** -- placed further right and below their source, stacked vertically when multiple end branches exist from the same decision
5. **Auto fit-to-view** -- fires once on mount so the full graph is visible immediately

## Technical details

**File: `src/components/scenario/WorkflowFlowView.tsx`**

### Rewritten `autoPosition` algorithm

```text
1. Build connections, identify main path (same as now)
2. Walk the main path left-to-right:
   - For each step, place at (xCursor, LANE_Y_START)
   - If the step is a decision node with N branch targets (not on main path):
     - Reserve horizontal space: advance xCursor by max(NODE_X_GAP, N * NODE_X_GAP * 0.6)
       so branches have room to fan out without hitting the next main-path node
   - Otherwise advance xCursor by NODE_X_GAP
   - Add COLUMN_GAP when crossing phase boundaries
3. Place branch targets:
   - For each decision node, collect its off-main-path branch targets
   - Place them on a row below (sourceY + NODE_Y_GAP)
   - Spread them horizontally starting from (sourceX - offset) so they are
     centered under the source but spaced at NODE_X_GAP apart
   - If a branch target itself has branches, recursively reserve space below
4. Collision avoidance sweep:
   - Sort all placed nodes by Y then X
   - For each overlapping pair, nudge the lower node down by NODE_H + padding
5. Place orphan nodes at the bottom
```

### Spacing adjustments

| Constant | Old | New | Why |
|----------|-----|-----|-----|
| `NODE_X_GAP` | 360 | 320 | Slightly tighter base gap since decision nodes now reserve extra space dynamically |
| `NODE_Y_GAP` | 180 | 200 | More vertical room between main path and branch rows |
| `COLUMN_GAP` | 180 | 200 | Clearer visual separation between Intro/Simulation/Review |

### Decision node space reservation (key new logic)

```typescript
// When placing a decision node on the main path,
// count how many off-main-path branch targets it has
const offPathBranches = (step.choices ?? [])
  .filter(c => c.nextStepId !== "__end__" && !mainPathIds.has(c.nextStepId))
  .length;

// Reserve enough horizontal space so branch targets can fan out
// without colliding with the next main-path node
const reservedWidth = offPathBranches > 1
  ? Math.max(NODE_X_GAP, offPathBranches * NODE_X_GAP * 0.6)
  : NODE_X_GAP;

xCursor += reservedWidth;
```

### End node placement improvement

```typescript
// Place end nodes to the right and below their source
// Stack vertically when multiple end branches exist
endNodes.forEach((endNode, idx) => {
  const sourcePos = positions[endNode.fromStepId];
  positions[endNode.id] = {
    x: sourcePos.x + NODE_X_GAP * 0.7,
    y: sourcePos.y + NODE_Y_GAP + idx * (NODE_H + 60),
  };
});
```

### Auto fit-to-view (already implemented, kept as-is)

The existing `hasAutoFitted` ref and `useEffect` remain unchanged.

### Files changed

| File | Change |
|------|--------|
| `src/components/scenario/WorkflowFlowView.tsx` | Rewrite `autoPosition` with decision-node space reservation, wider branch fan-out, improved end-node stacking, and adjusted spacing constants |

