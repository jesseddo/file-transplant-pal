import { Link } from "react-router-dom";
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
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to scenarios</span>
        </Link>
        <Badge variant="outline" className="ml-1 text-xs capitalize">{scenario.criticality.replace("-", " ")}</Badge>
        <Badge className="bg-primary/10 text-primary border-0 text-xs capitalize">{scenario.status}</Badge>
      </div>
      <h1 className="text-xl font-semibold text-foreground">{scenario.name}</h1>
      {(scenario.targetRole || scenario.description) && (
        <p className="text-sm text-muted-foreground mt-0.5">
          {scenario.targetRole}{scenario.targetRole && scenario.description ? " — " : ""}{scenario.description}
        </p>
      )}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        {scenario.estimatedDuration && (
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {scenario.estimatedDuration}</span>
        )}
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {CRITICALITY_LABELS[scenario.criticality]}</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Updated {format(new Date(scenario.updatedAt), "MMM d, yyyy")}</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {scenario.personas.length} Personas</span>
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
