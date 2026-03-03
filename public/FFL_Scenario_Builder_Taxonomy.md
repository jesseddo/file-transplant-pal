# FFL Platform — Scenario Builder Taxonomy

## Overview

The scenario builder uses a layered taxonomy to organize training content. This framework separates **what the learner experiences** (Activities) from **what the designer configures behind the scenes** (Mechanics), all organized within narrative containers (Scenes).

---

## Hierarchy

```
SCENARIO (the full training experience)
├── PHASE: Intro
├── PHASE: Simulation
│   ├── SCENE (a narrative moment with a persona and goal)
│   │   ├── ACTIVITIES (learner-facing)
│   │   └── MECHANICS (designer-facing)
│   ├── SCENE
│   └── SCENE
└── PHASE: Review
```

---

## Levels

| Level        | What it answers                              | Who cares               |
|--------------|----------------------------------------------|-------------------------|
| **Scenario** | "What are we training?"                      | Stakeholder, SME, ID    |
| **Phase**    | "What stage of the experience?" (Intro → Sim → Review) | ID             |
| **Scene**    | "What's happening in the story right now?"   | SME + ID together       |
| **Activity** | "What does the learner *do*?" (visible)      | SME leads, ID implements|
| **Mechanic** | "What's happening under the hood?" (may be hidden) | ID leads, SME reviews |

---

## Activities (Learner-Facing)

These are what the learner sees and interacts with during the scenario.

### Communication
| Activity       | Description                                      |
|----------------|--------------------------------------------------|
| **Text Chat**  | Async messaging simulation with a persona        |
| **Radio Call**  | Real-time voice-style simulation                 |

### Media
| Activity          | Description                                   |
|-------------------|-----------------------------------------------|
| **Video**         | Introductory or contextual video content      |
| **Audio**         | Narration, ambient audio, or radio ambience   |
| **PDF / Document**| Reference documents (permits, checklists, etc.)|

### Immersive
| Activity            | Description                                 |
|---------------------|---------------------------------------------|
| **3D Environment**  | Spatial walkthrough or interactive scene     |

### Reflection
| Activity               | Description                              |
|------------------------|------------------------------------------|
| **AI Coach Reflection**| Post-scene guided debrief with AI coach  |

---

## Mechanics (Designer-Facing)

These are configured by the ID/SME in the Inspector panel. They may be hidden from or visible to the learner depending on the design intent.

### Flow Control
| Mechanic            | Description                                           | Visible to learner? |
|---------------------|-------------------------------------------------------|---------------------|
| **Decision Point**  | Branch the scenario based on learner choice           | Yes (learner makes a choice) |
| **Redirect / Loop** | Send learner back to a previous scene to retry        | Yes (learner re-experiences) |
| **Routing Rules**   | Hidden task-based routing — AI determines next scene  | No                  |

### Assessment
| Mechanic                | Description                                       | Visible to learner? |
|-------------------------|---------------------------------------------------|---------------------|
| **Competency Tracking** | Silently score learner against competency criteria | No                  |
| **Evaluation Report**   | Generate a scored output at end of scenario       | Yes (end result)    |
| **Completion Criteria** | Define what "done" looks like for a task          | No                  |

### Behavioral
| Mechanic                | Description                                       | Visible to learner? |
|-------------------------|---------------------------------------------------|---------------------|
| **Interruption Trigger**| Timed or conditional unexpected event injection   | Yes (learner experiences it) |
| **Parallel Pressure**   | Concurrent task injection to simulate pressure    | Yes (learner experiences it) |
| **Hidden Tasks**        | Criteria the learner is evaluated on but can't see| No                  |

---

## Example: How They Combine

A single **Scene** like "Zero Energy Verification" might contain:

- **Activity**: Text Chat with Tom (learner-facing)
- **Mechanics**:
  - **Decision Point** → routes to Safe Outcome or Incident scene (designer-configured, learner chooses)
  - **Competency Tracking**: "Safeguard Verification" scored silently (hidden from learner)
  - **Hidden Task**: "Learner must challenge gauge-only confirmation" (learner doesn't see this criteria)
  - **Interruption Trigger**: if learner approves too quickly, Tom pushes back (conditional)

---

## In the Builder UI

- The **Activity Palette** (right panel) = what you drag onto the canvas. The learner will experience these.
- The **Inspector Panel** (opens when selecting a step) = where you layer on Mechanics. Both Activities and Mechanics are visible to the ID/SME in the builder, but only Activities are visible to the learner at runtime.

---

*FFL Platform — Scenario Builder Taxonomy v1.0*
