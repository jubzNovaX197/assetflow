// components/layout/sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Package,
  Users,
  ClipboardList,
  RotateCcw,
  Wrench,
  History,
  Boxes,
} from "lucide-react";

import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:shrink-0 md:flex-col md:border-r md:bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Boxes className="h-6 w-6 text-sidebar-foreground" />

        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          AssetFlow
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-6 py-4">
        <p className="text-xs text-sidebar-foreground/50">
          &copy; {new Date().getFullYear()} AssetFlow
        </p>
      </div>
    </aside>
  );
}