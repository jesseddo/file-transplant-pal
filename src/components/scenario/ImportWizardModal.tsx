import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import {
  parseWorkbook,
  autoDetectMapping,
  importRows,
  ColumnMapping,
  MappableField,
  FIELD_LABELS,
  REQUIRED_FIELDS,
  ImportResult,
} from "@/lib/excelImporter";
import { importJson } from "@/lib/jsonImporter";
import { importDocx } from "@/lib/docxImporter";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: ImportResult) => void;
}

type WizardStep = "upload" | "mapping" | "preview";
type FileFormat = "excel" | "json" | "docx";

export function ImportWizardModal({ open, onOpenChange, onImport }: ImportWizardModalProps) {
  const [wizardStep, setWizardStep] = useState<WizardStep>("upload");
  const [fileFormat, setFileFormat] = useState<FileFormat>("excel");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = useCallback(() => {
    setWizardStep("upload");
    setFileFormat("excel");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
  }, []);

  const handleFileChange = useCallback(async (file: File) => {
    setFileName(file.name);
    const isJson = file.name.endsWith(".json");
    const isDocx = file.name.endsWith(".docx");

    if (isJson) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        const res = importJson(json);
        setFileFormat("json");
        setResult(res);
        setWizardStep("preview");
      } catch {
        setResult({ steps: [], personas: [], resources: [], warnings: ["Failed to parse JSON file"] });
        setFileFormat("json");
        setWizardStep("preview");
      }
    } else if (isDocx) {
      const data = await file.arrayBuffer();
      const res = await importDocx(data);
      setFileFormat("docx");
      setResult(res);
      setWizardStep("preview");
    } else {
      const data = await file.arrayBuffer();
      const parsed = parseWorkbook(data);
      setFileFormat("excel");
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoDetectMapping(parsed.headers));
      setWizardStep("mapping");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleMappingChange = useCallback((header: string, value: string) => {
    setMapping((prev) => ({
      ...prev,
      [header]: value === "__none__" ? null : (value as MappableField),
    }));
  }, []);

  const proceedToPreview = useCallback(() => {
    const res = importRows(rows, mapping);
    setResult(res);
    setWizardStep("preview");
  }, [rows, mapping]);

  const handleConfirmImport = useCallback(() => {
    if (result) {
      onImport(result);
      reset();
      onOpenChange(false);
    }
  }, [result, onImport, reset, onOpenChange]);

  const missingRequired = REQUIRED_FIELDS.filter(
    (f) => !Object.values(mapping).includes(f)
  );

  const usedFields = new Set(Object.values(mapping).filter(Boolean));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Scenario
            <Badge variant="outline" className="ml-2 text-xs font-normal">
              {fileFormat === "json" || fileFormat === "docx"
                ? `Step ${wizardStep === "upload" ? 1 : 2} of 2`
                : `Step ${wizardStep === "upload" ? 1 : wizardStep === "mapping" ? 2 : 3} of 3`}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {wizardStep === "upload" && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-border rounded-lg p-10 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => document.getElementById("import-file-input")?.click()}
          >
            <Upload className="w-10 h-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Drop your file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse · .xlsx / .csv / .json / .docx</p>
            </div>
            <input
              id="import-file-input"
              type="file"
              accept=".xlsx,.xls,.csv,.json,.docx"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        )}

        {/* ── Step 2: Column Mapping ── */}
        {wizardStep === "mapping" && (
          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{fileName}</span> · {rows.length} rows detected
            </p>

            {missingRequired.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" />
                Required: {missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}
              </div>
            )}

            <ScrollArea className="flex-1 min-h-0 pr-2">
              <div className="space-y-2">
                {headers.map((header) => (
                  <div key={header} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-40 truncate shrink-0" title={header}>
                      {header}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <Select
                      value={mapping[header] ?? "__none__"}
                      onValueChange={(v) => handleMappingChange(header, v)}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— skip —</SelectItem>
                        {(Object.entries(FIELD_LABELS) as [MappableField, string][]).map(([field, label]) => (
                          <SelectItem
                            key={field}
                            value={field}
                            disabled={usedFields.has(field) && mapping[header] !== field}
                          >
                            {label}
                            {REQUIRED_FIELDS.includes(field) ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {wizardStep === "preview" && result && (
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard label="Steps" count={result.steps.length} />
              <SummaryCard label="Personas" count={result.personas.length} />
              <SummaryCard label="Resources" count={result.resources.length} />
            </div>

            {result.warnings.length > 0 && (
              <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-1.5">
                  {result.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                      {w}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {result.warnings.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                No warnings — ready to import
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {wizardStep !== "upload" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWizardStep(
                wizardStep === "preview" && fileFormat === "excel" ? "mapping" : "upload"
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </Button>
          )}
          {wizardStep === "mapping" && (
            <Button size="sm" disabled={missingRequired.length > 0} onClick={proceedToPreview}>
              Preview <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
          {wizardStep === "preview" && (
            <Button size="sm" onClick={handleConfirmImport}>
              Import {result?.steps.length} steps
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
      <p className="text-2xl font-semibold text-foreground">{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
