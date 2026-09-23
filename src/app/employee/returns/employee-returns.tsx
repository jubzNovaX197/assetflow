"use client";

import EmployeePortalHeader from "@/components/employee/employee-portal-header";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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
    assetType: string;
    category: string;
    manufacturer?: string | null;
    model?: string | null;
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

function statusConfig(status: string) {
  switch (status) {
    case "PENDING":
      return {
        className:
          "border-amber-400/20 bg-amber-500/10 text-amber-300",
        icon: Clock3,
      };

    case "APPROVED":
      return {
        className:
          "border-blue-400/20 bg-blue-500/10 text-blue-300",
        icon: CheckCircle2,
      };

    case "COMPLETED":
      return {
        className:
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
        icon: CheckCircle2,
      };

    case "REJECTED":
      return {
        className:
          "border-red-400/20 bg-red-500/10 text-red-300",
        icon: XCircle,
      };

    default:
      return {
        className:
          "border-slate-700 bg-slate-800/70 text-slate-400",
        icon: AlertCircle,
      };
  }
}

export default function EmployeeReturns() {
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const response = await fetch(
          "/api/employee/return-requests",
        );

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Unable to load your return requests.",
          );
        }

        const data = await response.json();

        setRequests(data.returnRequests ?? []);
      } catch (err) {
        console.error("Employee returns page error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your return requests.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadRequests();
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
              Loading return requests...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const pendingCount = requests.filter(
    (request) => request.status === "PENDING",
  ).length;

  const approvedCount = requests.filter(
    (request) => request.status === "APPROVED",
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "COMPLETED",
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
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-400/80">
              <ShieldCheck className="h-4 w-4" />
              Employee workspace
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Return Requests
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Track the status and processing history of your asset
              return requests.
            </p>
          </div>
        </section>

        {/* KPI cards */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
              Total requests
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">
              {requests.length}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              All submitted requests
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                Pending
              </p>

              <Clock3 className="h-4 w-4 text-amber-400/70" />
            </div>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-amber-300">
              {pendingCount}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Awaiting processing
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                Approved
              </p>

              <CheckCircle2 className="h-4 w-4 text-blue-400/70" />
            </div>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-blue-300">
              {approvedCount}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Approved by administrator
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
                Completed
              </p>

              <CheckCircle2 className="h-4 w-4 text-emerald-400/70" />
            </div>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">
              {completedCount}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Return process completed
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="mt-6">
          {error ? (
            <div className="rounded-3xl border border-red-500/20 bg-[#10151f] p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
                <AlertCircle className="h-6 w-6 text-red-400" />
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
          ) : requests.length === 0 ? (
            <div className="rounded-3xl border border-slate-800/80 bg-[#10151f] px-6 py-16 text-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
                <Package className="h-7 w-7 text-slate-600" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-100">
                No return requests
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You have not submitted any asset return requests yet.
              </p>

              <Button
                variant="outline"
                className="mt-6 border-slate-700 bg-slate-900/60 text-slate-300 hover:border-blue-400/30 hover:bg-blue-500/5 hover:text-blue-300"
                onClick={() =>
                  (window.location.href = "/employee/assets")
                }
              >
                View my assets
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const config = statusConfig(request.status);
                const StatusIcon = config.icon;

                return (
                  <article
                    key={request.id}
                    className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151f] shadow-[0_12px_40px_rgba(0,0,0,0.22)] transition duration-200 hover:border-slate-700"
                  >
                    {/* Request header */}
                    <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10">
                            <Package className="h-4 w-4 text-blue-300" />
                          </div>

                          <div>
                            <h2 className="font-semibold text-slate-100">
                              {request.asset.name}
                            </h2>

                            <p className="mt-1 font-mono text-xs text-slate-600">
                              {request.asset.assetTag}
                            </p>
                          </div>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {formatLabel(request.status)}
                          </span>
                        </div>

                        <p className="mt-4 text-xs text-slate-500">
                          {formatLabel(request.asset.category)}
                          <span className="mx-2 text-slate-700">
                            •
                          </span>
                          {request.asset.manufacturer ||
                            "Manufacturer not specified"}
                          {request.asset.model && (
                            <>
                              <span className="mx-2 text-slate-700">
                                •
                              </span>
                              {request.asset.model}
                            </>
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 lg:text-right">
                        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                          Requested
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-300">
                          {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Request details */}
                    <div className="border-t border-slate-800/80 px-6 py-5">
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Reason
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {request.reason}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Request date
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-300">
                            {formatDate(request.requestedAt)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Processed
                          </p>

                          <p className="mt-2 text-sm font-medium text-slate-300">
                            {request.processedAt
                              ? formatDate(request.processedAt)
                              : "Not processed"}
                          </p>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-6 border-t border-slate-800/80 pt-5">
                          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                            Administrator notes
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {request.notes}
                          </p>
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