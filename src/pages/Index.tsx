import { useState, useCallback } from "react";
import { AppSidebar } from "@/components/scenario/AppSidebar";
import { ScenarioHeader } from "@/components/scenario/ScenarioHeader";
import { WorkflowCanvas } from "@/components/scenario/WorkflowCanvas";
import { ActionsPanel } from "@/components/scenario/ActionsPanel";
import { InspectorPanel } from "@/components/scenario/InspectorPanel";
import { WorkflowFlowView } from "@/components/scenario/WorkflowFlowView";
import { ImportWizardModal } from "@/components/scenario/ImportWizardModal";
import { useWorkflow } from "@/hooks/useWorkflow";
import { usePersonas } from "@/hooks/usePersonas";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildExportPayload, downloadJson } from "@/lib/scenarioExporter";
import type { ImportResult } from "@/lib/excelImporter";

const Index = () => {
  const wf = useWorkflow();
  const { personas, importPersonas } = usePersonas();
  const [activeTab, setActiveTab] = useState("design");
  const [importOpen, setImportOpen] = useState(false);

  const handleImport = useCallback((result: ImportResult) => {
    wf.importSteps(result.steps);
    importPersonas(result.personas);
  }, [wf.importSteps, importPersonas]);

  const handleExport = useCallback(() => {
    const payload = buildExportPayload(wf.steps, personas);
    downloadJson(payload);
  }, [wf.steps, personas]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar personas={personas} onImportClick={() => setImportOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0">
        <ScenarioHeader onExportJson={handleExport} />

        <div className="border-b border-border bg-card px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-10 p-0 gap-4">
              {["Design", "Workflow", "Dependencies", "Settings", "Preview"].map((t) => (
                <TabsTrigger
                  key={t}
                  value={t.toLowerCase()}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 pb-2 text-sm"
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {activeTab === "design" && (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <WorkflowCanvas
              steps={wf.steps}
              selectedStepId={wf.selectedStepId}
              selectedColumn={wf.selectedColumn}
              onSelectStep={wf.setSelectedStepId}
              onSelectColumn={wf.setSelectedColumn}
              onRemoveStep={wf.removeStep}
              onMoveStep={wf.moveStep}
              onAddStepToColumn={wf.addStepToColumn}
            />

            {wf.selectedStep ? (
              <InspectorPanel
                step={wf.selectedStep}
                allSteps={wf.steps}
                personas={personas}
                onClose={() => wf.setSelectedStepId(null)}
                onUpdate={wf.updateStep}
              />
            ) : (
              <ActionsPanel onAddStep={wf.addStep} />
            )}
          </div>
        )}

        {activeTab === "workflow" && (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            <WorkflowFlowView
              steps={wf.steps}
              selectedStepId={wf.selectedStepId}
              onSelectStep={wf.setSelectedStepId}
              onUpdateStep={wf.updateStep}
            />
          </div>
        )}

        {activeTab !== "design" && activeTab !== "workflow" && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab — coming soon</p>
          </div>
        )}
      </div>

      <ImportWizardModal open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
    </div>
  );
};

export default Index;
