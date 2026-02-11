

# Restructure: Decision Checkpoint and Scene/Narrative as Step Behaviors

## Overview

Currently, "Decision Checkpoint" and "Scene/Narrative" are standalone step types in the Actions panel. The user wants them to be **behavioral modifiers** that can be applied to any step type. For example, a "Radio Call" step can have a decision checkpoint embedded, meaning the learner must make a branching choice during that radio call.

## Architecture Change

Instead of `type: "decision-checkpoint"`, every step will have an optional `flowBehavior` property:

```text
flowBehavior: "linear" (default) | "decision"
```

- **linear** (default / Scene-Narrative): The step flows to the next step in order. No branching.
- **decision**: The step includes branching choices. At least one choice is required with label, action ID, and next-step target.

## Detailed Changes

### 1. Update `src/types/workflow.ts`

- Remove `"scene-narrative"` and `"decision-checkpoint"` from `StepType` union
- Remove them from `ACTION_TILES`, `STEP_TYPE_LABELS`, `STEP_TYPE_CATEGORY`
- Add a new type: `FlowBehavior = "linear" | "decision"`
- Add `flowBehavior?: FlowBehavior` to the `Step` interface (defaults to `"linear"`)
- Update `isDecisionCheckpointValid` to check `step.flowBehavior === "decision"` instead of `step.type`

### 2. Update `src/components/scenario/StepCard.tsx`

- Replace `step.type === "decision-checkpoint"` checks with `step.flowBehavior === "decision"`
- Show choice count and warning icon based on `flowBehavior`, not `type`
- Add a small indicator (e.g., a fork icon) on any card that has `flowBehavior: "decision"` so it's visually clear this step branches

### 3. Update `src/components/scenario/InspectorPanel.tsx`

- Remove the Scene/Narrative info box and Decision Checkpoint section that are gated on `step.type`
- Add a **Flow Behavior** selector (radio group or dropdown) near the top of the inspector for ALL step types:
  - "Linear" -- step proceeds to next in order
  - "Decision" -- step includes branching choices
- When "Decision" is selected, show the choices editor (same UI as today)
- When "Linear" is selected, hide the choices editor and clear any existing choices

### 4. Update `src/components/scenario/ActionsPanel.tsx`

- Remove "Scene / Narrative" and "Decision Checkpoint" tiles from the Flow category
- Remove the "Flow" category entirely if it becomes empty
- Remove `BookOpen` and `GitFork` icon imports if unused

### 5. Update `src/index.css`

- Remove the Flow badge CSS variables (`--badge-flow`, `--badge-flow-fg`) since the Flow category no longer exists

### 6. Update `src/hooks/useWorkflow.ts`

- No structural changes needed; the `addStep` / `updateStep` functions already handle partial updates which will cover `flowBehavior`

## What stays the same

- The `BranchChoice` interface and choice validation logic remain
- The choices editor UI in the inspector stays identical
- Drag-and-drop, column layout, and all other step types are untouched
- No scoring, conditions, timers, or runtime logic

## Result

Any step (Video, Radio Call, Text Chat, etc.) can be toggled to "Decision" mode in its inspector, gaining branching choices. By default all steps are "Linear." This matches the real-world pattern where a decision point happens *within* an activity rather than as a separate standalone card.

