import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Calendar, Users, Layers, Trash2 } from "lucide-react";
import { Scenario, CRITICALITY_LABELS } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ScenarioCardProps {
  scenario: Scenario;
  onDelete?: (id: string) => void;
}

export function ScenarioCard({ scenario, onDelete }: ScenarioCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group relative"
      onClick={() => navigate(`/scenario/${scenario.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            variant={scenario.status === "published" ? "default" : "secondary"}
            className="text-[10px] uppercase tracking-wide"
          >
            {scenario.status}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {CRITICALITY_LABELS[scenario.criticality]}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug">{scenario.name}</CardTitle>
        {scenario.description && (
          <CardDescription className="line-clamp-2 text-xs">{scenario.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        {scenario.targetRole && (
          <p className="text-xs text-muted-foreground mb-2 truncate">{scenario.targetRole}</p>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> {scenario.steps.length} step{scenario.steps.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {scenario.personas.length} personas
          </span>
          {scenario.estimatedDuration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {scenario.estimatedDuration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" /> {CRITICALITY_LABELS[scenario.criticality]}
          </span>
        </div>
      </CardContent>

      <CardFooter className="text-[11px] text-muted-foreground pt-0 flex justify-between items-center">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {format(new Date(scenario.createdAt), "MMM d, yyyy")}
        </span>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(scenario.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
