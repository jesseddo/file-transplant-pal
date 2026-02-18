import { useState, useCallback } from "react";
import { Persona } from "@/types/workflow";

const INITIAL_PERSONAS: Persona[] = [
  {
    id: "persona_mike",
    name: "Mike",
    role: "Control Room Operator",
    personality: "Direct, concise, slightly blunt/sarcastic; prefers structured updates",
    objective: "Get a clear decision and understand what verification steps will occur before start.",
    initialMessages: [
      "Mike in the control room. They're asking for your permit sign-off so they can start the pump recommissioning. Can you approve it now, or are you holding it for verification?"
    ],
  },
  {
    id: "persona_tom",
    name: "Tom",
    role: "Maintenance / Crew Lead",
    personality: "Practical, field-focused, confident; may be slightly defensive",
    objective: "Represent isolations as implemented; support verification; keep the job moving safely.",
    initialMessages: [
      "Tom with maintenance. We installed the isolations per the plan. Are we ready to start?"
    ],
  },
  {
    id: "persona_tom_swc",
    name: "Tom",
    role: "Maintenance / Crew Lead",
    personality: "Practical, concise; supports walk-through when prompted",
    objective: "Walk through the isolations and safeguards and discuss the start work check.",
    initialMessages: [
      "Ok, I'll walk through the isolations and safeguards so you can physically verify them.",
      "We've got Breaker VE03A OFF—LOTO lock on, tag on with name/date/permit.",
      "Walking the hard isolations first: inlet from V400 closed—locked/tagged. Pump discharge closed—locked/tagged. Outlet to caustic drum closed—locked/tagged. Vent closed—locked/tagged. Bypass closed—locked/tagged. Return to V400 closed—locked/tagged."
    ],
  },
  {
    id: "persona_tom_zev",
    name: "Tom",
    role: "Maintenance / Crew Lead",
    personality: "Confident, practical; may lean on 'normal practice' shortcuts unless challenged",
    objective: "Get to start work while complying with verification expectations.",
    initialMessages: [
      "We're ready for zero-energy verification. Ask what you need.",
      "Crew note: gauge is reading zero. Control room said it's at zero too."
    ],
  },
  {
    id: "persona_tom_incident",
    name: "Tom",
    role: "Maintenance / Crew Lead",
    personality: "Urgent, direct",
    objective: "Get the crew safe and coordinate immediate actions with the verifier and control room.",
    initialMessages: [
      "Stop—stop! We've got a release! Back out—get upwind!",
      "One of the guys is dizzy—getting him to fresh air. We need medical response now."
    ],
  },
  {
    id: "persona_coach_safe",
    name: "Coach",
    role: "AI Coach (Out of Role-play)",
    personality: "Reflective, guiding",
    objective: "Help learner articulate lessons learned from a successful verification and safe outcome.",
    initialMessages: [
      "Debrief. You prevented an incident by requiring proof of zero energy—not just a gauge reading.",
      "Lessons learned: what did you do well, and how will you apply this verification approach on the next job?"
    ],
  },
  {
    id: "persona_coach_incident",
    name: "Coach",
    role: "AI Coach (Out of Role-play)",
    personality: "Reflective, guiding, direct about cause-and-effect without shaming",
    objective: "Help learner connect verification lapse to outcome and articulate prevention-focused lessons learned.",
    initialMessages: [
      "Debrief. The critical miss was approving start work without proving zero energy—specifically, the bleeder/vent was never opened.",
      "Lessons learned: what verification dialogue should have happened, and what will you do differently next time before you sign off?"
    ],
  },
];

let nextPersonaId = 100;

export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>(INITIAL_PERSONAS);

  const addPersona = useCallback((persona: Omit<Persona, "id">) => {
    const id = `persona_${nextPersonaId++}`;
    const newPersona: Persona = { ...persona, id };
    setPersonas((prev) => [...prev, newPersona]);
    return id;
  }, []);

  const updatePersona = useCallback((id: string, updates: Partial<Persona>) => {
    setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  }, []);

  const removePersona = useCallback((id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPersona = useCallback((id: string) => {
    return personas.find((p) => p.id === id) ?? null;
  }, [personas]);

  return { personas, addPersona, updatePersona, removePersona, getPersona };
}
