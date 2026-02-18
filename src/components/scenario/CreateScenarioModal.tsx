import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileSpreadsheet, FileJson, Plus } from "lucide-react";
import { CriticalityLevel } from "@/types/workflow";
import { parseWorkbook, autoDetectMapping, importRows } from "@/lib/excelImporter";
import { importJson } from "@/lib/jsonImporter";
import type { ImportResult } from "@/lib/excelImporter";
import { cn } from "@/lib/utils";

type ImportSource = "scratch" | "excel" | "json";

interface CreateScenarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: {
    name: string;
    description: string;
    targetRole: string;
    estimatedDuration: string;
    criticality: CriticalityLevel;
    importResult?: ImportResult;
  }) => void;
}

export function CreateScenarioModal({ open, onOpenChange, onCreate }: CreateScenarioModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [criticality, setCriticality] = useState<CriticalityLevel>("operational");
  const [importSource, setImportSource] = useState<ImportSource>("scratch");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName(""); setDescription(""); setTargetRole("");
    setEstimatedDuration(""); setCriticality("operational");
    setImportSource("scratch"); setImportResult(null); setImportFileName("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    try {
      if (importSource === "excel") {
        const buf = await file.arrayBuffer();
        const { headers, rows } = parseWorkbook(buf);
        const mapping = autoDetectMapping(headers);
        const result = importRows(rows, mapping);
        setImportResult(result);
      } else {
        const text = await file.text();
        const json = JSON.parse(text);
        const result = importJson(json);
        setImportResult(result);
      }
    } catch {
      setImportResult(null);
      setImportFileName("Error parsing file");
    }
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      targetRole: targetRole.trim(),
      estimatedDuration: estimatedDuration.trim(),
      criticality,
      importResult: importResult ?? undefined,
    });
    reset();
    onOpenChange(false);
  };

  const sourceOptions: { value: ImportSource; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "scratch", label: "From scratch", icon: <Plus className="w-4 h-4" />, desc: "Empty scenario" },
    { value: "excel", label: "Excel / CSV", icon: <FileSpreadsheet className="w-4 h-4" />, desc: "Import spreadsheet" },
    { value: "json", label: "JSON", icon: <FileJson className="w-4 h-4" />, desc: "Import JSON file" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Scenario</DialogTitle>
          <DialogDescription>Set up a new training scenario. You can optionally import steps from a file.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="scenario-name">Name *</Label>
            <Input id="scenario-name" placeholder="e.g. Zero Energy Verification" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="scenario-desc">Description</Label>
            <Textarea id="scenario-desc" placeholder="Brief summary of the scenario" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Target Role & Duration row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scenario-role">Target Role</Label>
              <Input id="scenario-role" placeholder="e.g. Outside Operator" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scenario-duration">Est. Duration</Label>
              <Input id="scenario-duration" placeholder="e.g. 20-30 min" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)} />
            </div>
          </div>

          {/* Criticality */}
          <div className="space-y-1.5">
            <Label>Criticality</Label>
            <Select value={criticality} onValueChange={(v) => setCriticality(v as CriticalityLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="safety-critical">Safety Critical</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Import Source */}
          <div className="space-y-1.5">
            <Label>Import Source</Label>
            <div className="grid grid-cols-3 gap-2">
              {sourceOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border p-3 text-xs transition-colors",
                    importSource === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                  onClick={() => { setImportSource(opt.value); setImportResult(null); setImportFileName(""); }}
                >
                  {opt.icon}
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File picker for import */}
          {importSource !== "scratch" && (
            <div className="space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                {importFileName || `Choose ${importSource === "excel" ? ".xlsx / .csv" : ".json"} file`}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={importSource === "excel" ? ".xlsx,.csv,.xls" : ".json"}
                onChange={handleFileChange}
              />
              {importResult && (
                <p className="text-xs text-muted-foreground">
                  Parsed {importResult.steps.length} steps, {importResult.personas.length} personas
                  {importResult.warnings.length > 0 && ` (${importResult.warnings.length} warnings)`}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
