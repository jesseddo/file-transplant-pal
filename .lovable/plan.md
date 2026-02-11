

# Auto Fit-to-View on First Mount

## What It Does

When you open the Workflow tab, the canvas will automatically zoom and pan so every node is visible and centered -- no manual scrolling or clicking needed.

## How It Works

- The first time positions are ready after mounting, the view adjusts to fit all nodes with comfortable padding
- It only fires once per tab visit -- dragging or zooming afterward won't reset your view
- Switching away and back to the Workflow tab will re-fit to account for any changes made in the Design tab

## Technical Details

**File: `src/components/scenario/WorkflowFlowView.tsx`**

1. Add a `useRef<boolean>` called `hasAutoFitted` (initialized to `false`)
2. Add a `useEffect` watching `positions`:
   - When `Object.keys(positions).length > 0` and `hasAutoFitted.current === false`:
     - Use `requestAnimationFrame` to let the DOM settle
     - Call the existing `handleFitToContent()` function
     - Set `hasAutoFitted.current = true`
3. No other files change

This is a ~10-line addition with zero risk to existing layout or drag behavior.

