import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Persona, ColumnId, StepType } from "@/types/workflow";
import { MessageSquare, Plus } from "lucide-react";

interface AddSceneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personas: Persona[];
  onAddScene: (scene: {
    title: string;
    type: StepType;
    column: ColumnId;
    personaId?: string;
    openingLine: string;
    isBranching: boolean;
  }) => void;
}

export function AddSceneModal({
  open,
  onOpenChange,
  personas,
  onAddScene,
}: AddSceneModalProps) {
  const [personaId, setPersonaId] = useState<string>("");
  const [newPersonaName, setNewPersonaName] = useState("");
  const [openingLine, setOpeningLine] = useState("");
  const [isBranching, setIsBranching] = useState(false);
  const [column, setColumn] = useState<ColumnId>("simulation");
  const [mode, setMode] = useState<"existing" | "new">("existing");

  const reset = () => {
    setPersonaId("");
    setNewPersonaName("");
    setOpeningLine("");
    setIsBranching(false);
    setColumn("simulation");
    setMode("existing");
  };

  const selectedPersona = personas.find((p) => p.id === personaId);
  const displayName =
    mode === "existing"
      ? selectedPersona?.name ?? "Scene"
      : newPersonaName.trim() || "Scene";

  const title = isBranching
    ? `${displayName} – Decision`
    : `${displayName} – Dialogue`;

  const canSubmit =
    openingLine.trim().length > 0 &&
    (mode === "existing" ? !!personaId : newPersonaName.trim().length > 0);

  const handleSubmit = () => {
    onAddScene({
      title,
      type: "text-chat",
      column,
      personaId: mode === "existing" ? personaId : undefined,
      openingLine: openingLine.trim(),
      isBranching,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Add Scene
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Column */}
          <div className="space-y-1.5">
            <Label className="text-xs">Phase</Label>
            <Select value={column} onValueChange={(v) => setColumn(v as ColumnId)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intro">Intro</SelectItem>
                <SelectItem value="simulation">Simulation</SelectItem>
                <SelectItem value="review">Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Character */}
          <div className="space-y-1.5">
            <Label className="text-xs">Character</Label>
            {mode === "existing" ? (
              <div className="flex gap-2">
                <Select value={personaId} onValueChange={setPersonaId}>
                  <SelectTrigger className="h-9 text-sm flex-1">
                    <SelectValue placeholder="Select a persona…" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} – {p.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 text-xs shrink-0"
                  onClick={() => setMode("new")}
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  className="h-9 text-sm flex-1"
                  placeholder="e.g. Maria"
                  value={newPersonaName}
                  onChange={(e) => setNewPersonaName(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs shrink-0"
                  onClick={() => setMode("existing")}
                >
                  Existing
                </Button>
              </div>
            )}
          </div>

          {/* Opening line */}
          <div className="space-y-1.5">
            <Label className="text-xs">Opening line</Label>
            <Textarea
              className="text-sm min-h-[72px]"
              placeholder="What does this character say to the learner?"
              value={openingLine}
              onChange={(e) => setOpeningLine(e.target.value)}
            />
          </div>

          {/* Branching toggle */}
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">Decision point</p>
              <p className="text-xs text-muted-foreground">Learner will choose between options</p>
            </div>
            <Switch checked={isBranching} onCheckedChange={setIsBranching} />
          </div>

          {/* Preview */}
          <div className="rounded-md bg-muted/50 border border-border px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
              Will create
            </p>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Text Chat • {column.charAt(0).toUpperCase() + column.slice(1)} phase
              {isBranching && " • With branching choices"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            Add Scene
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
