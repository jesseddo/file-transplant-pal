

# Smarter Initial Layout for Workflow View

## Problem

All workflow nodes are placed on a single horizontal line at y=200 with equal 280px spacing. Decision nodes with multiple branches, back-references, and different targets all sit at the same vertical level, causing edges to cross over nodes and labels to overlap.

## Solution

Replace the flat `autoPosition` with a layout-aware algorithm that:

1. **Groups nodes by column** (Intro, Simulation, Review) with clear horizontal separation between groups
2. **Staggers branch targets vertically** -- when a decision node has multiple targets, those targets fan out vertically instead of sitting on the same row
3. **Places back-reference targets** (like loops back to earlier steps) with enough vertical offset to keep return edges clear
4. **Increases spacing** between nodes both horizontally and vertically to give edges and labels room to breathe

## Layout Strategy

```text
INTRO                    SIMULATION                         REVIEW
 ___________              ___________                        ___________
| Overview  | ---------> | Radio     | --------->           | AI Coach  |
|___________|             |___________|                      |___________|
      |                        |                                  |
      v                        v                                  v
 ___________              ___________    ___________         ___________
| Recom SOP | ---------> | Checklist | -| Clearance|------> | Report    |
|___________|             |_(decision)|  |__________|        |___________|
      |                    /         \
      v                   v           v
 ___________         ___________   ___________
| Safety    |       | Startup   | | Valve Mis |
|___________|       | Auth Check|  |___________|
                    |_(decision)|
```

Nodes within each column are stacked vertically with generous spacing. The main flow proceeds left-to-right, and branch targets that are NOT the next linear step get placed with vertical offsets.

## Technical Details (single file: `src/components/scenario/WorkflowFlowView.tsx`)

### 1. Update `autoPosition` function

Replace the current flat layout with a column-grouped, vertically-stacked layout:

- **Column X positions**: Give each of the 3 columns (intro, simulation, review) a distinct X band. Within each column, steps that branch off the main path get additional horizontal offset.
- **Vertical stacking**: Steps within a column are spaced vertically with ~120px gaps instead of all sitting at y=200.
- **Branch fan-out**: For decision nodes, identify which targets are "off the main path" and offset them vertically and/or horizontally so edges don't overlap the main flow.
- **Increase constants**: Bump `LANE_X_GAP` from 280 to ~320, and use a `LANE_Y_GAP` of ~130 for vertical spacing between steps in the same column.

New layout constants:

| Constant | Old | New |
|----------|-----|-----|
| LANE_X_GAP | 280 | 320 |
| LANE_Y_GAP | (none) | 130 |
| LANE_Y_CENTER | 200 | 80 (top start) |

### 2. Graph-aware positioning

Build a simple dependency graph from `buildConnections` to determine:
- **Main path**: The longest chain of linear connections (the "happy path")
- **Branch targets**: Steps only reachable through branch edges get offset vertically below the main path
- **Back-links**: Connections pointing to earlier steps (loops) -- the source and target are already placed, so no repositioning needed, but extra vertical gap is reserved

Algorithm outline:
1. Identify the main linear chain (steps connected by `type: "linear"`)
2. Place main-chain steps left-to-right with column grouping
3. For each decision node's branch targets that are NOT the next main-chain step, place them in a row below the decision node with horizontal offsets
4. End nodes get positioned to the right and below their source

### 3. Update end node auto-positioning

Currently end nodes are placed at `fromPos.x + NODE_W + 100` at the same Y level. Update to place them with more generous offset (e.g., +160px right, +60px down from the branch handle) to avoid overlapping with other nodes and edges.

### Files Changed

| File | Change |
|------|--------|
| `src/components/scenario/WorkflowFlowView.tsx` | Rewrite `autoPosition` with column-grouped vertical stacking and branch fan-out; update layout constants; adjust end node auto-positioning |

