import { useRef, useEffect, useState, useCallback } from "react";
import { Step, ColumnId, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, GitBranch, StopCircle } from "lucide-react";
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
  const sortedByColumn: Record<ColumnId, Step[]> = {
    intro: [],
    simulation: [],
    review: [],
  };

  steps.forEach((s) => sortedByColumn[s.column].push(s));
  Object.values(sortedByColumn).forEach((arr) => arr.sort((a, b) => a.order - b.order));

  // Build a flat ordered list: intro steps → simulation steps → review steps
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
      connections.push({
        fromId: step.id,
        toId: flatOrder[i + 1].id,
        type: "linear",
      });
    }
  }

  return connections;
}

export function WorkflowFlowView({ steps, selectedStepId, onSelectStep }: WorkflowFlowViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<JSX.Element[]>([]);

  const setNodeRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    nodeRefs.current[id] = el;
  }, []);

  const computePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const connections = buildConnections(steps);
    const elements: JSX.Element[] = [];

    connections.forEach((conn, i) => {
      const fromEl = nodeRefs.current[conn.fromId];
      if (!fromEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
      const y1 = fromRect.bottom - containerRect.top;

      if (conn.toId === "__end__") {
        // Draw to an "end" indicator below the node
        const endY = y1 + 48;
        elements.push(
          <g key={`conn-${i}`}>
            <path
              d={`M ${x1} ${y1} L ${x1} ${endY}`}
              stroke={conn.color || "hsl(0, 72%, 51%)"}
              strokeWidth={2}
              fill="none"
              strokeDasharray="6 3"
            />
            <rect x={x1 - 24} y={endY} width={48} height={22} rx={11} fill="hsl(0, 72%, 51%)" />
            <text x={x1} y={endY + 15} textAnchor="middle" fill="white" fontSize={11} fontWeight={600}>
              End
            </text>
          </g>
        );
        return;
      }

      const toEl = nodeRefs.current[conn.toId];
      if (!toEl) return;

      const toRect = toEl.getBoundingClientRect();
      const x2 = toRect.left + toRect.width / 2 - containerRect.left;
      const y2 = toRect.top - containerRect.top;

      const midY = (y1 + y2) / 2;
      const strokeColor = conn.type === "branch" ? (conn.color || "hsl(var(--primary))") : "hsl(var(--muted-foreground) / 0.35)";
      const strokeWidth = conn.type === "branch" ? 2 : 1.5;

      elements.push(
        <g key={`conn-${i}`}>
          <path
            d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Arrow */}
          <circle cx={x2} cy={y2} r={3} fill={strokeColor} />
          {conn.label && (
            <text
              x={(x1 + x2) / 2}
              y={midY - 4}
              textAnchor="middle"
              fill={strokeColor}
              fontSize={10}
              fontWeight={500}
              className="select-none"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    });

    setPaths(elements);
  }, [steps]);

  useEffect(() => {
    // Delay to let nodes render
    const timer = setTimeout(computePaths, 50);
    return () => clearTimeout(timer);
  }, [steps, computePaths]);

  useEffect(() => {
    const observer = new ResizeObserver(computePaths);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [computePaths]);

  const sortedByColumn: Record<ColumnId, Step[]> = {
    intro: [],
    simulation: [],
    review: [],
  };
  steps.forEach((s) => sortedByColumn[s.column].push(s));
  Object.values(sortedByColumn).forEach((arr) => arr.sort((a, b) => a.order - b.order));

  return (
    <div className="flex-1 overflow-auto bg-[hsl(var(--canvas))] p-6 relative" ref={containerRef}>
      {/* SVG overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {paths}
      </svg>

      {/* Columns */}
      <div className="flex gap-8 min-w-[720px] relative z-10">
        {COLUMN_ORDER.map((col) => (
          <div key={col} className="flex-1 min-w-[220px]">
            <div className={cn(
              "mb-4 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider text-muted-foreground",
              col === "intro" && "bg-[hsl(var(--column-header-intro))]",
              col === "simulation" && "bg-[hsl(var(--column-header-sim))]",
              col === "review" && "bg-[hsl(var(--column-header-review))]"
            )}>
              {COLUMN_LABELS[col]}
            </div>

            <div className="flex flex-col gap-4">
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
                      "wf-node rounded-lg border bg-card p-3 cursor-pointer transition-all hover:shadow-md",
                      isSelected && "ring-2 ring-primary border-primary",
                      isDecision && "border-l-[3px] border-l-primary",
                      hasInvalidBranch && "border-l-[3px] border-l-destructive ring-1 ring-destructive/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {isDecision && <GitBranch className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <span className="text-sm font-medium text-foreground truncate">{step.title}</span>
                      {hasInvalidBranch && (
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      )}
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

                    {/* Show branch choices summary */}
                    {isDecision && step.choices && step.choices.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {step.choices.map((choice, ci) => (
                          <div key={choice.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: BRANCH_COLORS[ci % BRANCH_COLORS.length] }}
                            />
                            <span className="truncate">{choice.label || "Untitled"}</span>
                            {choice.nextStepId === "__end__" && (
                              <StopCircle className="w-3 h-3 text-destructive shrink-0 ml-auto" />
                            )}
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
  );
}
