

# Open Edit Logic Modal on Node Click (for Decision Steps)

## Summary

Remove the separate "Edit logic" button from decision cards. Instead, clicking a decision node directly opens the Edit Logic modal. The modal will also pre-populate with any existing routing rules so users see current branch configuration immediately.

## Changes

### File: `src/components/scenario/WorkflowFlowView.tsx`

1. **Change node click behavior for decision steps**: In the `onClick` handler on each node card (line 397-399), check if the step is a decision step with choices. If so, open the Edit Logic modal instead of just selecting it. Non-decision steps continue to call `onSelectStep` as before.

2. **Remove the "Edit logic" button**: Delete the `<Button>` element (lines 464-475) that currently triggers the modal from inside the card. The choice list (colored dots + labels) stays visible on the card -- only the button is removed.

3. **Keep branch list visible on card**: The choice dots and labels remain rendered on the card so users can see at a glance which branches exist before clicking.

### File: `src/components/scenario/EditLogicModal.tsx`

4. **Auto-populate rules from existing choices**: When the modal opens and `routingRules` is empty, auto-generate initial rules from `step.choices` that have a `nextStepId` set. This way, if routing was previously configured via the Inspector panel's "Then go to..." selectors, those rules appear pre-filled in the modal.

Update the `useEffect` initialization (lines 34-39):
- If `step.routingRules` has entries, use those (current behavior)
- Otherwise, map `step.choices` into rules: for each choice with a `nextStepId`, create `{ choiceId: choice.id, nextStepId: choice.nextStepId }`
- This ensures existing branch data is shown on first open

## Behavior Summary

| Step type | Click action |
|-----------|-------------|
| Normal step | Select step (existing behavior) |
| Decision step with choices | Open Edit Logic modal |
| Decision step without choices | Select step |

