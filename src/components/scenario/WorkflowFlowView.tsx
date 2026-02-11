import { useRef, useEffect, useState, useCallback } from "react";
import { Step, ColumnId, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, GitBranch, StopCircle, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkflowFlowViewProps {
  steps: Step[];
  selectedStepId: string | null;
  onSelectStep: (id: string | null) => void;
}

interface Connection {
  fromId: string;
  toId: string | "__end__";
  type: "linear" | "branch";
  label?: string;
  color?: string;
}

const COLUMN_ORDER: ColumnId[] = ["intro", "simulation", "review"];
const COLUMN_LABELS: Record<ColumnId, string> = {
  intro: "Intro",
  simulation: "Simulation",
  review: "Review",
};

const BRANCH_COLORS = [
  "hsl(var(--primary))",
  "hsl(340, 70%, 50%)",
  "hsl(150, 60%, 40%)",
  "hsl(30, 80%, 50%)",
  "hsl(260, 70%, 50%)",
];

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

/** Walk offsetParent chain to get position relative to an ancestor */
function getOffsetRelativeTo(el: HTMLElement, ancestor: HTMLElement): { x: number; y: number } {
  let x = 0, y = 0;
  let current: HTMLElement | null = el;
  while (current && current !== ancestor) {
    x += current.offsetLeft;
    y += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

export function WorkflowFlowView({ steps, selectedStepId, onSelectStep }: WorkflowFlowViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<JSX.Element[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 2400, h: 800 });
  const [zoom, setZoom] = useState(1);

  const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  }, []);

  const computePaths = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setSvgSize({ w: canvas.scrollWidth, h: canvas.scrollHeight });

    const connections = buildConnections(steps);
    const elements: JSX.Element[] = [];

    connections.forEach((conn, i) => {
      const fromEl = nodeRefs.current[conn.fromId];
      if (!fromEl) return;

      const fromPos = getOffsetRelativeTo(fromEl, canvas);
      const x1 = fromPos.x + fromEl.offsetWidth / 2;
      const y1 = fromPos.y + fromEl.offsetHeight;

      if (conn.toId === "__end__") {
        const endY = y1 + 48;
        elements.push(
          <g key={`conn-${i}`}>
            <path d={`M ${x1} ${y1} L ${x1} ${endY}`} stroke={conn.color || "hsl(0, 72%, 51%)"} strokeWidth={2} fill="none" strokeDasharray="6 3" />
            <rect x={x1 - 24} y={endY} width={48} height={22} rx={11} fill="hsl(0, 72%, 51%)" />
            <text x={x1} y={endY + 15} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>End</text>
          </g>
        );
        return;
      }

      const toEl = nodeRefs.current[conn.toId];
      if (!toEl) return;

      const toPos = getOffsetRelativeTo(toEl, canvas);
      const x2 = toPos.x + toEl.offsetWidth / 2;
      const y2 = toPos.y;

      const midY = (y1 + y2) / 2;
      const strokeColor = conn.type === "branch" ? (conn.color || "hsl(var(--primary))") : "hsl(var(--muted-foreground) / 0.35)";
      const strokeWidth = conn.type === "branch" ? 2 : 1.5;

      elements.push(
        <g key={`conn-${i}`}>
          <path d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" />
          <circle cx={x2} cy={y2} r={3} fill={strokeColor} />
          {conn.label && (
            <text x={(x1 + x2) / 2} y={midY - 4} textAnchor="middle" fill={strokeColor} fontSize={10} fontWeight={500} className="select-none">
              {conn.label}
            </text>
          )}
        </g>
      );
    });

    setPaths(elements);
  }, [steps]);

  useEffect(() => {
    const timer = setTimeout(computePaths, 50);
    return () => clearTimeout(timer);
  }, [steps, computePaths]);

  useEffect(() => {
    const observer = new ResizeObserver(computePaths);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [computePaths]);

  // Zoom via Ctrl+wheel
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.min(1.5, Math.max(0.5, z - e.deltaY * 0.002)));
      }
    };
    scrollEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => scrollEl.removeEventListener("wheel", handleWheel);
  }, []);

  const sortedByColumn: Record<ColumnId, Step[]> = { intro: [], simulation: [], review: [] };
  steps.forEach((s) => sortedByColumn[s.column].push(s));
  Object.values(sortedByColumn).forEach((arr) => arr.sort((a, b) => a.order - b.order));

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto bg-[hsl(var(--canvas))] relative">
      {/* Zoom indicator */}
      {zoom !== 1 && (
        <div className="sticky top-2 right-2 z-30 flex justify-end px-2 pointer-events-none">
          <Badge variant="secondary" className="pointer-events-auto flex items-center gap-1 text-xs">
            <ZoomIn className="w-3 h-3" />
            {Math.round(zoom * 100)}%
          </Badge>
        </div>
      )}

      <div
        ref={canvasRef}
        className="relative min-w-[2400px] p-6"
        style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
      >
        {/* Layer 1: SVG connections (behind cards) */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1, width: svgSize.w, height: svgSize.h }}
        >
          {paths}
        </svg>

        {/* Layer 2: Step cards (above arrows) */}
        <div className="flex gap-16 relative" style={{ zIndex: 2 }}>
          {COLUMN_ORDER.map((col) => (
            <div key={col} className="w-fit min-w-[200px]">
              <div className={cn(
                "mb-4 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                col === "intro" && "bg-[hsl(var(--column-header-intro))]",
                col === "simulation" && "bg-[hsl(var(--column-header-sim))]",
                col === "review" && "bg-[hsl(var(--column-header-review))]"
              )}>
                {COLUMN_LABELS[col]}
              </div>

              <div className="flex flex-col gap-10">
                {sortedByColumn[col].map((step) => {
                  const isDecision = step.flowBehavior === "decision";
                  const isSelected = step.id === selectedStepId;
                  const hasInvalidBranch = isDecision && !isDecisionCheckpointValid(step);
                  const category = STEP_TYPE_CATEGORY[step.type];
                  const badgeClass = CATEGORY_BADGE_CLASS[category];

                  return (
                    <div
                      key={step.id}
                      ref={setNodeRef(step.id)}
                      onClick={() => onSelectStep(step.id)}
                      className={cn(
                        "wf-node rounded-lg border bg-card p-3 cursor-pointer transition-all hover:shadow-md w-fit max-w-full",
                        isSelected && "ring-2 ring-primary border-primary",
                        isDecision && "border-l-[3px] border-l-primary",
                        hasInvalidBranch && "border-l-[3px] border-l-destructive ring-1 ring-destructive/30"
                      )}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
