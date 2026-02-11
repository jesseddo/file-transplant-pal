import { useState } from "react";
import { AppSidebar } from "@/components/scenario/AppSidebar";
import { ScenarioHeader } from "@/components/scenario/ScenarioHeader";
import { WorkflowCanvas } from "@/components/scenario/WorkflowCanvas";
import { ActionsPanel } from "@/components/scenario/ActionsPanel";
import { InspectorPanel } from "@/components/scenario/InspectorPanel";
import { useWorkflow } from "@/hooks/useWorkflow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const wf = useWorkflow();
  const [activeTab, setActiveTab] = useState("design");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <ScenarioHeader />

        <div className="border-b border-border bg-card px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent h-10 p-0 gap-4">
              {["Design", "Dependencies", "Settings", "Preview"].map((t) => (
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
            />

            {wf.selectedStep ? (
              <InspectorPanel
                step={wf.selectedStep}
                onClose={() => wf.setSelectedStepId(null)}
                onUpdate={wf.updateStep}
              />
            ) : (
              <ActionsPanel onAddStep={wf.addStep} />
            )}
          </div>
        )}

        {activeTab !== "design" && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab — coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
