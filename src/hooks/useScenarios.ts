import { useState, useCallback, useEffect } from "react";
import { Scenario, Step, Persona, SceneResource, CriticalityLevel } from "@/types/workflow";

const STORAGE_KEY = "scenario-dashboard-scenarios";

let _scenarioId = Date.now();
function genId() {
  return `sc_${_scenarioId++}`;
}

function loadFromStorage(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

function saveToStorage(scenarios: Scenario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(scenarios);
  }, [scenarios]);

  const createScenario = useCallback(
    (opts: {
      name: string;
      description?: string;
      targetRole?: string;
      estimatedDuration?: string;
      criticality?: CriticalityLevel;
      steps?: Step[];
      personas?: Persona[];
      resources?: SceneResource[];
    }): string => {
      const id = genId();
      const now = new Date().toISOString();
      const scenario: Scenario = {
        id,
        name: opts.name,
        description: opts.description ?? "",
        targetRole: opts.targetRole ?? "",
        estimatedDuration: opts.estimatedDuration ?? "",
        criticality: opts.criticality ?? "operational",
        status: "draft",
        createdAt: now,
        updatedAt: now,
        steps: opts.steps ?? [],
        personas: opts.personas ?? [],
        resources: opts.resources ?? [],
      };
      setScenarios((prev) => [...prev, scenario]);
      return id;
    },
    []
  );

  const updateScenario = useCallback((id: string, updates: Partial<Scenario>) => {
    setScenarios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )
    );
  }, []);

  const deleteScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getScenario = useCallback(
    (id: string) => scenarios.find((s) => s.id === id) ?? null,
    [scenarios]
  );

  return { scenarios, createScenario, updateScenario, deleteScenario, getScenario };
}
