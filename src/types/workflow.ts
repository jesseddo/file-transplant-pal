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

export type ActivityCategory = "Communication" | "Media" | "Immersive" | "Reflection";
export type MechanicCategory = "Branching" | "Assessment" | "Behavioral";
export type StepCategory = ActivityCategory | MechanicCategory;

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
  category: StepCategory;
  icon: string;
  isMechanic: boolean;
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
  // Activities (learner-facing)
  { type: "text-chat", label: "Text Chat", category: "Communication", icon: "MessageSquare", isMechanic: false },
  { type: "radio-call", label: "Radio Call", category: "Communication", icon: "Radio", isMechanic: false },
  { type: "video", label: "Video", category: "Media", icon: "Play", isMechanic: false },
  { type: "audio", label: "Audio", category: "Media", icon: "Headphones", isMechanic: false },
  { type: "pdf", label: "PDF / Document", category: "Media", icon: "FileText", isMechanic: false },
  { type: "3d-environment", label: "3D Environment", category: "Immersive", icon: "Box", isMechanic: false },
  { type: "ai-coach", label: "AI Coach Reflection", category: "Reflection", icon: "Brain", isMechanic: false },
  // Mechanics (designer-facing)
  { type: "decision-checkpoint", label: "Decision Point", category: "Branching", icon: "GitMerge", isMechanic: true },
  { type: "redirect-loop", label: "Redirect / Loop", category: "Branching", icon: "RotateCcw", isMechanic: true },
  { type: "fetch-document", label: "Fetch Document", category: "Assessment", icon: "Download", isMechanic: true },
  { type: "generate-evaluation", label: "Evaluation Report", category: "Assessment", icon: "ClipboardCheck", isMechanic: true },
  { type: "interruption", label: "Interruption Trigger", category: "Behavioral", icon: "AlertTriangle", isMechanic: true },
  { type: "parallel-order", label: "Parallel Pressure", category: "Behavioral", icon: "GitBranch", isMechanic: true },
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
};

export const STEP_TYPE_CATEGORY: Record<StepType, StepCategory> = {
  video: "Media",
  pdf: "Media",
  audio: "Media",
  "text-chat": "Communication",
  "radio-call": "Communication",
  "3d-environment": "Immersive",
  "ai-coach": "Reflection",
  "fetch-document": "Assessment",
  "generate-evaluation": "Assessment",
  interruption: "Behavioral",
  "parallel-order": "Behavioral",
  "decision-checkpoint": "Branching",
  "redirect-loop": "Branching",
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
};

export const CATEGORY_BADGE_CLASS: Record<StepCategory, string> = {
  Communication: "bg-[hsl(var(--badge-communication))] text-[hsl(var(--badge-communication-fg))]",
  Media: "bg-[hsl(var(--badge-media))] text-[hsl(var(--badge-media-fg))]",
  Immersive: "bg-[hsl(var(--badge-immersive))] text-[hsl(var(--badge-immersive-fg))]",
  Reflection: "bg-[hsl(var(--badge-reflection))] text-[hsl(var(--badge-reflection-fg))]",
  Branching: "bg-[hsl(var(--badge-branching))] text-[hsl(var(--badge-branching-fg))]",
  Assessment: "bg-[hsl(var(--badge-assessment))] text-[hsl(var(--badge-assessment-fg))]",
  Behavioral: "bg-[hsl(var(--badge-behavioral))] text-[hsl(var(--badge-behavioral-fg))]",
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
