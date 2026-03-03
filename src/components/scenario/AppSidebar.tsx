import {
  LayoutDashboard, MonitorPlay, Library, FolderOpen,
  Workflow, TestTube, Component, MapPin,
  Settings, Users, BarChart3, MessageCircle, User
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Persona } from "@/types/workflow";

const NAV_SECTIONS = [
  {
    label: "LEARNER",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: null },
      { icon: MonitorPlay, label: "v3 Scenario Demo", path: null },
      { icon: Library, label: "Scenario Library", path: null },
      { icon: FolderOpen, label: "Resources", path: null },
    ],
  },
  {
    label: "DESIGNER",
    items: [
      { icon: Workflow, label: "Scenarios", path: "/" },
      { icon: TestTube, label: "Playtests", path: null },
      { icon: Component, label: "Component Gallery", path: "/component-gallery" },
      { icon: MapPin, label: "Hotspot Mapper", path: null },
    ],
  },
  {
    label: "FACILITATOR",
    items: [
      { icon: Settings, label: "Operations Console", path: null },
      { icon: Users, label: "Learners", path: null },
      { icon: Workflow, label: "Scenarios", path: null },
      { icon: BarChart3, label: "Analytics", path: null },
      { icon: MessageCircle, label: "Coaching", path: null },
    ],
  },
];

interface AppSidebarProps {
  personas?: Persona[];
  activeSection?: "scenarios" | "editor";
}

export function AppSidebar({ personas = [], activeSection = "scenarios" }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Deduplicate by name for the library display
  const uniquePersonas = personas.reduce<Persona[]>((acc, p) => {
    if (!acc.find(x => x.name === p.name)) acc.push(p);
    return acc;
  }, []);

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === "/") {
      // "Scenarios" is active when on root or inside a scenario editor
      return location.pathname === "/" || location.pathname.startsWith("/scenario/");
    }
    return location.pathname === path;
  };

  return (
    <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col h-screen">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">F</span>
        </div>
        <span className="font-semibold text-sm text-foreground">FFL Platform</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-4 mb-1 text-[10px] font-semibold tracking-wider text-sidebar-muted">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={`${section.label}-${item.label}`}
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors ${
                    active
                      ? "text-primary font-medium bg-sidebar-accent"
                      : item.path
                      ? "text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
                      : "text-sidebar-foreground opacity-50 cursor-not-allowed"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}

        {/* Persona Library — shown when inside a scenario editor */}
        {uniquePersonas.length > 0 && (
          <div className="mb-4">
            <p className="px-4 mb-1 text-[10px] font-semibold tracking-wider text-sidebar-muted">
              PERSONAS
            </p>
            {uniquePersonas.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 px-4 py-1.5 text-sm text-sidebar-foreground"
              >
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-sidebar-muted truncate">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs font-medium text-foreground">Design Team</p>
        <p className="text-[10px] text-sidebar-muted">Version 3.1</p>
      </div>
    </aside>
  );
}
