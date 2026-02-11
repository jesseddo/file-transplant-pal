import { useState, DragEvent, useCallback } from "react";
import { Step, ColumnId } from "@/types/workflow";
import { StepCard } from "./StepCard";

interface CanvasProps {
  steps: Step[];
  selectedStepId: string | null;
  selectedColumn: ColumnId;
  onSelectStep: (id: string | null) => void;
  onSelectColumn: (col: ColumnId) => void;
  onRemoveStep: (id: string) => void;
  onMoveStep: (stepId: string, toColumn: ColumnId, toIndex: number) => void;
}

const COLUMNS: { id: ColumnId; label: string; headerClass: string; bgClass: string }[] = [
  { id: "intro", label: "INTRO", headerClass: "bg-[hsl(var(--column-header-intro))]", bgClass: "bg-[hsl(var(--column-intro))]" },
  { id: "simulation", label: "SIMULATION", headerClass: "bg-[hsl(var(--column-header-sim))]", bgClass: "bg-[hsl(var(--column-sim))]" },
  { id: "review", label: "REVIEW", headerClass: "bg-[hsl(var(--column-header-review))]", bgClass: "bg-[hsl(var(--column-review))]" },
];

export function WorkflowCanvas({
  steps,
  selectedStepId,
  selectedColumn,
  onSelectStep,
  onSelectColumn,
  onRemoveStep,
  onMoveStep,
}: CanvasProps) {
  const [dropTarget, setDropTarget] = useState<{ col: ColumnId; index: number } | null>(null);

  const stepsByColumn = (col: ColumnId) =>
    steps.filter((s) => s.column === col).sort((a, b) => a.order - b.order);

  const getDropIndex = useCallback((e: DragEvent, col: ColumnId) => {
    const container = e.currentTarget as HTMLElement;
    const cards = Array.from(container.querySelectorAll("[data-step-id]"));
    const mouseY = e.clientY;

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (mouseY < midY) return i;
    }
    return cards.length;
  }, []);

  const handleDragOver = useCallback((e: DragEvent, col: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const index = getDropIndex(e, col);
    setDropTarget({ col, index });
  }, [getDropIndex]);

  const handleDrop = useCallback((e: DragEvent, col: ColumnId) => {
    e.preventDefault();
    const stepId = e.dataTransfer.getData("text/plain");
    if (!stepId) return;
    const index = getDropIndex(e, col);
    onMoveStep(stepId, col, index);
    onSelectColumn(col);
    setDropTarget(null);
  }, [getDropIndex, onMoveStep, onSelectColumn]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  return (
    <div className="flex-1 bg-canvas p-4 overflow-auto relative">
      <div className="flex gap-3 relative z-20 min-h-[500px]">
        {COLUMNS.map((col) => {
          const colSteps = stepsByColumn(col.id);
          const isActive = selectedColumn === col.id;
          const isDropHere = dropTarget?.col === col.id;
          return (
            <div
              key={col.id}
              className={`w-[280px] shrink-0 rounded-lg border-2 transition-colors ${
                isDropHere
                  ? "border-primary/50 bg-primary/5"
                  : isActive
                  ? "border-primary/30"
                  : "border-transparent"
              } ${col.bgClass}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectColumn(col.id);
              }}
            >
              <div className={`px-3 py-2 rounded-t-md ${col.headerClass}`}>
                <h3 className="text-xs font-bold tracking-wider text-foreground/70">
                  {col.label}
                </h3>
              </div>
              <div
                className="p-3 space-y-2 min-h-[200px]"
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {colSteps.map((step, idx) => (
                  <div key={step.id} data-step-id={step.id}>
                    {isDropHere && dropTarget.index === idx && (
                      <div className="h-0.5 bg-primary rounded-full mb-2 transition-all" />
                    )}
                    <StepCard
                      step={step}
                      isSelected={selectedStepId === step.id}
                      onSelect={() => onSelectStep(step.id)}
                      onRemove={() => onRemoveStep(step.id)}
                    />
                  </div>
                ))}
                {isDropHere && dropTarget.index >= colSteps.length && (
                  <div className="h-0.5 bg-primary rounded-full transition-all" />
                )}
                {colSteps.length === 0 && !isDropHere && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Drop steps here
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
