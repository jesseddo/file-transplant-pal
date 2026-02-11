import { useRef, useEffect, useState, useCallback } from "react";
import { Step, ColumnId, StepType, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, GitBranch, StopCircle, ZoomIn, ZoomOut, Maximize, LayoutGrid, RotateCcw, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EditLogicModal } from "@/components/scenario/EditLogicModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  branchIndex?: number;
  branchTotal?: number;
}

interface EndNodeInfo {
  id: string; // e.g. "__end__:s8:c8c"
  fromStepId: string;
  choiceLabel?: string;
  color?: string;
}

const COLUMN_ORDER: ColumnId[] = ["intro", "simulation", "review"];
const LANE_X_START = 80;
const LANE_Y_START = 60;
const COLUMN_GAP = 200; // gap between column groups
const NODE_X_GAP = 320; // horizontal gap between nodes within main path
const NODE_Y_GAP = 200; // vertical gap between rows

const BRANCH_COLORS = [
  "hsl(var(--primary))",
  "hsl(340, 70%, 50%)",
  "hsl(150, 60%, 40%)",
  "hsl(30, 80%, 50%)",
  "hsl(260, 70%, 50%)",
];

// Node dimensions
const NODE_W = 220;
const NODE_H = 70;
const HANDLE_SIZE = 10;
// Vertical spacing between branch output handles
const BRANCH_HANDLE_SPACING = 16;
// Top offset for first branch handle (below badge row)
const BRANCH_HANDLE_TOP_START = 52;

function autoPosition(steps: Step[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  if (steps.length === 0) return positions;

  // Group by column, sorted by order
  const byCol: Record<ColumnId, Step[]> = { intro: [], simulation: [], review: [] };
  steps.forEach((s) => byCol[s.column].push(s));
  Object.values(byCol).forEach((arr) => arr.sort((a, b) => a.order - b.order));

  // Build connections to understand the graph
  const conns = buildConnections(steps);

  // Find the "main path" — follow linear connections and first branch choices
  const mainPathIds = new Set<string>();
  const mainPathOrder: string[] = [];
  const flatOrder = COLUMN_ORDER.flatMap((col) => byCol[col]);
  if (flatOrder.length > 0) {
    const visited = new Set<string>();
    let current: string | null = flatOrder[0].id;
    while (current && !visited.has(current)) {
      visited.add(current);
      mainPathIds.add(current);
      mainPathOrder.push(current);
      const outgoing = conns.filter((c) => c.fromId === current && c.toId !== "__end__");
      if (outgoing.length === 0) break;
      const linear = outgoing.find((c) => c.type === "linear");
      if (linear) {
        current = linear.toId;
      } else {
        const first = outgoing.sort((a, b) => (a.branchIndex ?? 0) - (b.branchIndex ?? 0))[0];
        current = first?.toId ?? null;
      }
    }
  }

  // Identify branch-only targets (not on main path, not back-references)
  const branchTargets = new Set<string>();
  conns.forEach((c) => {
    if (c.type === "branch" && c.toId !== "__end__" && !mainPathIds.has(c.toId)) {
      branchTargets.add(c.toId);
    }
  });

  // Collect off-main-path branch targets per decision node
  const decisionBranches: Record<string, string[]> = {};
  conns.forEach((c) => {
    if (c.type === "branch" && c.toId !== "__end__" && branchTargets.has(c.toId)) {
      if (!decisionBranches[c.fromId]) decisionBranches[c.fromId] = [];
      if (!decisionBranches[c.fromId].includes(c.toId)) {
        decisionBranches[c.fromId].push(c.toId);
      }
    }
  });

  // Position main path nodes: fully horizontal, decision nodes reserve extra space
  let xCursor = LANE_X_START;
  let lastCol: ColumnId | null = null;

  const mainSteps = mainPathOrder.map((id) => steps.find((s) => s.id === id)!).filter(Boolean);

  mainSteps.forEach((step) => {
    if (lastCol !== null && step.column !== lastCol) {
      xCursor += COLUMN_GAP; // extra gap between phase columns
    }
    positions[step.id] = { x: xCursor, y: LANE_Y_START };
    lastCol = step.column;

    // Reserve extra horizontal space for decision nodes with off-path branches
    const offPathTargets = decisionBranches[step.id];
    const offPathCount = offPathTargets ? offPathTargets.length : 0;

    if (offPathCount > 1) {
      // Reserve enough room so branches can fan out without colliding with the next main-path node
      const reservedWidth = Math.max(NODE_X_GAP, offPathCount * NODE_X_GAP * 0.6);
      xCursor += reservedWidth;
    } else {
      xCursor += NODE_X_GAP;
    }
  });

  // Position branch targets: fan out below their source decision node, spread horizontally
  Object.entries(decisionBranches).forEach(([sourceId, targets]) => {
    const sourcePos = positions[sourceId];
    if (!sourcePos) return;
    // Fan branches horizontally below the source, centered under it
    const totalWidth = (targets.length - 1) * NODE_X_GAP;
    const startX = sourcePos.x - totalWidth / 2;
    targets.forEach((targetId, idx) => {
      if (positions[targetId]) return;
      positions[targetId] = {
        x: startX + idx * NODE_X_GAP,
        y: sourcePos.y + NODE_Y_GAP,
      };
    });
  });

  // Any remaining steps not yet positioned (orphans) — stack below everything
  const allYValues = Object.values(positions).map((p) => p.y);
  let orphanY = allYValues.length > 0 ? Math.max(...allYValues) + NODE_Y_GAP : LANE_Y_START + NODE_Y_GAP * 2;
  let orphanX = LANE_X_START;
  flatOrder.forEach((step) => {
    if (!positions[step.id]) {
      positions[step.id] = { x: orphanX, y: orphanY };
      orphanX += NODE_X_GAP;
    }
  });

  // Collision avoidance pass: nudge overlapping nodes down
  const nodeIds = Object.keys(positions);
  const pad = 40;
  // Sort by Y then X for a predictable sweep
  nodeIds.sort((a, b) => positions[a].y - positions[b].y || positions[a].x - positions[b].x);
  for (let i = 0; i < nodeIds.length; i++) {
    for (let j = i + 1; j < nodeIds.length; j++) {
      const a = positions[nodeIds[i]];
      const b = positions[nodeIds[j]];
      const overlapX = a.x < b.x + NODE_W + pad && b.x < a.x + NODE_W + pad;
      const overlapY = a.y < b.y + NODE_H + pad && b.y < a.y + NODE_H + pad;
      if (overlapX && overlapY) {
        // Push j down
        b.y = a.y + NODE_H + pad;
      }
    }
  }

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
      // Prefer routingRules if defined
      if (step.routingRules && step.routingRules.length > 0) {
        step.routingRules.forEach((rule, idx) => {
          const choice = step.choices?.find((c) => c.id === rule.choiceId);
          connections.push({
            fromId: step.id,
            toId: rule.nextStepId || "",
            type: "branch",
            label: choice?.label,
            color: BRANCH_COLORS[idx % BRANCH_COLORS.length],
            branchIndex: idx,
            branchTotal: step.routingRules!.length,
          });
        });
        if (step.fallbackNextStepId && step.fallbackNextStepId !== "__none__") {
          connections.push({
            fromId: step.id,
            toId: step.fallbackNextStepId,
            type: "linear",
            label: "fallback",
          });
        }
      } else {
        // Fall back to choices[].nextStepId
        const total = step.choices.length;
        step.choices.forEach((choice, ci) => {
          connections.push({
            fromId: step.id,
            toId: choice.nextStepId || "",
            type: "branch",
            label: choice.label,
            color: BRANCH_COLORS[ci % BRANCH_COLORS.length],
            branchIndex: ci,
            branchTotal: total,
          });
        });
      }
    } else if (i < flatOrder.length - 1) {
      connections.push({ fromId: step.id, toId: flatOrder[i + 1].id, type: "linear" });
    }
  }
  return connections;
}

// Bezier midpoint helper
function bezierMidpoint(
  x1: number, y1: number,
  cx1: number, cy1: number,
  cx2: number, cy2: number,
  x2: number, y2: number,
  t = 0.5
) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * x1 + 3 * mt ** 2 * t * cx1 + 3 * mt * t ** 2 * cx2 + t ** 3 * x2,
    y: mt ** 3 * y1 + 3 * mt ** 2 * t * cy1 + 3 * mt * t ** 2 * cy2 + t ** 3 * y2,
  };
}

type Direction = 'right' | 'bottom' | 'left' | 'top';

function getDirection(fromPos: { x: number; y: number }, toPos: { x: number; y: number }): Direction {
  const fromCx = fromPos.x + NODE_W / 2;
  const fromCy = fromPos.y + NODE_H / 2;
  const toCx = toPos.x + NODE_W / 2;
  const toCy = toPos.y + NODE_H / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  // Use aspect-ratio-adjusted comparison so horizontal bias matches wide nodes
  if (Math.abs(dx) * (NODE_H / NODE_W) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'bottom' : 'top';
}

function getSmartOutputPos(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  branchIndex?: number,
  branchTotal?: number
): { x: number; y: number; direction: Direction } {
  const dir = getDirection(sourcePos, targetPos);
  // For branch handles, stack along the chosen side
  if (branchIndex !== undefined && branchTotal !== undefined && branchTotal > 0) {
    const spacing = BRANCH_HANDLE_SPACING;
    if (dir === 'right' || dir === 'left') {
      const y = sourcePos.y + BRANCH_HANDLE_TOP_START + branchIndex * spacing;
      return { x: dir === 'right' ? sourcePos.x + NODE_W : sourcePos.x, y, direction: dir };
    }
    // bottom/top: stack horizontally
    const totalW = (branchTotal - 1) * spacing;
    const startX = sourcePos.x + NODE_W / 2 - totalW / 2;
    const x = startX + branchIndex * spacing;
    return { x, y: dir === 'bottom' ? sourcePos.y + NODE_H : sourcePos.y, direction: dir };
  }
  switch (dir) {
    case 'right':  return { x: sourcePos.x + NODE_W, y: sourcePos.y + NODE_H / 2, direction: dir };
    case 'left':   return { x: sourcePos.x, y: sourcePos.y + NODE_H / 2, direction: dir };
    case 'bottom': return { x: sourcePos.x + NODE_W / 2, y: sourcePos.y + NODE_H, direction: dir };
    case 'top':    return { x: sourcePos.x + NODE_W / 2, y: sourcePos.y, direction: dir };
  }
}

function getSmartInputPos(
  targetPos: { x: number; y: number },
  sourcePos: { x: number; y: number }
): { x: number; y: number; direction: Direction } {
  // Direction from target toward source, then attach on that side
  const dir = getDirection(targetPos, sourcePos);
  switch (dir) {
    case 'right':  return { x: targetPos.x + NODE_W, y: targetPos.y + NODE_H / 2, direction: dir };
    case 'left':   return { x: targetPos.x, y: targetPos.y + NODE_H / 2, direction: dir };
    case 'bottom': return { x: targetPos.x + NODE_W / 2, y: targetPos.y + NODE_H, direction: dir };
    case 'top':    return { x: targetPos.x + NODE_W / 2, y: targetPos.y, direction: dir };
  }
}

function controlPoint(x: number, y: number, dir: Direction, offset: number): { x: number; y: number } {
  switch (dir) {
    case 'right':  return { x: x + offset, y };
    case 'left':   return { x: x - offset, y };
    case 'bottom': return { x, y: y + offset };
    case 'top':    return { x, y: y - offset };
  }
}

export function WorkflowFlowView({ steps, selectedStepId, onSelectStep, onUpdateStep }: WorkflowFlowViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [editLogicStep, setEditLogicStep] = useState<Step | null>(null);
  const [endNodeConfigs, setEndNodeConfigs] = useState<Record<string, { action: string; message: string }>>({});
  const [activeEndPopover, setActiveEndPopover] = useState<string | null>(null);

  const hasAutoFitted = useRef(false);

  const [dragging, setDragging] = useState<{ stepId: string; startMouse: { x: number; y: number }; startPos: { x: number; y: number } } | null>(null);
  const hasDragged = useRef(false);
  const [panning, setPanning] = useState<{ startMouse: { x: number; y: number }; startPan: { x: number; y: number } } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Initialize positions
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
    if (needsUpdate) {
      steps.forEach((s) => {
        if (!s.ui?.position && pos[s.id]) {
          onUpdateStep(s.id, { ui: { position: pos[s.id] } });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.map(s => s.id).join(",")]);

  // Auto fit-to-view on first mount
  useEffect(() => {
    if (Object.keys(positions).length > 0 && !hasAutoFitted.current) {
      requestAnimationFrame(() => {
        handleFitToContent();
        hasAutoFitted.current = true;
      });
    }
  }, [positions]);

  // Space key listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) setSpaceHeld(true); };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") setSpaceHeld(false); };
    const reset = () => setSpaceHeld(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, []);

  // Wheel: zoom only on Ctrl+scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.003)));
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
        const dist = Math.sqrt((e.clientX - dragging.startMouse.x) ** 2 + (e.clientY - dragging.startMouse.y) ** 2);
        if (dist > 5) hasDragged.current = true;
        setPositions((prev) => ({
          ...prev,
          [dragging.stepId]: { x: dragging.startPos.x + dx, y: dragging.startPos.y + dy },
        }));
      }
      if (panning) {
        setPan({ x: panning.startPan.x + (e.clientX - panning.startMouse.x), y: panning.startPan.y + (e.clientY - panning.startMouse.y) });
      }
    };
    const handleUp = () => {
      if (dragging) {
        const pos = positions[dragging.stepId];
        // Only persist position for real steps, not end nodes
        if (pos && !dragging.stepId.startsWith("__end__")) {
          onUpdateStep(dragging.stepId, { ui: { position: pos } });
        }
        setDragging(null);
        setTimeout(() => { hasDragged.current = false; }, 0);
      }
      if (panning) setPanning(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [dragging, panning, zoom, positions, onUpdateStep]);

  const handleNodeMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const pos = positions[stepId];
    if (!pos) return;
    hasDragged.current = false;
    setDragging({ stepId, startMouse: { x: e.clientX, y: e.clientY }, startPos: { ...pos } });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const isCanvas = e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg;
    if (!isCanvas) return;
    if ((spaceHeld && e.button === 0) || e.button === 1) {
      e.preventDefault();
      setPanning({ startMouse: { x: e.clientX, y: e.clientY }, startPan: { ...pan } });
    }
  };

  const handleAutoArrange = () => {
    const newPos = autoPosition(steps);
    setPositions(newPos);
    steps.forEach((s) => onUpdateStep(s.id, { ui: { position: newPos[s.id] } }));
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

  // Build connections & compute target offsets
  const connections = buildConnections(steps);

  // Collect end nodes and auto-position them
  const END_PILL_W = 56;
  const END_PILL_H = 28;
  const endNodes: EndNodeInfo[] = [];
  const endNodeIdSet = new Set<string>();
  connections.forEach((conn, i) => {
    if (conn.toId === "__end__") {
      const endId = `__end__${i}`;
      if (!endNodeIdSet.has(endId)) {
        endNodeIdSet.add(endId);
        endNodes.push({
          id: endId,
          fromStepId: conn.fromId,
          choiceLabel: conn.label,
          color: conn.color,
        });
        // Auto-position if not already placed
        if (!positions[endId]) {
          const fromPos = positions[conn.fromId];
          if (fromPos) {
            // Place end nodes to the right and below their source, stacked vertically
            const existingEndCount = Object.keys(positions).filter(
              (k) => k.startsWith("__end__") && positions[k] &&
                Math.abs(positions[k].x - (fromPos.x + NODE_X_GAP * 0.7)) < 10
            ).length;
            setPositions((prev) => ({
              ...prev,
              [endId]: {
                x: fromPos.x + NODE_X_GAP * 0.7,
                y: fromPos.y + NODE_Y_GAP + existingEndCount * (NODE_H + 60),
              },
            }));
          }
        }
      }
    }
  });

  // Count how many edges target the same node for vertical offset
  const targetCounts: Record<string, number> = {};
  const targetIndices: Map<Connection, number> = new Map();
  connections.forEach((conn) => {
    if (conn.toId && conn.toId !== "__end__") {
      targetCounts[conn.toId] = (targetCounts[conn.toId] || 0) + 1;
    }
  });
  const targetCurrentIndex: Record<string, number> = {};
  connections.forEach((conn) => {
    if (conn.toId && conn.toId !== "__end__") {
      const idx = targetCurrentIndex[conn.toId] || 0;
      targetIndices.set(conn, idx);
      targetCurrentIndex[conn.toId] = idx + 1;
    }
  });

  const svgElements: JSX.Element[] = [];
  let endConnIdx = 0;
  connections.forEach((conn, i) => {
    const fromPos = positions[conn.fromId];
    if (!fromPos) return;

    if (conn.toId === "__end__") {
      const endId = `__end__${i}`;
      const endPos = positions[endId];
      if (!endPos) { endConnIdx++; return; }

      // Draw edge from source to end node center
      const endCenterPos = { x: endPos.x, y: endPos.y + END_PILL_H / 2 };
      // Use source output handle toward the end node
      const fakeTargetPos = { x: endPos.x - END_PILL_W / 2, y: endPos.y };
      const out = getSmartOutputPos(fromPos, fakeTargetPos, conn.branchIndex, conn.branchTotal);
      const x1 = out.x;
      const y1 = out.y;
      const x2 = endCenterPos.x;
      const y2 = endCenterPos.y;
      const edgeColor = conn.color || "hsl(0, 72%, 51%)";
      const offset = Math.min(120, Math.max(60, Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 0.3));
      const cp1 = controlPoint(x1, y1, out.direction, offset);
      // Input direction: from end node toward source
      const inDir = getDirection({ x: endPos.x - END_PILL_W / 2, y: endPos.y }, fromPos);
      const cp2 = controlPoint(x2, y2, inDir, offset);
      const pathData = `M ${x1} ${y1} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${x2} ${y2}`;

      svgElements.push(
        <g key={`conn-${i}`}>
          <path d={pathData} stroke="transparent" strokeWidth={14} fill="none" />
          <path d={pathData} stroke={edgeColor} strokeWidth={2} fill="none" strokeDasharray="6 3" />
          <circle cx={x2} cy={y2} r={3} fill={edgeColor} />
          {conn.label && (() => {
            const mid = bezierMidpoint(x1, y1, cp1.x, cp1.y, cp2.x, cp2.y, x2, y2);
            const textW = conn.label!.length * 6 + 12;
            return (
              <>
                <rect x={mid.x - textW / 2} y={mid.y - 18} width={textW} height={16} rx={8} fill="hsl(var(--card))" stroke={edgeColor} strokeWidth={1} />
                <text x={mid.x} y={mid.y - 7} textAnchor="middle" fill={edgeColor} fontSize={10} fontWeight={500} className="select-none">{conn.label}</text>
              </>
            );
          })()}
        </g>
      );
      endConnIdx++;
      return;
    }

    const toPos = positions[conn.toId];
    if (!toPos) return;

    const out = getSmartOutputPos(fromPos, toPos, conn.branchIndex, conn.branchTotal);
    const inp = getSmartInputPos(toPos, fromPos);
    const x1 = out.x;
    const y1 = out.y;
    const x2 = inp.x;
    const y2 = inp.y;

    const strokeColor = conn.type === "branch" ? (conn.color || "hsl(var(--primary))") : "hsl(var(--muted-foreground) / 0.35)";
    const sw = conn.type === "branch" ? 2 : 1.5;

    const offset = Math.min(120, Math.max(60, Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 0.3));
    const cp1 = controlPoint(x1, y1, out.direction, offset);
    const cp2 = controlPoint(x2, y2, inp.direction, offset);
    const pathData = `M ${x1} ${y1} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${x2} ${y2}`;
    const isDashed = conn.label === "fallback";

    svgElements.push(
      <g key={`conn-${i}`}>
        <path d={pathData} stroke="transparent" strokeWidth={14} fill="none" />
        <path d={pathData} stroke={strokeColor} strokeWidth={sw} fill="none" strokeDasharray={isDashed ? "6 3" : undefined} />
        <circle cx={x2} cy={y2} r={3} fill={strokeColor} />
        {conn.label && (() => {
          const mid = bezierMidpoint(x1, y1, cp1.x, cp1.y, cp2.x, cp2.y, x2, y2);
          const textW = conn.label!.length * 6 + 12;
          return (
            <>
              <rect x={mid.x - textW / 2} y={mid.y - 18} width={textW} height={16} rx={8} fill="hsl(var(--card))" stroke={strokeColor} strokeWidth={1} />
              <text x={mid.x} y={mid.y - 7} textAnchor="middle" fill={strokeColor} fontSize={10} fontWeight={500} className="select-none">{conn.label}</text>
            </>
          );
        })()}
      </g>
    );
  });

  // SVG bounds
  const allPos = Object.values(positions);
  const svgW = allPos.length > 0 ? Math.max(...allPos.map((p) => p.x)) + NODE_W + 200 : 2000;
  const svgH = allPos.length > 0 ? Math.max(...allPos.map((p) => p.y)) + NODE_H + 200 : 1000;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-[hsl(var(--canvas))] relative select-none"
      onMouseDown={handleCanvasMouseDown}
      style={{ cursor: panning ? "grabbing" : spaceHeld ? "grab" : "default" }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
          position: "relative",
          width: svgW,
          height: svgH,
        }}
      >
        {/* SVG connections */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, width: svgW, height: svgH }}>
          {svgElements}
        </svg>

        {/* Step nodes */}
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
                if (!dragging && !hasDragged.current) {
                  e.stopPropagation();
                  if (isDecision && step.choices && step.choices.length > 0) {
                    setEditLogicStep(step);
                  } else {
                    onSelectStep(step.id);
                  }
                }
              }}
            >
              {/* Decorative handles on all four sides */}
              {(['left', 'right', 'top', 'bottom'] as const).map((side) => {
                const sizeStyle = { width: HANDLE_SIZE, height: HANDLE_SIZE } as React.CSSProperties;
                switch (side) {
                  case 'left':   Object.assign(sizeStyle, { left: -(HANDLE_SIZE / 2), top: `calc(50% - ${HANDLE_SIZE / 2}px)` }); break;
                  case 'right':  Object.assign(sizeStyle, { right: -(HANDLE_SIZE / 2), top: `calc(50% - ${HANDLE_SIZE / 2}px)` }); break;
                  case 'top':    Object.assign(sizeStyle, { top: -(HANDLE_SIZE / 2), left: `calc(50% - ${HANDLE_SIZE / 2}px)` }); break;
                  case 'bottom': Object.assign(sizeStyle, { bottom: -(HANDLE_SIZE / 2), left: `calc(50% - ${HANDLE_SIZE / 2}px)` }); break;
                }
                return (
                  <div
                    key={side}
                    className="absolute rounded-full border-2 border-muted-foreground/20 bg-card opacity-50"
                    style={sizeStyle}
                  />
                );
              })}

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

        {/* End nodes (draggable HTML pills) */}
        {endNodes.map((endNode) => {
          const pos = positions[endNode.id];
          if (!pos) return null;
          const config = endNodeConfigs[endNode.id] || { action: "end_scenario", message: "" };
          const isDraggingThis = dragging?.stepId === endNode.id;

          return (
            <Popover
              key={endNode.id}
              open={activeEndPopover === endNode.id}
              onOpenChange={(open) => setActiveEndPopover(open ? endNode.id : null)}
            >
              <PopoverTrigger asChild>
                <div
                  className={cn(
                    "absolute cursor-grab select-none flex items-center justify-center rounded-full text-white text-[11px] font-semibold shadow-md transition-shadow hover:shadow-lg",
                    isDraggingThis && "cursor-grabbing shadow-lg"
                  )}
                  style={{
                    left: pos.x - END_PILL_W / 2,
                    top: pos.y,
                    width: END_PILL_W,
                    height: END_PILL_H,
                    backgroundColor: "hsl(0, 72%, 51%)",
                    borderRadius: END_PILL_H / 2,
                    zIndex: isDraggingThis ? 10 : 3,
                    userSelect: "none",
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    hasDragged.current = false;
                    setDragging({
                      stepId: endNode.id,
                      startMouse: { x: e.clientX, y: e.clientY },
                      startPos: { x: pos.x, y: pos.y },
                    });
                  }}
                  onClick={(e) => {
                    if (!hasDragged.current) {
                      e.stopPropagation();
                      setActiveEndPopover(endNode.id);
                    }
                  }}
                >
                  <StopCircle className="w-3.5 h-3.5 mr-1" />
                  End
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-72" side="bottom" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">End Configuration</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setActiveEndPopover(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {endNode.choiceLabel && (
                    <p className="text-xs text-muted-foreground">
                      Triggered by: <span className="font-medium text-foreground">{endNode.choiceLabel}</span>
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Action</Label>
                    <Select
                      value={config.action}
                      onValueChange={(val) =>
                        setEndNodeConfigs((prev) => ({
                          ...prev,
                          [endNode.id]: { ...config, action: val },
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="end_scenario">End Scenario</SelectItem>
                        <SelectItem value="show_summary">Show Summary</SelectItem>
                        <SelectItem value="restart">Restart from Beginning</SelectItem>
                        <SelectItem value="redirect">Redirect to Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">End Message (optional)</Label>
                    <Textarea
                      className="text-xs min-h-[60px] resize-none"
                      placeholder="Message shown to the trainee..."
                      value={config.message}
                      onChange={(e) =>
                        setEndNodeConfigs((prev) => ({
                          ...prev,
                          [endNode.id]: { ...config, message: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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

      {/* Edit Logic Modal */}
      {editLogicStep && (
        <EditLogicModal
          open={!!editLogicStep}
          onOpenChange={(open) => { if (!open) setEditLogicStep(null); }}
          step={editLogicStep}
          allSteps={steps}
          onSave={onUpdateStep}
        />
      )}
    </div>
  );
}
