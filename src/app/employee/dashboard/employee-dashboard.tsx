"use client";

import Link from "next/link";
import EmployeePortalHeader from "@/components/employee/employee-portal-header";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Laptop,
  Loader2,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation?: string | null;
  phone?: string | null;
  isActive: boolean;
};

type EmployeeAsset = {
  assignmentId: string;
  assignedAt: string;
  assignedCondition: string;
  notes?: string | null;
  asset: {
    id: string;
    assetTag: string;
    name: string;
    assetType: string;
    category: string;
    manufacturer?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    condition: string;
    status: string;
    warrantyExpiry?: string | null;
  };
};

type ReturnRequest = {
  id: string;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt?: string | null;
  notes?: string | null;
  asset: {
    id: string;
    assetTag: string;
    name: string;
    category: string;
    status: string;
    condition: string;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "ASSIGNED":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "IN_REPAIR":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "RETURN_REQUESTED":
      return "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200";
    case "RETIRED":
      return "bg-slate-800/70 text-slate-500 ring-1 ring-inset ring-slate-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "APPROVED":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";
    default:
      return "bg-slate-800/70 text-slate-500 ring-1 ring-inset ring-slate-200";
  }
}

export default function EmployeeDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        setError("");

        const [employeeResponse, assetsResponse, returnsResponse] =
          await Promise.all([
            fetch("/api/employee/me"),
            fetch("/api/employee/assets"),
            fetch("/api/employee/return-requests"),
          ]);

        if (
          employeeResponse.status === 401 ||
          employeeResponse.status === 403 ||
          assetsResponse.status === 401 ||
          assetsResponse.status === 403
        ) {
          window.location.href = "/login";
          return;
        }

        if (!employeeResponse.ok) {
          throw new Error("Unable to load your employee profile.");
        }

        if (!assetsResponse.ok) {
          throw new Error("Unable to load your assigned assets.");
        }

        if (!returnsResponse.ok) {
          throw new Error("Unable to load your return requests.");
        }

        const employeeData = await employeeResponse.json();
        const assetsData = await assetsResponse.json();
        const returnsData = await returnsResponse.json();

        setEmployee(employeeData.employee);
        setAssets(assetsData.assets ?? []);
        setReturnRequests(returnsData.returnRequests ?? []);
      } catch (err) {
        console.error("Employee dashboard error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleSignOut() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900/60">
        <EmployeePortalHeader />

        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-slate-800/80 bg-[#10151f] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
            <p className="text-sm">Loading your workspace...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900/60">
        <EmployeePortalHeader />

        <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-red-200 bg-[#10151f] p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <ShieldCheck className="h-7 w-7 text-red-600" />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-100">
              Unable to load your workspace
            </h1>

            <p className="mt-2 text-sm text-slate-500">{error}</p>

            <Button
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const pendingRequests = returnRequests.filter(
    (request) => request.status === "PENDING",
  ).length;

  const approvedRequests = returnRequests.filter(
    (request) => request.status === "APPROVED",
  ).length;

  const completedRequests = returnRequests.filter(
    (request) => request.status === "COMPLETED",
  ).length;

  return (
    <main className="min-h-screen bg-[#080b12]">
      <EmployeePortalHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Welcome hero */}
<section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0d1422] via-[#0a0f19] to-[#080b12] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:px-8 sm:py-10">
  <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

  <div className="relative z-10 max-w-3xl">
    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
      Employee workspace
    </div>

    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
      Welcome back, {employee?.name?.split(" ")[0] || "there"}
    </h1>

    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
      Manage your assigned assets, track return requests, and keep your
      employee information up to date.
    </p>

    <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
        <UserRound className="h-4 w-4" />
      </div>

      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Employee ID
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-200">
          {employee?.employeeCode || "Ã¢â‚¬â€"}
        </p>
      </div>
    </div>
  </div>
</section>

        {/* KPI cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group rounded-2xl border-slate-800/80 bg-[#10151f] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Assigned assets
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {assets.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-105">
                <Laptop className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Currently under your custody
            </p>
          </div>

          <div className="group rounded-2xl border-slate-800/80 bg-[#10151f] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Return requests
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {returnRequests.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {pendingRequests} pending
            </p>
          </div>

          <div className="group rounded-2xl border-slate-800/80 bg-[#10151f] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Approved returns
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                  {approvedRequests}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Awaiting completion
            </p>
          </div>

          <div className="group rounded-2xl border-slate-800/80 bg-[#10151f] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Account status
                </p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {employee?.isActive ? "Active" : "Inactive"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Assquere account access
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          {/* Assets */}
          <section className="overflow-hidden rounded-2xl border-slate-800/80 bg-[#10151f] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="font-semibold text-white">
                  My assigned assets
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Assets currently under your custody
                </p>
              </div>

              <Link
                href="/employee/assets"
                className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white sm:flex"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {assets.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/70">
                  <Package className="h-6 w-6 text-slate-500" />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-100">
                  No assets assigned
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                  You currently do not have any assets assigned to your
                  account.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {assets.map((item) => (
                  <Link
                    key={item.assignmentId}
                    href={`/employee/assets/${item.asset.id}`}
                    className="group flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-slate-800/80 bg-slate-900/60 text-slate-500 transition-colors group-hover:bg-[#10151f]">
                        <Laptop className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-medium text-white">
                            {item.asset.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(item.asset.status)}`}
                          >
                            {formatLabel(item.asset.status)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.asset.assetTag} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·{" "}
                          {formatLabel(item.asset.category)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Assigned {formatDate(item.assignedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end">
                      <span className="text-xs font-medium text-slate-500 sm:hidden">
                        View details
                      </span>

                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-slate-800/80 bg-[#10151f] text-slate-300 transition-all group-hover:border-slate-300 group-hover:text-slate-300">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Return activity */}
          <section className="overflow-hidden rounded-2xl border-slate-800/80 bg-[#10151f] shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="font-semibold text-white">
                  Return activity
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Recent return requests
                </p>
              </div>

              <Link
                href="/employee/returns"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-white"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {returnRequests.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-100">
                  No return requests
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Your return activity will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {returnRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="px-6 py-4 transition-colors hover:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {request.asset.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {request.asset.assetTag}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Requested {formatDate(request.requestedAt)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(request.status)}`}
                      >
                        {formatLabel(request.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Profile / access */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border-slate-800/80 bg-[#10151f] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800/70 text-slate-500">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-white">
                      Employee profile
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Your account information
                    </p>
                  </div>

                  <Link
                    href="/employee/profile"
                    className="text-xs font-medium text-slate-500 transition hover:text-white"
                  >
                    View profile
                  </Link>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Employee ID
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-100">
                      {employee?.employeeCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Department
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-100">
                      {employee?.department}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Designation
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-100">
                      {employee?.designation || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Email
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-100">
                      {employee?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-slate-800/80 bg-[#10151f] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-white">
                  Account access
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Your account provides access to information associated with
                  your employee profile and assigned assets. Administrators
                  manage assignments, returns, services, and account access.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-500">
                    Employee access
                  </span>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Account {employee?.isActive ? "active" : "inactive"}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {completedRequests} completed returns
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between border-t pt-5">
          <p className="text-xs text-slate-500">
            Assquere ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Employee workspace
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-medium text-slate-500 transition hover:text-slate-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}