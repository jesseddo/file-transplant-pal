import { AppSidebar } from "@/components/scenario/AppSidebar";
import {
  MessageSquare, Radio, Play, Headphones, FileText, Box, Brain,
  GitMerge, RotateCcw, AlertTriangle, GitBranch, ClipboardCheck, Download,
  Eye, EyeOff, ListChecks, Target, Timer, Layers,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* ── Data ── */

interface TaxonomyItem {
  icon: React.ElementType;
  label: string;
  description: string;
  whenToUse: string;
  example: string;
  visibleToLearner: boolean;
}

interface TaxonomyCategory {
  title: string;
  items: TaxonomyItem[];
}

const ACTIVITIES: TaxonomyCategory[] = [
  {
    title: "Communication",
    items: [
      {
        icon: MessageSquare,
        label: "Text Chat",
        description: "Async messaging simulation with a persona. The learner exchanges text messages in a realistic chat interface.",
        whenToUse: "When the learner needs to practice dialogue, ask questions, give instructions, or negotiate with a character.",
        example: "Learner texts the Control Room Operator to request permit sign-off, practicing closed-loop communication.",
        visibleToLearner: true,
      },
      {
        icon: Radio,
        label: "Radio Call",
        description: "Real-time voice-style simulation. Mimics push-to-talk radio communication common in field operations.",
        whenToUse: "When the scenario involves field-to-control-room communication or urgent coordination.",
        example: "Learner radios maintenance crew to confirm isolation points before authorizing work.",
        visibleToLearner: true,
      },
    ],
  },
  {
    title: "Media",
    items: [
      {
        icon: Play,
        label: "Video",
        description: "Pre-recorded video content for context-setting, demonstrations, or briefings.",
        whenToUse: "At the start of a scenario for orientation, or mid-scenario to show physical processes the learner can't simulate in chat.",
        example: "A 2-minute overview video showing the pump recommissioning site and equipment layout.",
        visibleToLearner: true,
      },
      {
        icon: Headphones,
        label: "Audio",
        description: "Narration, ambient audio, or recorded instructions.",
        whenToUse: "To set atmosphere, deliver briefings, or simulate announcements the learner would hear in the field.",
        example: "PA system announcement: 'All personnel, hot work permit required in Zone 3.'",
        visibleToLearner: true,
      },
      {
        icon: FileText,
        label: "PDF / Document",
        description: "Reference documents the learner can view — permits, checklists, procedures, P&IDs.",
        whenToUse: "When the learner needs to consult a real document to make decisions (e.g., isolation list, permit to work).",
        example: "Start Work Check (SWC) form that the learner reviews before authorizing work.",
        visibleToLearner: true,
      },
    ],
  },
  {
    title: "Immersive",
    items: [
      {
        icon: Box,
        label: "3D Environment",
        description: "Spatial walkthrough or interactive 3D scene. The learner navigates a virtual environment.",
        whenToUse: "When physical verification matters — the learner needs to 'walk up to' equipment, check valve positions, or inspect a site.",
        example: "Learner walks through the pump area to visually verify lock-out/tag-out positions match the isolation list.",
        visibleToLearner: true,
      },
    ],
  },
  {
    title: "Reflection",
    items: [
      {
        icon: Brain,
        label: "AI Coach Reflection",
        description: "Post-scene guided debrief with an AI coach persona. Open-ended dialogue focused on lessons learned.",
        whenToUse: "After a critical scene outcome (safe or incident) to help the learner articulate what they did well or missed.",
        example: "Coach asks: 'What verification step prevented the incident?' and guides the learner to connect actions to outcomes.",
        visibleToLearner: true,
      },
    ],
  },
];

const MECHANICS: TaxonomyCategory[] = [
  {
    title: "Flow Control",
    items: [
      {
        icon: GitMerge,
        label: "Decision Point",
        description: "Branch the scenario based on the learner's choice. Routes to different scenes depending on what the learner says or does.",
        whenToUse: "When the learner faces a critical moment where their action determines the outcome path (safe vs. incident).",
        example: "Learner either initiates a walkdown (→ Perform Walkdown scene) or signs off prematurely (→ Redirect scene).",
        visibleToLearner: true,
      },
      {
        icon: RotateCcw,
        label: "Redirect / Loop",
        description: "Send the learner back to a previous scene to retry. Used when the learner takes a wrong action that should be corrected before proceeding.",
        whenToUse: "When a premature or incorrect action should loop back rather than ending the scenario.",
        example: "Learner approves permit too early → persona pushes back → learner returns to the approval scene.",
        visibleToLearner: true,
      },
      {
        icon: Layers,
        label: "Routing Rules",
        description: "Hidden task-based routing. The AI evaluates learner behavior against criteria and automatically routes to the next scene.",
        whenToUse: "When branching should happen based on nuanced behavior rather than an explicit learner choice.",
        example: "If learner mentions the isolation list during walkdown → route to SWC Dialogue. If not → route to Incident.",
        visibleToLearner: false,
      },
    ],
  },
  {
    title: "Assessment",
    items: [
      {
        icon: Target,
        label: "Competency Tracking",
        description: "Silently score the learner against defined competency criteria throughout the scenario.",
        whenToUse: "When you need to track competency development (e.g., Communication, Safeguard Verification) without interrupting the learner.",
        example: "Track whether the learner uses three-way communication (call-out, repeat-back, confirm) during radio calls.",
        visibleToLearner: false,
      },
      {
        icon: ClipboardCheck,
        label: "Evaluation Report",
        description: "Generate a scored competency report at the end of the scenario based on tracked criteria.",
        whenToUse: "In the Review phase to give the learner (and facilitator) a summary of performance.",
        example: "Report shows scores for Communication (3/5) and Safeguard Verification (4/5) with specific evidence.",
        visibleToLearner: true,
      },
      {
        icon: ListChecks,
        label: "Completion Criteria",
        description: "Define what 'done' looks like for a task within a scene. Used by the AI to determine when to advance.",
        whenToUse: "On every task — tells the AI what the learner must say or do to complete this step.",
        example: "'Learner asks show me how you verified zero energy and challenges reliance on gauge-only confirmation.'",
        visibleToLearner: false,
      },
    ],
  },
  {
    title: "Behavioral",
    items: [
      {
        icon: AlertTriangle,
        label: "Interruption Trigger",
        description: "Timed or conditional unexpected event injection. Something happens to the learner that disrupts their plan.",
        whenToUse: "When you want to test how the learner handles pressure, surprises, or deviations from the expected flow.",
        example: "Mid-verification, Tom's radio crackles: 'Stop — we've got a release! Back out!'",
        visibleToLearner: true,
      },
      {
        icon: GitBranch,
        label: "Parallel Pressure",
        description: "Concurrent task injection to simulate real-world multitasking pressure.",
        whenToUse: "When the learner should experience competing priorities (e.g., another job needs attention during verification).",
        example: "While verifying isolations, Control Room calls about an unrelated alarm in another zone.",
        visibleToLearner: true,
      },
      {
        icon: EyeOff,
        label: "Hidden Tasks",
        description: "Evaluation criteria the learner is scored on but cannot see. The AI watches for specific behaviors.",
        whenToUse: "When you want to assess natural behavior without prompting (e.g., does the learner ask for the isolation list unprompted?).",
        example: "Hidden task: 'Learner requests the isolation list before verifying valve positions' — scored but never shown.",
        visibleToLearner: false,
      },
    ],
  },
];

/* ── Hierarchy diagram ── */

const HIERARCHY = [
  { label: "Scenario", desc: "The full training experience", who: "Stakeholder, SME, ID" },
  { label: "Phase", desc: "Stage of the experience (Intro → Simulation → Review)", who: "ID" },
  { label: "Scene", desc: "A narrative moment with a persona and goal", who: "SME + ID together" },
  { label: "Activity", desc: "What the learner does (visible)", who: "SME leads, ID implements" },
  { label: "Mechanic", desc: "What's configured under the hood (may be hidden)", who: "ID leads, SME reviews" },
];

/* ── Component ── */

function CategorySection({ category, colorClass }: { category: TaxonomyCategory; colorClass: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">{category.title}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {category.items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-5 space-y-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                  <item.icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{item.label}</h4>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] ${
                  item.visibleToLearner
                    ? "border-primary/30 text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {item.visibleToLearner ? (
                  <><Eye className="w-3 h-3 mr-1" /> Learner sees</>
                ) : (
                  <><EyeOff className="w-3 h-3 mr-1" /> Hidden</>
                )}
              </Badge>
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>

            <div className="space-y-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">When to use</p>
                <p className="text-xs text-foreground/70 leading-relaxed">{item.whenToUse}</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">Example</p>
                <p className="text-xs text-foreground/70 leading-relaxed italic">"{item.example}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComponentGallery() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar activeSection="scenarios" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-8 py-6">
          <h1 className="text-2xl font-bold text-foreground">Component Gallery</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Taxonomy reference for Activities and Mechanics — everything you can use to build a training scenario.
          </p>
        </header>

        <main className="px-8 py-8 space-y-10 max-w-6xl">
          {/* Hierarchy overview */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Scenario Hierarchy</h2>
            <div className="flex flex-wrap items-center gap-2">
              {HIERARCHY.map((level, i) => (
                <div key={level.label} className="flex items-center gap-2">
                  <div className="rounded-lg border border-border bg-card px-4 py-3 min-w-[160px]">
                    <p className="text-sm font-semibold text-foreground">{level.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{level.desc}</p>
                    <p className="text-[10px] text-primary mt-1">{level.who}</p>
                  </div>
                  {i < HIERARCHY.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Activities */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Activities</h2>
                <p className="text-sm text-muted-foreground">Learner-facing interactions — what the learner sees and does</p>
              </div>
            </div>

            <div className="space-y-8">
              {ACTIVITIES.map((cat) => (
                <CategorySection
                  key={cat.title}
                  category={cat}
                  colorClass="bg-primary/10 text-primary"
                />
              ))}
            </div>
          </section>

          {/* Mechanics */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Mechanics</h2>
                <p className="text-sm text-muted-foreground">Designer-facing logic — configured in the Inspector, may be hidden from the learner</p>
              </div>
            </div>

            <div className="space-y-8">
              {MECHANICS.map((cat) => (
                <CategorySection
                  key={cat.title}
                  category={cat}
                  colorClass="bg-muted text-muted-foreground"
                />
              ))}
            </div>
          </section>

          {/* Combination example */}
          <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground">How They Combine: Example Scene</h2>
            <p className="text-sm text-muted-foreground">
              A single <strong>Scene</strong> like "Zero Energy Verification" might contain:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg bg-card border border-border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Activity</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong>Text Chat</strong> with Tom (Maintenance Lead). Learner engages in dialogue about proving zero energy.
                </p>
              </div>
              <div className="rounded-lg bg-card border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Mechanics</p>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5">
                    <GitMerge className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span><strong>Decision Point</strong> — routes to Safe Outcome or Incident</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Target className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span><strong>Competency</strong> — "Safeguard Verification" scored silently</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <EyeOff className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span><strong>Hidden Task</strong> — "Must challenge gauge-only confirmation"</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span><strong>Interruption</strong> — Tom pushes back if approved too quickly</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <div className="h-8" />
        </main>
      </div>
    </div>
  );
}
