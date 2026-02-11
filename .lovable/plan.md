

# Horizontal Workflow Layout (Typeform-style)

## Overview

Change the Workflow canvas from a vertical column layout to a horizontal left-to-right flow, matching the Typeform reference screenshot. Steps flow left to right across the canvas. Each node keeps its column color-coding so users can visually distinguish Intro, Simulation, and Review phases.

## What Changes

### 1. Auto-position algorithm becomes horizontal

Instead of placing columns side-by-side vertically, steps are laid out in a single horizontal line (left to right), grouped by phase:

```text
Current (vertical lanes):        New (horizontal flow):
  INTRO    SIM    REVIEW           INTRO steps -> SIM steps -> REVIEW steps
  step1   step4   step9            [s1]-[s2]-[s3]-[s4]-[s5]-[s6]-...-[s10]
  step2   step5   step10                         (left to right)
  step3   step6                   Branches fork vertically (below the main line)
          step7
          step8
```

Auto-arrange positions:
- All steps placed along y = 200 (center of canvas)
- x starts at 100, each step spaced 280px apart (NODE_W + 60px gap)
- Decision branches fork downward (y + 140 per branch row)

### 2. Color-coded nodes by column/phase

Each node card gets a subtle left border or background tint matching its column:
- **Intro** nodes: left border using `--column-header-intro` color
- **Simulation** nodes: left border using `--column-header-sim` color  
- **Review** nodes: left border using `--column-header-review` color

This replaces the floating column header labels, since in a horizontal layout the columns are no longer spatially separated.

### 3. Connection lines become horizontal

SVG connections change from vertical curves to horizontal curves:
- Linear connections: draw from right edge of source node to left edge of target node (horizontal bezier)
- Branch connections: exit from right edge, curve down/up to the target node's left edge
- End markers: short horizontal dashed line to a red "End" pill

### 4. Remove column header labels

The floating "Intro", "Simulation", "Review" header labels are removed since they don't apply to a free-form horizontal layout. The color-coding on each node communicates the phase instead.

## Technical Details

### File: `src/components/scenario/WorkflowFlowView.tsx`

**`autoPosition()` function** -- rewrite to horizontal layout:
- Sort steps in flat order: intro steps (by order), then simulation (by order), then review (by order)
- Place each step at `{ x: 100 + i * 280, y: 200 }`
- For decision steps with branches, offset branch targets vertically if they sit below the main line

**Connection drawing** -- change anchor points:
- Source anchor: right edge center `(pos.x + NODE_W, pos.y + NODE_H/2)`
- Target anchor: left edge center `(pos.x, pos.y + NODE_H/2)`
- Bezier: horizontal S-curve `M x1,y1 C x1+offset,y1 x2-offset,y2 x2,y2`

**Node rendering** -- add column color border:
- Add a 3px left border colored by column phase (intro = blue-ish, simulation = indigo-ish, review = purple-ish) using existing CSS variables
- Remove the column header `div` elements

**Constants updated**:
- `LANE_Y_START` replaced with `LANE_X_START = 100`
- `LANE_X_GAP = 280` (horizontal spacing)
- `NODE_W` stays 220, `NODE_H` stays 70

No changes to other files -- only `WorkflowFlowView.tsx` is modified.
