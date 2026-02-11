

# Improve Workflow Edge Coherence with Connection Ports

## Overview

Add explicit input/output connection handles (small circles) on each card, switch edges from bezier curves to orthogonal smooth-step routing, and place branch labels near source handles for clearer visual connections.

## Visual Changes

- **Input handle**: Small circle (6px radius) on left-center of every card
- **Output handle**: Single circle on right-center for normal cards; one per branch choice vertically stacked for decision cards
- **Edge style**: Orthogonal (smooth-step) paths instead of bezier curves -- edges travel horizontally, then turn 90 degrees vertically, then horizontally again
- **Branch labels**: Positioned near the source handle (just right of it) instead of mid-curve
- **Vertical offsets**: Multiple edges entering/leaving a node are spaced apart so they don't overlap

## Technical Details

### File: `src/components/scenario/WorkflowFlowView.tsx`

**1. Connection interface update**

Add `branchIndex` and `branchTotal` fields to the `Connection` interface so edges know their vertical offset at both source and target:

```typescript
interface Connection {
  fromId: string;
  toId: string | "__end__";
  type: "linear" | "branch";
  label?: string;
  color?: string;
  branchIndex?: number;   // which branch (0-based) on the source decision
  branchTotal?: number;   // total branches on the source
}
```

**2. Handle position helpers**

New helper functions to compute port positions:

- `getInputHandlePos(pos)`: returns `{ x: pos.x, y: pos.y + NODE_H / 2 }` (left-center)
- `getOutputHandlePos(pos, branchIndex?, branchTotal?)`: for normal cards returns right-center; for decision cards computes a vertically stacked y-offset aligned with the choice list area (starting below the badge row, ~16px apart per choice)

**3. Render visual handles on cards**

After each card's content, render small SVG-like circles as absolutely positioned `div` elements:

- **Left handle** (input): `left: -5px, top: 50%`, 10x10 circle, border + fill
- **Right handle(s)** (output): for normal cards one at `right: -5px, top: 50%`; for decision cards one per choice, vertically aligned with the choice dot in the choice list

**4. Smooth-step (orthogonal) edge routing**

Replace bezier `C` paths with orthogonal routing:

```
M x1,y1  H midX  V y2  H x2
```

Where `midX = (x1 + x2) / 2`. This creates a clean right-angle path: horizontal from source, vertical turn, horizontal into target.

**5. Vertical offset for overlapping edges**

When multiple edges enter the same target node, compute per-edge offsets at the target. Count how many connections share the same `toId`, assign each an index, and offset the target y by `(index - (count-1)/2) * 12px`. Same logic for multiple edges leaving a non-decision node (rare but handled).

**6. Branch labels near source handle**

Move the label `text` element from mid-curve `((x1+x2)/2, min(y1,y2)-6)` to near the source: `(x1 + 14, y1 - 2)` with `textAnchor="start"`.

**7. Update `buildConnections`**

Pass `branchIndex` and `branchTotal` in each connection for decision steps so the rendering knows which output port to use.

### No other files changed

All modifications are within `WorkflowFlowView.tsx`. No data model or type changes needed.

