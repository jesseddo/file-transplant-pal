export type ColumnId = "intro" | "simulation" | "review";

export type StepType =
  | "video"
  | "pdf"
  | "audio"
  | "text-chat"
  | "radio-call"
  | "ai-coach"
  | "fetch-document"
  | "generate-evaluation"
  | "interruption"
  | "parallel-order"
  | "3d-environment"
  | "decision-checkpoint"
  | "redirect-loop"
  | "resume-point";

export type FlowBehavior = "linear" | "conditional" | "gated" | "interruption" | "timing";

export type EvaluationWeight = "high" | "medium" | "low" | "none";

export interface EvaluationConfig {
  competencyTags: string[];
  weight: EvaluationWeight;
  threshold?: number; // optional pass level 0-100
}

// Which flow types each step type supports
export const FLOW_COMPATIBILITY: Record<StepType, FlowBehavior[]> = {
  video: ["linear", "conditional", "interruption", "timing"],
  audio: ["linear", "gated", "timing"],
  pdf: ["linear", "conditional", "gated"],
  "text-chat": ["linear", "conditional", "gated", "interruption", "timing"],
  "radio-call": ["linear", "conditional", "gated", "interruption", "timing"],
  "3d-environment": ["linear", "conditional", "gated", "timing"],
  "ai-coach": ["linear", "conditional"],
  "fetch-document": ["linear"],
  "generate-evaluation": ["linear"],
  interruption: ["linear"],
  "parallel-order": ["linear", "timing"],
  "decision-checkpoint": ["linear", "conditional"],
  "redirect-loop": ["linear", "conditional"],
  "resume-point": ["linear"],
};

export const FLOW_LABELS: Record<FlowBehavior, { label: string; description: string }> = {
  linear: { label: "Linear", description: "Goes to the next step. Default." },
  conditional: { label: "Conditional", description: "Branches based on what the learner did or said." },
  gated: { label: "Gated", description: "Blocks progress until a condition is met." },
  interruption: { label: "Interruption", description: "A concurrent event that fires on top of the current step." },
  timing: { label: "Timing Pressure", description: "Silent timer that affects evaluation if the learner takes too long." },
};

export type StepCategory = "Media" | "Resources" | "Communication" | "Coaching" | "Flow Control" | "Assessment" | "Triggers";

// ── Persona ──

export interface Persona {
  id: string;
  name: string;
  role: string;
  personality: string;
  objective: string;
  initialMessages: string[];
  avatarUrl?: string;
}

// ── Simulation Task ──

export interface SimTask {
  id: string;
  description: string;
  completionCriteria: string;
  isHidden: boolean;
  nextNodeId?: string;
}

// ── Scene Resource ──

export interface SceneResource {
  id: string;
  title: string;
  type: "Document" | "Image" | "Video" | "Audio";
  description: string;
  url?: string;
  hidden?: boolean;
}


// ── Action Tile (palette) ──

export interface ActionTile {
  type: StepType;
  label: string;
  category: StepCategory;
  icon: string;
  isMechanic: boolean;
}

export type ConnectionType = "linear" | "conditional" | "interruption" | "resume";

export interface ConnectionStyle {
  color?: string;
  label?: string;
  type: ConnectionType;
  dashed?: boolean;
}

export interface BranchChoice {
  id: string;
  label: string;
  actionId: string;
  nextStepId: string;
  connectionStyle?: ConnectionStyle;
}

export interface RoutingRule {
  choiceId: string;
  nextStepId: string;
  connectionStyle?: ConnectionStyle;
}

export type TrackId = "main" | "parallel-1";

export type StepState = "active" | "suspended" | "resumable";

export interface Step {
  id: string;
  title: string;
  type: StepType;
  column: ColumnId;
  order: number;
  flowBehavior?: FlowBehavior;
  choices?: BranchChoice[];
  routingRules?: RoutingRule[];
  fallbackNextStepId?: string;
  ui?: { position: { x: number; y: number } };

  // Track and interruption support
  trackId?: TrackId;
  state?: StepState;
  interruptionTriggerId?: string;
  interruptionStyle?: ConnectionStyle;
  resumeTargetStepId?: string;
  resumeStyle?: ConnectionStyle;

  // Evaluation layer
  evaluation?: EvaluationConfig;

  // Flow layer extras
  gateCondition?: string; // for "gated" flow
  timingPressureSeconds?: number; // for "timing" flow

  // Chat-simulation fields
  personaId?: string;
  tasks?: SimTask[];
  givenResourceIds?: string[];
  hiddenResourceIds?: string[];
}

export const STEP_CATEGORIES_ORDER: StepCategory[] = [
  "Media", "Resources", "Communication", "Coaching", "Flow Control", "Assessment", "Triggers",
];

export const ACTION_TILES: ActionTile[] = [
  // Media
  { type: "video", label: "Video", category: "Media", icon: "Play", isMechanic: false },
  { type: "audio", label: "Audio", category: "Media", icon: "Headphones", isMechanic: false },
  // Resources
  { type: "pdf", label: "PDF Document", category: "Resources", icon: "FileText", isMechanic: false },
  // Communication
  { type: "text-chat", label: "Text Chat", category: "Communication", icon: "MessageSquare", isMechanic: false },
  { type: "radio-call", label: "Radio Call", category: "Communication", icon: "Radio", isMechanic: false },
  { type: "3d-environment", label: "3D Environment", category: "Communication", icon: "Box", isMechanic: false },
  // Coaching
  { type: "ai-coach", label: "AI Coach Reflection", category: "Coaching", icon: "Brain", isMechanic: false },
  // Flow Control
  { type: "decision-checkpoint", label: "Decision Point", category: "Flow Control", icon: "GitMerge", isMechanic: true },
  { type: "redirect-loop", label: "Redirect / Loop", category: "Flow Control", icon: "RotateCcw", isMechanic: true },
  { type: "resume-point", label: "Resume Point", category: "Flow Control", icon: "CornerDownLeft", isMechanic: true },
  // Assessment
  { type: "fetch-document", label: "Fetch Document", category: "Assessment", icon: "Download", isMechanic: true },
  { type: "generate-evaluation", label: "Evaluation Report", category: "Assessment", icon: "ClipboardCheck", isMechanic: true },
  // Triggers
  { type: "interruption", label: "Interruption Trigger", category: "Triggers", icon: "AlertTriangle", isMechanic: true },
  { type: "parallel-order", label: "Parallel Pressure", category: "Triggers", icon: "GitBranch", isMechanic: true },
];

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  video: "Video",
  pdf: "PDF Document",
  audio: "Audio",
  "text-chat": "Text Chat",
  "radio-call": "Radio Call",
  "ai-coach": "AI Coach",
  "fetch-document": "Fetch Doc",
  "generate-evaluation": "Evaluation",
  interruption: "Interruption",
  "parallel-order": "Parallel",
  "3d-environment": "3D Environment",
  "decision-checkpoint": "Decision",
  "redirect-loop": "Redirect",
  "resume-point": "Resume Point",
};

export const STEP_TYPE_CATEGORY: Record<StepType, StepCategory> = {
  video: "Media",
  pdf: "Resources",
  audio: "Media",
  "text-chat": "Communication",
  "radio-call": "Communication",
  "3d-environment": "Communication",
  "ai-coach": "Coaching",
  "fetch-document": "Assessment",
  "generate-evaluation": "Assessment",
  interruption: "Triggers",
  "parallel-order": "Triggers",
  "decision-checkpoint": "Flow Control",
  "redirect-loop": "Flow Control",
  "resume-point": "Flow Control",
};

export const STEP_IS_MECHANIC: Record<StepType, boolean> = {
  video: false,
  pdf: false,
  audio: false,
  "text-chat": false,
  "radio-call": false,
  "3d-environment": false,
  "ai-coach": false,
  "fetch-document": true,
  "generate-evaluation": true,
  interruption: true,
  "parallel-order": true,
  "decision-checkpoint": true,
  "redirect-loop": true,
  "resume-point": true,
};

export const CATEGORY_BADGE_CLASS: Record<StepCategory, string> = {
  Media: "bg-[hsl(var(--badge-media))] text-[hsl(var(--badge-media-fg))]",
  Resources: "bg-[hsl(var(--badge-resources))] text-[hsl(var(--badge-resources-fg))]",
  Communication: "bg-[hsl(var(--badge-communication))] text-[hsl(var(--badge-communication-fg))]",
  Coaching: "bg-[hsl(var(--badge-reflection))] text-[hsl(var(--badge-reflection-fg))]",
  "Flow Control": "bg-[hsl(var(--badge-branching))] text-[hsl(var(--badge-branching-fg))]",
  Assessment: "bg-[hsl(var(--badge-assessment))] text-[hsl(var(--badge-assessment-fg))]",
  Triggers: "bg-[hsl(var(--badge-behavioral))] text-[hsl(var(--badge-behavioral-fg))]",
};

export type CriticalityLevel = "safety-critical" | "operational" | "training";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  estimatedDuration: string;
  criticality: CriticalityLevel;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  steps: Step[];
  personas: Persona[];
  resources: SceneResource[];
}

export const CRITICALITY_LABELS: Record<CriticalityLevel, string> = {
  "safety-critical": "Safety Critical",
  operational: "Operational",
  training: "Training",
};

export const CONNECTION_TYPE_COLORS: Record<ConnectionType, string> = {
  linear: "hsl(var(--muted-foreground))",
  conditional: "hsl(210, 100%, 50%)",
  interruption: "hsl(0, 84%, 60%)",
  resume: "hsl(270, 70%, 60%)",
};

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  linear: "Linear Flow",
  conditional: "Conditional Branch",
  interruption: "Interruption",
  resume: "Resume Flow",
};

export function isDecisionCheckpointValid(step: Step): boolean {
  if (step.flowBehavior !== "conditional") return true;
  const choices = step.choices ?? [];
  if (choices.length === 0) return false;
  return choices.every(c => c.label.trim() !== "" && c.nextStepId.trim() !== "");
}
