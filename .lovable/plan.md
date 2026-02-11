

# Add Workflow View Toggle

## Overview

Add a "Workflow" tab next to the existing "Design" tab that provides a read-only node-and-edge visualization of scenario flow and branching logic. The Design tab remains unchanged as the content authoring view. No data structures are modified.

## Changes

### 1. Add Workflow tab -- `src/pages/Index.tsx`

- Add "Workflow" to the tab list: `["Design", "Workflow", "Dependencies", "Settings", "Preview"]`
- Default remains `"design"`
- When `activeTab === "workflow"`, render a new `WorkflowFlowView` component
- The InspectorPanel still opens when a step is selected (clicking a node in workflow view selects it)
- Switching tabs does not reset any state -- `useWorkflow` hook and `selectedStepId` persist across views

### 2. Create `src/components/scenario/WorkflowFlowView.tsx` (new file)

A read-only visualization component receiving `steps`, `selectedStepId`, and `onSelectStep` props.

**Layout:**
- Three column groups (Intro, Simulation, Review) arranged left-to-right
- Steps rendered as compact node cards within each column, stacked vertically by order
- An SVG overlay draws connection lines between nodes

**Node rendering:**
- Each node shows: step title, type badge, and a fork icon if `flowBehavior === "decision"`
- Clicking a node calls `onSelectStep` to open the existing inspector panel (same as Design view)
- Selected node gets a highlighted border
- Decision steps get a distinct visual highlight (colored border or badge)

**Edge rendering:**
- Linear flow: gray curved SVG paths connecting each step to the next in sequence (within columns and across column boundaries)
- Decision branches: colored SVG paths from decision steps to each choice's `nextStepId` target, with small labels showing choice text
- Terminal nodes: a small "End" pill rendered when `nextStepId === "__end__"`
- Connections computed using `useRef` + `useEffect` to measure node positions after render, recalculated when steps change

**Validation hints (informational only, non-blocking):**
- Decision steps with missing or incomplete connections show an orange border and warning icon
- Steps that end the scenario show an "End" indicator
- No blocking errors

**Constraints enforced in this component:**
- No step creation, deletion, or reordering
- No editing of branching rules (inspector is used for review only from this view)
- No drag-and-drop
- Purely a visualization layer reading from the existing `steps` array

### 3. Minor style additions -- `src/index.css`

- Add CSS for workflow node cards, edge colors, and the "End" terminal pill (reusing existing theme tokens)

## What stays the same

- All step data structures (`Step`, `BranchChoice`, `FlowBehavior`) unchanged
- The `useWorkflow` hook unchanged
- Design tab, WorkflowCanvas, StepCard, ActionsPanel, InspectorPanel all unchanged
- No branching logic duplicated -- workflow view reads the same data

## File summary

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | Edit -- add "Workflow" tab, conditionally render WorkflowFlowView |
| `src/components/scenario/WorkflowFlowView.tsx` | Create -- node-and-edge flow visualization |
| `src/index.css` | Minor additions for workflow node and edge styling |

