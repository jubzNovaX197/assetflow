"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Laptop,
  Loader2,
  Package,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";

import { getSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

type AssetDetails = {
  id: string;
  assetTag: string;
  name: string;
  assetType: string;
  category: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  description?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | number | null;
  warrantyExpiry?: string | null;
  licenseKey?: string | null;
  licenseExpiry?: string | null;
  condition: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type AssignmentDetails = {
  id: string;
  assignedAt: string;
  assignedCondition: string;
  returnedAt?: string | null;
  returnedCondition?: string | null;
  notes?: string | null;
};

type AssetDetailsResponse = {
  asset: AssetDetails;
  assignment: AssignmentDetails;
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

export default function EmployeeAssetDetails({
  assetId,
}: {
  assetId: string;
}) {
  const [data, setData] =
    useState<AssetDetailsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] =
    useState(false);
  const [returnSuccess, setReturnSuccess] = useState("");

  useEffect(() => {
    async function loadAssetDetails() {
      try {
        const response = await fetch(
          `/api/employee/assets/${assetId}`,
        );

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          setError(
            "This asset is not currently assigned to your account.",
          );
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load asset details.");
        }

        const result =
          (await response.json()) as AssetDetailsResponse;

        setData(result);
      } catch (err) {
        console.error(
          "Employee asset details page error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load asset details.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAssetDetails();
  }, [assetId]);

  async function handleSignOut() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  async function handleReturnRequest() {
    if (!data || isSubmittingReturn) {
      return;
    }

    setIsSubmittingReturn(true);
    setReturnSuccess("");
    setError("");

    try {
      const session = await getSession();

      if (!session?.user?.employeeId) {
        throw new Error(
          "Your employee session could not be verified.",
        );
      }

      const response = await fetch("/api/return-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: data.asset.id,
          employeeId: session.user.employeeId,
          reason:
            returnReason.trim() ||
            "Employee requested asset return.",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Unable to submit return request.",
        );
      }

      setReturnSuccess(
        "Your return request has been submitted successfully.",
      );

      setShowReturnPanel(false);
      setReturnReason("");

      setData((current) =>
        current
          ? {
              ...current,
              asset: {
                ...current.asset,
                status: "RETURN_REQUESTED",
              },
            }
          : current,
      );
    } catch (err) {
      console.error(
        "Employee return request error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit return request.",
      );
    } finally {
      setIsSubmittingReturn(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#080b12]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
              <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
            </div>
            <p className="text-sm">Loading asset details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#080b12]">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/employee/assets"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to my assets
          </Link>

          <div className="mt-8 rounded-3xl border border-slate-800/80 bg-[#10151f] p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
              <Package className="h-7 w-7 text-slate-600" />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-100">
              Unable to load asset
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error || "The requested asset could not be found."}
            </p>

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

  const { asset, assignment } = data;
  const returnRequested = asset.status === "RETURN_REQUESTED";

  return (
    <main className="min-h-screen bg-[#080b12]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Top navigation */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/employee/assets"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:border-blue-400/20 hover:bg-blue-500/5 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            My Assets
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-300"
          >
            Sign out
          </button>
        </div>

        {/* Asset hero */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#101a2b] via-[#0c121e] to-[#080b12] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
                <Laptop className="h-7 w-7 text-blue-300" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {asset.name}
                  </h1>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusClass(
                      asset.status,
                    )}`}
                  >
                    {formatLabel(asset.status)}
                  </span>
                </div>

                <p className="mt-2 font-mono text-xs text-slate-500">
                  {asset.assetTag}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Assigned to your account
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts */}
        {returnSuccess && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Return request submitted
              </p>

              <p className="mt-1 text-sm text-emerald-400/70">
                {returnSuccess}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-300">
              {error}
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Asset information */}
          <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151f] shadow-[0_12px_40px_rgba(0,0,0,0.22)] lg:col-span-2">
            <div className="border-b border-slate-800/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <Package className="h-4 w-4 text-blue-300" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-100">
                    Asset information
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Hardware and lifecycle information
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-7 p-6 sm:grid-cols-2">
              {[
                ["Category", formatLabel(asset.category)],
                ["Asset type", formatLabel(asset.assetType)],
                ["Manufacturer", asset.manufacturer || "—"],
                ["Model", asset.model || "—"],
                ["Serial number", asset.serialNumber || "—"],
                ["Current condition", formatLabel(asset.condition)],
                ["Purchase date", formatDate(asset.purchaseDate)],
                ["Warranty expiry", formatDate(asset.warrantyExpiry)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                    {label}
                  </p>
                  <p className="mt-1.5 break-all text-sm font-medium text-slate-300">
                    {value}
                  </p>
                </div>
              ))}

              {asset.description && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                    Description
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {asset.description}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Right column */}
          <div className="space-y-6">
            {/* Assignment */}
            <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151f] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <div className="border-b border-slate-800/80 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                    <ClipboardList className="h-4 w-4 text-indigo-300" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-slate-100">
                      Assignment
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Current custody information
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />

                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                    Assigned on
                  </p>

                  <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <CalendarDays className="h-4 w-4 text-slate-600" />
                    {formatDate(assignment.assignedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                    Condition at assignment
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-slate-300">
                    {formatLabel(assignment.assignedCondition)}
                  </p>
                </div>

                {assignment.notes && (
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                      Assignment notes
                    </p>

                    <p className="mt-1.5 text-sm leading-6 text-slate-400">
                      {assignment.notes}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Return */}
            <section className="rounded-2xl border border-slate-800/80 bg-[#10151f] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-400/15 bg-orange-500/10">
                  <RotateCcw className="h-4 w-4 text-orange-300" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-100">
                    Return this asset
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Request that this asset be returned to the administrator.
                  </p>
                </div>
              </div>

              {returnRequested ? (
                <div className="mt-5 rounded-xl border border-orange-400/20 bg-orange-500/5 p-4">
                  <p className="text-sm font-semibold text-orange-300">
                    Return request pending
                  </p>

                  <p className="mt-1 text-sm leading-5 text-orange-400/70">
                    Your request has been submitted and is waiting for
                    administrator processing.
                  </p>
                </div>
              ) : showReturnPanel ? (
                <div className="mt-5">
                  <label
                    htmlFor="return-reason"
                    className="text-sm font-medium text-slate-300"
                  >
                    Reason
                  </label>

                  <textarea
                    id="return-reason"
                    value={returnReason}
                    onChange={(event) =>
                      setReturnReason(event.target.value)
                    }
                    placeholder="Why are you returning this asset?"
                    rows={4}
                    className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/10"
                  />

                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowReturnPanel(false);
                        setReturnReason("");
                      }}
                      disabled={isSubmittingReturn}
                      className="gap-2 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      onClick={handleReturnRequest}
                      disabled={isSubmittingReturn}
                      className="gap-2"
                    >
                      {isSubmittingReturn ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}

                      {isSubmittingReturn
                        ? "Submitting..."
                        : "Confirm return request"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 w-full gap-2 border-slate-700 bg-slate-900/60 text-slate-300 hover:border-blue-400/30 hover:bg-blue-500/5 hover:text-blue-300"
                  onClick={() => setShowReturnPanel(true)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Request return
                </Button>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}