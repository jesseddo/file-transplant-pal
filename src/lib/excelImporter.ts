import * as XLSX from "xlsx";
import { Step, Persona, SimTask, SceneResource, ColumnId, StepType } from "@/types/workflow";

// ── Column field identifiers ──

export type MappableField =
  | "nodeId"
  | "title"
  | "description"
  | "phase"
  | "type"
  | "personaName"
  | "personaRole"
  | "personaPersonality"
  | "personaObjective"
  | "openingLines"
  | "taskDescription"
  | "completionCriteria"
  | "hiddenTask"
  | "nextNode"
  | "givenResources"
  | "hiddenResources";

export const FIELD_LABELS: Record<MappableField, string> = {
  nodeId: "Node ID",
  title: "Title",
  description: "Description",
  phase: "Phase (Intro / Simulation / Review)",
  type: "Type (Chat / Video / PDF …)",
  personaName: "Persona Name",
  personaRole: "Persona Role",
  personaPersonality: "Persona Personality",
  personaObjective: "Persona Objective",
  openingLines: "Opening Lines",
  taskDescription: "Task Description",
  completionCriteria: "Completion Criteria",
  hiddenTask: "Hidden Task?",
  nextNode: "Next Node",
  givenResources: "Given Resources",
  hiddenResources: "Hidden Resources",
};

export const REQUIRED_FIELDS: MappableField[] = ["nodeId", "title"];

export type ColumnMapping = Record<string, MappableField | null>;

export interface ImportResult {
  steps: Step[];
  personas: Persona[];
  resources: SceneResource[];
  warnings: string[];
}

// ── Auto-detect column mappings ──

const HEADER_HINTS: Record<MappableField, RegExp> = {
  nodeId: /node[\s_-]?id|step[\s_-]?id/i,
  title: /^title$|^name$|step[\s_-]?title/i,
  description: /^description$|^desc$/i,
  phase: /phase|column|section|stage/i,
  type: /^type$|step[\s_-]?type|node[\s_-]?type/i,
  personaName: /persona[\s_-]?name|npc[\s_-]?name|character/i,
  personaRole: /persona[\s_-]?role|npc[\s_-]?role/i,
  personaPersonality: /personality|persona[\s_-]?personality/i,
  personaObjective: /persona[\s_-]?objective|npc[\s_-]?objective/i,
  openingLines: /opening[\s_-]?line|initial[\s_-]?message/i,
  taskDescription: /task[\s_-]?desc|task$|learner[\s_-]?task/i,
  completionCriteria: /completion[\s_-]?criteria|criteria|success[\s_-]?criteria/i,
  hiddenTask: /hidden[\s_-]?task|is[\s_-]?hidden/i,
  nextNode: /next[\s_-]?node|next[\s_-]?step|go[\s_-]?to/i,
  givenResources: /given[\s_-]?resource|visible[\s_-]?resource/i,
  hiddenResources: /hidden[\s_-]?resource/i,
};

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<MappableField>();

  for (const header of headers) {
    let matched: MappableField | null = null;
    for (const [field, regex] of Object.entries(HEADER_HINTS)) {
      if (regex.test(header) && !usedFields.has(field as MappableField)) {
        matched = field as MappableField;
        usedFields.add(matched);
        break;
      }
    }
    mapping[header] = matched;
  }
  return mapping;
}

// ── Parse workbook ──

export function parseWorkbook(data: ArrayBuffer): { headers: string[]; rows: Record<string, string>[]; rowCount: number } {
  const wb = XLSX.read(data, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (raw.length === 0) return { headers: [], rows: [], rowCount: 0 };

  const headers = raw[0].map((h) => String(h).trim());
  const rows = raw.slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
      return obj;
    });

  return { headers, rows, rowCount: rows.length };
}

// ── Map phase string to ColumnId ──

function toColumnId(val: string): ColumnId {
  const lower = val.toLowerCase();
  if (lower.includes("intro")) return "intro";
  if (lower.includes("review") || lower.includes("debrief")) return "review";
  return "simulation";
}

// ── Map type string to StepType ──

const TYPE_MAP: Record<string, StepType> = {
  chat: "text-chat", "text-chat": "text-chat", "text chat": "text-chat",
  video: "video", pdf: "pdf", audio: "audio",
  "radio call": "radio-call", "radio-call": "radio-call", radio: "radio-call",
  "ai coach": "ai-coach", "ai-coach": "ai-coach", coach: "ai-coach",
  interruption: "interruption",
  "fetch document": "fetch-document", "fetch-document": "fetch-document",
  evaluation: "generate-evaluation", "generate-evaluation": "generate-evaluation",
  "parallel order": "parallel-order", "parallel-order": "parallel-order",
};

function toStepType(val: string): StepType {
  return TYPE_MAP[val.toLowerCase()] ?? "text-chat";
}

// ── Main import function ──

let _importIdCounter = 1000;

export function importRows(rows: Record<string, string>[], mapping: ColumnMapping): ImportResult {
  const warnings: string[] = [];
  const reverseMap: Partial<Record<MappableField, string>> = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (field) reverseMap[field] = header;
  }

  const get = (row: Record<string, string>, field: MappableField): string => {
    const header = reverseMap[field];
    return header ? (row[header] ?? "").trim() : "";
  };

  // Group rows by Node ID
  const nodeGroups = new Map<string, Record<string, string>[]>();
  rows.forEach((row, idx) => {
    const nodeId = get(row, "nodeId");
    if (!nodeId) {
      warnings.push(`Row ${idx + 2}: no Node ID — skipped`);
      return;
    }
    if (!nodeGroups.has(nodeId)) nodeGroups.set(nodeId, []);
    nodeGroups.get(nodeId)!.push(row);
  });

  // Build personas (deduplicated by name)
  const personaMap = new Map<string, Persona>();
  rows.forEach((row) => {
    const name = get(row, "personaName");
    if (!name || personaMap.has(name)) return;
    const id = `persona_imp_${_importIdCounter++}`;
    personaMap.set(name, {
      id,
      name,
      role: get(row, "personaRole") || "NPC",
      personality: get(row, "personaPersonality") || "",
      objective: get(row, "personaObjective") || "",
      initialMessages: get(row, "openingLines")
        ? get(row, "openingLines").split(";").map((s) => s.trim()).filter(Boolean)
        : [],
    });
  });

  // Build steps
  const steps: Step[] = [];
  let orderCounters: Record<ColumnId, number> = { intro: 0, simulation: 0, review: 0 };

  nodeGroups.forEach((groupRows, nodeId) => {
    const firstRow = groupRows[0];
    const title = get(firstRow, "title") || nodeId;
    const column = toColumnId(get(firstRow, "phase") || "simulation");
    const type = toStepType(get(firstRow, "type") || "text-chat");

    // Collect tasks from all rows in this group
    const tasks: SimTask[] = groupRows
      .filter((r) => get(r, "taskDescription"))
      .map((r) => ({
        id: `task_imp_${_importIdCounter++}`,
        description: get(r, "taskDescription"),
        completionCriteria: get(r, "completionCriteria") || "",
        isHidden: /true|yes|1|hidden/i.test(get(r, "hiddenTask")),
        nextNodeId: get(r, "nextNode") || undefined,
      }));

    // Persona link
    const personaName = get(firstRow, "personaName");
    const persona = personaName ? personaMap.get(personaName) : undefined;

    // Resources
    const givenResourceIds = get(firstRow, "givenResources")
      ? get(firstRow, "givenResources").split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const hiddenResourceIds = get(firstRow, "hiddenResources")
      ? get(firstRow, "hiddenResources").split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const step: Step = {
      id: nodeId,
      title,
      type,
      column,
      order: orderCounters[column]++,
      ...(persona && { personaId: persona.id }),
      ...(tasks.length > 0 && { tasks }),
      ...(givenResourceIds && { givenResourceIds }),
      ...(hiddenResourceIds && { hiddenResourceIds }),
    };

    // Warn if no next node
    if (tasks.length > 0 && tasks.every((t) => !t.nextNodeId)) {
      warnings.push(`Node "${nodeId}": no Next Node on any task — will default to linear flow`);
    }

    steps.push(step);
  });

  // Detect circular references (simple: check for any step whose tasks point back to an ancestor)
  const stepIds = new Set(steps.map((s) => s.id));
  steps.forEach((step) => {
    step.tasks?.forEach((t) => {
      if (t.nextNodeId && !stepIds.has(t.nextNodeId) && t.nextNodeId !== "__end__") {
        warnings.push(`Node "${step.id}", task "${t.id}": next node "${t.nextNodeId}" does not exist`);
      }
    });
  });

  return {
    steps,
    personas: Array.from(personaMap.values()),
    resources: [],
    warnings,
  };
}
