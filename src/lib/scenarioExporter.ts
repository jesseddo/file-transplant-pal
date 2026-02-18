import { Step, Persona, SceneResource } from "@/types/workflow";

export interface ExportPayload {
  steps: Step[];
  personas: Persona[];
  resources: SceneResource[];
  exportedAt: string;
}

export function buildExportPayload(
  steps: Step[],
  personas: Persona[],
  resources: SceneResource[] = []
): ExportPayload {
  return {
    steps,
    personas,
    resources,
    exportedAt: new Date().toISOString(),
  };
}

export function downloadJson(payload: ExportPayload, filename = "scenario.json") {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
