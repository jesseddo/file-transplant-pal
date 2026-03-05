import { ConnectionType, CONNECTION_TYPE_LABELS } from "@/types/workflow";

interface ConnectionLabelProps {
  label?: string;
  type: ConnectionType;
  midX: number;
  midY: number;
  onEdit?: () => void;
}

export function ConnectionLabel({ label, type, midX, midY, onEdit }: ConnectionLabelProps) {
  const displayLabel = label || CONNECTION_TYPE_LABELS[type];

  if (!displayLabel) return null;

  const bgColors: Record<ConnectionType, string> = {
    linear: "bg-muted/90",
    conditional: "bg-blue-500/90",
    interruption: "bg-red-500/90",
    resume: "bg-purple-500/90",
  };

  const textColors: Record<ConnectionType, string> = {
    linear: "text-foreground",
    conditional: "text-white",
    interruption: "text-white",
    resume: "text-white",
  };

  return (
    <g
      transform={`translate(${midX}, ${midY})`}
      className={onEdit ? "cursor-pointer" : ""}
      onClick={onEdit}
    >
      <foreignObject
        x="-50"
        y="-12"
        width="100"
        height="24"
        className="overflow-visible"
      >
        <div className="flex items-center justify-center pointer-events-auto">
          <div
            className={`px-2 py-0.5 rounded text-[10px] font-medium ${bgColors[type]} ${textColors[type]} shadow-sm border border-border/50 whitespace-nowrap`}
          >
            {displayLabel}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
