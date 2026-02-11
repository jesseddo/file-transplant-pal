

# Fix Line/Arrow Layering in Workflow View

## Problem

In `WorkflowFlowView.tsx`, the SVG overlay (lines and arrows) has `z-10` while the columns container has `z-20`. This means the step cards render **on top** of the connection lines, hiding them.

## Fix

Swap the z-index values in `src/components/scenario/WorkflowFlowView.tsx`:

- **SVG overlay**: change from `z-10` to `z-20` (lines render on top)
- **Columns container**: change from `z-20` to `z-10` (cards render below lines)

The SVG already has `pointer-events-none`, so clicks will still pass through to the step cards underneath.

## Scope

One file, two single-line changes in `src/components/scenario/WorkflowFlowView.tsx`.

