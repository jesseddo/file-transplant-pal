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
  | "redirect-loop";

export type FlowBehavior = "linear" | "decision";

export type ActionCategory = "Media" | "Simulation" | "Coaching" | "Resources & Compliance" | "Behavioral" | "Environment" | "Flow Control";

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
  nextNodeId?: string; // step id, "__end__", or undefined (no routing)
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

// ── Scene (groups steps within simulation) ──

export interface Scene {
  id: string;
  title: string;
  order: number;
}

// ── Action Tile (palette) ──

export interface ActionTile {
  type: StepType;
  label: string;
  category: ActionCategory;
  icon: string;
}

export interface BranchChoice {
  id: string;
  label: string;
  actionId: string;
  nextStepId: string;
}

export interface RoutingRule {
  choiceId: string;
  nextStepId: string;
}

export interface Step {
  id: string;
  title: string;
  type: StepType;
  column: ColumnId;
  order: number;
  sceneId?: string;
  flowBehavior?: FlowBehavior;
  choices?: BranchChoice[];
  routingRules?: RoutingRule[];
  fallbackNextStepId?: string;
  ui?: { position: { x: number; y: number } };

  // Chat-simulation fields
  personaId?: string;
  tasks?: SimTask[];
  givenResourceIds?: string[];
  hiddenResourceIds?: string[];
}

export const ACTION_TILES: ActionTile[] = [
  { type: "video", label: "Video", category: "Media", icon: "Play" },
  { type: "pdf", label: "PDF Document", category: "Media", icon: "FileText" },
  { type: "audio", label: "Audio", category: "Media", icon: "Headphones" },
  { type: "text-chat", label: "Text Chat Simulation", category: "Simulation", icon: "MessageSquare" },
  { type: "radio-call", label: "Radio Call", category: "Simulation", icon: "Radio" },
  { type: "3d-environment", label: "3D Environment", category: "Environment", icon: "Box" },
  { type: "ai-coach", label: "AI Coach Reflection", category: "Coaching", icon: "Brain" },
  { type: "fetch-document", label: "Fetch Document/Permit", category: "Resources & Compliance", icon: "Download" },
  { type: "generate-evaluation", label: "Generate Evaluation", category: "Resources & Compliance", icon: "ClipboardCheck" },
  { type: "interruption", label: "Interruption", category: "Behavioral", icon: "AlertTriangle" },
  { type: "parallel-order", label: "Parallel Order", category: "Behavioral", icon: "GitBranch" },
  { type: "decision-checkpoint", label: "Decision Checkpoint", category: "Flow Control", icon: "GitMerge" },
  { type: "redirect-loop", label: "Redirect / Loop", category: "Flow Control", icon: "RotateCcw" },
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
  "parallel-order": "Parallel Order",
  "3d-environment": "3D Environment",
  "decision-checkpoint": "Decision",
  "redirect-loop": "Redirect",
};

export const STEP_TYPE_CATEGORY: Record<StepType, ActionCategory> = {
  video: "Media",
  pdf: "Media",
  audio: "Media",
  "text-chat": "Simulation",
  "radio-call": "Simulation",
  "3d-environment": "Environment",
  "ai-coach": "Coaching",
  "fetch-document": "Resources & Compliance",
  "generate-evaluation": "Resources & Compliance",
  interruption: "Behavioral",
  "parallel-order": "Behavioral",
  "decision-checkpoint": "Flow Control",
  "redirect-loop": "Flow Control",
};

export const CATEGORY_BADGE_CLASS: Record<ActionCategory, string> = {
  Media: "bg-[hsl(var(--badge-media))] text-[hsl(var(--badge-media-fg))]",
  Simulation: "bg-[hsl(var(--badge-simulation))] text-[hsl(var(--badge-simulation-fg))]",
  Coaching: "bg-[hsl(var(--badge-coaching))] text-[hsl(var(--badge-coaching-fg))]",
  "Resources & Compliance": "bg-[hsl(var(--badge-resource))] text-[hsl(var(--badge-resource-fg))]",
  Behavioral: "bg-[hsl(var(--badge-behavioral))] text-[hsl(var(--badge-behavioral-fg))]",
  Environment: "bg-[hsl(var(--badge-environment))] text-[hsl(var(--badge-environment-fg))]",
  "Flow Control": "bg-[hsl(var(--badge-flow))] text-[hsl(var(--badge-flow-fg))]",
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
  scenes: Scene[];
}

export const CRITICALITY_LABELS: Record<CriticalityLevel, string> = {
  "safety-critical": "Safety Critical",
  operational: "Operational",
  training: "Training",
};

export function isDecisionCheckpointValid(step: Step): boolean {
  if (step.flowBehavior !== "decision") return true;
  const choices = step.choices ?? [];
  if (choices.length === 0) return false;
  return choices.every(c => c.label.trim() !== "" && c.nextStepId.trim() !== "");
}
