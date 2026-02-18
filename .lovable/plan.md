# Scenario Dashboard -- Create & Manage Projects

## What changes for the user

Today the app opens directly into a single hardcoded scenario editor. After this change:

1. The **designer** **landing page (**`/`**)** becomes a **Scenario Dashboard** showing all created scenarios as cards
2. Each card shows the scenario name, creation date, status (Draft/Published), step count, and persona count
3. A prominent **"Create Scenario"** button opens a dialog where the user fills in metadata and optionally imports an Excel/JSON file in one flow
4. Clicking a scenario card navigates to `**/scenario/:id**` which loads the existing editor (currently at `/`)
5. The "Back to scenarios" breadcrumb in the header becomes a real link back to the dashboard

## Dashboard card details

Each scenario card will display:

- **Name** (user-provided)
- **Description** (optional short summary)
- **Target role** (e.g., "Outside Operator / Permit Approver")
- **Status** badge: Draft or Published
- **Criticality** badge: Safety Critical, Operational, etc.
- **Created date** and **Last modified date**
- **Step count** and **Persona count** (computed from data)
- **Estimated duration** (e.g., "20-30 min", user-provided)

## Create Scenario flow

A modal dialog with two sections:

**Section 1 -- Scenario Details**

- Name (required)
- Description (optional)
- Target role (optional)
- Estimated duration (optional)
- Criticality level (dropdown: Safety Critical, Operational, Training)

**Section 2 -- Import Source (optional)**

- Three options presented as selectable cards:
  - "Start from scratch" (default) -- creates an empty scenario
  - "Import from Excel/CSV" -- opens file picker, runs existing import pipeline
  - "Import from JSON" -- opens file picker, runs existing JSON importer
- If importing, the file is parsed and the steps/personas are pre-loaded into the new scenario

## Technical approach

### New types

A `Scenario` interface added to `src/types/workflow.ts`:

```
interface Scenario {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  estimatedDuration: string;
  criticality: "safety-critical" | "operational" | "training";
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  steps: Step[];
  personas: Persona[];
  resources: SceneResource[];
}
```

### New files


| File                                              | Purpose                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------- |
| `src/pages/Dashboard.tsx`                         | Dashboard page with scenario cards grid and create button        |
| `src/components/scenario/CreateScenarioModal.tsx` | Modal for entering scenario metadata + optional import           |
| `src/components/scenario/ScenarioCard.tsx`        | Card component for each scenario in the grid                     |
| `src/hooks/useScenarios.ts`                       | State management for the list of scenarios (localStorage-backed) |


### Modified files


| File                                         | Change                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types/workflow.ts`                      | Add `Scenario` interface and `CriticalityLevel` type                                                                                       |
| `src/App.tsx`                                | Add route `/` for Dashboard and `/scenario/:id` for the editor                                                                             |
| `src/pages/Index.tsx`                        | Rename to `ScenarioEditor.tsx`; read scenario ID from URL params; load scenario data from the scenarios hook                               |
| `src/components/scenario/ScenarioHeader.tsx` | Make "Back to scenarios" a real `Link` to `/`; display dynamic scenario name, dates, and metadata instead of hardcoded text                |
| `src/hooks/useWorkflow.ts`                   | Accept initial steps as a parameter instead of using hardcoded `INITIAL_STEPS`; the hardcoded data becomes the seed for a default scenario |


### State management

- `useScenarios` hook stores an array of `Scenario` objects in React state, persisted to `localStorage`
- On first load, it seeds one default scenario using the current hardcoded steps and personas
- Creating a new scenario adds an entry; navigating to it loads its steps into the editor
- Saving happens automatically (steps/personas sync back to the scenario entry on change)

### Routing

```
/                  --> Designer Dashboard (list of scenarios)
/scenario/:id      --> Scenario Editor (current Index page)
```

### Dashboard layout

- Clean grid of scenario cards (responsive: 1 column on mobile, 2-3 on desktop)
- Top bar with app title and "Create Scenario" primary button
- Empty state with illustration and "Create your first scenario" prompt
- Each card has a subtle hover effect and click navigates to the editor