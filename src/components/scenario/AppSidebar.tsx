import {
  LayoutDashboard, MonitorPlay, Library, FolderOpen,
  Workflow, TestTube, Component, MapPin,
  Settings, Users, BarChart3, MessageCircle
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "LEARNER",
    items: [
      { icon: LayoutDashboard, label: "Dashboard" },
      { icon: MonitorPlay, label: "v3 Scenario Demo" },
      { icon: Library, label: "Scenario Library" },
      { icon: FolderOpen, label: "Resources" },
    ],
  },
  {
    label: "DESIGNER",
    items: [
      { icon: Workflow, label: "Scenarios", active: true },
      { icon: TestTube, label: "Playtests" },
      { icon: Component, label: "Component Gallery" },
      { icon: MapPin, label: "Hotspot Mapper" },
    ],
  },
  {
    label: "FACILITATOR",
    items: [
      { icon: Settings, label: "Operations Console" },
      { icon: Users, label: "Learners" },
      { icon: Workflow, label: "Scenarios" },
      { icon: BarChart3, label: "Analytics" },
      { icon: MessageCircle, label: "Coaching" },
    ],
  },
];

export function AppSidebar() {
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
            {section.items.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors ${
                  item.active
                    ? "text-primary font-medium bg-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs font-medium text-foreground">Design Team</p>
        <p className="text-[10px] text-sidebar-muted">Version 3.1</p>
      </div>
    </aside>
  );
}
