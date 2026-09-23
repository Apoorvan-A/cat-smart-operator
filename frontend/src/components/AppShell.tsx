import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { USE_MOCK } from "@/api";
import { cx } from "@/lib/format";
import { LiveIndicator } from "./status";
import {
  IconAlert,
  IconChart,
  IconClipboard,
  IconExcavator,
  IconGauge,
  IconHandover,
  IconHeart,
  IconLogout,
  IconMenu,
  IconRadar,
  IconShield,
  IconSpark,
  IconTasks,
  IconX,
} from "./icons";

const NAV: { to: string; label: string; icon: ReactNode; group?: string }[] = [
  { to: "/", label: "Command Center", icon: <IconGauge /> },
  { to: "/tasks", label: "Daily Tasks", icon: <IconTasks /> },
  { to: "/machine", label: "Machine Health", icon: <IconHeart /> },
  { to: "/safety", label: "Safety Center", icon: <IconShield /> },
  { to: "/zone", label: "Live Work Zone", icon: <IconRadar /> },
  { to: "/incidents", label: "Incidents", icon: <IconAlert /> },
  { to: "/training", label: "Training Hub", icon: <IconClipboard /> },
  { to: "/analytics", label: "Analytics", icon: <IconChart /> },
  { to: "/handover", label: "Shift Handover", icon: <IconHandover /> },
  { to: "/assistant", label: "AI Assistant", icon: <IconSpark /> },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { status, alerts } = useWebSocket();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE" || a.status === "CREATED").length;
  const currentLabel = NAV.find((n) => n.to === location.pathname)?.label ?? "";

  const rail = (
    <div className="flex h-full flex-col">
      <Brand />
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cx("nav-link", isActive && "nav-link-active")}
          >
            {({ isActive }) => (
              <>
                <span className={cx("shrink-0 transition-colors", isActive ? "text-cat" : "text-fg-faint")}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.to === "/safety" && activeAlerts > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sev-high px-1.5 text-[11px] font-bold text-ink-900">
                    {activeAlerts}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <OperatorCard name={user?.name} role={user?.role} onLogout={logout} />
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-ink-800/70 backdrop-blur lg:block">{rail}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 animate-slide-up border-r border-line bg-ink-800">{rail}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-ink-900/80 px-4 py-3 backdrop-blur lg:px-8">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
            {mobileOpen ? <IconX /> : <IconMenu />}
          </button>
          <div className="min-w-0 flex-1">
            <div className="eyebrow hidden sm:block">CAT Smart Operator</div>
            <h1 className="h-display truncate text-base text-fg sm:text-lg">{currentLabel}</h1>
          </div>
          {USE_MOCK && (
            <span className="hidden items-center gap-1.5 rounded-full border border-cat/30 bg-cat/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cat sm:inline-flex">
              Simulated feed
            </span>
          )}
          <LiveIndicator status={status} />
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-cat text-ink-900 shadow-glow-cat">
        <IconExcavator width={22} height={22} />
      </div>
      <div className="leading-tight">
        <div className="font-display text-sm font-bold uppercase tracking-wider text-fg">CAT Operator</div>
        <div className="text-[11px] text-fg-faint">Smart Assistant</div>
      </div>
    </div>
  );
}

function OperatorCard({ name, role, onLogout }: { name?: string; role?: string; onLogout: () => void }) {
  const initials = (name ?? "OP")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-3 rounded-xl bg-ink-700/60 p-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cat to-cat-dim font-display text-sm font-bold text-ink-900">
          {initials}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-fg">{name ?? "Operator"}</div>
          <div className="text-[11px] uppercase tracking-wide text-fg-faint">{role ?? "OPERATOR"}</div>
        </div>
        <button className="rounded-lg p-2 text-fg-faint transition-colors hover:bg-ink-500 hover:text-sev-critical" onClick={onLogout} aria-label="Sign out">
          <IconLogout width={18} height={18} />
        </button>
      </div>
    </div>
  );
}
