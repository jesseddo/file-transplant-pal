

# Make the Branching Choices Editor More User-Friendly

## Problem

The current choice editor uses technical labels like **"Action Identifier"** and **"Learner-facing Label"** that feel like developer jargon. Instructional Designers think in terms of what the learner sees and where the story goes next -- not API identifiers.

## Changes

### 1. Simplify field labels and add helper text

| Current Label | New Label | Why |
|---|---|---|
| Learner-facing Label | **Button Text** | IDs understand this immediately -- it's what the learner clicks |
| Action Identifier | **Remove entirely** (auto-generate from label) | IDs don't need this; it's a backend concern |
| Next Step | **Then go to...** | Conversational, matches how IDs think about flow |

### 2. Auto-generate the Action Identifier

Instead of asking the ID to type `evacuate_area`, auto-generate it from the button text by lowercasing and replacing spaces with underscores. Store it silently in `choice.actionId` -- the ID never sees or manages it. This keeps the data structure unchanged while hiding the technical detail.

### 3. Improve choice card layout

- Replace the generic "Choice 1" header with a colored letter badge (A, B, C) for quick visual scanning
- Add a subtle helper sentence below the "Learner Choices" heading: *"What options does the learner see at this point?"*
- Change the "+ Add Choice" button text to **"+ Add Option"** (friendlier wording)
- Update placeholder text to be more contextual: `e.g. "Evacuate the area"` for button text, and keep the dropdown as-is

### 4. Polish the Flow Behavior selector

- Change "Linear -- proceeds to next step" to **"Linear -- continues to the next step automatically"**
- Change "Decision -- learner makes a branching choice" to **"Decision -- the learner picks what to do next"**

## Technical Details

### File: `src/components/scenario/InspectorPanel.tsx`

- Remove the "Action Identifier" input field from the choice card
- Add a `useEffect` or inline logic that auto-generates `actionId` from `label` whenever label changes: `label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')`
- Rename displayed labels as described above
- Add letter badges (A, B, C) using `String.fromCharCode(65 + idx)`
- Add helper text paragraph below the "Learner Choices" label

### File: `src/types/workflow.ts`

No changes -- `BranchChoice` keeps the `actionId` field; it's just auto-populated now.

## What stays the same

- All data structures unchanged
- The `actionId` field still exists and is still stored -- just auto-generated
- Inspector functionality (add/remove/reorder choices) unchanged
- Workflow view unchanged

