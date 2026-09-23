"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  RotateCcw,
  User,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/employee/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Assets",
    href: "/employee/assets",
    icon: Package,
  },
  {
    label: "Assignments",
    href: "/employee/assignments",
    icon: ClipboardList,
  },
  {
    label: "Returns",
    href: "/employee/returns",
    icon: RotateCcw,
  },
  {
    label: "My Profile",
    href: "/employee/profile",
    icon: User,
  },
];

export default function EmployeePortalHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-[#080b12]/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/employee/dashboard"
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_24px_rgba(59,130,246,0.25)] transition-transform duration-200 group-hover:scale-105">
              <BriefcaseBusiness className="h-5 w-5 text-white" />
            </div>

            <div className="hidden sm:block">
              <p className="text-[15px] font-semibold tracking-tight text-white">
                Assquere
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Employee Portal
                </p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1 md:flex">
            {navigation.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/employee/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-500/10 text-blue-300 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.12)]"
                      : "text-slate-500 hover:bg-slate-800/70 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive
                        ? "text-blue-400"
                        : "text-slate-600 group-hover:text-slate-300"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sign out */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-[13px] font-medium text-slate-400 transition-all duration-200 hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex gap-1 overflow-x-auto pb-3 md:hidden">
          {navigation.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (item.href !== "/employee/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "border-blue-400/20 bg-blue-500/10 text-blue-300"
                    : "border-transparent text-slate-500 hover:bg-slate-800/70 hover:text-slate-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}