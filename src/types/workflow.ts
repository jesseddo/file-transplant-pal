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
  | "parallel-order";

export type ActionCategory = "Media" | "Simulation" | "Coaching" | "Resources & Compliance" | "Behavioral";

export interface ActionTile {
  type: StepType;
  label: string;
  category: ActionCategory;
  icon: string;
}

export interface Step {
  id: string;
  title: string;
  type: StepType;
  column: ColumnId;
  order: number;
}


export const ACTION_TILES: ActionTile[] = [
  { type: "video", label: "Video", category: "Media", icon: "Play" },
  { type: "pdf", label: "PDF Document", category: "Media", icon: "FileText" },
  { type: "audio", label: "Audio", category: "Media", icon: "Headphones" },
  { type: "text-chat", label: "Text Chat Simulation", category: "Simulation", icon: "MessageSquare" },
  { type: "radio-call", label: "Radio Call", category: "Simulation", icon: "Radio" },
  { type: "ai-coach", label: "AI Coach Reflection", category: "Coaching", icon: "Brain" },
  { type: "fetch-document", label: "Fetch Document/Permit", category: "Resources & Compliance", icon: "Download" },
  { type: "generate-evaluation", label: "Generate Evaluation", category: "Resources & Compliance", icon: "ClipboardCheck" },
  { type: "interruption", label: "Interruption", category: "Behavioral", icon: "AlertTriangle" },
  { type: "parallel-order", label: "Parallel Order", category: "Behavioral", icon: "GitBranch" },
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
};

export const STEP_TYPE_CATEGORY: Record<StepType, ActionCategory> = {
  video: "Media",
  pdf: "Media",
  audio: "Media",
  "text-chat": "Simulation",
  "radio-call": "Simulation",
  "ai-coach": "Coaching",
  "fetch-document": "Resources & Compliance",
  "generate-evaluation": "Resources & Compliance",
  interruption: "Behavioral",
  "parallel-order": "Behavioral",
};

export const CATEGORY_BADGE_CLASS: Record<ActionCategory, string> = {
  Media: "bg-[hsl(var(--badge-media))] text-[hsl(var(--badge-media-fg))]",
  Simulation: "bg-[hsl(var(--badge-simulation))] text-[hsl(var(--badge-simulation-fg))]",
  Coaching: "bg-[hsl(var(--badge-coaching))] text-[hsl(var(--badge-coaching-fg))]",
  "Resources & Compliance": "bg-[hsl(var(--badge-resource))] text-[hsl(var(--badge-resource-fg))]",
  Behavioral: "bg-[hsl(var(--badge-behavioral))] text-[hsl(var(--badge-behavioral-fg))]",
};
