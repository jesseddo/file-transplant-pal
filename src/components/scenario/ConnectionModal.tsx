import { Connection, Step } from "@/types/workflow";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ConnectionModalProps {
  connection: Connection;
  steps: Step[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Connection>) => void;
  onRemove: (id: string) => void;
}

export function ConnectionModal({ connection, steps, onClose, onUpdate, onRemove }: ConnectionModalProps) {
  const [condition, setCondition] = useState(connection.condition ?? "");
  const fromStep = steps.find((s) => s.id === connection.fromStepId);
  const toStep = steps.find((s) => s.id === connection.toStepId);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Connection</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{fromStep?.title ?? "?"}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-foreground">{toStep?.title ?? "?"}</span>
          </div>
          <div>
            <Label className="text-xs">Condition (optional)</Label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. score >= 80"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Destination</Label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm">
              {steps.map((s) => (
                <option key={s.id} value={s.id} selected={s.id === connection.toStepId}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => { onRemove(connection.id); onClose(); }}
          >
            Delete
          </Button>
          <Button
            size="sm"
            onClick={() => { onUpdate(connection.id, { condition }); onClose(); }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
