"use client";

import EmployeePortalHeader from "@/components/employee/employee-portal-header";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Laptop,
  Loader2,
  Package,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Assignment = {
  id: string;
  assignedAt: string;
  returnedAt?: string | null;
  assignedCondition: string;
  returnedCondition?: string | null;
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

function statusClass(returnedAt?: string | null) {
  return returnedAt
    ? "border-slate-700 bg-slate-800/70 text-slate-400"
    : "border-blue-400/20 bg-blue-500/10 text-blue-300";
}

export default function EmployeeAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      try {
        const response = await fetch("/api/employee/assignments");

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load your assignment history.",
          );
        }

        const data = await response.json();
        setAssignments(data.assignments ?? []);
      } catch (err) {
        console.error("Employee assignments page error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your assignment history.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAssignments();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#080b12]">
        <EmployeePortalHeader />

        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>

            <p className="text-sm">
              Loading assignment history...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const activeAssignments = assignments.filter(
    (assignment) => !assignment.returnedAt,
  ).length;

  const returnedAssignments = assignments.filter(
    (assignment) => Boolean(assignment.returnedAt),
  ).length;

  return (
    <main className="min-h-screen bg-[#080b12]">
      <EmployeePortalHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <button
          type="button"
          onClick={() =>
            (window.location.href = "/employee/dashboard")
          }
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:border-blue-400/20 hover:bg-blue-500/5 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </button>

        {/* Page heading */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#101a2b] via-[#0c121e] to-[#080b12] px-6 py-8 shadow-[0_20px_70px_rgba(0,0,0,0.3)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-400/80">
              <ShieldCheck className="h-4 w-4" />
              Employee workspace
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Assignment History
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Review the assets that have been assigned to you and
              your previous assignment history.
            </p>
          </div>
        </section>

        {/* KPI cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
              Total assignments
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">
              {assignments.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Complete assignment history
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                Currently assigned
              </p>

              <Clock3 className="h-4 w-4 text-blue-400/70" />
            </div>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-300">
              {activeAssignments}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Assets currently in your custody
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                Returned
              </p>

              <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
            </div>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">
              {returnedAssignments}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Previous completed assignments
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mt-6">
          {error ? (
            <div className="rounded-3xl border border-red-500/20 bg-[#10151f] p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
                <Package className="h-6 w-6 text-red-400" />
              </div>

              <p className="mx-auto mt-4 max-w-md text-sm font-medium leading-6 text-red-300">
                {error}
              </p>

              <Button
                className="mt-5"
                onClick={() => window.location.reload()}
              >
                Try again
              </Button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-3xl border border-slate-800/80 bg-[#10151f] px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
                <Package className="h-7 w-7 text-slate-600" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-100">
                No assignment history
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your asset assignment history will appear here
                when an asset is assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const isReturned = Boolean(
                  assignment.returnedAt,
                );

                return (
                  <article
                    key={assignment.id}
                    className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151f] shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition duration-200 hover:border-slate-700"
                  >
                    {/* Assignment header */}
                    <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10">
                          <Laptop className="h-5 w-5 text-blue-300" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold text-slate-100">
                              {assignment.asset.name}
                            </h2>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                                assignment.returnedAt,
                              )}`}
                            >
                              {isReturned
                                ? "Returned"
                                : "Currently assigned"}
                            </span>
                          </div>

                          <p className="mt-1 font-mono text-xs text-slate-600">
                            {assignment.asset.assetTag}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            {formatLabel(
                              assignment.asset.category,
                            )}

                            <span className="mx-2 text-slate-700">
                              •
                            </span>

                            {assignment.asset.manufacturer ||
                              "Manufacturer not specified"}

                            {assignment.asset.model && (
                              <>
                                <span className="mx-2 text-slate-700">
                                  •
                                </span>

                                {assignment.asset.model}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 lg:text-right">
                        <div className="flex items-center gap-2 lg:justify-end">
                          {isReturned ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Clock3 className="h-4 w-4 text-blue-400" />
                          )}

                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            {isReturned ? "Returned" : "Assigned"}
                          </p>
                        </div>

                        <p className="mt-1 text-sm font-medium text-slate-300">
                          {isReturned
                            ? formatDate(assignment.returnedAt!)
                            : formatDate(assignment.assignedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Assignment details */}
                    <div className="border-t border-slate-800/80 px-6 py-5">
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Assigned condition
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-300">
                            {formatLabel(
                              assignment.assignedCondition,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Returned condition
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-300">
                            {assignment.returnedCondition
                              ? formatLabel(
                                  assignment.returnedCondition,
                                )
                              : "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Assigned date
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-300">
                            {formatDate(assignment.assignedAt)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Return date
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-300">
                            {assignment.returnedAt
                              ? formatDate(
                                  assignment.returnedAt,
                                )
                              : "Not returned"}
                          </p>
                        </div>
                      </div>

                      {(assignment.asset.manufacturer ||
                        assignment.asset.model ||
                        assignment.asset.serialNumber ||
                        assignment.notes) && (
                        <div className="mt-6 grid gap-5 border-t border-slate-800/80 pt-5 sm:grid-cols-2">
                          {(assignment.asset.manufacturer ||
                            assignment.asset.model) && (
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                                Asset details
                              </p>

                              <p className="mt-2 text-sm text-slate-400">
                                {[
                                  assignment.asset.manufacturer,
                                  assignment.asset.model,
                                ]
                                  .filter(Boolean)
                                  .join(" • ")}
                              </p>
                            </div>
                          )}

                          {assignment.asset.serialNumber && (
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                                Serial number
                              </p>

                              <p className="mt-2 break-all font-mono text-sm text-slate-400">
                                {assignment.asset.serialNumber}
                              </p>
                            </div>
                          )}

                          {assignment.notes && (
                            <div className="sm:col-span-2">
                              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                                Notes
                              </p>

                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {assignment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}