

# Excel Import and Live Editing Pipeline

## Overview

Instructional designers currently build scenarios in Excel spreadsheets. This plan adds a complete pipeline: upload an Excel file, map it to the internal JSON format, render it as an editable scenario, and then let the ID freely add, modify, or remove steps, tasks, personas, and completion criteria -- all within the app.

## How it works for the designer

```text
1. Click "Import Scenario" in the sidebar or header
2. Upload their .xlsx file
3. See a mapping preview: "We found 8 nodes, 4 personas, 3 resources -- does this look right?"
4. Confirm -- the workflow canvas populates with all steps, personas, and branching
5. From there, everything is editable: add new tasks, create new chat steps, link personas, etc.
```

## Phase 1: Excel Parsing (client-side)

**New dependency**: `xlsx` (SheetJS) -- runs entirely in the browser, no backend needed.

**Expected Excel structure** (based on how IDs typically lay these out):

| Column | Maps to |
|--------|---------|
| Node ID | `Step.id` |
| Title | `Step.title` |
| Description | Stored as step metadata |
| Phase (Intro/Simulation/Review) | `Step.column` |
| Type (Chat/Video/PDF/etc.) | `Step.type` |
| Persona Name | Links to or creates a `Persona` |
| Persona Role | `Persona.role` |
| Persona Personality | `Persona.personality` |
| Persona Objective | `Persona.objective` |
| Opening Lines | `Persona.initialMessages` (semicolon-separated) |
| Task Description | `SimTask.description` |
| Completion Criteria | `SimTask.completionCriteria` |
| Hidden Task? | `SimTask.isHidden` |
| Next Node | `SimTask.nextNodeId` or `BranchChoice.nextStepId` |
| Given Resources | `Step.givenResourceIds` (comma-separated) |
| Hidden Resources | `Step.hiddenResourceIds` (comma-separated) |

Since not all IDs will use the exact same column names, the import wizard will include a **column mapping step** where they can match their spreadsheet columns to the expected fields.

**File**: `src/lib/excelImporter.ts`

- Reads the uploaded `.xlsx` using SheetJS
- Extracts rows, auto-detects likely column mappings based on header names
- Groups rows by Node ID (multiple rows per node = multiple tasks)
- Deduplicates personas by name (Tom appearing in 3 nodes = 1 persona with context variants)
- Returns a structured result: `{ steps: Step[], personas: Persona[], resources: SceneResource[], warnings: string[] }`

## Phase 2: Import Wizard UI

**File**: `src/components/scenario/ImportWizardModal.tsx`

A 3-step modal dialog:

**Step 1 -- Upload**
- Drag-and-drop or file picker for `.xlsx` / `.csv`
- Shows file name and row count after parsing

**Step 2 -- Column Mapping**
- Table showing detected columns with dropdown selectors to map each to an internal field
- Auto-maps obvious ones (e.g., "Title" to Title, "Persona" to Persona Name)
- Highlights unmapped required fields

**Step 3 -- Preview and Confirm**
- Shows summary: "12 steps, 4 personas, 3 resources, 2 warnings"
- Warnings for issues like: "Row 8: no Next Node specified -- will default to linear flow"
- "Import" button commits everything to state

## Phase 3: Post-Import Editing (what makes this powerful)

Once imported, the scenario lives in the same `useWorkflow` and `usePersonas` state as a hand-built scenario. The ID can immediately:

### Add new steps not in the original Excel
- Use the existing Actions Panel to drag in new step types (text-chat, video, interruption, etc.)
- New steps appear in the Design tab and can be wired into the flow

### Add or edit completion criteria on any task
- Click any step in the Design tab to open the Inspector Panel
- The "Learner Tasks" section already supports adding/editing/removing tasks
- Each task has: description, completion criteria, hidden toggle, and "then go to" routing

### Create new personas
- The Persona section in the sidebar will get a "+ New Persona" button
- Opens an inline form: name, role, personality, objective, opening lines
- New persona immediately available in the Inspector's persona dropdown

### Rewire branching
- Change "then go to" on any task or decision choice
- Add new decision choices to create additional branches
- The Workflow tab updates in real-time to show the new graph

### Add resources
- Resources section in the Inspector already shows given/hidden resource links
- Will be extended with a resource library (similar to persona library) where IDs can add new documents

## Phase 4: Export Back to JSON

**File**: `src/lib/scenarioExporter.ts`

- "Export JSON" button in the header or settings tab
- Serializes the current `steps`, `personas`, and `resources` state into the `roleplay_definition.json` format
- Downloads as a `.json` file the ID can share or re-import

This closes the loop: Excel in, edit in app, JSON out.

## Technical details

### New files

| File | Purpose |
|------|---------|
| `src/lib/excelImporter.ts` | SheetJS parsing, column detection, row-to-step mapping |
| `src/lib/scenarioExporter.ts` | State-to-JSON serialization and download |
| `src/components/scenario/ImportWizardModal.tsx` | 3-step import dialog (upload, map, preview) |
| `src/components/scenario/PersonaEditorForm.tsx` | Inline form for creating/editing personas |

### Modified files

| File | Change |
|------|--------|
| `src/components/scenario/AppSidebar.tsx` | Add "Import Scenario" button and "+ New Persona" button |
| `src/components/scenario/ScenarioHeader.tsx` | Add "Export JSON" button |
| `src/hooks/useWorkflow.ts` | Add `importSteps(steps: Step[])` method to bulk-replace state |
| `src/hooks/usePersonas.ts` | Add `importPersonas(personas: Persona[])` method |
| `src/pages/Index.tsx` | Wire import wizard modal state |

### Persona deduplication logic

The importer groups persona references by name. If "Tom" appears in 3 different nodes with slightly different personality descriptions (which is common in the JSON), it creates one base persona and stores per-node personality overrides as step-level metadata. This matches the existing pattern where `persona_tom`, `persona_tom_swc`, and `persona_tom_zev` are separate entries but represent the same character in different contexts.

### Edge cases handled

- **Missing Next Node**: defaults to linear flow (next row in order)
- **Circular references**: detected and flagged as warnings, not blocked
- **Empty rows**: skipped silently
- **Unknown step types**: mapped to the closest match or flagged for manual assignment
- **Multiple tasks per node**: rows sharing the same Node ID are grouped as tasks under one step

