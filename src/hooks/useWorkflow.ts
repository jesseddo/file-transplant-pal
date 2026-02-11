import { useState, useCallback } from "react";
import { Step, ColumnId, StepType } from "@/types/workflow";

const INITIAL_STEPS: Step[] = [
  // Intro column
  { id: "s1", title: "P-101 Overview Video", type: "video", column: "intro", order: 0 },
  { id: "s2", title: "Recommissioning SOP", type: "pdf", column: "intro", order: 1 },
  { id: "s3", title: "Pre-Task Safety Audio Brief", type: "audio", column: "intro", order: 2 },

  // Simulation column
  { id: "s4", title: "Radio: Confirm Isolation Status", type: "radio-call", column: "simulation", order: 0 },
  {
    id: "s5", title: "Verify Line-up Checklist", type: "text-chat", column: "simulation", order: 1,
    flowBehavior: "decision",
    choices: [
      { id: "c5a", label: "All valves correct", actionId: "proceed", nextStepId: "s6" },
      { id: "c5b", label: "Valve misalignment found", actionId: "corrective", nextStepId: "s7" },
    ],
  },
  { id: "s6", title: "Fetch Clearance Permit", type: "fetch-document", column: "simulation", order: 2 },
  { id: "s7", title: "Handle Valve Misalignment", type: "interruption", column: "simulation", order: 3 },
  {
    id: "s8", title: "Startup Authorization Check", type: "text-chat", column: "simulation", order: 4,
    flowBehavior: "decision",
    choices: [
      { id: "c8a", label: "Startup approved", actionId: "approve", nextStepId: "s9" },
      { id: "c8b", label: "Startup denied — recheck", actionId: "deny", nextStepId: "s5" },
      { id: "c8c", label: "Emergency condition", actionId: "emergency", nextStepId: "__end__" },
    ],
  },

  // Review column
  { id: "s9", title: "AI Coach: Recommissioning Debrief", type: "ai-coach", column: "review", order: 0 },
  { id: "s10", title: "Generate Competency Report", type: "generate-evaluation", column: "review", order: 1 },
];

let nextId = 11;

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

      // Remove from current position and reorder source column
      const withoutStep = prev.filter((s) => s.id !== stepId);

      // Get target column steps (without the moved step)
      const targetColSteps = withoutStep
        .filter((s) => s.column === toColumn)
        .sort((a, b) => a.order - b.order);

      // Clamp index
      const clampedIndex = Math.max(0, Math.min(toIndex, targetColSteps.length));

      // Insert at position
      targetColSteps.splice(clampedIndex, 0, { ...step, column: toColumn });

      // Re-assign orders for target column
      targetColSteps.forEach((s, i) => (s.order = i));

      // Re-assign orders for source column if different
      const sourceColSteps = toColumn !== step.column
        ? withoutStep.filter((s) => s.column === step.column).sort((a, b) => a.order - b.order)
        : [];
      sourceColSteps.forEach((s, i) => (s.order = i));

      // Build final array: other columns untouched + updated source + updated target
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
