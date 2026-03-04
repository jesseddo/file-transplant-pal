import {
  Step, BranchChoice, SimTask, Persona, Scene,
  STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, STEP_IS_MECHANIC, CATEGORY_BADGE_CLASS,
  isDecisionCheckpointValid, FlowBehavior, FLOW_COMPATIBILITY, FLOW_LABELS,
  EvaluationWeight,
} from "@/types/workflow";
import {
  X, Plus, Trash2, AlertCircle, ChevronDown, ChevronRight,
  Eye, EyeOff, User, MessageSquare, ListChecks, FileText,
  Settings2, BarChart3, GitBranch, Lock, Zap, Timer,
} from "lucide-react";
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

type InspectorTab = "content" | "evaluation" | "flow";

const TAB_CONFIG: { id: InspectorTab; label: string; icon: React.ElementType }[] = [
  { id: "content", label: "Content", icon: FileText },
  { id: "evaluation", label: "Evaluation", icon: BarChart3 },
  { id: "flow", label: "Flow", icon: GitBranch },
];

const WEIGHT_OPTIONS: { value: EvaluationWeight; label: string; stars: number }[] = [
  { value: "high", label: "High", stars: 3 },
  { value: "medium", label: "Medium", stars: 2 },
  { value: "low", label: "Low", stars: 1 },
  { value: "none", label: "None", stars: 0 },
];

const COMPETENCY_SUGGESTIONS = [
  "situational_awareness", "decision_making", "communication",
  "technical_knowledge", "leadership", "safety_compliance",
  "teamwork", "risk_assessment", "emergency_response",
];

/* ── Main panel ── */
export function InspectorPanel({ step, allSteps, personas, scenes, onClose, onUpdate }: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("content");

  const category = STEP_TYPE_CATEGORY[step.type];
  const badgeClass = CATEGORY_BADGE_CLASS[category];
  const isMechanic = STEP_IS_MECHANIC[step.type];
  const flowBehavior = step.flowBehavior ?? "linear";
  const isConditional = flowBehavior === "conditional";
  const choices = step.choices ?? [];
  const tasks = step.tasks ?? [];
  const isValid = isDecisionCheckpointValid(step);
  const isChatSim = step.type === "text-chat" || step.type === "radio-call" || step.type === "ai-coach";
  const linkedPersona = personas.find(p => p.id === step.personaId) ?? null;
  const availableFlows = FLOW_COMPATIBILITY[step.type] ?? ["linear"];
  const evaluation = step.evaluation ?? { competencyTags: [], weight: "none" as EvaluationWeight };

  const isWide = isChatSim;

  const setFlowBehavior = useCallback((value: FlowBehavior) => {
    const updates: Partial<Step> = { flowBehavior: value };
    if (value !== "conditional") {
      updates.choices = [];
    }
    onUpdate(step.id, updates);
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

  const updateEvaluation = useCallback((updates: Partial<typeof evaluation>) => {
    onUpdate(step.id, { evaluation: { ...evaluation, ...updates } });
  }, [step.id, evaluation, onUpdate]);

  const toggleCompetencyTag = useCallback((tag: string) => {
    const tags = evaluation.competencyTags;
    const next = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    updateEvaluation({ competencyTags: next });
  }, [evaluation.competencyTags, updateEvaluation]);

  const targetOptions = allSteps.filter(s => s.id !== step.id);

  return (
    <div className={cn(
      "shrink-0 border-l border-border bg-card h-full overflow-y-auto scrollbar-thin flex flex-col",
      isWide ? "w-[400px]" : "w-80"
    )}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {isMechanic ? (
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-primary" />
          )}
          <h2 className="text-xs font-bold tracking-wider text-foreground">STEP SETTINGS</h2>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step title + type badge */}
      <div className="px-4 py-3 border-b border-border space-y-2 shrink-0">
        <Input
          value={step.title}
          onChange={(e) => onUpdate(step.id, { title: e.target.value })}
          className="font-medium"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${badgeClass}`}>
            {STEP_TYPE_LABELS[step.type]}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">{step.column} phase</span>
          {isMechanic && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> Hidden from learner
            </span>
          )}
        </div>
        {step.column === "simulation" && scenes.length > 0 && (
          <select
            value={step.sceneId ?? ""}
            onChange={(e) => onUpdate(step.id, { sceneId: e.target.value || undefined })}
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
          >
            <option value="">— Ungrouped —</option>
            {scenes.map(s => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        {TAB_CONFIG.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2",
                isActive
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">

        {/* ═══════════════════════════════════════ */}
        {/* TAB: CONTENT (Layer 1 — Type)          */}
        {/* ═══════════════════════════════════════ */}
        {activeTab === "content" && (
          <>
            {/* PERSONA SECTION (chat-sim only) */}
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

            {/* COMPLETION TASKS */}
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
                          title={task.isHidden ? "Hidden from learner" : "Visible to learner"}
                        >
                          {task.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        {task.isHidden && (
                          <span className="text-[9px] text-muted-foreground">Hidden</span>
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

            {/* RESOURCES */}
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

            {/* TYPE-SPECIFIC FIELDS */}
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

            {/* MECHANIC-SPECIFIC FIELDS */}
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
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* TAB: EVALUATION (Layer 2)               */}
        {/* ═══════════════════════════════════════ */}
        {activeTab === "evaluation" && (
          <>
            <div className="rounded-md bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
              <EyeOff className="w-3.5 h-3.5 shrink-0" />
              <span>Evaluation settings are <strong>hidden from learners</strong>. They only surface in the final Evaluation Report.</span>
            </div>

            {/* Competency Tags */}
            <div>
              <Label className="text-xs font-bold">Competency Dimensions</Label>
              <p className="text-[11px] text-muted-foreground mb-2">What skills does this step measure?</p>
              <div className="flex flex-wrap gap-1.5">
                {COMPETENCY_SUGGESTIONS.map(tag => {
                  const isActive = evaluation.competencyTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleCompetencyTag(tag)}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-medium transition-colors border",
                        isActive
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                      )}
                    >
                      {tag.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weight */}
            <div>
              <Label className="text-xs font-bold">Weight</Label>
              <p className="text-[11px] text-muted-foreground mb-2">How much does this step contribute to the final score?</p>
              <div className="grid grid-cols-4 gap-1.5">
                {WEIGHT_OPTIONS.map(opt => {
                  const isActive = evaluation.weight === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateEvaluation({ weight: opt.value })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors",
                        isActive
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/20 border-border text-muted-foreground hover:bg-muted/40"
                      )}
                    >
                      <span className="text-sm">
                        {opt.stars > 0 ? "★".repeat(opt.stars) + "☆".repeat(3 - opt.stars) : "—"}
                      </span>
                      <span className="text-[10px] font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Threshold */}
            <div>
              <Label className="text-xs font-bold">Retake Threshold</Label>
              <p className="text-[11px] text-muted-foreground mb-2">
                Optional minimum performance. Below this triggers a retake.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={evaluation.threshold ?? ""}
                  onChange={(e) => updateEvaluation({
                    threshold: e.target.value ? Number(e.target.value) : undefined
                  })}
                  placeholder="—"
                  className="w-20 h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">% pass level</span>
              </div>
            </div>

            {evaluation.competencyTags.length === 0 && evaluation.weight === "none" && (
              <div className="rounded-md bg-muted/20 px-3 py-3 text-xs text-muted-foreground text-center">
                No evaluation configured — this step won't contribute to the final report.
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════ */}
        {/* TAB: FLOW (Layer 3)                     */}
        {/* ═══════════════════════════════════════ */}
        {activeTab === "flow" && (
          <>
            <div className="rounded-md bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5 shrink-0" />
              <span>What happens <strong>next</strong> based on what the learner did? Every step is Linear by default.</span>
            </div>

            {/* Flow type selection */}
            <RadioGroup
              value={flowBehavior}
              onValueChange={(v) => setFlowBehavior(v as FlowBehavior)}
              className="gap-2"
            >
              {availableFlows.map(flow => {
                const info = FLOW_LABELS[flow];
                const FlowIcon = flow === "linear" ? GitBranch
                  : flow === "conditional" ? GitBranch
                  : flow === "gated" ? Lock
                  : flow === "interruption" ? Zap
                  : Timer;
                return (
                  <div key={flow} className={cn(
                    "flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors",
                    flowBehavior === flow ? "border-primary/40 bg-primary/5" : "border-border"
                  )}>
                    <RadioGroupItem value={flow} id={`flow-${flow}`} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={`flow-${flow}`} className="text-xs font-medium cursor-pointer flex items-center gap-1.5">
                        <FlowIcon className="w-3.5 h-3.5" />
                        {info.label}
                      </Label>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {/* Conditional: branch choices */}
            {isConditional && (
              <div className="space-y-3 mt-1">
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

            {/* Gated: condition */}
            {flowBehavior === "gated" && (
              <div>
                <Label className="text-xs font-bold">Gate Condition</Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  What must happen before the learner can proceed?
                </p>
                <Textarea
                  value={step.gateCondition ?? ""}
                  onChange={(e) => onUpdate(step.id, { gateCondition: e.target.value })}
                  placeholder="e.g. Document opened, checkbox signed, response submitted..."
                  className="text-xs min-h-[60px]"
                  rows={2}
                />
              </div>
            )}

            {/* Timing: pressure duration */}
            {flowBehavior === "timing" && (
              <div>
                <Label className="text-xs font-bold">Timing Pressure</Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Silent timer — affects evaluation score if the learner takes too long.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={step.timingPressureSeconds ?? ""}
                    onChange={(e) => onUpdate(step.id, {
                      timingPressureSeconds: e.target.value ? Number(e.target.value) : undefined
                    })}
                    placeholder="120"
                    className="w-24 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">seconds</span>
                </div>
              </div>
            )}

            {/* Fallback next step */}
            <div className="pt-1">
              <Label className="text-xs">Fallback Next Step</Label>
              <p className="text-[10px] text-muted-foreground mb-1">Used when no condition matches.</p>
              <select
                value={step.fallbackNextStepId ?? ""}
                onChange={(e) => onUpdate(step.id, { fallbackNextStepId: e.target.value || undefined })}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
              >
                <option value="">— Continue linearly —</option>
                {targetOptions.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({STEP_TYPE_LABELS[s.type]})</option>
                ))}
                <option value="__end__">End Scenario</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
