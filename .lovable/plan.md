

# P-101 Isobutane Pump Recommissioning -- Branching Scenario Data

## Overview

Replace the current 6-step placeholder data in `useWorkflow.ts` with a realistic **P-101 Isobutane Pump Recommissioning** scenario that includes decision points and branching. This will demonstrate the Workflow view's visualization capabilities without changing any data structures or components.

## The Scenario (Domain Context)

A field operator is recommissioning an isobutane pump (P-101) after maintenance. The training scenario walks them through safety orientation, a simulated field task with decision checkpoints, and a final review/evaluation.

## Proposed Steps and Branching

### Intro Column (3 steps)
1. **P-101 Overview Video** (video) -- orientation video about the pump system
2. **Recommissioning SOP** (pdf) -- standard operating procedure document
3. **Pre-Task Safety Audio Brief** (audio) -- audio walkthrough of hazards

### Simulation Column (5 steps, including 2 decision points)
4. **Radio: Confirm Isolation Status** (radio-call) -- trainee calls control room to verify isolation
5. **Verify Line-up Checklist** (text-chat, DECISION) -- trainee verifies valve positions via chat simulation
   - Branch A: "All valves correct" --> proceeds to step 6
   - Branch B: "Valve misalignment found" --> goes to step 7 (interruption for corrective action)
6. **Fetch Clearance Permit** (fetch-document) -- retrieve the work permit
7. **Handle Valve Misalignment** (interruption) -- corrective action for the error path
8. **Startup Authorization Check** (text-chat, DECISION) -- control room grants or denies startup
   - Branch A: "Startup approved" --> proceeds to step 9 (review)
   - Branch B: "Startup denied -- recheck" --> loops back to step 5
   - Branch C: "Emergency condition" --> ends scenario

### Review Column (2 steps)
9. **AI Coach: Recommissioning Debrief** (ai-coach) -- reflection on decisions made
10. **Generate Competency Report** (generate-evaluation) -- final evaluation

## Flow Visualization (what the Workflow tab will show)

```text
INTRO                    SIMULATION                              REVIEW
+-----------------+      +-------------------------+
| P-101 Overview  |----->| Radio: Confirm          |
| (video)         |      | Isolation Status        |
+-----------------+      +-------------------------+
                                  |
+-----------------+      +-------------------------+
| Recommissioning |      | Verify Line-up          |
| SOP (pdf)       |      | Checklist (DECISION)    |--+
+-----------------+      +---+---------------------+  |
                              |                        |
+-----------------+      "All valves    "Valve         |
| Pre-Task Safety |      correct"      misalignment"   |
| Audio (audio)   |         |               |          |
+-----------------+         v               v          |
                     +-------------+ +---------------+ |
                     | Fetch       | | Handle Valve  | |
                     | Clearance   | | Misalignment  | |
                     | Permit      | | (interruption)| |
                     +------+------+ +-------+-------+ |
                            |                |          |
                            +---+------------+          |
                                |                       |
                     +----------v-----------+           |
                     | Startup Auth Check   |           |
                     | (DECISION)           |           |
                     +--+-------+--------+--+           |
                        |       |        |              |
                  "Approved" "Denied" "Emergency"       |
                        |    (back to    |              |
                        |    Verify)   [END]     +------+------+
                        |       |                | AI Coach    |
                        +-------+--------------->| Debrief     |
                                                 +------+------+
                                                        |
                                                 +------v------+
                                                 | Generate    |
                                                 | Report      |
                                                 +-------------+
```

## Technical Changes

### File: `src/hooks/useWorkflow.ts`

Replace the `INITIAL_STEPS` array with 10 steps. Two steps use `flowBehavior: "decision"` with populated `choices` arrays:

- Step s5 ("Verify Line-up Checklist"): 2 branches
- Step s8 ("Startup Authorization Check"): 3 branches (including one `__end__`)

Update `nextId` to `11`.

No other files change. The existing `WorkflowFlowView` component will automatically render the nodes and SVG connections from this data.

