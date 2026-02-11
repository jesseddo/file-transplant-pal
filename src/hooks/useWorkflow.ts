import { useState, useCallback } from "react";
import { Step, Connection, ColumnId, StepType } from "@/types/workflow";

const INITIAL_STEPS: Step[] = [
  { id: "s1", title: "Orientation & Media", type: "video", column: "intro", order: 0 },
  { id: "s2", title: "Safety Briefing PDF", type: "pdf", column: "intro", order: 1 },
  { id: "s3", title: "Radio Check-in", type: "radio-call", column: "simulation", order: 0 },
  { id: "s4", title: "Isolation Verification", type: "text-chat", column: "simulation", order: 1 },
  { id: "s5", title: "Coach Review & Unlocks", type: "ai-coach", column: "review", order: 0 },
  { id: "s6", title: "Generate Report", type: "generate-evaluation", column: "review", order: 1 },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { id: "c1", fromStepId: "s1", toStepId: "s2" },
  { id: "c2", fromStepId: "s2", toStepId: "s3" },
  { id: "c3", fromStepId: "s3", toStepId: "s4" },
  { id: "c4", fromStepId: "s4", toStepId: "s5" },
  { id: "c5", fromStepId: "s5", toStepId: "s6" },
];

let nextId = 7;

export function useWorkflow() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnId>("intro");
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);

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
    setConnections((prev) => prev.filter((c) => c.fromStepId !== stepId && c.toStepId !== stepId));
    if (selectedStepId === stepId) setSelectedStepId(null);
  }, [selectedStepId]);

  const updateStep = useCallback((stepId: string, updates: Partial<Step>) => {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  }, []);

  const startConnect = useCallback((stepId: string) => {
    setConnectingFrom(stepId);
  }, []);

  const finishConnect = useCallback((toStepId: string) => {
    if (connectingFrom && connectingFrom !== toStepId) {
      const exists = connections.some(
        (c) => c.fromStepId === connectingFrom && c.toStepId === toStepId
      );
      if (!exists) {
        setConnections((prev) => [
          ...prev,
          { id: `c${nextId++}`, fromStepId: connectingFrom, toStepId: toStepId },
        ]);
      }
    }
    setConnectingFrom(null);
  }, [connectingFrom, connections]);

  const cancelConnect = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  const removeConnection = useCallback((connId: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    if (selectedConnectionId === connId) setSelectedConnectionId(null);
  }, [selectedConnectionId]);

  const updateConnection = useCallback((connId: string, updates: Partial<Connection>) => {
    setConnections((prev) => prev.map((c) => (c.id === connId ? { ...c, ...updates } : c)));
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
  const selectedConnection = connections.find((c) => c.id === selectedConnectionId) ?? null;

  return {
    steps,
    connections,
    selectedStep,
    selectedStepId,
    selectedColumn,
    connectingFrom,
    selectedConnectionId,
    selectedConnection,
    setSelectedStepId,
    setSelectedColumn,
    setSelectedConnectionId,
    addStep,
    removeStep,
    updateStep,
    moveStep,
    startConnect,
    finishConnect,
    cancelConnect,
    removeConnection,
    updateConnection,
  };
}
