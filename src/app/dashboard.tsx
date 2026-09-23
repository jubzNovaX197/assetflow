"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  History,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Users,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Employee {
  id: string;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  name?: string;
  employeeCode?: string;
}

interface Asset {
  id: string;
  status:
    | "AVAILABLE"
    | "ASSIGNED"
    | "IN_REPAIR"
    | "RETURN_REQUESTED"
    | "RETIRED";
  name: string;
  assetTag: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt: string | null;
}

interface ReturnRequest {
  id: string;
  assetId: string;
  employeeId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedAt: string;
  reason?: string;
}

interface ServiceRecord {
  id: string;
  assetId: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  issue: string;
  openedAt: string;
  cost: string | null;
}

interface AuditLog {
  id: string;
  assetId: string;
  action: string;
  actor: string;
  oldStatus: string | null;
  newStatus: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  inRepairAssets: number;
  returnRequestedAssets: number;
  retiredAssets: number;
  pendingReturnRequests: number;
  openServiceRecords: number;
  totalServiceCost: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentAssignments: Assignment[];
  recentServiceRecords: ServiceRecord[];
  recentAuditLogs: AuditLog[];
  assets: Asset[];
  employees: Employee[];
  returnRequests: ReturnRequest[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return res.json() as Promise<T>;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString();
}

function formatCost(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClasses(status: string): string {
  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

    case "ASSIGNED":
    case "IN_PROGRESS":
      return "border-violet-500/20 bg-violet-500/10 text-violet-300";

    case "IN_REPAIR":
    case "OPEN":
      return "border-orange-500/20 bg-orange-500/10 text-orange-300";

    case "RETURN_REQUESTED":
    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";

    case "REJECTED":
    case "CANCELLED":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    default:
      return "border-slate-700 bg-slate-800/60 text-slate-300";
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  accent: "violet" | "amber" | "emerald" | "orange";
}) {
  const accentClasses = {
    violet: {
      icon: "bg-violet-500/10 text-violet-400",
      glow: "group-hover:border-violet-500/30",
    },
    amber: {
      icon: "bg-amber-500/10 text-amber-400",
      glow: "group-hover:border-amber-500/30",
    },
    emerald: {
      icon: "bg-emerald-500/10 text-emerald-400",
      glow: "group-hover:border-emerald-500/30",
    },
    orange: {
      icon: "bg-orange-500/10 text-orange-400",
      glow: "group-hover:border-orange-500/30",
    },
  }[accent];

  const content = (
    <Card
      className={`group border-slate-800/80 bg-[#0d111a] shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#101520] ${accentClasses.glow}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          {title}
        </CardTitle>

        <div className={`rounded-xl p-2.5 ${accentClasses.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-semibold tracking-tight text-white">
          {value}
        </div>
      </CardContent>
    </Card>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);

      try {
        const [
          employees,
          assets,
          assignments,
          returnRequests,
          serviceRecords,
          auditLogs,
        ] = await Promise.all([
          fetchJson<Employee[]>("/api/employees"),
          fetchJson<Asset[]>("/api/assets"),
          fetchJson<Assignment[]>("/api/assignments"),
          fetchJson<ReturnRequest[]>("/api/return-requests"),
          fetchJson<ServiceRecord[]>("/api/service-records"),
          fetchJson<AuditLog[]>("/api/audit-logs"),
        ]);

        if (!isMounted) {
          return;
        }

        const totalServiceCost = serviceRecords.reduce((total, record) => {
          const cost = Number(record.cost ?? 0);

          return Number.isNaN(cost) ? total : total + cost;
        }, 0);

        const stats: DashboardStats = {
          totalEmployees: employees.length,
          activeEmployees: employees.filter(
            (employee) => employee.isActive
          ).length,
          totalAssets: assets.length,
          assignedAssets: assets.filter(
            (asset) => asset.status === "ASSIGNED"
          ).length,
          availableAssets: assets.filter(
            (asset) => asset.status === "AVAILABLE"
          ).length,
          inRepairAssets: assets.filter(
            (asset) => asset.status === "IN_REPAIR"
          ).length,
          returnRequestedAssets: assets.filter(
            (asset) => asset.status === "RETURN_REQUESTED"
          ).length,
          retiredAssets: assets.filter(
            (asset) => asset.status === "RETIRED"
          ).length,
          pendingReturnRequests: returnRequests.filter(
            (request) => request.status === "PENDING"
          ).length,
          openServiceRecords: serviceRecords.filter(
            (record) =>
              record.status === "OPEN" || record.status === "IN_PROGRESS"
          ).length,
          totalServiceCost,
        };

        const recentAssignments = [...assignments]
          .sort(
            (a, b) =>
              new Date(b.assignedAt).getTime() -
              new Date(a.assignedAt).getTime()
          )
          .slice(0, 5);

        const recentServiceRecords = [...serviceRecords]
          .sort(
            (a, b) =>
              new Date(b.openedAt).getTime() -
              new Date(a.openedAt).getTime()
          )
          .slice(0, 5);

        const recentAuditLogs = [...auditLogs]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
          .slice(0, 6);

        setData({
          stats,
          recentAssignments,
          recentServiceRecords,
          recentAuditLogs,
          assets,
          employees,
          returnRequests,
        });
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load dashboard data:", err);

        setError(
          "Unable to load dashboard data right now. Please try again later."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const assets = data?.assets ?? [];
  const employees = data?.employees ?? [];

  const assetMap = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets]
  );

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );

  const stats = data?.stats ?? {
    totalEmployees: 0,
    activeEmployees: 0,
    totalAssets: 0,
    assignedAssets: 0,
    availableAssets: 0,
    inRepairAssets: 0,
    returnRequestedAssets: 0,
    retiredAssets: 0,
    pendingReturnRequests: 0,
    openServiceRecords: 0,
    totalServiceCost: 0,
  };

  const recentAssignments = data?.recentAssignments ?? [];
  const recentServiceRecords = data?.recentServiceRecords ?? [];
  const recentAuditLogs = data?.recentAuditLogs ?? [];

  const assetStatusTotal =
    stats.availableAssets +
    stats.assignedAssets +
    stats.inRepairAssets +
    stats.returnRequestedAssets +
    stats.retiredAssets;

  const getAssetName = (assetId: string) => {
    return assetMap.get(assetId)?.name ?? "Unknown asset";
  };

  const getAssetTag = (assetId: string) => {
    return assetMap.get(assetId)?.assetTag ?? "Unknown";
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employeeMap.get(employeeId);

    if (!employee) {
      return "Unknown employee";
    }

    if (employee.name) {
      return employee.name;
    }

    if (employee.firstName || employee.lastName) {
      return `${employee.firstName ?? ""} ${employee.lastName ?? ""}`.trim();
    }

    return employee.employeeCode ?? "Employee";
  };

  if (isLoading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex min-h-[70vh] items-center justify-center bg-[#080b12]">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
              <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">
                Loading command center
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Gathering organizational data...
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard">
        <div className="flex min-h-[70vh] items-center justify-center bg-[#080b12]">
          <div className="max-w-md rounded-3xl border border-red-500/20 bg-[#0d111a] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-white">
              Dashboard unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div className="min-h-screen bg-[#080b12] text-white">
        <div className="flex flex-col gap-7">
          {/* Admin Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-violet-500/15 bg-gradient-to-br from-[#171126] via-[#0e101a] to-[#080b12] px-6 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-8 sm:py-10">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-amber-500/5 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  Admin control center
                </div>

                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Good to see you,{" "}
                  <span className="text-violet-300">Administrator.</span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
                  Monitor your organization&apos;s assets, people, services,
                  assignments, and lifecycle activity from one place.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
                <Clock3 className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-amber-400/70">
                    System status
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-200">
                    Operational
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-400">
                  Operations
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Quick actions
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Link
                href="/assets"
                className="group flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-[#0d111a] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-[#111622]"
              >
                <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    View assets
                  </p>
                  <p className="text-xs text-slate-500">Manage inventory</p>
                </div>
              </Link>

              <Link
                href="/assignments"
                className="group flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-[#0d111a] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-[#111622]"
              >
                <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400">
                  <ClipboardList className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Assign asset
                  </p>
                  <p className="text-xs text-slate-500">Manage custody</p>
                </div>
              </Link>

              <Link
                href="/services"
                className="group flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-[#0d111a] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-[#111622]"
              >
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Create service
                  </p>
                  <p className="text-xs text-slate-500">Track maintenance</p>
                </div>
              </Link>

              <Link
                href="/return-requests"
                className="group flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-[#0d111a] px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-[#111622]"
              >
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                  <RotateCcw className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Return requests
                  </p>
                  <p className="text-xs text-slate-500">Review requests</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Main Statistics */}
          <section>
            <div className="mb-3">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                Asset intelligence
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Current inventory
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total assets"
                value={stats.totalAssets}
                icon={Package}
                href="/assets"
                accent="violet"
              />

              <StatCard
                title="Assigned assets"
                value={stats.assignedAssets}
                icon={ClipboardList}
                href="/assignments"
                accent="violet"
              />

              <StatCard
                title="Available assets"
                value={stats.availableAssets}
                icon={CheckCircle2}
                href="/assets"
                accent="emerald"
              />

              <StatCard
                title="Assets in repair"
                value={stats.inRepairAssets}
                icon={Wrench}
                href="/services"
                accent="orange"
              />
            </div>
          </section>

          {/* Secondary Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active employees"
              value={stats.activeEmployees}
              icon={Users}
              href="/employees"
              accent="violet"
            />

            <StatCard
              title="Pending returns"
              value={stats.pendingReturnRequests}
              icon={RotateCcw}
              href="/return-requests"
              accent="amber"
            />

            <StatCard
              title="Open services"
              value={stats.openServiceRecords}
              icon={Wrench}
              href="/services"
              accent="orange"
            />

            <StatCard
              title="Service cost"
              value={formatCost(stats.totalServiceCost)}
              icon={Clock3}
              href="/services"
              accent="amber"
            />
          </div>

          {/* Asset Status Overview */}
          <Card className="border-slate-800/80 bg-[#0d111a] shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-base font-semibold text-white">
                      Asset status overview
                    </CardTitle>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Current distribution across the complete asset inventory.
                  </p>
                </div>

                <Link
                  href="/assets"
                  className="hidden items-center text-sm font-medium text-slate-500 transition-colors hover:text-violet-300 sm:inline-flex"
                >
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {assetStatusTotal === 0 ? (
                <p className="text-sm text-slate-500">No assets available.</p>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="flex h-full">
                      {stats.availableAssets > 0 && (
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${
                              (stats.availableAssets / assetStatusTotal) * 100
                            }%`,
                          }}
                        />
                      )}

                      {stats.assignedAssets > 0 && (
                        <div
                          className="h-full bg-violet-500"
                          style={{
                            width: `${
                              (stats.assignedAssets / assetStatusTotal) * 100
                            }%`,
                          }}
                        />
                      )}

                      {stats.inRepairAssets > 0 && (
                        <div
                          className="h-full bg-orange-500"
                          style={{
                            width: `${
                              (stats.inRepairAssets / assetStatusTotal) * 100
                            }%`,
                          }}
                        />
                      )}

                      {stats.returnRequestedAssets > 0 && (
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${
                              (stats.returnRequestedAssets /
                                assetStatusTotal) *
                              100
                            }%`,
                          }}
                        />
                      )}

                      {stats.retiredAssets > 0 && (
                        <div
                          className="h-full bg-slate-500"
                          style={{
                            width: `${
                              (stats.retiredAssets / assetStatusTotal) * 100
                            }%`,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="text-xs text-slate-500">Available</p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {stats.availableAssets}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-500" />
                        <p className="text-xs text-slate-500">Assigned</p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {stats.assignedAssets}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        <p className="text-xs text-slate-500">In repair</p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {stats.inRepairAssets}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <p className="text-xs text-slate-500">
                          Return requested
                        </p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {stats.returnRequestedAssets}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                        <p className="text-xs text-slate-500">Retired</p>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">
                        {stats.retiredAssets}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments + Services */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-slate-800/80 bg-[#0d111a] shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      Recent assignments
                    </CardTitle>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest asset custody changes.
                    </p>
                  </div>

                  <Link
                    href="/assignments"
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-violet-300"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>

              <CardContent>
                {recentAssignments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No recent assignments to show.
                  </p>
                ) : (
                  <div className="flex flex-col">
                    {recentAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between gap-4 border-b border-slate-800/70 py-4 last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {getAssetName(assignment.assetId)}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {getAssetTag(assignment.assetId)} •{" "}
                            {getEmployeeName(assignment.employeeId)}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-slate-600">
                          {formatDate(assignment.assignedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800/80 bg-[#0d111a] shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-white">
                      Recent services
                    </CardTitle>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest maintenance activity.
                    </p>
                  </div>

                  <Link
                    href="/services"
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-violet-300"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>

              <CardContent>
                {recentServiceRecords.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No recent service records to show.
                  </p>
                ) : (
                  <div className="flex flex-col">
                    {recentServiceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between gap-4 border-b border-slate-800/70 py-4 last:border-b-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {record.issue}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {getAssetTag(record.assetId)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge
                            className={`border ${getStatusClasses(
                              record.status
                            )}`}
                          >
                            {formatStatus(record.status)}
                          </Badge>

                          <span className="text-xs text-slate-600">
                            {formatDate(record.openedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-slate-800/80 bg-[#0d111a] shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                      <History className="h-4 w-4" />
                    </div>

                    <CardTitle className="text-base font-semibold text-white">
                      Recent activity
                    </CardTitle>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Latest asset lifecycle events recorded in Assquere.
                  </p>
                </div>

                <Link
                  href="/audit-trail"
                  className="hidden items-center text-sm font-medium text-slate-500 transition-colors hover:text-amber-300 sm:inline-flex"
                >
                  Audit trail
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {recentAuditLogs.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No recent activity to show.
                </p>
              ) : (
                <div className="flex flex-col">
                  {recentAuditLogs.map((log) => (
                    <Link
                      key={log.id}
                      href={`/assets/${log.assetId}`}
                      className="group flex items-center justify-between gap-4 border-b border-slate-800/70 py-4 transition-colors last:border-b-0 hover:bg-violet-500/[0.03]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 transition-colors group-hover:border-violet-500/20 group-hover:bg-violet-500/10">
                          <History className="h-4 w-4 text-slate-500 group-hover:text-violet-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-200">
                            {formatAction(log.action)}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {getAssetTag(log.assetId)} • {log.actor}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {log.oldStatus && log.newStatus ? (
                          <span className="text-xs text-slate-500">
                            {formatStatus(log.oldStatus)} →{" "}
                            {formatStatus(log.newStatus)}
                          </span>
                        ) : null}

                        <span className="text-xs text-slate-600">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}