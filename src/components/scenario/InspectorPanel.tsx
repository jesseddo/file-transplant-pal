import { Step, BranchChoice, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCallback } from "react";

interface InspectorPanelProps {
  step: Step;
  allSteps: Step[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Step>) => void;
}

export function InspectorPanel({ step, allSteps, onClose, onUpdate }: InspectorPanelProps) {
  const category = STEP_TYPE_CATEGORY[step.type];
  const badgeClass = CATEGORY_BADGE_CLASS[category];
  const flowBehavior = step.flowBehavior ?? "linear";
  const isDecision = flowBehavior === "decision";
  const choices = step.choices ?? [];
  const isValid = isDecisionCheckpointValid(step);

  const setFlowBehavior = useCallback((value: string) => {
    if (value === "linear") {
      onUpdate(step.id, { flowBehavior: "linear", choices: [] });
    } else {
      onUpdate(step.id, { flowBehavior: "decision" });
    }
  }, [step.id, onUpdate]);

  const addChoice = useCallback(() => {
    const newChoice: BranchChoice = {
      id: `ch-${Date.now()}`,
      label: "",
      actionId: "",
      nextStepId: "",
    };
    onUpdate(step.id, { choices: [...choices, newChoice] });
  }, [step.id, choices, onUpdate]);

  const updateChoice = useCallback((choiceId: string, updates: Partial<BranchChoice>) => {
    onUpdate(step.id, {
      choices: choices.map(c => c.id === choiceId ? { ...c, ...updates } : c),
    });
  }, [step.id, choices, onUpdate]);

  const removeChoice = useCallback((choiceId: string) => {
    onUpdate(step.id, { choices: choices.filter(c => c.id !== choiceId) });
  }, [step.id, choices, onUpdate]);

  const targetOptions = allSteps.filter(s => s.id !== step.id);

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card h-full overflow-y-auto scrollbar-thin">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-bold tracking-wider text-foreground">INSPECTOR</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Label className="text-xs">Title</Label>
          <Input
            value={step.title}
            onChange={(e) => onUpdate(step.id, { title: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs">Type</Label>
          <div className="mt-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
              {STEP_TYPE_LABELS[step.type]}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-xs">Column</Label>
          <p className="text-sm text-foreground mt-1 capitalize">{step.column}</p>
        </div>

        <hr className="border-border" />

        {/* Flow Behavior selector — available for all step types */}
        <div>
          <Label className="text-xs font-bold">Flow Behavior</Label>
          <RadioGroup value={flowBehavior} onValueChange={setFlowBehavior} className="mt-2 gap-3">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="linear" id="flow-linear" />
              <Label htmlFor="flow-linear" className="text-xs font-normal cursor-pointer">
                Linear — proceeds to next step
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="decision" id="flow-decision" />
              <Label htmlFor="flow-decision" className="text-xs font-normal cursor-pointer">
                Decision — learner makes a branching choice
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Choices editor when Decision is selected */}
        {isDecision && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Learner Choices</Label>
              {!isValid && (
                <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                  <AlertCircle className="w-3 h-3" /> Incomplete
                </span>
              )}
            </div>

            {choices.length === 0 && (
              <p className="text-xs text-destructive">At least one choice is required.</p>
            )}

            {choices.map((choice, idx) => (
              <div key={choice.id} className="rounded-md border border-border p-2.5 space-y-2 bg-muted/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Choice {idx + 1}
                  </span>
                  <button onClick={() => removeChoice(choice.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <Label className="text-[10px]">Learner-facing Label</Label>
                  <Input
                    value={choice.label}
                    onChange={(e) => updateChoice(choice.id, { label: e.target.value })}
                    placeholder="e.g. Evacuate area"
                    className="mt-0.5 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Action Identifier</Label>
                  <Input
                    value={choice.actionId}
                    onChange={(e) => updateChoice(choice.id, { actionId: e.target.value })}
                    placeholder="e.g. evacuate_area"
                    className="mt-0.5 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Next Step</Label>
                  <select
                    value={choice.nextStepId}
                    onChange={(e) => updateChoice(choice.id, { nextStepId: e.target.value })}
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="">— Select target —</option>
                    {targetOptions.map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({STEP_TYPE_LABELS[s.type]})</option>
                    ))}
                    <option value="__end__">End Scenario</option>
                  </select>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={addChoice}>
              <Plus className="w-3 h-3" /> Add Choice
            </Button>
          </div>
        )}

        <hr className="border-border" />

        {/* Type-specific fields */}
        {(step.type === "video" || step.type === "audio") && (
          <>
            <div>
              <Label className="text-xs">Media URL</Label>
              <Input placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Duration (seconds)</Label>
              <Input type="number" placeholder="120" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Auto-advance</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </>
        )}

        {step.type === "pdf" && (
          <>
            <div>
              <Label className="text-xs">Document URL</Label>
              <Input placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Required Reading Time</Label>
              <Input type="number" placeholder="60" className="mt-1" />
            </div>
          </>
        )}

        {(step.type === "text-chat" || step.type === "radio-call") && (
          <>
            <div>
              <Label className="text-xs">NPC Name</Label>
              <Input placeholder="Control Room Operator" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Script / Prompt</Label>
              <Textarea placeholder="Enter the simulation script..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Max Turns</Label>
              <Input type="number" placeholder="10" className="mt-1" />
            </div>
          </>
        )}

        {step.type === "ai-coach" && (
          <>
            <div>
              <Label className="text-xs">Coaching Prompt</Label>
              <Textarea placeholder="Reflect on the learner's decisions..." className="mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-xs">Rubric</Label>
              <Textarea placeholder="Criteria for evaluation..." className="mt-1" rows={2} />
            </div>
          </>
        )}

        {step.type === "fetch-document" && (
          <div>
            <Label className="text-xs">Permit ID / Document Reference</Label>
            <Input placeholder="PERMIT-2025-001" className="mt-1" />
          </div>
        )}

        {step.type === "generate-evaluation" && (
          <div>
            <Label className="text-xs">Evaluation Template</Label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
              <option>Standard Competency Check</option>
              <option>Safety Critical Assessment</option>
              <option>Custom Template</option>
            </select>
          </div>
        )}

        {step.type === "interruption" && (
          <>
            <div>
              <Label className="text-xs">Trigger Condition</Label>
              <Input placeholder="After step completes..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Interruption Message</Label>
              <Textarea placeholder="Urgent radio call from control room..." className="mt-1" rows={2} />
            </div>
          </>
        )}

        {step.type === "parallel-order" && (
          <>
            <div>
              <Label className="text-xs">Parallel Steps (comma-separated IDs)</Label>
              <Input placeholder="s3, s4" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Join Condition</Label>
              <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
                <option>All must complete</option>
                <option>Any one completes</option>
              </select>
            </div>
          </>
        )}

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="Add notes..." className="mt-1" rows={2} />
        </div>
      </div>
    </div>
  );
}
