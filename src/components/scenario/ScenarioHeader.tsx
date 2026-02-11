import { ArrowLeft, Clock, Triangle, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ScenarioHeader() {
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to scenarios</span>
        <Badge variant="outline" className="ml-1 text-xs">3.1</Badge>
        <Badge className="bg-primary/10 text-primary border-0 text-xs">Draft</Badge>
      </div>
      <h1 className="text-xl font-semibold text-foreground">
        P-101 Isobutane Pump Recommissioning (Phase Flow)
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Phase-based flow with intro assets, a simulation focused on isolation verification, and a coach-led review.
      </p>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 15-20 min</span>
        <span className="flex items-center gap-1"><Triangle className="w-3.5 h-3.5" /> Beginner</span>
        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Updated Nov 11, 2025</span>
        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Owner Design Team</span>
      </div>
    </div>
  );
}
