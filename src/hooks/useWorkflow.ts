import { useState, useCallback } from "react";
import { Step, ColumnId, StepType } from "@/types/workflow";

/**
 * Steps derived from roleplay_definition.json
 * Node → Step mapping:
 *   - Nodes with role_play_persona + is_debrief → ai-coach
 *   - Nodes with role_play_persona (chat sim) → text-chat
 *   - Redirect / outcome nodes without persona → interruption
 *   - sceneResources → pdf (intro)
 *
 * Branching: tasks with different next_node_id → decision choices
 */
const INITIAL_STEPS: Step[] = [
  // ── Intro column: scene resources ──
  { id: "intro_overview", title: "Scenario Overview: Zero Energy Verification", type: "video", column: "intro", order: 0 },
  { id: "PTW", title: "Permit to Work (PTW)", type: "pdf", column: "intro", order: 1 },
  { id: "SWC", title: "Start Work Check (SWC) Form", type: "pdf", column: "intro", order: 2 },
  { id: "LOTO", title: "Isolation List – P-101", type: "pdf", column: "intro", order: 3 },

  // ── Simulation column ──
  {
    id: "A1_Remote_Approval_Request",
    title: "Remote Approval Request",
    type: "text-chat",
    column: "simulation",
    order: 0,
    flowBehavior: "decision",
    choices: [
      { id: "A1_c1", label: "Initiate walkdown to verify isolations", actionId: "initiate_walkdown", nextStepId: "A2_Perform_Walkdown" },
      { id: "A1_c2", label: "Approve PTW immediately (premature)", actionId: "premature_signoff", nextStepId: "A1B_Redirect" },
    ],
  },
  {
    id: "A1B_Redirect",
    title: "Premature Signoff – Redirect",
    type: "interruption",
    column: "simulation",
    order: 1,
    flowBehavior: "linear",
    // loops back to A1 (rendered as edge only)
    choices: [
      { id: "A1B_c1", label: "Redirect back to approval", actionId: "redirect", nextStepId: "A1_Remote_Approval_Request" },
    ],
  },
  {
    id: "A2_Perform_Walkdown",
    title: "Perform Walkdown",
    type: "text-chat",
    column: "simulation",
    order: 2,
    flowBehavior: "decision",
    choices: [
      { id: "A2_c1", label: "Verify with isolation list", actionId: "verify_with_list", nextStepId: "A3_SWC_Dialogue" },
      { id: "A2_c2", label: "Verify without isolation list", actionId: "verify_without_list", nextStepId: "O2_Incident_Flange_Break" },
    ],
  },
  {
    id: "A3_SWC_Dialogue",
    title: "Walkthrough & SWC Dialogue",
    type: "text-chat",
    column: "simulation",
    order: 3,
  },
  {
    id: "A4_Zero_Energy_Verification",
    title: "Zero Energy Verification",
    type: "text-chat",
    column: "simulation",
    order: 4,
    flowBehavior: "decision",
    choices: [
      { id: "A4_c1", label: "Catch bleeder gap – stop & correct", actionId: "catch_bleeder", nextStepId: "O1_Safe_Outcome" },
      { id: "A4_c2", label: "Approve without bleeder check", actionId: "approve_no_bleeder", nextStepId: "O2_Incident_Flange_Break" },
    ],
  },

  // ── Outcomes (still simulation column) ──
  {
    id: "O1_Safe_Outcome",
    title: "✅ Safe Proceed (Bleeder Caught)",
    type: "fetch-document",
    column: "simulation",
    order: 5,
  },
  {
    id: "O2_Incident_Flange_Break",
    title: "⚠️ Incident: Flange Break",
    type: "interruption",
    column: "simulation",
    order: 6,
  },
  {
    id: "O3_Valve_Blowby",
    title: "⚠️ Incident: Valve Blowby",
    type: "interruption",
    column: "simulation",
    order: 7,
  },

  // ── Review column: debriefs ──
  {
    id: "D1_Debrief_Safe",
    title: "Debrief – Safe Outcome",
    type: "ai-coach",
    column: "review",
    order: 0,
  },
  {
    id: "D2_Debrief_Incident",
    title: "Debrief – Incident Outcome",
    type: "ai-coach",
    column: "review",
    order: 1,
  },
  {
    id: "eval",
    title: "Generate Competency Report",
    type: "generate-evaluation",
    column: "review",
    order: 2,
  },
];

let nextId = 100;

export function useWorkflow() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>("intro");

  const addStep = useCallback((type: StepType, title: string) => {
    const id = `s${nextId++}`;
    const colSteps = steps.filter((s) => s.column === selectedColumn);
    const newStep: Step = {
      id,
      title,
      type,
      column: selectedColumn,
      order: colSteps.length,
    };
    setSteps((prev) => [...prev, newStep]);
    setSelectedStepId(id);
  }, [selectedColumn, steps]);

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    if (selectedStepId === stepId) setSelectedStepId(null);
  }, [selectedStepId]);

  const updateStep = useCallback((stepId: string, updates: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  }, []);

  const addStepToColumn = useCallback((type: StepType, title: string, column: ColumnId, index: number) => {
    const id = `s${nextId++}`;
    setSteps((prev) => {
      const colSteps = prev
        .filter((s) => s.column === column)
        .sort((a, b) => a.order - b.order);
      const clampedIndex = Math.max(0, Math.min(index, colSteps.length));
      const newStep: Step = { id, title, type, column, order: clampedIndex };
      colSteps.splice(clampedIndex, 0, newStep);
      colSteps.forEach((s, i) => (s.order = i));
      const otherSteps = prev.filter((s) => s.column !== column);
      return [...otherSteps, ...colSteps];
    });
    setSelectedStepId(id);
  }, []);

  const moveStep = useCallback((stepId: string, toColumn: ColumnId, toIndex: number) => {
    setSteps((prev) => {
      const step = prev.find((s) => s.id === stepId);
      if (!step) return prev;
      const withoutStep = prev.filter((s) => s.id !== stepId);
      const targetColSteps = withoutStep
        .filter((s) => s.column === toColumn)
        .sort((a, b) => a.order - b.order);
      const clampedIndex = Math.max(0, Math.min(toIndex, targetColSteps.length));
      targetColSteps.splice(clampedIndex, 0, { ...step, column: toColumn });
      targetColSteps.forEach((s, i) => (s.order = i));
      const sourceColSteps = toColumn !== step.column
        ? withoutStep.filter((s) => s.column === step.column).sort((a, b) => a.order - b.order)
        : [];
      sourceColSteps.forEach((s, i) => (s.order = i));
      const otherSteps = withoutStep.filter(
        (s) => s.column !== toColumn && s.column !== step.column
      );
      return [...otherSteps, ...sourceColSteps, ...targetColSteps];
    });
  }, []);

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

  return {
    steps,
    selectedStep,
    selectedStepId,
    selectedColumn,
    setSelectedStepId,
    setSelectedColumn,
    addStep,
    addStepToColumn,
    removeStep,
    updateStep,
    moveStep,
  };
}
