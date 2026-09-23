"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Laptop,
  Loader2,
  Package,
  ShieldCheck,
} from "lucide-react";

import EmployeePortalHeader from "@/components/employee/employee-portal-header";
import { Button } from "@/components/ui/button";

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
    case "ASSIGNED":
      return "border-blue-400/20 bg-blue-500/10 text-blue-300";
    case "IN_REPAIR":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
    case "RETURN_REQUESTED":
      return "border-orange-400/20 bg-orange-500/10 text-orange-300";
    default:
      return "border-slate-700 bg-slate-800/70 text-slate-400";
  }
}

export default function EmployeeAssets() {
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAssets() {
      try {
        const response = await fetch("/api/employee/assets");

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your assigned assets.");
        }

        const data = await response.json();
        setAssets(data.assets ?? []);
      } catch (err) {
        console.error("Employee assets page error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your assigned assets.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAssets();
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
            <p className="text-sm">Loading your assets...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b12]">
      <EmployeePortalHeader />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page heading */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0d1422] via-[#0a0f19] to-[#080b12] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.25)] sm:px-8">
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Employee workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              My Assets
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              View and manage the assets currently assigned to your employee
              account.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
              <Package className="h-3.5 w-3.5" />
              {assets.length} {assets.length === 1 ? "asset" : "assets"} assigned
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-[#10151f] p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
              <Package className="h-5 w-5 text-red-400" />
            </div>

            <p className="mt-4 font-medium text-red-300">{error}</p>

            <Button
              className="mt-5"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-[#10151f] px-6 py-20 text-center shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
              <Package className="h-7 w-7 text-slate-600" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-100">
              No assets assigned
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              You currently do not have any assets assigned to your employee
              account.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((item) => (
              <Link
                key={item.assignmentId}
                href={`/employee/assets/${item.asset.id}`}
                className="group block"
              >
                <article className="relative h-full overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151f] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-blue-400/20 group-hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/5 blur-2xl transition-opacity group-hover:bg-blue-500/10" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.08)]">
                      <Laptop className="h-5 w-5 text-blue-300" />
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                        item.asset.status,
                      )}`}
                    >
                      {formatLabel(item.asset.status)}
                    </span>
                  </div>

                  <div className="relative mt-6">
                    <h2 className="font-semibold tracking-tight text-slate-100 transition-colors group-hover:text-white">
                      {item.asset.name}
                    </h2>

                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {item.asset.assetTag}
                    </p>
                  </div>

                  <div className="relative mt-6 space-y-3 border-t border-slate-800/80 pt-5">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Category</span>
                      <span className="text-right font-medium text-slate-300">
                        {formatLabel(item.asset.category)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Condition</span>
                      <span className="text-right font-medium text-slate-300">
                        {formatLabel(item.asset.condition)}
                      </span>
                    </div>

                    {item.asset.manufacturer && (
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-slate-500">Manufacturer</span>
                        <span className="text-right font-medium text-slate-300">
                          {item.asset.manufacturer}
                        </span>
                      </div>
                    )}

                    {item.asset.model && (
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-slate-500">Model</span>
                        <span className="text-right font-medium text-slate-300">
                          {item.asset.model}
                        </span>
                      </div>
                    )}

                    {item.asset.serialNumber && (
                      <div className="flex justify-between gap-4 text-sm">
                        <span className="text-slate-500">Serial number</span>
                        <span className="break-all text-right font-mono text-xs font-medium text-slate-400">
                          {item.asset.serialNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Assigned</span>
                      <span className="text-right font-medium text-slate-300">
                        {formatDate(item.assignedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4 text-sm font-medium text-slate-500 transition-colors group-hover:text-blue-300">
                    <span>View asset details</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 transition-all group-hover:border-blue-400/20 group-hover:bg-blue-500/10">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}