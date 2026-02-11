

# Add "Edit Logic" Modal for Branching Rules

## Overview

Add a Typeform-style modal accessible from decision step cards in the Workflow view. The modal provides a clean rule-based interface for configuring routing logic, separate from the choice definition in the Inspector panel.

## What Changes

### 1. Data Model Extension (`src/types/workflow.ts`)

Add two new optional fields to the `Step` interface:

- `routingRules?: { choiceId: string; nextStepId: string }[]` -- ordered list mapping a choice to a destination
- `fallbackNextStepId?: string` -- destination for any choice not covered by a rule

No migration needed -- existing `choices[].nextStepId` data stays as-is. The new fields are optional and additive.

### 2. New Component: `EditLogicModal` (`src/components/scenario/EditLogicModal.tsx`)

A Dialog-based modal containing:

- **Title**: "Edit logic for [Step Title]"
- **Rules list**: Each row renders: `IF [Choice Selected] [is] [dropdown of choices] THEN Go to [dropdown of steps]`
  - Choice dropdown populated from `step.choices`
  - Destination dropdown populated from all other steps + "End Scenario"
  - Each row has a delete button
- **"+ Add rule" button** at the bottom of the list
- **Fallback row**: "All other cases go to [destination dropdown]"
- **Footer**: Save and Cancel buttons

On Save, writes `routingRules` and `fallbackNextStepId` to the step via `onUpdateStep`.

### 3. "Edit Logic" Button on Workflow Cards (`src/components/scenario/WorkflowFlowView.tsx`)

For decision step cards (those with `flowBehavior === "decision"` and choices), add a small "Edit logic" button below the branch list. Clicking it opens the `EditLogicModal` and stops propagation so it doesn't trigger node drag or selection.

### 4. Wire Edge Visualization to New Data (`src/components/scenario/WorkflowFlowView.tsx`)

Update `buildConnections` to prefer `routingRules` when present:

- If `step.routingRules` exists and is non-empty, build branch connections from it instead of from `choices[].nextStepId`
- Add a linear connection for `fallbackNextStepId` if set
- Fall back to existing `choices[].nextStepId` behavior if no routing rules are defined (backward compatible)

### 5. Inspector Panel Unchanged

The existing "Learner Choices" section in `InspectorPanel.tsx` keeps its "Then go to..." selector. No removal or refactor. Both paths can set routing; the Edit Logic modal is the primary one for the Workflow view.

## Technical Details

### EditLogicModal Props

```typescript
interface EditLogicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: Step;
  allSteps: Step[];
  onSave: (stepId: string, updates: Partial<Step>) => void;
}
```

### Internal State

The modal manages local draft state (rules array + fallback) initialized from `step.routingRules` / `step.fallbackNextStepId`. On Save, it calls `onSave` with the updated fields. On Cancel, it discards changes.

### Rule Row Layout

```
[ IF ] [ Choice Selected v ] [ is ] [ Choice Label v ] [ THEN Go to ] [ Step v ] [ X ]
```

Each rule is a `{ choiceId: string; nextStepId: string }` pair. The choice dropdown shows available choices from `step.choices`. The destination dropdown shows all steps (excluding current) plus "End Scenario" (`__end__`).

### Connection Building Update

```typescript
// In buildConnections:
if (step.routingRules && step.routingRules.length > 0) {
  // Use routingRules for branch connections
  step.routingRules.forEach((rule, idx) => {
    const choice = step.choices?.find(c => c.id === rule.choiceId);
    connections.push({
      fromId: step.id,
      toId: rule.nextStepId,
      type: "branch",
      label: choice?.label,
      color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
      branchIndex: idx,
      branchTotal: step.routingRules!.length,
    });
  });
  // Add fallback connection if set
  if (step.fallbackNextStepId) {
    connections.push({
      fromId: step.id,
      toId: step.fallbackNextStepId,
      type: "linear",
      label: "fallback",
    });
  }
} else {
  // Existing behavior using choices[].nextStepId
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/types/workflow.ts` | Add `routingRules` and `fallbackNextStepId` to `Step` interface |
| `src/components/scenario/EditLogicModal.tsx` | New file -- the modal component |
| `src/components/scenario/WorkflowFlowView.tsx` | Add "Edit logic" button on decision cards, update `buildConnections`, import modal |

