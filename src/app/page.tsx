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

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "AVAILABLE":
    case "COMPLETED":
      return "default";

    case "ASSIGNED":
    case "IN_PROGRESS":
      return "secondary";

    case "IN_REPAIR":
    case "RETURN_REQUESTED":
    case "OPEN":
      return "destructive";

    default:
      return "outline";
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <Card className="transition-colors hover:bg-muted/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>

        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
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
              record.status === "OPEN" ||
              record.status === "IN_PROGRESS"
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

  /*
   * IMPORTANT:
   * These values and hooks are intentionally placed BEFORE
   * the loading/error conditional returns.
   *
   * React requires hooks to be called in the same order
   * on every render.
   */

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
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />

          <p className="text-sm">Loading dashboard data...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Dashboard">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />

          <p className="text-sm font-medium text-foreground">
            {error}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>

          <p className="text-sm text-muted-foreground">
            An overview of assets, employees, services, and activity across
            your organization.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/assets"
            className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Package className="mr-2 h-4 w-4" />
            View Assets
          </Link>

          <Link
            href="/assignments"
            className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Assign Asset
          </Link>

          <Link
            href="/services"
            className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Service
          </Link>

          <Link
            href="/return-requests"
            className="inline-flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Return Requests
          </Link>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Assets"
            value={stats.totalAssets}
            icon={Package}
            href="/assets"
          />

          <StatCard
            title="Assigned Assets"
            value={stats.assignedAssets}
            icon={ClipboardList}
            href="/assignments"
          />

          <StatCard
            title="Available Assets"
            value={stats.availableAssets}
            icon={CheckCircle2}
            href="/assets"
          />

          <StatCard
            title="Assets In Repair"
            value={stats.inRepairAssets}
            icon={Wrench}
            href="/services"
          />
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            icon={Users}
            href="/employees"
          />

          <StatCard
            title="Pending Returns"
            value={stats.pendingReturnRequests}
            icon={RotateCcw}
            href="/return-requests"
          />

          <StatCard
            title="Open Services"
            value={stats.openServiceRecords}
            icon={Wrench}
            href="/services"
          />

          <StatCard
            title="Service Cost"
            value={formatCost(stats.totalServiceCost)}
            icon={Clock3}
            href="/services"
          />
        </div>

        {/* Asset Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Asset Status Overview
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Current distribution of all assets.
                </p>
              </div>

              <Link
                href="/assets"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {assetStatusTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assets available.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
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
                        className="h-full bg-blue-500"
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
                        className="h-full bg-yellow-500"
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
                        className="h-full bg-gray-400"
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
                    <p className="text-xs text-muted-foreground">
                      Available
                    </p>

                    <p className="mt-1 font-semibold">
                      {stats.availableAssets}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Assigned
                    </p>

                    <p className="mt-1 font-semibold">
                      {stats.assignedAssets}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      In Repair
                    </p>

                    <p className="mt-1 font-semibold">
                      {stats.inRepairAssets}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Return Requested
                    </p>

                    <p className="mt-1 font-semibold">
                      {stats.returnRequestedAssets}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Retired
                    </p>

                    <p className="mt-1 font-semibold">
                      {stats.retiredAssets}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments + Recent Services */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Recent Assignments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Recent Assignments
                </CardTitle>

                <Link
                  href="/assignments"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  View all
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {recentAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent assignments to show.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {recentAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {getAssetName(assignment.assetId)}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {getAssetTag(assignment.assetId)} ·{" "}
                          {getEmployeeName(assignment.employeeId)}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(assignment.assignedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Services */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Recent Services
                </CardTitle>

                <Link
                  href="/services"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  View all
                </Link>
              </div>
            </CardHeader>

            <CardContent>
              {recentServiceRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent service records to show.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {recentServiceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {record.issue}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {getAssetTag(record.assetId)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge
                          variant={getStatusBadgeVariant(record.status)}
                        >
                          {formatStatus(record.status)}
                        </Badge>

                        <span className="text-xs text-muted-foreground">
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Recent Activity
                </CardTitle>

                <p className="mt-1 text-sm text-muted-foreground">
                  Latest asset lifecycle events.
                </p>
              </div>

              <Link
                href="/audit-trail"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Audit Trail
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </CardHeader>

          <CardContent>
            {recentAuditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity to show.
              </p>
            ) : (
              <div className="flex flex-col">
                {recentAuditLogs.map((log) => (
                  <Link
                    key={log.id}
                    href={`/assets/${log.assetId}`}
                    className="flex items-center justify-between gap-4 border-b py-3 transition-colors hover:bg-muted/30 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {formatAction(log.action)}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {getAssetTag(log.assetId)} · {log.actor}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {log.oldStatus && log.newStatus ? (
                        <span className="text-xs text-muted-foreground">
                          {formatStatus(log.oldStatus)} →{" "}
                          {formatStatus(log.newStatus)}
                        </span>
                      ) : null}

                      <span className="text-xs text-muted-foreground">
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
    </AppShell>
  );
}