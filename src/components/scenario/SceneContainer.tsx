import { Step, Scene } from "@/types/workflow";
import { StepCard } from "./StepCard";
import { ChevronDown, ChevronRight, MoveHorizontal as MoreHorizontal } from "lucide-react";
import { useState, DragEvent } from "react";

interface SceneContainerProps {
  scene: Scene;
  steps: Step[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onRemoveStep: (id: string) => void;
  onRenameScene: (sceneId: string, title: string) => void;
  onRemoveScene: (sceneId: string) => void;
  onDragOverSide?: (side: 'left' | 'right') => void;
  onDragLeaveSide?: () => void;
  onDropOnSide?: (side: 'left' | 'right', e: DragEvent) => void;
  showLeftDropZone?: boolean;
  showRightDropZone?: boolean;
}

export function SceneContainer({
  scene,
  steps,
  selectedStepId,
  onSelectStep,
  onRemoveStep,
  onRenameScene,
  onRemoveScene,
  onDragOverSide,
  onDragLeaveSide,
  onDropOnSide,
  showLeftDropZone,
  showRightDropZone,
}: SceneContainerProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(scene.title);

  const handleTitleCommit = () => {
    setEditing(false);
    if (title.trim() && title !== scene.title) {
      onRenameScene(scene.id, title.trim());
    } else {
      setTitle(scene.title);
    }
  };

  const handleDragOverLeft = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverSide?.('left');
  };

  const handleDragOverRight = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverSide?.('right');
  };

  const handleDragLeave = (e: DragEvent) => {
    e.stopPropagation();
    onDragLeaveSide?.();
  };

  const handleDropLeft = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDropOnSide?.('left', e);
  };

  const handleDropRight = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDropOnSide?.('right', e);
  };

  return (
    <div className="relative" data-scene-id={scene.id}>
      {/* Left drop zone */}
      {showLeftDropZone && (
        <div
          className="absolute left-0 top-0 bottom-0 w-8 -ml-4 bg-primary/20 border-2 border-primary rounded-lg z-10 flex items-center justify-center"
          onDragOver={handleDragOverLeft}
          onDragLeave={handleDragLeave}
          onDrop={handleDropLeft}
        >
          <div className="w-1 h-16 bg-primary rounded-full" />
        </div>
      )}

      {/* Right drop zone */}
      {showRightDropZone && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 -mr-4 bg-primary/20 border-2 border-primary rounded-lg z-10 flex items-center justify-center"
          onDragOver={handleDragOverRight}
          onDragLeave={handleDragLeave}
          onDrop={handleDropRight}
        >
          <div className="w-1 h-16 bg-primary rounded-full" />
        </div>
      )}

      <div className="rounded-lg border border-border bg-[hsl(var(--column-sim))] shadow-sm overflow-hidden"
    >
      {/* Scene header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[hsl(var(--column-header-sim))]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleCommit();
              if (e.key === "Escape") { setTitle(scene.title); setEditing(false); }
            }}
            autoFocus
            className="flex-1 text-xs font-bold tracking-wider bg-transparent border-b border-primary/50 outline-none text-foreground/70 uppercase"
          />
        ) : (
          <h4
            className="flex-1 text-xs font-bold tracking-wider text-foreground/70 uppercase cursor-pointer"
            onDoubleClick={() => setEditing(true)}
          >
            {scene.title}
          </h4>
        )}

        <span className="text-[10px] text-muted-foreground">
          {steps.length} {steps.length === 1 ? "step" : "steps"}
        </span>

        <button
          onClick={() => onRemoveScene(scene.id)}
          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
          title="Remove scene"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scene body */}
      {!collapsed && (
        <div className="p-2.5 space-y-1.5 min-h-[40px]">
          {steps.length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-3">
              No steps in this scene
            </p>
          )}
          {steps.map((step) => (
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
      </div>
    </div>
  );
}
