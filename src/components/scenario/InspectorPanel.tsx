import { Step, BranchChoice, SimTask, Persona, Scene, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, STEP_IS_MECHANIC, CATEGORY_BADGE_CLASS, isDecisionCheckpointValid } from "@/types/workflow";
import { X, Plus, Trash2, AlertCircle, ChevronDown, ChevronRight, Eye, EyeOff, User, MessageSquare, ListChecks, FileText, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface InspectorPanelProps {
  step: Step;
  allSteps: Step[];
  personas: Persona[];
  scenes: Scene[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Step>) => void;
}

/* ── Collapsible section wrapper ── */
function Section({ title, icon: Icon, defaultOpen = true, children, badge }: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold tracking-wide text-foreground bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="uppercase">{title}</span>
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Main panel ── */
export function InspectorPanel({ step, allSteps, personas, scenes, onClose, onUpdate }: InspectorPanelProps) {
  const category = STEP_TYPE_CATEGORY[step.type];
  const badgeClass = CATEGORY_BADGE_CLASS[category];
  const isMechanic = STEP_IS_MECHANIC[step.type];
  const flowBehavior = step.flowBehavior ?? "linear";
  const isDecision = flowBehavior === "decision";
  const choices = step.choices ?? [];
  const tasks = step.tasks ?? [];
  const isValid = isDecisionCheckpointValid(step);
  const isChatSim = step.type === "text-chat" || step.type === "radio-call" || step.type === "ai-coach";
  const linkedPersona = personas.find(p => p.id === step.personaId) ?? null;

  const isWide = isChatSim;

  const setFlowBehavior = useCallback((value: string) => {
    if (value === "linear") {
      onUpdate(step.id, { flowBehavior: "linear", choices: [] });
    } else {
      onUpdate(step.id, { flowBehavior: "decision" });
    }
  }, [step.id, onUpdate]);

  const addChoice = useCallback(() => {
    const newChoice: BranchChoice = { id: `ch-${Date.now()}`, label: "", actionId: "", nextStepId: "" };
    onUpdate(step.id, { choices: [...choices, newChoice] });
  }, [step.id, choices, onUpdate]);

  const updateChoice = useCallback((choiceId: string, updates: Partial<BranchChoice>) => {
    const finalUpdates = { ...updates };
    if ('label' in finalUpdates) {
      finalUpdates.actionId = (finalUpdates.label ?? '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    onUpdate(step.id, { choices: choices.map(c => c.id === choiceId ? { ...c, ...finalUpdates } : c) });
  }, [step.id, choices, onUpdate]);

  const removeChoice = useCallback((choiceId: string) => {
    onUpdate(step.id, { choices: choices.filter(c => c.id !== choiceId) });
  }, [step.id, choices, onUpdate]);

  const addTask = useCallback(() => {
    const newTask: SimTask = { id: `t-${Date.now()}`, description: "", completionCriteria: "", isHidden: false };
    onUpdate(step.id, { tasks: [...tasks, newTask] });
  }, [step.id, tasks, onUpdate]);

  const updateTask = useCallback((taskId: string, updates: Partial<SimTask>) => {
    onUpdate(step.id, { tasks: tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) });
  }, [step.id, tasks, onUpdate]);

  const removeTask = useCallback((taskId: string) => {
    onUpdate(step.id, { tasks: tasks.filter(t => t.id !== taskId) });
  }, [step.id, tasks, onUpdate]);

  const targetOptions = allSteps.filter(s => s.id !== step.id);

  return (
    <div className={cn(
      "shrink-0 border-l border-border bg-card h-full overflow-y-auto scrollbar-thin",
      isWide ? "w-[400px]" : "w-72"
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isMechanic ? (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-primary" />
          )}
          <h2 className="text-xs font-bold tracking-wider text-foreground">
            {isMechanic ? "MECHANIC" : "ACTIVITY"} SETTINGS
          </h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <Label className="text-xs">Step Title</Label>
          <Input value={step.title} onChange={(e) => onUpdate(step.id, { title: e.target.value })} className="mt-1" />
        </div>

        {/* Type + Column + Scene row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <Label className="text-xs">Type</Label>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
                {STEP_TYPE_LABELS[step.type]}
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs">Phase</Label>
            <p className="text-sm text-foreground mt-1 capitalize">{step.column}</p>
          </div>
          {step.column === "simulation" && scenes.length > 0 && (
            <div className="flex-1 min-w-[120px]">
              <Label className="text-xs">Scene</Label>
              <select
                value={step.sceneId ?? ""}
                onChange={(e) => onUpdate(step.id, { sceneId: e.target.value || undefined })}
                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                <option value="">— Ungrouped —</option>
                {scenes.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Activity/Mechanic indicator */}
        <div className={cn(
          "rounded-md px-3 py-2 text-xs flex items-center gap-2",
          isMechanic ? "bg-muted/50 text-muted-foreground" : "bg-primary/5 text-primary"
        )}>
          {isMechanic ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span><strong>Mechanic</strong> — Designer-facing logic. May be hidden from the learner.</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span><strong>Activity</strong> — The learner will see and interact with this step.</span>
            </>
          )}
        </div>

        <hr className="border-border" />

        {/* ══════════════════════════════════════════════════ */}
        {/* ACTIVITY SETTINGS (learner-facing configuration)  */}
        {/* ══════════════════════════════════════════════════ */}

        {/* ── PERSONA SECTION (chat-sim only) ── */}
        {isChatSim && (
          <Section title="Persona" icon={User} badge={
            linkedPersona ? (
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                {linkedPersona.name}
              </span>
            ) : null
          }>
            <div>
              <Label className="text-[10px]">Linked Persona</Label>
              <select
                value={step.personaId ?? ""}
                onChange={(e) => onUpdate(step.id, { personaId: e.target.value || undefined })}
                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                <option value="">— Select persona —</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.role}</option>
                ))}
              </select>
            </div>

            {linkedPersona && (
              <div className="space-y-2 bg-muted/30 rounded-md p-2.5">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Role</Label>
                  <p className="text-xs text-foreground">{linkedPersona.role}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Personality</Label>
                  <p className="text-xs text-foreground">{linkedPersona.personality}</p>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Objective</Label>
                  <p className="text-xs text-foreground">{linkedPersona.objective}</p>
                </div>
                {linkedPersona.initialMessages.length > 0 && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Opening Lines</Label>
                    {linkedPersona.initialMessages.map((msg, i) => (
                      <div key={i} className="mt-1 px-2 py-1.5 bg-background rounded text-[11px] text-foreground border border-border">
                        "{msg}"
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Section>
        )}

        {/* ── TYPE-SPECIFIC FIELDS (non-chat Activity types) ── */}
        {!isChatSim && !isMechanic && (
          <>
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
              </>
            )}
            {step.type === "pdf" && (
              <div>
                <Label className="text-xs">Document URL</Label>
                <Input placeholder="https://..." className="mt-1" />
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* MECHANICS (designer-facing configuration)         */}
        {/* ══════════════════════════════════════════════════ */}

        <div className="flex items-center gap-2 pt-1">
          <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Mechanics</h3>
        </div>

        {/* ── LEARNER TASKS ── */}
        {(isChatSim || tasks.length > 0) && (
          <Section title="Completion Tasks" icon={ListChecks} badge={
            <span className="text-[10px] text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
          }>
            <p className="text-[11px] text-muted-foreground -mt-1">
              What must the learner do or demonstrate? Hidden tasks are scored silently.
            </p>

            {tasks.map((task, idx) => (
              <div key={task.id} className="rounded-md border border-border p-2.5 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => updateTask(task.id, { isHidden: !task.isHidden })}
                      className="text-muted-foreground hover:text-foreground"
                      title={task.isHidden ? "Hidden from learner (AI evaluates silently)" : "Visible to learner"}
                    >
                      {task.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    {task.isHidden && (
                      <span className="text-[9px] text-muted-foreground">Hidden mechanic</span>
                    )}
                  </div>
                  <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <Label className="text-[10px]">Description</Label>
                  <Textarea
                    value={task.description}
                    onChange={(e) => updateTask(task.id, { description: e.target.value })}
                    placeholder="What should the learner do?"
                    className="mt-0.5 text-xs min-h-[48px]"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Completion Criteria</Label>
                  <Textarea
                    value={task.completionCriteria}
                    onChange={(e) => updateTask(task.id, { completionCriteria: e.target.value })}
                    placeholder="How does the AI know this task is complete?"
                    className="mt-0.5 text-xs min-h-[48px]"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Then go to…</Label>
                  <select
                    value={task.nextNodeId ?? ""}
                    onChange={(e) => updateTask(task.id, { nextNodeId: e.target.value || undefined })}
                    className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="">— Continue linearly —</option>
                    {targetOptions.map(s => (
                      <option key={s.id} value={s.id}>{s.title} ({STEP_TYPE_LABELS[s.type]})</option>
                    ))}
                    <option value="__end__">End Scenario</option>
                  </select>
                </div>
              </div>
            ))}

            <Button variant="outline" size="sm" className="w-full text-xs gap-1" onClick={addTask}>
              <Plus className="w-3 h-3" /> Add Task
            </Button>
          </Section>
        )}

        {/* ── RESOURCES SECTION ── */}
        {isChatSim && (
          <Section title="Resources" icon={FileText} defaultOpen={false} badge={
            <span className="text-[10px] text-muted-foreground">
              {(step.givenResourceIds?.length ?? 0) + (step.hiddenResourceIds?.length ?? 0)} linked
            </span>
          }>
            <div>
              <Label className="text-[10px]">Given to Learner</Label>
              <p className="text-[11px] text-muted-foreground">
                {step.givenResourceIds?.length ? step.givenResourceIds.join(", ") : "None"}
              </p>
            </div>
            <div>
              <Label className="text-[10px]">Hidden (revealed conditionally)</Label>
              <p className="text-[11px] text-muted-foreground">
                {step.hiddenResourceIds?.length ? step.hiddenResourceIds.join(", ") : "None"}
              </p>
            </div>
          </Section>
        )}

        {/* ── FLOW BEHAVIOR ── */}
        <Section title="Flow Control" icon={MessageSquare} defaultOpen={isDecision}>
          <RadioGroup value={flowBehavior} onValueChange={setFlowBehavior} className="gap-3">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="linear" id="flow-linear" />
              <Label htmlFor="flow-linear" className="text-xs font-normal cursor-pointer">
                Linear — continues to the next step
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="decision" id="flow-decision" />
              <Label htmlFor="flow-decision" className="text-xs font-normal cursor-pointer">
                Decision Point — learner picks what to do next
              </Label>
            </div>
          </RadioGroup>

          {isDecision && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Learner Choices</Label>
                {!isValid && (
                  <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                    <AlertCircle className="w-3 h-3" /> Incomplete
                  </span>
                )}
              </div>

              {choices.length === 0 && (
                <p className="text-xs text-destructive">At least one option is required.</p>
              )}

              {choices.map((choice, idx) => (
                <div key={choice.id} className="rounded-md border border-border p-2.5 space-y-2 bg-muted/40">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <button onClick={() => removeChoice(choice.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <Label className="text-[10px]">Button Text</Label>
                    <Input
                      value={choice.label}
                      onChange={(e) => updateChoice(choice.id, { label: e.target.value })}
                      placeholder='e.g. "Evacuate the area"'
                      className="mt-0.5 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">Then go to…</Label>
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
                <Plus className="w-3 h-3" /> Add Option
              </Button>
            </div>
          )}
        </Section>

        {/* ── MECHANIC-SPECIFIC FIELDS ── */}
        {isMechanic && (
          <>
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
          </>
        )}

        <div>
          <Label className="text-xs">Notes</Label>
          <Textarea placeholder="Add design notes for your team..." className="mt-1" rows={2} />
        </div>
      </div>
    </div>
  );
}
