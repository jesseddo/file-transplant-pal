import { useState, useEffect } from "react";
import { Step, RoutingRule } from "@/types/workflow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface EditLogicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: Step;
  allSteps: Step[];
  onSave: (stepId: string, updates: Partial<Step>) => void;
}

export function EditLogicModal({ open, onOpenChange, step, allSteps, onSave }: EditLogicModalProps) {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [fallback, setFallback] = useState<string>("");

  // Initialize from step data when modal opens
  useEffect(() => {
    if (open) {
      if (step.routingRules?.length) {
        setRules([...step.routingRules]);
      } else {
        // Auto-populate from existing choices that have routing set
        const autoRules = (step.choices ?? [])
          .filter((c) => c.nextStepId && c.nextStepId !== "")
          .map((c) => ({ choiceId: c.id, nextStepId: c.nextStepId! }));
        setRules(autoRules);
      }
      setFallback(step.fallbackNextStepId || "");
    }
  }, [open, step]);

  const choices = step.choices ?? [];
  const destinations = allSteps
    .filter((s) => s.id !== step.id)
    .map((s) => ({ value: s.id, label: s.title }));
  destinations.push({ value: "__end__", label: "End Scenario" });

  const addRule = () => {
    setRules((prev) => [...prev, { choiceId: "", nextStepId: "" }]);
  };

  const updateRule = (index: number, field: keyof RoutingRule, value: string) => {
    setRules((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const validRules = rules.filter((r) => r.choiceId && r.nextStepId);
    onSave(step.id, {
      routingRules: validRules.length > 0 ? validRules : undefined,
      fallbackNextStepId: fallback || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit logic for {step.title}</DialogTitle>
          <DialogDescription>
            Define routing rules to control where learners go based on their choices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto py-2">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-medium shrink-0">IF</span>
              <Select value={rule.choiceId} onValueChange={(v) => updateRule(i, "choiceId", v)}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                  <SelectValue placeholder="Select choice…" />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.label || "Untitled"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground font-medium shrink-0">→</span>
              <Select value={rule.nextStepId} onValueChange={(v) => updateRule(i, "nextStepId", v)}>
                <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                  <SelectValue placeholder="Go to…" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeRule(i)}>
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={addRule}>
            <Plus className="w-3.5 h-3.5" /> Add rule
          </Button>
        </div>

        {/* Fallback */}
        <div className="flex items-center gap-2 text-sm border-t pt-3">
          <span className="text-muted-foreground font-medium shrink-0">All other cases →</span>
          <Select value={fallback} onValueChange={setFallback}>
            <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
              <SelectValue placeholder="Select destination…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-muted-foreground">
                None
              </SelectItem>
              {destinations.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs">
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
