
# Improve Workflow Edge Clarity

## Summary

Update the SVG edge rendering in `WorkflowFlowView.tsx` to use smooth Bezier curves, attach branch labels as styled pills on the edge midpoints, and clean up handle anchor logic. No data model changes, no new files.

## Changes (single file: `src/components/scenario/WorkflowFlowView.tsx`)

### 1. Replace Orthogonal Routing with Cubic Bezier

Replace the current path generation (lines 329-331):
```
M x1,y1 H midX V y2 H x2
```

With a cubic Bezier curve:
```
M x1,y1 C (x1+offset),y1 (x2-offset),y2 x2,y2
```

The offset is dynamic based on horizontal distance:
```typescript
const offset = Math.min(120, Math.max(60, Math.abs(x2 - x1) * 0.3));
```

This produces smooth, natural-looking curves instead of sharp right-angle bends. Also apply the same Bezier approach to the `__end__` edge (short dashed line to the End pill).

### 2. Use Dashed Bezier for Fallback Edges

For connections with `label === "fallback"`, render using `strokeDasharray="6 3"` to visually distinguish fallback routing from explicit branch rules.

### 3. Move Branch Labels to Edge Midpoints with Background Pills

Currently labels are rendered at `(x1 + 14, y1 - 4)` near the source handle. Instead:

- Compute the Bezier midpoint at `t = 0.5`:
  ```typescript
  const t = 0.5;
  const mx = (1-t)**3*x1 + 3*(1-t)**2*t*(x1+offset) + 3*(1-t)*t**2*(x2-offset) + t**3*x2;
  const my = (1-t)**3*y1 + 3*(1-t)**2*t*y1 + 3*(1-t)*t**2*y2 + t**3*y2;
  ```
- Render a rounded `<rect>` background pill behind each label using `fill="hsl(var(--card))"` with a thin stroke matching the edge color, and `rx="8"` for rounded corners.
- Render the `<text>` centered on the pill, colored to match the edge stroke.
- Offset the pill slightly above the curve (`my - 8`).
- Use a hidden `<text>` element or estimated character width (~6px per char) to size the pill dynamically.

### 4. Add Invisible Hit Area on Edges

Add a transparent wider stroke (`strokeWidth={14}`, `opacity={0}`) behind each edge path to create a hover/click target for future interactions.

### 5. Standardize Handle Anchors

The current handle positions are already right-to-left (output on right edge of source, input on left edge of target). No change needed to anchor logic -- just confirming this stays as-is.

## Technical Details

### Bezier Midpoint Calculation Helper

```typescript
function bezierMidpoint(
  x1: number, y1: number,
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  x2: number, y2: number,
  t = 0.5
) {
  const mt = 1 - t;
  return {
    x: mt**3*x1 + 3*mt**2*t*cx1 + 3*mt*t**2*cx2 + t**3*x2,
    y: mt**3*y1 + 3*mt**2*t*cy1 + 3*mt*t**2*cy2 + t**3*y2,
  };
}
```

### Updated Edge Rendering (pseudocode)

```typescript
const offset = Math.min(120, Math.max(60, Math.abs(x2 - x1) * 0.3));
const cx1 = x1 + offset, cy1 = y1;
const cx2 = x2 - offset, cy2 = y2;
const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
const isDashed = conn.label === "fallback";

// Invisible hit area
<path d={pathData} stroke="transparent" strokeWidth={14} fill="none" />
// Visible edge
<path d={pathData} stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
      strokeDasharray={isDashed ? "6 3" : undefined} />
// Arrowhead dot at target
<circle cx={x2} cy={y2} r={3} fill={strokeColor} />

// Label pill at midpoint
if (conn.label) {
  const mid = bezierMidpoint(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
  const textW = conn.label.length * 6 + 12;
  <rect x={mid.x - textW/2} y={mid.y - 18} width={textW} height={16}
        rx={8} fill="hsl(var(--card))" stroke={strokeColor} strokeWidth={1} />
  <text x={mid.x} y={mid.y - 7} textAnchor="middle"
        fill={strokeColor} fontSize={10} fontWeight={500}>{conn.label}</text>
}
```

### Files Changed

| File | Change |
|------|--------|
| `src/components/scenario/WorkflowFlowView.tsx` | Replace orthogonal paths with Bezier curves, add `bezierMidpoint` helper, render label pills at edge midpoints, add invisible hit areas, dashed style for fallback edges |
