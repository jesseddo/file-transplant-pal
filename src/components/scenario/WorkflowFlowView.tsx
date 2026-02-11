import { useRef, useEffect, useState, useCallback } from "react";
import { Step, ColumnId, StepType, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, GitBranch, StopCircle, ZoomIn, ZoomOut, Maximize, LayoutGrid, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WorkflowFlowViewProps {
  steps: Step[];
  selectedStepId: string | null;
  onSelectStep: (id: string | null) => void;
  onUpdateStep: (stepId: string, updates: Partial<Step>) => void;
}

interface Connection {
  fromId: string;
  toId: string | "__end__";
  type: "linear" | "branch";
  label?: string;
  color?: string;
}

const COLUMN_ORDER: ColumnId[] = ["intro", "simulation", "review"];
const LANE_X_START = 100;
const LANE_X_GAP = 280;
const LANE_Y_CENTER = 200;

const BRANCH_COLORS = [
  "hsl(var(--primary))",
  "hsl(340, 70%, 50%)",
  "hsl(150, 60%, 40%)",
  "hsl(30, 80%, 50%)",
  "hsl(260, 70%, 50%)",
];

function autoPosition(steps: Step[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const byCol: Record<ColumnId, Step[]> = { intro: [], simulation: [], review: [] };
  steps.forEach((s) => byCol[s.column].push(s));
  Object.values(byCol).forEach((arr) => arr.sort((a, b) => a.order - b.order));

  const flatOrder = COLUMN_ORDER.flatMap((col) => byCol[col]);
  flatOrder.forEach((step, i) => {
    positions[step.id] = { x: LANE_X_START + i * LANE_X_GAP, y: LANE_Y_CENTER };
  });
  return positions;
}

function buildConnections(steps: Step[]): Connection[] {
  const connections: Connection[] = [];
  const sortedByColumn: Record<ColumnId, Step[]> = { intro: [], simulation: [], review: [] };
  steps.forEach((s) => sortedByColumn[s.column].push(s));
  Object.values(sortedByColumn).forEach((arr) => arr.sort((a, b) => a.order - b.order));
  const flatOrder = COLUMN_ORDER.flatMap((col) => sortedByColumn[col]);

  for (let i = 0; i < flatOrder.length; i++) {
    const step = flatOrder[i];
    if (step.flowBehavior === "decision" && step.choices && step.choices.length > 0) {
      step.choices.forEach((choice, ci) => {
        connections.push({
          fromId: step.id,
          toId: choice.nextStepId || "",
          type: "branch",
          label: choice.label,
          color: BRANCH_COLORS[ci % BRANCH_COLORS.length],
        });
      });
    } else if (i < flatOrder.length - 1) {
      connections.push({ fromId: step.id, toId: flatOrder[i + 1].id, type: "linear" });
    }
  }
  return connections;
}

// Node dimensions (approximate for connection drawing)
const NODE_W = 220;
const NODE_H = 70;

export function WorkflowFlowView({ steps, selectedStepId, onSelectStep, onUpdateStep }: WorkflowFlowViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Dragging state
  const [dragging, setDragging] = useState<{ stepId: string; startMouse: { x: number; y: number }; startPos: { x: number; y: number } } | null>(null);
  // Panning state
  const [panning, setPanning] = useState<{ startMouse: { x: number; y: number }; startPan: { x: number; y: number } } | null>(null);

  // Initialize positions from step data or auto-layout
  useEffect(() => {
    const pos: Record<string, { x: number; y: number }> = {};
    const fallback = autoPosition(steps);
    let needsUpdate = false;
    steps.forEach((s) => {
      if (s.ui?.position) {
        pos[s.id] = { ...s.ui.position };
      } else {
        pos[s.id] = fallback[s.id] || { x: 100, y: 100 };
        needsUpdate = true;
      }
    });
    setPositions(pos);
    // Persist fallback positions
    if (needsUpdate) {
      steps.forEach((s) => {
        if (!s.ui?.position && pos[s.id]) {
          onUpdateStep(s.id, { ui: { position: pos[s.id] } });
        }
      });
    }
    // Only run on step count/id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.map(s => s.id).join(",")]);

  // Wheel scroll: horizontal pan (no ctrl), zoom (with ctrl)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.003)));
      } else {
        e.preventDefault();
        setPan((p) => ({
          x: p.x - e.deltaX - e.deltaY,
          y: p.y,
        }));
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  // Mouse move/up for drag & pan
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startMouse.x) / zoom;
        const dy = (e.clientY - dragging.startMouse.y) / zoom;
        setPositions((prev) => ({
          ...prev,
          [dragging.stepId]: {
            x: dragging.startPos.x + dx,
            y: dragging.startPos.y + dy,
          },
        }));
      }
      if (panning) {
        setPan({
          x: panning.startPan.x + (e.clientX - panning.startMouse.x),
          y: panning.startPan.y + (e.clientY - panning.startMouse.y),
        });
      }
    };
    const handleUp = () => {
      if (dragging) {
        const pos = positions[dragging.stepId];
        if (pos) {
          onUpdateStep(dragging.stepId, { ui: { position: pos } });
        }
        setDragging(null);
      }
      if (panning) setPanning(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, panning, zoom, positions, onUpdateStep]);

  const handleNodeMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const pos = positions[stepId];
    if (!pos) return;
    setDragging({
      stepId,
      startMouse: { x: e.clientX, y: e.clientY },
      startPos: { ...pos },
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan on left-click on empty canvas
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg) {
      setPanning({
        startMouse: { x: e.clientX, y: e.clientY },
        startPan: { ...pan },
      });
    }
  };

  const handleAutoArrange = () => {
    const newPos = autoPosition(steps);
    setPositions(newPos);
    steps.forEach((s) => {
      onUpdateStep(s.id, { ui: { position: newPos[s.id] } });
    });
  };

  const handleFitToContent = () => {
    if (!containerRef.current || steps.length === 0) return;
    const allPos = Object.values(positions);
    if (allPos.length === 0) return;
    const minX = Math.min(...allPos.map((p) => p.x));
    const minY = Math.min(...allPos.map((p) => p.y));
    const maxX = Math.max(...allPos.map((p) => p.x)) + NODE_W;
    const maxY = Math.max(...allPos.map((p) => p.y)) + NODE_H;
    const contentW = maxX - minX + 100;
    const contentH = maxY - minY + 100;
    const rect = containerRef.current.getBoundingClientRect();
    const newZoom = Math.min(1.5, Math.max(0.3, Math.min(rect.width / contentW, rect.height / contentH)));
    setZoom(newZoom);
    setPan({
      x: (rect.width - contentW * newZoom) / 2 - minX * newZoom + 50 * newZoom,
      y: (rect.height - contentH * newZoom) / 2 - minY * newZoom + 50 * newZoom,
    });
  };

  // Build SVG connections
  const connections = buildConnections(steps);
  const svgElements: JSX.Element[] = [];
  connections.forEach((conn, i) => {
    const fromPos = positions[conn.fromId];
    if (!fromPos) return;
    const x1 = fromPos.x + NODE_W;
    const y1 = fromPos.y + NODE_H / 2;

    if (conn.toId === "__end__") {
      const endX = x1 + 50;
      svgElements.push(
        <g key={`conn-${i}`}>
          <path d={`M ${x1} ${y1} L ${endX} ${y1}`} stroke={conn.color || "hsl(0, 72%, 51%)"} strokeWidth={2} fill="none" strokeDasharray="6 3" />
          <rect x={endX} y={y1 - 11} width={48} height={22} rx={11} fill="hsl(0, 72%, 51%)" />
          <text x={endX + 24} y={y1 + 4} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>End</text>
        </g>
      );
      return;
    }

    const toPos = positions[conn.toId];
    if (!toPos) return;
    const x2 = toPos.x;
    const y2 = toPos.y + NODE_H / 2;
    const offsetX = Math.abs(x2 - x1) * 0.4;
    const strokeColor = conn.type === "branch" ? (conn.color || "hsl(var(--primary))") : "hsl(var(--muted-foreground) / 0.35)";
    const strokeWidth = conn.type === "branch" ? 2 : 1.5;

    svgElements.push(
      <g key={`conn-${i}`}>
        <path d={`M ${x1} ${y1} C ${x1 + offsetX} ${y1}, ${x2 - offsetX} ${y2}, ${x2} ${y2}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
        <circle cx={x2} cy={y2} r={3} fill={strokeColor} />
        {conn.label && (
          <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 6} textAnchor="middle" fill={strokeColor} fontSize={10} fontWeight={500} className="select-none">
            {conn.label}
          </text>
        )}
      </g>
    );
  });

  // Compute SVG bounds
  const allPos = Object.values(positions);
  const svgW = allPos.length > 0 ? Math.max(...allPos.map((p) => p.x)) + NODE_W + 200 : 2000;
  const svgH = allPos.length > 0 ? Math.max(...allPos.map((p) => p.y)) + NODE_H + 200 : 1000;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-[hsl(var(--canvas))] relative select-none"
      onMouseDown={handleCanvasMouseDown}
      style={{ cursor: panning ? "grabbing" : "default" }}
    >
      {/* Canvas layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "relative",
          width: svgW,
          height: svgH,
        }}
      >
        {/* SVG connections - z-index 1 */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1, width: svgW, height: svgH }}
        >
          {svgElements}
        </svg>


        {/* Step nodes - z-index 2 */}
        {steps.map((step) => {
          const pos = positions[step.id];
          if (!pos) return null;
          const isDecision = step.flowBehavior === "decision";
          const isSelected = step.id === selectedStepId;
          const hasInvalidBranch = isDecision && !isDecisionCheckpointValid(step);
          const category = STEP_TYPE_CATEGORY[step.type];
          const badgeClass = CATEGORY_BADGE_CLASS[category];

          return (
            <div
              key={step.id}
              className={cn(
                "absolute rounded-lg border bg-card p-3 cursor-grab transition-shadow hover:shadow-md border-l-[3px]",
                step.column === "intro" && "border-l-[hsl(var(--column-header-intro))]",
                step.column === "simulation" && "border-l-[hsl(var(--column-header-sim))]",
                step.column === "review" && "border-l-[hsl(var(--column-header-review))]",
                isSelected && "ring-2 ring-primary",
                hasInvalidBranch && "border-l-[3px] border-l-destructive ring-1 ring-destructive/30",
                dragging?.stepId === step.id && "cursor-grabbing shadow-lg"
              )}
              style={{
                left: pos.x,
                top: pos.y,
                zIndex: dragging?.stepId === step.id ? 10 : 2,
                width: NODE_W,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, step.id)}
              onClick={(e) => {
                // Only select if not dragged
                if (!dragging) {
                  e.stopPropagation();
                  onSelectStep(step.id);
                }
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {isDecision && <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />}
                <span className="text-sm font-medium text-foreground truncate">{step.title}</span>
                {hasInvalidBranch && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className={cn("text-[10px] px-1.5 py-0 h-4 border-none", badgeClass)}>
                  {STEP_TYPE_LABELS[step.type]}
                </Badge>
                {isDecision && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {step.choices?.length ?? 0} branches
                  </Badge>
                )}
              </div>
              {isDecision && step.choices && step.choices.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {step.choices.map((choice, ci) => (
                    <div key={choice.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRANCH_COLORS[ci % BRANCH_COLORS.length] }} />
                      <span className="truncate">{choice.label || "Untitled"}</span>
                      {choice.nextStepId === "__end__" && <StopCircle className="w-3 h-3 text-destructive shrink-0 ml-auto" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Canvas controls toolbar */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1 bg-card border border-border rounded-lg p-1 shadow-md">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(2, z + 0.15))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground px-1 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <div className="w-px h-5 bg-border" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Reset zoom">
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFitToContent} title="Fit to content">
          <Maximize className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleAutoArrange} title="Auto arrange">
          <LayoutGrid className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
