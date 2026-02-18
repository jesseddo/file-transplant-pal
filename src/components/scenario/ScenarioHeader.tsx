import { ArrowLeft, Clock, Shield, Calendar, Users, Download, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ScenarioHeaderProps {
  onExportJson?: () => void;
  onImportClick?: () => void;
}

export function ScenarioHeader({ onExportJson, onImportClick }: ScenarioHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to scenarios</span>
        <Badge variant="outline" className="ml-1 text-xs">Downstream</Badge>
        <Badge className="bg-primary/10 text-primary border-0 text-xs">Draft</Badge>
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        Safeguard Verification: Isobutane Pump Reinstated (Zero Energy Verification)
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Operator (Outside Operator / Permit Approver-Verifier) — Communication &amp; Safeguard Verification
      </p>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 20-30 min</span>
        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Safety Critical</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Updated Feb 18, 2026</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 4 NPC Personas</span>
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
