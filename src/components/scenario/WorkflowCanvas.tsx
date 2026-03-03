import { useState, DragEvent, useCallback, useRef, useEffect, useMemo } from "react";
import { Step, ColumnId, StepType, ACTION_TILES, StepCategory, Scene, STEP_CATEGORIES_ORDER } from "@/types/workflow";
import { StepCard } from "./StepCard";
import { SceneContainer } from "./SceneContainer";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasProps {
  steps: Step[];
  scenes: Scene[];
  selectedStepId: string | null;
  selectedColumn: ColumnId;
  onSelectStep: (id: string | null) => void;
  onSelectColumn: (col: ColumnId) => void;
  onRemoveStep: (id: string) => void;
  onMoveStep: (stepId: string, toColumn: ColumnId, toIndex: number) => void;
  onAddStepToColumn: (type: StepType, label: string, column: ColumnId, index: number) => void;
  onAddScene: (title: string) => void;
  onRenameScene: (sceneId: string, title: string) => void;
  onRemoveScene: (sceneId: string) => void;
}

const COLUMNS: { id: ColumnId; label: string; headerClass: string; bgClass: string }[] = [
  { id: "intro", label: "INTRO", headerClass: "bg-[hsl(var(--column-header-intro))]", bgClass: "bg-[hsl(var(--column-intro))]" },
  { id: "simulation", label: "SIMULATION", headerClass: "bg-[hsl(var(--column-header-sim))]", bgClass: "bg-[hsl(var(--column-sim))]" },
  { id: "review", label: "REVIEW", headerClass: "bg-[hsl(var(--column-header-review))]", bgClass: "bg-[hsl(var(--column-review))]" },
];

const CATEGORIES = STEP_CATEGORIES_ORDER;

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

/* ── Scene-to-scene connection arrows ── */
function SceneArrows({ scenes, steps, containerRef }: { scenes: Scene[]; steps: Step[]; containerRef: React.RefObject<HTMLDivElement> }) {
  const [paths, setPaths] = useState<{ d: string; key: string }[]>([]);

  useEffect(() => {
    if (!containerRef.current || scenes.length < 2) {
      setPaths([]);
      return;
    }

    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newPaths: { d: string; key: string }[] = [];

      // Build connections: for each scene, find tasks that route to steps in other scenes
      for (const scene of scenes) {
        const sceneSteps = steps.filter(s => s.sceneId === scene.id);
        const sceneEl = container.querySelector(`[data-scene-id="${scene.id}"]`);
        if (!sceneEl) continue;
        const sourceRect = sceneEl.getBoundingClientRect();

        const targetSceneIds = new Set<string>();
        for (const step of sceneSteps) {
          // Check choices
          if (step.choices) {
            for (const choice of step.choices) {
              if (choice.nextStepId) {
                const targetStep = steps.find(s => s.id === choice.nextStepId);
                if (targetStep?.sceneId && targetStep.sceneId !== scene.id) {
                  targetSceneIds.add(targetStep.sceneId);
                }
              }
            }
          }
          // Check tasks
          if (step.tasks) {
            for (const task of step.tasks) {
              if (task.nextNodeId && task.nextNodeId !== "__end__") {
                const targetStep = steps.find(s => s.id === task.nextNodeId);
                if (targetStep?.sceneId && targetStep.sceneId !== scene.id) {
                  targetSceneIds.add(targetStep.sceneId);
                }
              }
            }
          }
          // Check fallback
          if (step.fallbackNextStepId) {
            const targetStep = steps.find(s => s.id === step.fallbackNextStepId);
            if (targetStep?.sceneId && targetStep.sceneId !== scene.id) {
              targetSceneIds.add(targetStep.sceneId);
            }
          }
        }

        for (const targetId of targetSceneIds) {
          const targetEl = container.querySelector(`[data-scene-id="${targetId}"]`);
          if (!targetEl) continue;
          const targetRect = targetEl.getBoundingClientRect();

          const sx = sourceRect.right - containerRect.left;
          const sy = sourceRect.top + sourceRect.height / 2 - containerRect.top;
          const tx = targetRect.left - containerRect.left;
          const ty = targetRect.top + targetRect.height / 2 - containerRect.top;
          const cpx = (sx + tx) / 2;

          const d = `M ${sx} ${sy} C ${cpx} ${sy}, ${cpx} ${ty}, ${tx} ${ty}`;
          newPaths.push({ d, key: `${scene.id}-${targetId}` });
        }
      }

      setPaths(newPaths);
    }, 100);

    return () => clearTimeout(timer);
  }, [scenes, steps, containerRef]);

  if (paths.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-10" style={{ overflow: "visible" }}>
      <defs>
        <marker id="scene-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <path d="M 0 0 L 8 3 L 0 6 Z" fill="hsl(var(--connection))" />
        </marker>
      </defs>
      {paths.map(({ d, key }) => (
        <path
          key={key}
          d={d}
          stroke="hsl(var(--connection))"
          strokeWidth={1.5}
          fill="none"
          strokeDasharray="6 3"
          markerEnd="url(#scene-arrow)"
          opacity={0.5}
        />
      ))}
    </svg>
  );
}

export function WorkflowCanvas({
  steps,
  scenes,
  selectedStepId,
  selectedColumn,
  onSelectStep,
  onSelectColumn,
  onRemoveStep,
  onMoveStep,
  onAddStepToColumn,
  onAddScene,
  onRenameScene,
  onRemoveScene,
}: CanvasProps) {
  const [dropTarget, setDropTarget] = useState<{ col: ColumnId; index: number } | null>(null);
  const [pickerColumn, setPickerColumn] = useState<ColumnId | null>(null);
  const simContainerRef = useRef<HTMLDivElement>(null);

  const stepsByColumn = (col: ColumnId) =>
    steps.filter((s) => s.column === col).sort((a, b) => a.order - b.order);

  // Group simulation steps by scene
  const simSceneGroups = useMemo(() => {
    const simSteps = steps.filter(s => s.column === "simulation").sort((a, b) => a.order - b.order);
    const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);
    const groups: { scene: Scene; steps: Step[] }[] = [];
    const assignedIds = new Set<string>();

    for (const scene of sortedScenes) {
      const sceneSteps = simSteps.filter(s => s.sceneId === scene.id);
      groups.push({ scene, steps: sceneSteps });
      sceneSteps.forEach(s => assignedIds.add(s.id));
    }

    // Ungrouped simulation steps
    const ungrouped = simSteps.filter(s => !assignedIds.has(s.id));
    return { groups, ungrouped };
  }, [steps, scenes]);

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

  const renderIntroOrReview = (col: typeof COLUMNS[number]) => {
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

  const simCol = COLUMNS.find(c => c.id === "simulation")!;
  const isSimActive = selectedColumn === "simulation";
  const isSimDropHere = dropTarget?.col === "simulation";

  return (
    <div className="flex-1 bg-canvas p-4 overflow-auto relative">
      <div className="flex gap-3 relative z-20 min-h-[500px] items-start">
        {/* INTRO column */}
        {renderIntroOrReview(COLUMNS[0])}

        {/* SIMULATION column — scene-based */}
        <div
          ref={simContainerRef}
          className={`flex-1 min-w-[320px] shrink-0 rounded-lg border-2 transition-colors relative ${
            isSimDropHere
              ? "border-primary/50 bg-primary/5"
              : isSimActive
              ? "border-primary/30"
              : "border-border"
          } ${simCol.bgClass}`}
          onClick={(e) => { e.stopPropagation(); onSelectColumn("simulation"); }}
        >
          <div className={`px-3 py-2 rounded-t-md flex items-center justify-between ${simCol.headerClass}`}>
            <h3 className="text-xs font-bold tracking-wider text-foreground/70">SIMULATION</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onAddScene(`Scene ${scenes.length + 1}`);
              }}
            >
              <Plus className="w-3 h-3" /> Add Scene
            </Button>
          </div>

          <div
            className="p-3 relative"
            onDragOver={(e) => handleDragOver(e, "simulation")}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "simulation")}
          >
            {/* Arrows now inline with scenes */}

            {/* Scene containers in horizontal flow */}
            {simSceneGroups.groups.length > 0 ? (
              <div className="flex gap-3 relative z-20 overflow-x-auto pb-2 scrollbar-thin">
                {simSceneGroups.groups.map(({ scene, steps: sceneSteps }, idx) => (
                  <div key={scene.id} className="flex items-center shrink-0">
                    {idx > 0 && (
                      <svg className="w-8 h-6 shrink-0 -mx-1" viewBox="0 0 32 24">
                        <defs>
                          <marker id={`arrow-${scene.id}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                            <path d="M 0 0 L 8 3 L 0 6 Z" fill="hsl(var(--connection))" />
                          </marker>
                        </defs>
                        <line x1="0" y1="12" x2="24" y2="12" stroke="hsl(var(--connection))" strokeWidth="1.5" markerEnd={`url(#arrow-${scene.id})`} />
                      </svg>
                    )}
                    <div className="w-[260px] shrink-0">
                      <SceneContainer
                        scene={scene}
                        steps={sceneSteps}
                        selectedStepId={selectedStepId}
                        onSelectStep={onSelectStep}
                        onRemoveStep={onRemoveStep}
                        onRenameScene={onRenameScene}
                        onRemoveScene={onRemoveScene}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Ungrouped steps */}
            {simSceneGroups.ungrouped.length > 0 && (
              <div className={`space-y-2 ${simSceneGroups.groups.length > 0 ? "mt-3 pt-3 border-t border-border" : ""}`}>
                <p className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">Ungrouped Steps</p>
                {simSceneGroups.ungrouped.map((step) => (
                  <div key={step.id} data-step-id={step.id}>
                    <StepCard
                      step={step}
                      isSelected={selectedStepId === step.id}
                      onSelect={() => onSelectStep(step.id)}
                      onRemove={() => onRemoveStep(step.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {simSceneGroups.groups.length === 0 && simSceneGroups.ungrouped.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">
                Add scenes to organize your simulation flow
              </p>
            )}
          </div>

          {/* Add Step at bottom */}
          <div className="flex justify-center pb-2">
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
              onAdd={(type, label, column, index) => {
                onAddStepToColumn(type, label, column, index);
                onSelectColumn(column);
              }}
              onClose={() => setPickerColumn(null)}
            />
          )}
        </div>

        {/* REVIEW column */}
        {renderIntroOrReview(COLUMNS[2])}
      </div>
    </div>
  );
}
