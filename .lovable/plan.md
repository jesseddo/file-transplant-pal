

# Improve Edge Attachment Points

## Problem

Edges always connect from the **right** side of the source node and to the **left** side of the target node, regardless of where the target is positioned. When nodes are above, below, or to the left, this creates awkward, looping curves that look messy (visible in the screenshot with curves arcing far away from nodes).

## Solution

Make the attachment points **position-aware**: pick the closest edge of each node based on the relative position of the connected node. For example, if a target is directly below the source, the edge should exit from the **bottom** of the source and enter the **top** of the target.

## Changes (single file: `src/components/scenario/WorkflowFlowView.tsx`)

### 1. Update `getOutputHandlePos` to be position-aware

Instead of always returning the right edge, calculate which side (right, bottom, left, top) of the source node faces the target node center, then attach there.

Logic:
- Compute the angle from source center to target center
- If the target is mostly to the right: attach to right edge (current behavior)
- If the target is mostly below: attach to bottom edge
- If the target is mostly to the left: attach to left edge
- If the target is mostly above: attach to top edge

For **branch handles** on decision nodes, keep the right-side stacked handles when the target is generally to the right, but switch to bottom-stacked when the target is below.

### 2. Update `getInputHandlePos` to be position-aware

Same logic in reverse for the target node -- attach to the side closest to the source:
- Source mostly to the left: attach to left edge (current default)
- Source mostly above: attach to top edge
- Source mostly to the right: attach to right edge
- Source mostly below: attach to bottom edge

### 3. Adjust Bezier control points based on exit/entry direction

Currently the control points always extend horizontally (`cx1 = x1 + offset`, `cx2 = x2 - offset`). Update this so the control points extend in the direction of the handle:
- Right exit: control point goes right (`x1 + offset, y1`)
- Bottom exit: control point goes down (`x1, y1 + offset`)
- Left exit: control point goes left (`x1 - offset, y1`)
- Top exit: control point goes up (`x1, y1 - offset`)

Same for entry control points, extending away from the entry side.

### 4. Update the visual handle dots on nodes

Currently the JSX renders a fixed input handle on the left and output handle(s) on the right. Since handles are now dynamic per-connection, hide the static handle dots or keep them as decorative indicators on all four sides with reduced opacity, showing them as potential attachment points.

## Technical Details

New helper function signature:

```text
function getSmartHandlePos(
  sourcePos: {x, y},
  targetPos: {x, y},
  isOutput: boolean,
  branchIndex?: number,
  branchTotal?: number
): { x: number, y: number, direction: 'right' | 'bottom' | 'left' | 'top' }
```

The `direction` return value feeds into the Bezier control point calculation:

```text
switch (outDir):
  'right':  cx1 = x1 + offset, cy1 = y1
  'bottom': cx1 = x1,          cy1 = y1 + offset
  'left':   cx1 = x1 - offset, cy1 = y1
  'top':    cx1 = x1,          cy1 = y1 - offset
```

Same pattern for the input side control point, extending away from entry direction.

### Files Changed

| File | Change |
|------|--------|
| `src/components/scenario/WorkflowFlowView.tsx` | Replace fixed handle helpers with position-aware `getSmartHandlePos`, update Bezier control point logic, update handle dot rendering |

