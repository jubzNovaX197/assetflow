"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Boxes,
  ChevronDown,
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  RotateCcw,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Assignments", href: "/assignments", icon: ClipboardList },
  {
    label: "Return Requests",
    href: "/return-requests",
    icon: RotateCcw,
  },
  { label: "Services", href: "/services", icon: Wrench },
  { label: "Audit Trail", href: "/audit-trail", icon: History },
] as const;

const DASHBOARD_ITEMS = [
  { label: "Overview", href: "/#overview" },
  { label: "Asset Status", href: "/#asset-status" },
  { label: "Recent Activity", href: "/#recent-activity" },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [dashboardOpen, setDashboardOpen] = useState(pathname === "/");

  const isDashboardActive = pathname === "/";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r bg-sidebar shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
              <Boxes className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                Assquere
              </p>
              <p className="text-[11px] text-sidebar-foreground/50">
                Asset management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
          <div className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
              Workspace
            </p>

            <div>
              <div className="flex items-center">
                <Link
                  href="/"
                  onClick={() => {
                    setDashboardOpen((open) => !open);
                    onClose();
                  }}
                  className={cn(
                    "group flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isDashboardActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <LayoutDashboard
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isDashboardActive
                        ? "text-violet-400"
                        : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                    )}
                  />

                  <span className="truncate">Dashboard</span>
                </Link>

                <button
                  type="button"
                  aria-label="Toggle dashboard menu"
                  aria-expanded={dashboardOpen}
                  onClick={() => setDashboardOpen((open) => !open)}
                  className={cn(
                    "mr-1 rounded-md p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    isDashboardActive && "text-sidebar-foreground/60",
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      dashboardOpen && "rotate-180",
                    )}
                  />
                </button>
              </div>

              <div
                className={cn(
                  "grid transition-all duration-200",
                  dashboardOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="ml-4 mt-1 border-l border-sidebar-border pl-3">
                    {DASHBOARD_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className="block rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-1 space-y-0.5">
              {NAV_ITEMS.slice(0, 2).map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-violet-400"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                      )}
                    />

                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
              Operations
            </p>

            <div className="space-y-0.5">
              {NAV_ITEMS.slice(2, 5).map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-violet-400"
                          : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                      )}
                    />

                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
              Governance
            </p>

            <Link
              href="/audit-trail"
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                pathname.startsWith("/audit-trail")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <History
                className={cn(
                  "h-4 w-4 shrink-0",
                  pathname.startsWith("/audit-trail")
                    ? "text-violet-400"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
                )}
              />

              Audit Trail
            </Link>
          </div>

          <div className="mt-auto pt-6">
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-medium text-sidebar-foreground">
                  System operational
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[10px] text-sidebar-foreground/45">
                <Activity className="h-3 w-3" />
                Assquere workspace
              </div>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t px-5 py-4">
          <p className="text-[11px] text-sidebar-foreground/40">
            © {new Date().getFullYear()} Assquere
          </p>
        </div>
      </aside>
    </>
  );
}