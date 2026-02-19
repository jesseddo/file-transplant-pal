import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/scenario/AppSidebar";
import { ScenarioHeader } from "@/components/scenario/ScenarioHeader";
import { WorkflowCanvas } from "@/components/scenario/WorkflowCanvas";
import { ActionsPanel } from "@/components/scenario/ActionsPanel";
import { InspectorPanel } from "@/components/scenario/InspectorPanel";
import { WorkflowFlowView } from "@/components/scenario/WorkflowFlowView";
import { ImportWizardModal } from "@/components/scenario/ImportWizardModal";
import { AddSceneModal } from "@/components/scenario/AddSceneModal";
import { useWorkflow } from "@/hooks/useWorkflow";
import { usePersonas } from "@/hooks/usePersonas";
import { useScenarios } from "@/hooks/useScenarios";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildExportPayload, downloadJson } from "@/lib/scenarioExporter";
import { useToast } from "@/hooks/use-toast";
import type { ImportResult } from "@/lib/excelImporter";
import type { Step } from "@/types/workflow";

const ScenarioEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getScenario, updateScenario } = useScenarios();
  const scenario = id ? getScenario(id) : null;

  const wf = useWorkflow(scenario?.steps);
  const { personas, importPersonas, setPersonas } = usePersonas(scenario?.personas);
  const [activeTab, setActiveTab] = useState("design");
  const [importOpen, setImportOpen] = useState(false);
  const [addSceneOpen, setAddSceneOpen] = useState(false);
  const { toast } = useToast();

  // Sync changes back to scenario storage
  useEffect(() => {
    if (!id) return;
    updateScenario(id, { steps: wf.steps, personas });
  }, [wf.steps, personas, id, updateScenario]);

  // Redirect if scenario not found
  useEffect(() => {
    if (id && !scenario) navigate("/", { replace: true });
  }, [id, scenario, navigate]);

  const handleImport = useCallback((result: ImportResult) => {
    wf.importSteps(result.steps);
    importPersonas(result.personas);
    toast({
      title: "Scenario imported",
      description: `${result.steps.length} steps, ${result.personas.length} personas loaded.`,
    });
  }, [wf.importSteps, importPersonas, toast]);

  const handleAddScene = useCallback((scene: {
    title: string;
    type: import("@/types/workflow").StepType;
    column: import("@/types/workflow").ColumnId;
    personaId?: string;
    openingLine: string;
    isBranching: boolean;
  }) => {
    const colSteps = wf.steps.filter((s) => s.column === scene.column);
    const newId = wf.addStepToColumn(scene.type, scene.title, scene.column, colSteps.length);

    const updates: Partial<Step> = {};
    if (scene.personaId) updates.personaId = scene.personaId;
    if (scene.isBranching) {
      updates.flowBehavior = "decision";
      updates.choices = [
        { id: `${newId}_c1`, label: "Option A", actionId: "option_a", nextStepId: "" },
        { id: `${newId}_c2`, label: "Option B", actionId: "option_b", nextStepId: "" },
      ];
    }
    updates.tasks = [{
      id: `${newId}_T1`,
      description: scene.openingLine,
      completionCriteria: "",
      isHidden: false,
    }];
    wf.updateStep(newId, updates);
  }, [wf]);

  const handleExport = useCallback(() => {
    const payload = buildExportPayload(wf.steps, personas);
    downloadJson(payload);
  }, [wf.steps, personas]);

  if (!scenario) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar personas={personas} activeSection="editor" />

      <div className="flex-1 flex flex-col min-w-0">
        <ScenarioHeader
          scenario={scenario}
          onExportJson={handleExport}
          onImportClick={() => setImportOpen(true)}
        />

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
              <ActionsPanel onAddStep={wf.addStep} onAddScene={() => setAddSceneOpen(true)} />
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
      <AddSceneModal open={addSceneOpen} onOpenChange={setAddSceneOpen} personas={personas} onAddScene={handleAddScene} />
    </div>
  );
};

export default ScenarioEditor;
