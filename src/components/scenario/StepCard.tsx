import { X, GripVertical, AlertCircle, GitFork } from "lucide-react";
import { Step, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { DragEvent } from "react";

interface StepCardProps {
  step: Step;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function StepCard({ step, isSelected, onSelect, onRemove }: StepCardProps) {
  const category = STEP_TYPE_CATEGORY[step.type];
  const badgeClass = CATEGORY_BADGE_CLASS[category];
  const isInterruption = step.type === "interruption";
  const isDecision = step.flowBehavior === "decision";
  const choiceCount = step.choices?.length ?? 0;
  const isIncomplete = isDecision && !isDecisionCheckpointValid(step);

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", step.id);
    e.dataTransfer.effectAllowed = "move";
    (e.currentTarget as HTMLElement).style.opacity = "0.4";
  };

  const handleDragEnd = (e: DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  if (isInterruption) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={onSelect}
        className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-dashed cursor-grab active:cursor-grabbing transition-all text-xs ${
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-[hsl(var(--step-border))] bg-card hover:border-primary/40"
        }`}
      >
        <GripVertical className="w-3 h-3 shrink-0 text-muted-foreground/50" />
        <span className="font-medium text-foreground truncate">{step.title}</span>
        <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
          {STEP_TYPE_LABELS[step.type]}
        </span>
        {isDecision && <GitFork className="w-3 h-3 shrink-0 text-primary" />}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      className={`relative group rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all ${
        isIncomplete
          ? "border-destructive/60 bg-destructive/5"
          : isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-[hsl(var(--step-border))] bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5">
            <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground/40 mt-0.5" />
            <p className="text-sm font-medium text-foreground leading-tight">{step.title}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive transition-opacity mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 ml-5">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
            {STEP_TYPE_LABELS[step.type]}
          </span>
          {isDecision && (
            <>
              <GitFork className="w-3 h-3 text-primary shrink-0" />
              <span className="text-[10px] text-muted-foreground">
                {choiceCount} {choiceCount === 1 ? "choice" : "choices"}
              </span>
            </>
          )}
          {isIncomplete && (
            <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
