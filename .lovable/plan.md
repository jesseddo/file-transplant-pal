

# Make Workflow Tab Read-Only (Remove Inspector Panel)

## Change

Remove the Inspector panel from the Workflow tab so clicking a node only highlights it visually. All step editing happens exclusively in the Design tab.

## Technical Details

### File: `src/pages/Index.tsx`

- Remove the `InspectorPanel` rendering block inside the `activeTab === "workflow"` section (lines 73-80)
- Keep `onSelectStep` wired up so nodes can still be visually highlighted when clicked, but no panel opens

This is a small, isolated change -- no other files are affected.

