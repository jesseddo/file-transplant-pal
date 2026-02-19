import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Shield, Calendar, Users, Download, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scenario, CRITICALITY_LABELS } from "@/types/workflow";
import { format } from "date-fns";

interface ScenarioHeaderProps {
  scenario: Scenario;
  onExportJson?: () => void;
  onImportClick?: () => void;
}

export function ScenarioHeader({ scenario, onExportJson, onImportClick }: ScenarioHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-border bg-card px-6 py-4 shrink-0">
      {/* Breadcrumb / back row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="text-xs">Back to scenarios</span>
        </button>
        <span className="text-muted-foreground/40">·</span>
        <Badge variant="outline" className="text-[10px] capitalize">
          {CRITICALITY_LABELS[scenario.criticality]}
        </Badge>
        <Badge className="bg-primary/10 text-primary border-0 text-[10px] capitalize">
          {scenario.status}
        </Badge>
      </div>

      {/* Title */}
      <h1 className="text-xl font-semibold text-foreground leading-tight">{scenario.name}</h1>
      {(scenario.targetRole || scenario.description) && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {scenario.targetRole}
          {scenario.targetRole && scenario.description ? " — " : ""}
          {scenario.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        {scenario.estimatedDuration && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {scenario.estimatedDuration}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5" /> {CRITICALITY_LABELS[scenario.criticality]}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> Updated {format(new Date(scenario.updatedAt), "MMM d, yyyy")}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {scenario.personas.length} Personas
        </span>
        <div className="ml-auto flex items-center gap-2">
          {onImportClick && (
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={onImportClick}>
              <FileSpreadsheet className="w-3 h-3" /> Import
            </Button>
          )}
          {onExportJson && (
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1" onClick={onExportJson}>
              <Download className="w-3 h-3" /> Export JSON
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
