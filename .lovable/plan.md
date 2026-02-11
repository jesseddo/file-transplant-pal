

# Lane-Based Rail Routing for Workflow Edges

## Summary

Two targeted changes to edge rendering in `WorkflowFlowView.tsx`. No data model or modal changes.

## What Changes Visually

- Branch edges from decision nodes already start from stacked Y-offsets (this works today). The improvement is to the horizontal routing: instead of a single `midX` turning point, edges travel along fixed vertical "rails" positioned between lanes, creating cleaner, non-overlapping paths.
- Forward connections route cleanly through one rail. Backward or cross-lane connections route through two rails (exit rail, then entry rail), staying within workflow bounds.

## Technical Details

### File: `src/components/scenario/WorkflowFlowView.tsx`

**1. Define lane rail X-positions**

Compute a vertical rail between each pair of adjacent nodes. For each step in `flatOrder`, the "exit rail" sits at `stepPos.x + NODE_W + RAIL_MARGIN` and the "entry rail" sits at `nextStepPos.x - RAIL_MARGIN`. A constant `RAIL_MARGIN` of ~30px keeps rails clear of node edges.

```typescript
const RAIL_MARGIN = 30;
```

For each connection, compute:
- `exitRailX = fromPos.x + NODE_W + RAIL_MARGIN` (just right of source node)
- `entryRailX = toPos.x - RAIL_MARGIN` (just left of target node)

**2. Replace single-midX routing with rail-based paths**

Current path (line ~298-299):
```typescript
const midX = (x1 + x2) / 2;
const pathData = `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
```

New logic:
- If source and target are adjacent (exitRailX <= entryRailX), use a single rail at the midpoint between them: `M x1,y1 H railX V y2 H x2` (same shape, but rail is clamped to stay between the two nodes).
- If the target is to the left of the source (backward branch), route through two rails: exit rail down/up, then entry rail across: `M x1,y1 H exitRailX V routeY H entryRailX V y2 H x2`, where `routeY` is offset above or below the nodes to avoid crossing them.

**3. Compute routeY for backward edges**

When a branch targets a node to the left, `routeY` is computed as `min(allNodeYs) - 40` (route above all nodes) or `max(allNodeYs) + NODE_H + 40` (route below), choosing whichever keeps the path shorter. This ensures edges stay within reasonable bounds.

**4. Per-connection rail offset to prevent overlapping**

When multiple edges share the same rail X (e.g., two branches from the same decision both going forward), offset each rail by `connectionIndex * 8px` so they run parallel rather than overlapping. This uses the existing `branchIndex` field.

```typescript
const railOffset = (conn.branchIndex ?? 0) * 8;
const exitRailX = fromPos.x + NODE_W + RAIL_MARGIN + railOffset;
```

**5. Constants added**

```typescript
const RAIL_MARGIN = 30;    // gap between node edge and rail
const RAIL_SPREAD = 8;     // px between parallel rails
const ROUTE_MARGIN = 40;   // gap above/below nodes for backward routes
```

### No other files changed
