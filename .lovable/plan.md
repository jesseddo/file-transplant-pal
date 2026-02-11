

# Fix Click vs Drag Sensitivity on Workflow Nodes

## Problem

Clicking a decision node opens the Edit Logic modal, but even a tiny mouse movement during a drag attempt triggers the modal because the code only checks `if (!dragging)` -- which is true at the moment of `mousedown` before dragging state is set.

## Solution

Track whether a meaningful drag occurred by measuring the distance between `mousedown` and `mouseup`. Only treat it as a "click" if the mouse moved less than 5 pixels.

## Changes

### File: `src/components/scenario/WorkflowFlowView.tsx`

1. **Add a `hasDragged` ref**: Use a `useRef<boolean>(false)` to track whether the mouse moved beyond a 5px threshold during the current drag gesture.

2. **Set `hasDragged` in mouse move handler**: Inside the `handleMove` function (in the `useEffect` that handles `mousemove`), when `dragging` is active, calculate the total distance from `dragging.startMouse` to the current mouse position. If it exceeds 5px, set `hasDragged.current = true`.

3. **Reset `hasDragged` on mouse down**: In `handleNodeMouseDown`, reset `hasDragged.current = false`.

4. **Guard the click handler**: In the node's `onClick`, change `if (!dragging)` to `if (!dragging && !hasDragged.current)`. This prevents the modal from opening after a drag gesture.

5. **Reset on mouse up**: In the `handleUp` function, reset `hasDragged.current = false` after processing.

