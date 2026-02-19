import { useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScenarioCard } from "@/components/scenario/ScenarioCard";
import { CreateScenarioModal } from "@/components/scenario/CreateScenarioModal";
import { AppSidebar } from "@/components/scenario/AppSidebar";
import { useScenarios } from "@/hooks/useScenarios";
import type { CriticalityLevel } from "@/types/workflow";
import type { ImportResult } from "@/lib/excelImporter";

const Dashboard = () => {
  const { scenarios, createScenario, deleteScenario } = useScenarios();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = (data: {
    name: string;
    description: string;
    targetRole: string;
    estimatedDuration: string;
    criticality: CriticalityLevel;
    importResult?: ImportResult;
  }) => {
    createScenario({
      name: data.name,
      description: data.description,
      targetRole: data.targetRole,
      estimatedDuration: data.estimatedDuration,
      criticality: data.criticality,
      steps: data.importResult?.steps ?? [],
      personas: data.importResult?.personas ?? [],
      resources: data.importResult?.resources ?? [],
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar activeSection="scenarios" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Scenarios</h1>
            <p className="text-xs text-muted-foreground">Create and manage training scenarios</p>
          </div>
          <Button className="gap-1.5" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create Scenario
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {scenarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FolderOpen className="w-7 h-7 text-muted-foreground" />
              </div>
              <h2 className="text-base font-medium text-foreground mb-1">No scenarios yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create your first training scenario to start designing immersive simulations.
              </p>
              <Button className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" /> Create your first scenario
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((s) => (
                <ScenarioCard key={s.id} scenario={s} onDelete={deleteScenario} />
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateScenarioModal open={createOpen} onOpenChange={setCreateOpen} onCreate={handleCreate} />
    </div>
  );
};

export default Dashboard;
