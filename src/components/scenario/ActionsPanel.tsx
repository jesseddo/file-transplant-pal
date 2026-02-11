import { ACTION_TILES, ActionCategory, CATEGORY_BADGE_CLASS } from "@/types/workflow";
import {
  Play, FileText, Headphones, MessageSquare, Radio,
  Brain, Download, ClipboardCheck, AlertTriangle, GitBranch,
} from "lucide-react";
import type { StepType } from "@/types/workflow";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Play, FileText, Headphones, MessageSquare, Radio,
  Brain, Download, ClipboardCheck, AlertTriangle, GitBranch,
};

const CATEGORIES: ActionCategory[] = [
  "Media", "Simulation", "Coaching", "Resources & Compliance", "Behavioral",
];

interface ActionsPanelProps {
  onAddStep: (type: StepType, label: string) => void;
}

export function ActionsPanel({ onAddStep }: ActionsPanelProps) {
  return (
    <aside className="w-56 shrink-0 border-l border-border bg-actions-panel h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-bold tracking-wider text-foreground">ACTIONS</h2>
      </div>
      <div className="p-3 space-y-4">
        {CATEGORIES.map((cat) => {
          const tiles = ACTION_TILES.filter((t) => t.category === cat);
          return (
            <div key={cat}>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground mb-1.5 uppercase">
                {cat}
              </p>
              <div className="space-y-1">
                {tiles.map((tile) => {
                  const Icon = ICON_MAP[tile.icon];
                  return (
                    <div
                      key={tile.type}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/action-type", tile.type);
                        e.dataTransfer.setData("application/action-label", tile.label);
                        e.dataTransfer.effectAllowed = "copyMove";
                      }}
                      onClick={() => onAddStep(tile.type, tile.label)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors text-left cursor-grab active:cursor-grabbing"
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />}
                      <span className="truncate">{tile.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
