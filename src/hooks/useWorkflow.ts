import { useState, useCallback } from "react";
import { Step, ColumnId, StepType, SimTask } from "@/types/workflow";

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
    personaId: "persona_mike",
    flowBehavior: "decision",
    choices: [
      { id: "A1_c1", label: "Initiate walkdown to verify isolations", actionId: "initiate_walkdown", nextStepId: "A2_Perform_Walkdown" },
      { id: "A1_c2", label: "Approve PTW immediately (premature)", actionId: "premature_signoff", nextStepId: "A1B_Redirect" },
    ],
    tasks: [
      { id: "A1_T1", description: "Initiate a walkdown with the crew lead/maintenance lead to verify the isolations and safeguards.", completionCriteria: "Learner initiates a walkdown to physically verify the isolations and safeguards.", isHidden: true, nextNodeId: "A2_Perform_Walkdown" },
      { id: "A1_T2", description: "Learner approves/signs off on PTW immediately without additional verification.", completionCriteria: "Learner indicates they will sign/approve the PTW immediately or says 'approved' before verification steps.", isHidden: false, nextNodeId: "A1B_Redirect" },
    ],
  },
  {
    id: "A1B_Redirect",
    title: "Premature Signoff – Redirect",
    type: "interruption",
    column: "simulation",
    order: 1,
    tasks: [
      { id: "A1B_T1", description: "Redirect the learner back to proper approval flow.", completionCriteria: "Learner is redirected to the approval request.", isHidden: false, nextNodeId: "A1_Remote_Approval_Request" },
    ],
  },
  {
    id: "A2_Perform_Walkdown",
    title: "Perform Walkdown",
    type: "text-chat",
    column: "simulation",
    order: 2,
    personaId: "persona_tom",
    givenResourceIds: ["SWC"],
    flowBehavior: "decision",
    choices: [
      { id: "A2_c1", label: "Verify with isolation list", actionId: "verify_with_list", nextStepId: "A3_SWC_Dialogue" },
      { id: "A2_c2", label: "Verify without isolation list", actionId: "verify_without_list", nextStepId: "O2_Incident_Flange_Break" },
    ],
    tasks: [
      { id: "A2_T1", description: "Verify the isolations and safeguards with the isolation list.", completionCriteria: "Learner verifies the isolations and safeguards.", isHidden: true, nextNodeId: "A3_SWC_Dialogue" },
      { id: "A2_T2", description: "Learner verifies the isolations and safeguards without the isolation list.", completionCriteria: "Learner verifies without the isolation list.", isHidden: true, nextNodeId: "O2_Incident_Flange_Break" },
    ],
  },
  {
    id: "A3_SWC_Dialogue",
    title: "Walkthrough & SWC Dialogue",
    type: "text-chat",
    column: "simulation",
    order: 3,
    personaId: "persona_tom_swc",
    givenResourceIds: ["SWC"],
    tasks: [
      { id: "A3_T1", description: "Ask for zero energy verification.", completionCriteria: "Learner asks for zero energy verification.", isHidden: true, nextNodeId: "A4_Zero_Energy_Verification" },
    ],
  },
  {
    id: "A4_Zero_Energy_Verification",
    title: "Zero Energy Verification",
    type: "text-chat",
    column: "simulation",
    order: 4,
    personaId: "persona_tom_zev",
    givenResourceIds: ["SWC"],
    hiddenResourceIds: ["LOTO"],
    flowBehavior: "decision",
    choices: [
      { id: "A4_c1", label: "Catch bleeder gap – stop & correct", actionId: "catch_bleeder", nextStepId: "O1_Safe_Outcome" },
      { id: "A4_c2", label: "Approve without bleeder check", actionId: "approve_no_bleeder", nextStepId: "O2_Incident_Flange_Break" },
    ],
    tasks: [
      { id: "A4_T1", description: "Ask the crew to show exactly how they proved zero energy.", completionCriteria: "Learner asks 'show me how you verified/proved zero energy' and challenges reliance on gauge/control-room-only confirmation.", isHidden: false },
      { id: "A4_T2", description: "Catch that bleeder/vent was not opened; verify zero energy before proceeding.", completionCriteria: "Learner verifies zero energy before proceeding.", isHidden: false, nextNodeId: "O1_Safe_Outcome" },
      { id: "A4_T3", description: "Learner approves/signs off on start work without requiring the bleeder/vent to be opened/checked.", completionCriteria: "Learner approves without bleeder/vent verification.", isHidden: false, nextNodeId: "O2_Incident_Flange_Break" },
    ],
  },

  // ── Outcomes ──
  {
    id: "O1_Safe_Outcome",
    title: "✅ Safe Proceed (Bleeder Caught)",
    type: "fetch-document",
    column: "simulation",
    order: 5,
    tasks: [
      { id: "O1_T1", description: "Proceed with work only after zero energy is proven and start work expectations are aligned.", completionCriteria: "Learner states conditions met and authorizes proceed with closed-loop confirmation.", isHidden: false, nextNodeId: "D1_Debrief_Safe" },
    ],
  },
  {
    id: "O2_Incident_Flange_Break",
    title: "⚠️ Incident: Flange Break",
    type: "interruption",
    column: "simulation",
    order: 6,
    personaId: "persona_tom_incident",
    tasks: [
      { id: "O2_T1", description: "Confirm evacuation/accountability and initiate immediate controls.", completionCriteria: "Learner confirms evacuation/accountability, communicates immediate controls, uses closed-loop communication.", isHidden: false, nextNodeId: "D2_Debrief_Incident" },
    ],
  },
  {
    id: "O3_Valve_Blowby",
    title: "⚠️ Incident: Valve Blowby",
    type: "interruption",
    column: "simulation",
    order: 7,
    tasks: [
      { id: "O3_T1", description: "Valve blowby. Residual pressure/gas releases.", completionCriteria: "Learner confirms valve blowby, communicates immediate controls.", isHidden: false, nextNodeId: "D2_Debrief_Incident" },
    ],
  },

  // ── Review column: debriefs ──
  {
    id: "D1_Debrief_Safe",
    title: "Debrief – Safe Outcome",
    type: "ai-coach",
    column: "review",
    order: 0,
    personaId: "persona_coach_safe",
    tasks: [
      { id: "D1_T1", description: "Learner articulates lessons learned (verification discipline, critical safeguards, closed-loop communication).", completionCriteria: "Learner states at least 2 concrete lessons learned tied to safeguards verification and communication behaviors.", isHidden: false, nextNodeId: "__end__" },
    ],
  },
  {
    id: "D2_Debrief_Incident",
    title: "Debrief – Incident Outcome",
    type: "ai-coach",
    column: "review",
    order: 1,
    personaId: "persona_coach_incident",
    tasks: [
      { id: "D2_T1", description: "Learner names the missed verification step and prevention behaviors.", completionCriteria: "Learner identifies the missed bleeder/vent verification and states at least 2 concrete prevention behaviors.", isHidden: false, nextNodeId: "__end__" },
    ],
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
    const newStep: Step = { id, title, type, column: selectedColumn, order: colSteps.length };
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

  const addStepToColumn = useCallback((type: StepType, title: string, column: ColumnId, index: number): string => {
    const id = `s${nextId++}`;
    setSteps((prev) => {
      const colSteps = prev.filter((s) => s.column === column).sort((a, b) => a.order - b.order);
      const clampedIndex = Math.max(0, Math.min(index, colSteps.length));
      const newStep: Step = { id, title, type, column, order: clampedIndex };
      colSteps.splice(clampedIndex, 0, newStep);
      colSteps.forEach((s, i) => (s.order = i));
      const otherSteps = prev.filter((s) => s.column !== column);
      return [...otherSteps, ...colSteps];
    });
    setSelectedStepId(id);
    return id;
  }, []);

  const moveStep = useCallback((stepId: string, toColumn: ColumnId, toIndex: number) => {
    setSteps((prev) => {
      const step = prev.find((s) => s.id === stepId);
      if (!step) return prev;
      const withoutStep = prev.filter((s) => s.id !== stepId);
      const targetColSteps = withoutStep.filter((s) => s.column === toColumn).sort((a, b) => a.order - b.order);
      const clampedIndex = Math.max(0, Math.min(toIndex, targetColSteps.length));
      targetColSteps.splice(clampedIndex, 0, { ...step, column: toColumn });
      targetColSteps.forEach((s, i) => (s.order = i));
      const sourceColSteps = toColumn !== step.column
        ? withoutStep.filter((s) => s.column === step.column).sort((a, b) => a.order - b.order)
        : [];
      sourceColSteps.forEach((s, i) => (s.order = i));
      const otherSteps = withoutStep.filter((s) => s.column !== toColumn && s.column !== step.column);
      return [...otherSteps, ...sourceColSteps, ...targetColSteps];
    });
  }, []);

  const importSteps = useCallback((incoming: Step[]) => {
    setSteps(incoming);
    setSelectedStepId(null);
  }, []);

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? null;

  return {
    steps, selectedStep, selectedStepId, selectedColumn,
    setSelectedStepId, setSelectedColumn,
    addStep, addStepToColumn, removeStep, updateStep, moveStep, importSteps,
  };
}
