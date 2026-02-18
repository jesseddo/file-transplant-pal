import { Step, Persona, SimTask, SceneResource, ColumnId, StepType } from "@/types/workflow";
import { ImportResult } from "@/lib/excelImporter";

/**
 * Imports a roleplay_definition.json file into the internal data model.
 * Supports the format used in src/data/roleplay_definition.json.
 */

let _jsonIdCounter = 2000;

function inferColumn(index: number, total: number, nodeId: string): ColumnId {
  // Heuristic: nodes starting with D or having "debrief" → review, 
  // nodes starting with O → still simulation (outcomes), intro resources handled separately
  if (/^D\d|debrief/i.test(nodeId)) return "review";
  if (/^eval/i.test(nodeId)) return "review";
  return "simulation";
}

function inferStepType(node: any): StepType {
  if (node.role_play_persona) return "text-chat";
  if (/interrupt|redirect/i.test(node.title || "")) return "interruption";
  if (/debrief|coach/i.test(node.title || "")) return "ai-coach";
  if (/evaluat/i.test(node.title || "")) return "generate-evaluation";
  if (/video/i.test(node.title || "")) return "video";
  if (/safe.*proceed|outcome/i.test(node.title || "")) return "fetch-document";
  return "text-chat";
}

export function importJson(json: any): ImportResult {
  const warnings: string[] = [];

  // Handle both the exported format (flat steps/personas) and roleplay_definition format
  if (json.steps && Array.isArray(json.steps)) {
    // Already in our internal format (re-import of an export)
    return {
      steps: json.steps as Step[],
      personas: (json.personas as Persona[]) ?? [],
      resources: (json.resources as SceneResource[]) ?? [],
      warnings: [],
    };
  }

  // Parse roleplay_definition.json format
  const nodes: any[] = json.roleplay_nodes ?? json.nodes ?? [];
  if (nodes.length === 0) {
    warnings.push("No roleplay_nodes found in JSON");
    return { steps: [], personas: [], resources: [], warnings };
  }

  // Parse scene resources
  const resources: SceneResource[] = (json.sceneResources ?? []).map((r: any) => ({
    id: r.id,
    title: r.title ?? r.id,
    type: r.type ?? "Document",
    description: r.description ?? "",
    url: r.url,
    hidden: r.hidden ?? false,
  }));

  // Intro steps from resources
  const introSteps: Step[] = resources
    .filter((r) => !r.hidden)
    .map((r, i) => ({
      id: r.id,
      title: r.title,
      type: "pdf" as StepType,
      column: "intro" as ColumnId,
      order: i + 1, // leave 0 for overview
    }));

  // Add a scenario overview video step
  introSteps.unshift({
    id: "intro_overview",
    title: `Scenario Overview: ${json.title?.slice(0, 40) ?? "Imported"}`,
    type: "video",
    column: "intro",
    order: 0,
  });

  // Build personas (deduplicated by name)
  const personaMap = new Map<string, Persona>();
  nodes.forEach((node) => {
    const p = node.role_play_persona;
    if (!p?.name) return;
    const key = `${p.name}_${p.personality?.slice(0, 20) ?? ""}`;
    if (personaMap.has(key)) return;
    const id = `persona_imp_${_jsonIdCounter++}`;
    personaMap.set(key, {
      id,
      name: p.name,
      role: p.role ?? "NPC",
      personality: p.personality ?? "",
      objective: p.objective ?? p.roleplay_objective ?? "",
      initialMessages: p.initial_messages ?? [],
    });
  });

  // Build simulation/review steps
  const simSteps: Step[] = [];
  let simOrder = 0;
  let reviewOrder = introSteps.length > 0 ? 0 : 0;

  nodes.forEach((node, idx) => {
    const column = inferColumn(idx, nodes.length, node.id);
    const type = inferStepType(node);

    // Find persona
    let personaId: string | undefined;
    if (node.role_play_persona?.name) {
      const key = `${node.role_play_persona.name}_${node.role_play_persona.personality?.slice(0, 20) ?? ""}`;
      personaId = personaMap.get(key)?.id;
    }

    // Parse tasks
    const tasks: SimTask[] = (node.tasks ?? []).map((t: any) => ({
      id: t.id ?? `task_imp_${_jsonIdCounter++}`,
      description: t.description ?? "",
      completionCriteria: t.completion_criteria ?? t.completionCriteria ?? "",
      isHidden: t.is_hidden ?? t.isHidden ?? false,
      nextNodeId: t.next_node_id ?? t.nextNodeId ?? undefined,
    }));

    const step: Step = {
      id: node.id,
      title: node.title ?? node.id,
      type,
      column,
      order: column === "review" ? reviewOrder++ : simOrder++,
      ...(personaId && { personaId }),
      ...(tasks.length > 0 && { tasks }),
      ...(node.given_resources && { givenResourceIds: node.given_resources }),
      ...(node.hidden_resources && { hiddenResourceIds: node.hidden_resources }),
    };

    simSteps.push(step);
  });

  // Validate next node references
  const allStepIds = new Set([...introSteps.map((s) => s.id), ...simSteps.map((s) => s.id)]);
  simSteps.forEach((step) => {
    step.tasks?.forEach((t) => {
      if (t.nextNodeId && t.nextNodeId !== "__end__" && !allStepIds.has(t.nextNodeId)) {
        warnings.push(`Node "${step.id}": task references unknown node "${t.nextNodeId}"`);
      }
    });
  });

  return {
    steps: [...introSteps, ...simSteps],
    personas: Array.from(personaMap.values()),
    resources,
    warnings,
  };
}
