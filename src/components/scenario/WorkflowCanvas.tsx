import { useState, DragEvent, useCallback, useRef, useEffect } from "react";
import { Step, ColumnId, StepType, ACTION_TILES, ActionCategory } from "@/types/workflow";
import { StepCard } from "./StepCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasProps {
  steps: Step[];
  selectedStepId: string | null;
  selectedColumn: ColumnId;
  onSelectStep: (id: string | null) => void;
  onSelectColumn: (col: ColumnId) => void;
  onRemoveStep: (id: string) => void;
  onMoveStep: (stepId: string, toColumn: ColumnId, toIndex: number) => void;
  onAddStepToColumn: (type: StepType, label: string, column: ColumnId, index: number) => void;
}

const COLUMNS: { id: ColumnId; label: string; headerClass: string; bgClass: string }[] = [
  { id: "intro", label: "INTRO", headerClass: "bg-[hsl(var(--column-header-intro))]", bgClass: "bg-[hsl(var(--column-intro))]" },
  { id: "simulation", label: "SIMULATION", headerClass: "bg-[hsl(var(--column-header-sim))]", bgClass: "bg-[hsl(var(--column-sim))]" },
  { id: "review", label: "REVIEW", headerClass: "bg-[hsl(var(--column-header-review))]", bgClass: "bg-[hsl(var(--column-review))]" },
];

const CATEGORIES: ActionCategory[] = ["Media", "Simulation", "Coaching", "Resources & Compliance", "Behavioral"];

/* ── Inline step-type picker ── */
function AddStepPicker({ column, onAdd, onClose }: {
  column: ColumnId;
  onAdd: (type: StepType, label: string, column: ColumnId, index: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56 rounded-lg border border-border bg-card shadow-lg z-50 p-2 space-y-1.5"
    >
      <p className="text-[10px] font-semibold text-muted-foreground tracking-wide uppercase px-1">Add step</p>
      {CATEGORIES.map((cat) => {
        const tiles = ACTION_TILES.filter((t) => t.category === cat);
        if (tiles.length === 0) return null;
        return (
          <div key={cat}>
            <p className="text-[9px] font-medium text-muted-foreground px-1 mb-0.5">{cat}</p>
            {tiles.map((tile) => (
              <button
                key={tile.type}
                className="w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => {
                  onAdd(tile.type, tile.label, column, Infinity);
                  onClose();
                }}
              >
                {tile.label}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function WorkflowCanvas({
  steps,
  selectedStepId,
  selectedColumn,
  onSelectStep,
  onSelectColumn,
  onRemoveStep,
  onMoveStep,
  onAddStepToColumn,
}: CanvasProps) {
  const [dropTarget, setDropTarget] = useState<{ col: ColumnId; index: number } | null>(null);
  const [pickerColumn, setPickerColumn] = useState<ColumnId | null>(null);

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
    e.stopPropagation();
    const index = getDropIndex(e, col);
    setDropTarget({ col, index });
  }, [getDropIndex]);

  const handleDrop = useCallback((e: DragEvent, col: ColumnId) => {
    e.preventDefault();
    e.stopPropagation();
    const actionType = e.dataTransfer.getData("application/action-type");
    const actionLabel = e.dataTransfer.getData("application/action-label");
    const index = getDropIndex(e, col);

    if (actionType && actionLabel) {
      onAddStepToColumn(actionType as StepType, actionLabel, col, index);
    } else {
      const stepId = e.dataTransfer.getData("text/plain");
      if (stepId) {
        onMoveStep(stepId, col, index);
      }
    }
    onSelectColumn(col);
    setDropTarget(null);
  }, [getDropIndex, onMoveStep, onSelectColumn, onAddStepToColumn]);

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
              className={`w-[280px] shrink-0 rounded-lg border-2 transition-colors relative ${
                isDropHere
                  ? "border-primary/50 bg-primary/5"
                  : isActive
                  ? "border-primary/30"
                  : "border-border"
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
                className="p-3 space-y-2 min-h-[200px] pb-14"
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

              {/* Add Step button */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerColumn(pickerColumn === col.id ? null : col.id);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </Button>
              </div>

              {pickerColumn === col.id && (
                <AddStepPicker
                  column={col.id}
                  onAdd={(type, label, column, index) => {
                    onAddStepToColumn(type, label, column, index);
                    onSelectColumn(column);
                  }}
                  onClose={() => setPickerColumn(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
