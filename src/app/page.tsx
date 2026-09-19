"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Package,
  ClipboardList,
  CheckCircle2,
  Wrench,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Employee {
  id: string;
  isActive: boolean;
}

interface Asset {
  id: string;
  status: "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETURN_REQUESTED" | "RETIRED";
  name: string;
  assetTag: string;
  updatedAt: string;
}

interface Assignment {
  id: string;
  assignedAt: string;
  returnedAt: string | null;
}

interface ReturnRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedAt: string;
}

interface ServiceRecord {
  id: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  issue: string;
  openedAt: string;
}

interface DashboardStats {
  totalEmployees: number;
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  inRepairAssets: number;
  pendingReturnRequests: number;
  openServiceRecords: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentAssignments: Assignment[];
  recentServiceRecords: ServiceRecord[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return res.json() as Promise<T>;
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
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
        const [employees, assets, assignments, returnRequests, serviceRecords] =
          await Promise.all([
            fetchJson<Employee[]>("/api/employees"),
            fetchJson<Asset[]>("/api/assets"),
            fetchJson<Assignment[]>("/api/assignments"),
            fetchJson<ReturnRequest[]>("/api/return-requests"),
            fetchJson<ServiceRecord[]>("/api/service-records"),
          ]);

        if (!isMounted) return;

        const stats: DashboardStats = {
          totalEmployees: employees.length,
          totalAssets: assets.length,
          assignedAssets: assets.filter((a) => a.status === "ASSIGNED").length,
          availableAssets: assets.filter((a) => a.status === "AVAILABLE").length,
          inRepairAssets: assets.filter((a) => a.status === "IN_REPAIR").length,
          pendingReturnRequests: returnRequests.filter(
            (r) => r.status === "PENDING"
          ).length,
          openServiceRecords: serviceRecords.filter(
            (s) => s.status === "OPEN" || s.status === "IN_PROGRESS"
          ).length,
        };

        const recentAssignments = [...assignments]
          .sort(
            (a, b) =>
              new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
          )
          .slice(0, 5);

        const recentServiceRecords = [...serviceRecords]
          .sort(
            (a, b) =>
              new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
          )
          .slice(0, 5);

        setData({ stats, recentAssignments, recentServiceRecords });
      } catch (err) {
        if (!isMounted) return;
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
          <p className="text-sm font-medium text-foreground">{error}</p>
        </div>
      </AppShell>
    );
  }

  const stats = data?.stats ?? {
    totalEmployees: 0,
    totalAssets: 0,
    assignedAssets: 0,
    availableAssets: 0,
    inRepairAssets: 0,
    pendingReturnRequests: 0,
    openServiceRecords: 0,
  };

  const recentAssignments = data?.recentAssignments ?? [];
  const recentServiceRecords = data?.recentServiceRecords ?? [];

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            An overview of assets, employees, and activity across your
            organization.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            icon={Users}
          />
          <StatCard
            title="Total Assets"
            value={stats.totalAssets}
            icon={Package}
          />
          <StatCard
            title="Assigned Assets"
            value={stats.assignedAssets}
            icon={ClipboardList}
          />
          <StatCard
            title="Available Assets"
            value={stats.availableAssets}
            icon={CheckCircle2}
          />
          <StatCard
            title="Assets In Repair"
            value={stats.inRepairAssets}
            icon={Wrench}
          />
          <StatCard
            title="Pending Return Requests"
            value={stats.pendingReturnRequests}
            icon={RotateCcw}
          />
          <StatCard
            title="Open Service Records"
            value={stats.openServiceRecords}
            icon={AlertCircle}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent assignments to show.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {recentAssignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="text-foreground">
                        Assignment {assignment.id.slice(0, 8)}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Recent Service Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentServiceRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent service records to show.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {recentServiceRecords.map((record) => (
                    <li
                      key={record.id}
                      className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="truncate text-foreground">
                        {record.issue}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {new Date(record.openedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}