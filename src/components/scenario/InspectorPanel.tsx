import { Step, STEP_TYPE_LABELS, STEP_TYPE_CATEGORY, CATEGORY_BADGE_CLASS } from "@/types/workflow";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InspectorPanelProps {
  step: Step;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Step>) => void;
}

export function InspectorPanel({ step, onClose, onUpdate }: InspectorPanelProps) {
  const category = STEP_TYPE_CATEGORY[step.type];
  const badgeClass = CATEGORY_BADGE_CLASS[category];

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

        {/* Mock fields based on step type */}
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
