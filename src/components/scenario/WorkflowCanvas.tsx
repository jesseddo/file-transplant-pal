import { useState, DragEvent, useCallback, useRef, useEffect } from "react";
import { Step, ColumnId, StepType, ACTION_TILES, STEP_CATEGORIES_ORDER } from "@/types/workflow";
import { StepCard } from "./StepCard";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasProps {
  steps: Step[];
  selectedStepId: string | null;
  selectedColumn: ColumnId;
  onSelectStep: (id: string | null) => void;
  onSelectColumn: (col: ColumnId) => void;
  onRemoveStep: (id: string) => void;
  onMoveStep: (stepId: string, toColumn: ColumnId, toIndex: number) => void;
  onAddStepToColumn: (type: StepType, label: string, column: ColumnId, index: number) => string;
  onMoveStepToGrid: (stepId: string, gridX: number, gridY: number) => void;
  onAddStepToGrid: (type: StepType, label: string, gridX: number, gridY: number) => string;
  isDraggingFromSidebar?: boolean;
}

const COLUMNS: { id: ColumnId; label: string; headerClass: string; bgClass: string }[] = [
  { id: "intro", label: "INTRO", headerClass: "bg-[hsl(var(--column-header-intro))]", bgClass: "bg-[hsl(var(--column-intro))]" },
  { id: "simulation", label: "SIMULATION", headerClass: "bg-[hsl(var(--column-header-sim))]", bgClass: "bg-[hsl(var(--column-sim))]" },
  { id: "review", label: "REVIEW", headerClass: "bg-[hsl(var(--column-header-review))]", bgClass: "bg-[hsl(var(--column-review))]" },
];

const CATEGORIES = STEP_CATEGORIES_ORDER;

const GRID_CELL_WIDTH = 180;
const GRID_CELL_HEIGHT = 120;
const GRID_GAP = 16;

function SimulationGridArrows({ steps }: { steps: Step[] }) {
  const [arrows, setArrows] = useState<{ id: string; path: string; dashed?: boolean }[]>([]);

  useEffect(() => {
    const newArrows: { id: string; path: string; dashed?: boolean }[] = [];
    const simSteps = steps.filter(s => s.column === "simulation");

    for (const step of simSteps) {
      const fromX = (step.ui?.position?.x ?? 0) * (GRID_CELL_WIDTH + GRID_GAP) + GRID_CELL_WIDTH;
      const fromY = (step.ui?.position?.y ?? 0) * (GRID_CELL_HEIGHT + GRID_GAP) + GRID_CELL_HEIGHT / 2;

      const connections: { targetId: string; dashed?: boolean }[] = [];

      if (step.choices) {
        step.choices.forEach(choice => {
          if (choice.nextStepId) {
            connections.push({ targetId: choice.nextStepId, dashed: false });
          }
        });
      }

      if (step.tasks) {
        step.tasks.forEach(task => {
          if (task.nextNodeId && task.nextNodeId !== "__end__") {
            connections.push({ targetId: task.nextNodeId, dashed: true });
          }
        });
      }

      if (step.fallbackNextStepId) {
        connections.push({ targetId: step.fallbackNextStepId, dashed: false });
      }

      for (const conn of connections) {
        const targetStep = simSteps.find(s => s.id === conn.targetId);
        if (!targetStep) continue;

        const toX = (targetStep.ui?.position?.x ?? 0) * (GRID_CELL_WIDTH + GRID_GAP);
        const toY = (targetStep.ui?.position?.y ?? 0) * (GRID_CELL_HEIGHT + GRID_GAP) + GRID_CELL_HEIGHT / 2;

        const cpx = (fromX + toX) / 2;
        const path = `M ${fromX} ${fromY} C ${cpx} ${fromY}, ${cpx} ${toY}, ${toX} ${toY}`;

        newArrows.push({
          id: `${step.id}-${conn.targetId}`,
          path,
          dashed: conn.dashed,
        });
      }
    }

    setArrows(newArrows);
  }, [steps]);

  if (arrows.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-10" style={{ overflow: "visible" }}>
      <defs>
        <marker id="arrow-head" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M 0 0 L 8 3 L 0 6 Z" fill="hsl(var(--connection))" />
        </marker>
      </defs>
      {arrows.map(({ id, path, dashed }) => (
        <path
          key={id}
          d={path}
          stroke="hsl(var(--connection))"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray={dashed ? "6 3" : undefined}
          markerEnd="url(#arrow-head)"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}

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
      className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56 rounded-lg border border-border bg-card shadow-lg z-50 p-2 space-y-1.5 max-h-96 overflow-y-auto"
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
  onMoveStepToGrid,
  onAddStepToGrid,
  isDraggingFromSidebar,
}: CanvasProps) {
  const [dropTarget, setDropTarget] = useState<{ col: ColumnId; index: number } | null>(null);
  const [gridDropTarget, setGridDropTarget] = useState<{ x: number; y: number; isValid: boolean } | null>(null);
  const [pickerColumn, setPickerColumn] = useState<ColumnId | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const simGridRef = useRef<HTMLDivElement>(null);

  const showDropZones = isDragging || isDraggingFromSidebar;

  const stepsByColumn = (col: ColumnId) =>
    steps.filter((s) => s.column === col).sort((a, b) => a.order - b.order);

  const getDropInfo = useCallback((e: DragEvent, col: ColumnId): number => {
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

  const isCellOccupied = useCallback((x: number, y: number, excludeStepId?: string): boolean => {
    return steps.some(step => {
      if (excludeStepId && step.id === excludeStepId) return false;
      if (step.column !== "simulation") return false;
      return step.ui?.position?.x === x && step.ui?.position?.y === y;
    });
  }, [steps]);

  const getGridDropPosition = useCallback((e: DragEvent): { x: number; y: number; isValid: boolean } | null => {
    if (!simGridRef.current) return null;
    const gridRect = simGridRef.current.getBoundingClientRect();
    const mouseX = e.clientX - gridRect.left;
    const mouseY = e.clientY - gridRect.top;

    const cellFullWidth = GRID_CELL_WIDTH + GRID_GAP;
    const cellFullHeight = GRID_CELL_HEIGHT + GRID_GAP;

    const gridX = Math.floor(mouseX / cellFullWidth);
    const gridY = Math.floor(mouseY / cellFullHeight);

    const x = Math.max(0, gridX);
    const y = Math.max(0, gridY);
    const isValid = !isCellOccupied(x, y, draggedStepId ?? undefined);

    return { x, y, isValid };
  }, [isCellOccupied, draggedStepId]);

  const handleDragOver = useCallback((e: DragEvent, col: ColumnId) => {
    e.preventDefault();
    e.stopPropagation();

    if (col === "simulation") {
      const gridPos = getGridDropPosition(e);
      if (gridPos) {
        setGridDropTarget(gridPos);
        setDropTarget(null);
      }
      return;
    }

    const index = getDropInfo(e, col);
    setDropTarget({ col, index });
    setGridDropTarget(null);
  }, [getDropInfo, getGridDropPosition]);

  const handleDrop = useCallback((e: DragEvent, col: ColumnId) => {
    e.preventDefault();
    e.stopPropagation();

    const actionType = e.dataTransfer.getData("application/action-type");
    const actionLabel = e.dataTransfer.getData("application/action-label");

    if (col === "simulation" && gridDropTarget) {
      if (!gridDropTarget.isValid) {
        setGridDropTarget(null);
        setIsDragging(false);
        setDraggedStepId(null);
        return;
      }

      if (actionType && actionLabel) {
        onAddStepToGrid(actionType as StepType, actionLabel, gridDropTarget.x, gridDropTarget.y);
      } else {
        const stepId = e.dataTransfer.getData("text/plain");
        if (stepId) {
          onMoveStepToGrid(stepId, gridDropTarget.x, gridDropTarget.y);
        }
      }
      onSelectColumn(col);
      setGridDropTarget(null);
      setIsDragging(false);
      setDraggedStepId(null);
      return;
    }

    const index = getDropInfo(e, col);
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
    setIsDragging(false);
    setDraggedStepId(null);
  }, [gridDropTarget, getDropInfo, onMoveStep, onSelectColumn, onAddStepToColumn, onAddStepToGrid, onMoveStepToGrid]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
    setGridDropTarget(null);
  }, []);

  const renderSimulationGrid = () => {
    const simSteps = steps.filter(s => s.column === "simulation");

    const maxX = Math.max(0, ...simSteps.map(s => s.ui?.position?.x ?? 0));
    const maxY = Math.max(0, ...simSteps.map(s => s.ui?.position?.y ?? 0));
    const gridCols = Math.max(4, maxX + 2);
    const gridRows = Math.max(3, maxY + 2);

    const isActive = selectedColumn === "simulation";
    const isDropHere = gridDropTarget !== null;
    const simCol = COLUMNS[1];

    return (
      <div
        className={`flex-1 min-w-[600px] rounded-lg border-2 transition-colors relative ${
          isDropHere
            ? "border-primary/50 bg-primary/5"
            : isActive
            ? "border-primary/30"
            : "border-border"
        } ${simCol.bgClass}`}
        onClick={(e) => { e.stopPropagation(); onSelectColumn("simulation"); }}
      >
        <div className={`px-3 py-2 rounded-t-md ${simCol.headerClass}`}>
          <h3 className="text-xs font-bold tracking-wider text-foreground/70">SIMULATION</h3>
        </div>

        <div
          ref={simGridRef}
          className="p-4 overflow-auto relative"
          style={{
            minHeight: '400px',
            width: '100%',
          }}
          onDragOver={(e) => handleDragOver(e, "simulation")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "simulation")}
        >
          <div
            className="relative"
            style={{
              width: `${gridCols * (GRID_CELL_WIDTH + GRID_GAP)}px`,
              height: `${gridRows * (GRID_CELL_HEIGHT + GRID_GAP)}px`,
            }}
          >
            {Array.from({ length: gridRows }).map((_, row) =>
              Array.from({ length: gridCols }).map((_, col) => {
                const isOccupied = isCellOccupied(col, row, draggedStepId ?? undefined);
                const isHovered = gridDropTarget?.x === col && gridDropTarget?.y === row;
                return (
                  <div
                    key={`grid-${col}-${row}`}
                    className={`absolute border rounded-md transition-all ${
                      showDropZones
                        ? isOccupied
                          ? "border-destructive/40 bg-destructive/5 border-dashed"
                          : "border-primary/40 bg-primary/5 border-dashed"
                        : "border-dashed border-border/30"
                    } ${isHovered && gridDropTarget && !gridDropTarget.isValid ? "bg-destructive/10 border-destructive" : ""} ${
                      isHovered && gridDropTarget && gridDropTarget.isValid ? "bg-primary/10 border-primary" : ""
                    }`}
                    style={{
                      left: `${col * (GRID_CELL_WIDTH + GRID_GAP)}px`,
                      top: `${row * (GRID_CELL_HEIGHT + GRID_GAP)}px`,
                      width: `${GRID_CELL_WIDTH}px`,
                      height: `${GRID_CELL_HEIGHT}px`,
                    }}
                  >
                    {showDropZones && !isOccupied && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <SimulationGridArrows steps={steps} />

            {gridDropTarget && gridDropTarget.isValid && (
              <div
                className="absolute bg-primary/20 border-2 border-primary rounded-md z-10 animate-pulse"
                style={{
                  left: `${gridDropTarget.x * (GRID_CELL_WIDTH + GRID_GAP)}px`,
                  top: `${gridDropTarget.y * (GRID_CELL_HEIGHT + GRID_GAP)}px`,
                  width: `${GRID_CELL_WIDTH}px`,
                  height: `${GRID_CELL_HEIGHT}px`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
            )}

            {gridDropTarget && !gridDropTarget.isValid && (
              <div
                className="absolute bg-destructive/10 border-2 border-destructive border-dashed rounded-md z-10"
                style={{
                  left: `${gridDropTarget.x * (GRID_CELL_WIDTH + GRID_GAP)}px`,
                  top: `${gridDropTarget.y * (GRID_CELL_HEIGHT + GRID_GAP)}px`,
                  width: `${GRID_CELL_WIDTH}px`,
                  height: `${GRID_CELL_HEIGHT}px`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <X className="w-5 h-5 text-destructive" />
                  </div>
                </div>
              </div>
            )}

            {simSteps.map((step) => {
              const gridX = step.ui?.position?.x ?? 0;
              const gridY = step.ui?.position?.y ?? 0;
              const isBeingDragged = draggedStepId === step.id;
              return (
                <div
                  key={step.id}
                  data-step-id={step.id}
                  className="absolute z-20 transition-all duration-200"
                  style={{
                    left: `${gridX * (GRID_CELL_WIDTH + GRID_GAP)}px`,
                    top: `${gridY * (GRID_CELL_HEIGHT + GRID_GAP)}px`,
                    width: `${GRID_CELL_WIDTH}px`,
                  }}
                >
                  <StepCard
                    step={step}
                    isSelected={selectedStepId === step.id}
                    onSelect={() => onSelectStep(step.id)}
                    onRemove={() => onRemoveStep(step.id)}
                    onDragStart={(id) => {
                      setIsDragging(true);
                      setDraggedStepId(id);
                    }}
                    onDragEnd={() => {
                      setIsDragging(false);
                      setDraggedStepId(null);
                    }}
                    isDimmed={isDragging && !isBeingDragged}
                  />
                </div>
              );
            })}

            {simSteps.length === 0 && !isDropHere && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Drop steps here to build your workflow</p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setPickerColumn(pickerColumn === "simulation" ? null : "simulation");
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Step
          </Button>
        </div>
        {pickerColumn === "simulation" && (
          <AddStepPicker
            column="simulation"
            onAdd={(type, label) => {
              onAddStepToGrid(type, label, 0, 0);
              onSelectColumn("simulation");
            }}
            onClose={() => setPickerColumn(null)}
          />
        )}
      </div>
    );
  };

  const renderColumn = (col: typeof COLUMNS[number]) => {
    const colSteps = stepsByColumn(col.id);
    const isActive = selectedColumn === col.id;
    const isDropHere = dropTarget?.col === col.id;
    return (
      <div
        key={col.id}
        className={`w-[260px] shrink-0 rounded-lg border-2 transition-colors relative ${
          isDropHere
            ? "border-primary/50 bg-primary/5"
            : isActive
            ? "border-primary/30"
            : "border-border"
        } ${col.bgClass}`}
        onClick={(e) => { e.stopPropagation(); onSelectColumn(col.id); }}
      >
        <div className={`px-3 py-2 rounded-t-md ${col.headerClass}`}>
          <h3 className="text-xs font-bold tracking-wider text-foreground/70">{col.label}</h3>
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
            <p className="text-xs text-muted-foreground text-center py-8">Drop steps here</p>
          )}
        </div>
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
  };

  return (
    <div className="flex-1 bg-canvas p-4 overflow-auto relative">
      <div className="flex gap-3 relative z-20 min-h-[500px] items-start">
        {renderColumn(COLUMNS[0])}
        {renderSimulationGrid()}
        {renderColumn(COLUMNS[2])}
      </div>
    </div>
  );
}
