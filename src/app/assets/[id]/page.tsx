"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  assetType: string;
  category: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  condition: string;
  status: string;
  description: string | null;
  purchaseDate: string | null;
  purchasePrice: string | null;
  warrantyExpiry: string | null;
  licenseKey: string | null;
  licenseExpiry: string | null;
  createdAt: string;
  updatedAt: string;
};

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
};

type Assignment = {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  assignedCondition: string;
  returnedAt: string | null;
  returnedCondition: string | null;
  notes: string | null;
};

type ServiceRecord = {
  id: string;
  assetId: string;
  issue: string;
  vendor: string | null;
  cost: string | null;
  status: string;
  openedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  notes: string | null;
};

type ConditionHistory = {
  id: string;
  assetId: string;
  condition: string;
  recordedAt: string;
  recordedBy: string | null;
  notes: string | null;
};

type ReturnRequest = {
  id: string;
  assetId: string;
  employeeId: string;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
};

type AuditLog = {
  id: string;
  assetId: string;
  action: string;
  actor: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  metadata: unknown;
  createdAt: string;
};

type AssetDetailsResponse = {
  status: string;
  asset: Asset;
  currentEmployee: Employee | null;
  currentAssignment: Assignment | null;
  assignments: Assignment[];
  serviceRecords: ServiceRecord[];
  conditionHistory: ConditionHistory[];
  returnRequests: ReturnRequest[];
  auditLogs: AuditLog[];
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatCurrency(value: string | null) {
  if (!value) return "—";

  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function getStatusClass(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

    case "ASSIGNED":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

    case "IN_REPAIR":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";

    case "RETURN_REQUESTED":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

    case "RETIRED":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";

    case "COMPLETED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

    case "OPEN":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

    case "IN_PROGRESS":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";

    case "PENDING":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

    default:
      return "bg-muted text-slate-400";
  }
}

function getEmployeeDisplay(
  employees: Employee[],
  employeeId: string
) {
  const employee = employees.find(
    (item) => item.id === employeeId
  );

  if (!employee) {
    return null;
  }

  return employee;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-[#0d121c] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

export default function AssetDetailsPage() {
  const params = useParams();

  const assetId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [details, setDetails] =
    useState<AssetDetailsResponse | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lifecycleLoading, setLifecycleLoading] =
    useState(false);

  const [lifecycleMessage, setLifecycleMessage] =
    useState<string | null>(null);

  const [lifecycleError, setLifecycleError] =
    useState<string | null>(null);

  async function loadAssetDetails() {
    if (!assetId) {
      setError("Asset ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/assets/details?id=${assetId}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("Asset details response:", data);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to load asset details."
        );
      }

      if (!data?.asset) {
        throw new Error(
          "Invalid asset details response."
        );
      }

      setDetails(data);
    } catch (err) {
      console.error(
        "Failed to load asset details:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load asset details."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    try {
      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load employees.");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error(
        "Failed to load employees:",
        err
      );
    }
  }

  useEffect(() => {
    loadAssetDetails();
  }, [assetId]);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleLifecycleAction(
    action:
      | "SEND_TO_REPAIR"
      | "COMPLETE_REPAIR"
      | "RETIRE"
  ) {
    const lifecycleAssetId = details?.asset?.id;

    if (!lifecycleAssetId) {
      setLifecycleError("Asset ID is missing.");
      return;
    }

    try {
      setLifecycleLoading(true);
      setLifecycleMessage(null);
      setLifecycleError(null);

      const response = await fetch(
        `/api/assets/${encodeURIComponent(
          lifecycleAssetId
        )}/lifecycle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Lifecycle action failed."
        );
      }

      const messages = {
        SEND_TO_REPAIR:
          "Asset sent to repair successfully.",
        COMPLETE_REPAIR:
          "Repair completed successfully.",
        RETIRE:
          "Asset retired successfully.",
      };

      setLifecycleMessage(messages[action]);

      await loadAssetDetails();
    } catch (err) {
      console.error(
        "Lifecycle action failed:",
        err
      );

      setLifecycleError(
        err instanceof Error
          ? err.message
          : "Lifecycle action failed."
      );
    } finally {
      setLifecycleLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-slate-400">
          Loading asset details...
        </p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h1 className="text-lg font-semibold">
            Failed to load asset
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error ||
              "Asset details could not be loaded."}
          </p>

          <Link
            href="/assets"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-violet-400-foreground"
          >
            Back to Assets
          </Link>
        </div>
      </div>
    );
  }

  const {
    asset,
    currentEmployee,
    currentAssignment,
    assignments,
    serviceRecords,
    conditionHistory,
    returnRequests,
    auditLogs,
  } = details;

  const canSendToRepair =
    asset.status === "AVAILABLE" ||
    asset.status === "ASSIGNED";

  const canCompleteRepair =
    asset.status === "IN_REPAIR";

  const canRetire =
    asset.status === "AVAILABLE";

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/assets"
          className="mb-3 inline-block text-sm text-slate-400 hover:text-violet-400"
        >
          ← Back to Assets
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {asset.name}
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Asset Tag: {asset.assetTag}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(
              asset.status
            )}`}
          >
            {asset.status}
          </span>
        </div>
      </div>

      <Section title="Lifecycle Actions">
        <div className="flex flex-wrap gap-3">
          {canSendToRepair && (
            <button
              type="button"
              disabled={lifecycleLoading}
              onClick={() =>
                handleLifecycleAction(
                  "SEND_TO_REPAIR"
                )
              }
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(245,158,11,0.15)] transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lifecycleLoading
                ? "Processing..."
                : "🔧 Send to Repair"}
            </button>
          )}

          {canCompleteRepair && (
            <button
              type="button"
              disabled={lifecycleLoading}
              onClick={() =>
                handleLifecycleAction(
                  "COMPLETE_REPAIR"
                )
              }
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(16,185,129,0.15)] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lifecycleLoading
                ? "Processing..."
                : "✅ Complete Repair"}
            </button>
          )}

          {canRetire && (
            <button
              type="button"
              disabled={lifecycleLoading}
              onClick={() =>
                handleLifecycleAction("RETIRE")
              }
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lifecycleLoading
                ? "Processing..."
                : "♻️ Retire Asset"}
            </button>
          )}

          {!canSendToRepair &&
            !canCompleteRepair &&
            !canRetire && (
              <p className="text-sm text-slate-400">
                No lifecycle actions are available
                for the current asset status.
              </p>
            )}
        </div>

        {lifecycleMessage && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            {lifecycleMessage}
          </div>
        )}

        {lifecycleError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {lifecycleError}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-400">
          Available actions depend on the asset's
          current lifecycle status.
        </p>
      </Section>

      <Section title="Asset Information">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">
              Asset Tag
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.assetTag}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Name
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.name}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Type
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.assetType}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Category
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.category}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Manufacturer
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.manufacturer || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Model
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.model || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Serial Number
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.serialNumber || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Condition
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {asset.condition}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Purchase Date
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {formatDate(asset.purchaseDate)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Purchase Price
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {formatCurrency(asset.purchasePrice)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Warranty Expiry
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {formatDate(asset.warrantyExpiry)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">
              License Expiry
            </p>
            <p className="mt-1 font-medium text-slate-100">
              {formatDate(asset.licenseExpiry)}
            </p>
          </div>
        </div>

        {asset.description && (
          <div className="mt-5 border-t border-slate-800/80 pt-4">
            <p className="text-xs text-slate-400">
              Description
            </p>

            <p className="mt-1 text-sm text-slate-300">
              {asset.description}
            </p>
          </div>
        )}
      </Section>

      <Section title="Current Employee">
        {currentEmployee ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">
                Employee Code
              </p>

              <p className="mt-1 font-medium text-slate-100">
                {currentEmployee.employeeCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Name
              </p>

              <p className="mt-1 font-medium text-slate-100">
                {currentEmployee.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Email
              </p>

              <p className="mt-1 font-medium text-slate-100">
                {currentEmployee.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Department
              </p>

              <p className="mt-1 font-medium text-slate-100">
                {currentEmployee.department}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            This asset is not currently assigned to
            an employee.
          </p>
        )}

        {currentAssignment && (
          <div className="mt-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-slate-400">
                  Assigned At
                </p>

                <p className="mt-1 font-medium text-slate-100">
                  {formatDate(
                    currentAssignment.assignedAt
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Assigned Condition
                </p>

                <p className="mt-1 font-medium text-slate-100">
                  {currentAssignment.assignedCondition}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Notes
                </p>

                <p className="mt-1 font-medium text-slate-100">
                  {currentAssignment.notes || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Assignment History">
        {assignments.length === 0 ? (
          <p className="text-sm text-slate-400">
            No assignment history found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Employee
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Assigned At
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Assigned Condition
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Returned At
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Returned Condition
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Notes
                  </th>
                </tr>
              </thead>

              <tbody>
                {assignments.map((assignment) => {
                  const employee = getEmployeeDisplay(
                    employees,
                    assignment.employeeId
                  );

                  return (
                    <tr
                      key={assignment.id}
                      className="border-b border-slate-800/80 last:border-0"
                    >
                      <td className="px-3 py-3">
                        {employee ? (
                          <Link
                            href={`/employees/${employee.id}`}
                            className="font-medium text-violet-400 hover:underline"
                          >
                            {employee.employeeCode}
                            <span className="text-slate-400">
                              {" "}
                              — {employee.name}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-slate-400">
                            {assignment.employeeId}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDate(
                          assignment.assignedAt
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {assignment.assignedCondition}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDate(
                          assignment.returnedAt
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {assignment.returnedCondition ||
                          "—"}
                      </td>

                      <td className="px-3 py-3">
                        {assignment.notes || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Service History">
        {serviceRecords.length === 0 ? (
          <p className="text-sm text-slate-400">
            No service records found.
          </p>
        ) : (
          <div className="space-y-4">
            {serviceRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium">
                      {record.issue}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Opened:{" "}
                      {formatDate(record.openedAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-400">
                      Vendor
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {record.vendor || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Cost
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatCurrency(record.cost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Resolved At
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {formatDate(record.resolvedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Resolution
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {record.resolution || "—"}
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs text-slate-400">
                      Notes
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      {record.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Condition History">
        {conditionHistory.length === 0 ? (
          <p className="text-sm text-slate-400">
            No condition history found.
          </p>
        ) : (
          <div className="space-y-3">
            {conditionHistory.map((history) => (
              <div
                key={history.id}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-medium">
                      {history.condition}
                    </span>

                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(
                        history.recordedAt
                      )}
                    </p>
                  </div>

                  <span className="text-sm text-slate-400">
                    {history.recordedBy || "—"}
                  </span>
                </div>

                {history.notes && (
                  <p className="mt-3 text-sm">
                    {history.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Return Requests">
        {returnRequests.length === 0 ? (
          <p className="text-sm text-slate-400">
            No return requests found.
          </p>
        ) : (
          <div className="space-y-3">
            {returnRequests.map((request) => {
              const employee = getEmployeeDisplay(
                employees,
                request.employeeId
              );

              return (
                <div
                  key={request.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {request.reason}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Requested:{" "}
                        {formatDate(
                          request.requestedAt
                        )}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Requested by{" "}
                        {employee ? (
                          <Link
                            href={`/employees/${employee.id}`}
                            className="font-medium text-violet-400 hover:underline"
                          >
                            {employee.employeeCode} —{" "}
                            {employee.name}
                          </Link>
                        ) : (
                          request.employeeId
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {request.processedAt && (
                    <p className="mt-3 text-sm text-slate-400">
                      Processed:{" "}
                      {formatDate(
                        request.processedAt
                      )}
                    </p>
                  )}

                  {request.notes && (
                    <p className="mt-2 text-sm">
                      {request.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Audit History">
        {auditLogs.length === 0 ? (
          <p className="text-sm text-slate-400">
            No audit history found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Action
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Actor
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Old Status
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    New Status
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Metadata
                  </th>

                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Created At
                  </th>
                </tr>
              </thead>

              <tbody>
                {auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-800/80 last:border-0"
                  >
                    <td className="px-3 py-3 font-medium">
                      {log.action}
                    </td>

                    <td className="px-3 py-3">
                      {log.actor || "—"}
                    </td>

                    <td className="px-3 py-3">
                      {log.oldStatus || "—"}
                    </td>

                    <td className="px-3 py-3">
                      {log.newStatus || "—"}
                    </td>

                    <td className="max-w-[250px] px-3 py-3">
                      <pre className="whitespace-pre-wrap break-words text-xs text-slate-400">
                        {log.metadata
                          ? JSON.stringify(
                              log.metadata,
                              null,
                              2
                            )
                          : "—"}
                      </pre>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Asset Timeline">
        <div className="space-y-4">
          {[
            ...assignments.map((item) => {
              const employee = getEmployeeDisplay(
                employees,
                item.employeeId
              );

              return {
                date: item.assignedAt,
                title: "Asset Assigned",
                description: employee
                  ? `Assigned to ${employee.employeeCode} — ${employee.name}`
                  : `Assigned to employee ${item.employeeId}`,
              };
            }),

            ...returnRequests.map((item) => {
              const employee = getEmployeeDisplay(
                employees,
                item.employeeId
              );

              return {
                date: item.requestedAt,
                title: "Return Requested",
                description: employee
                  ? `${employee.employeeCode} — ${employee.name}: ${item.reason}`
                  : item.reason,
              };
            }),

            ...serviceRecords.map((item) => ({
              date: item.openedAt,
              title: "Service Record Opened",
              description: item.issue,
            })),

            ...conditionHistory.map((item) => ({
              date: item.recordedAt,
              title: "Condition Updated",
              description: `Condition changed to ${item.condition}`,
            })),

            ...auditLogs.map((item) => ({
              date: item.createdAt,
              title: item.action,
              description: `Performed by ${
                item.actor || "Unknown"
              }`,
            })),
          ]
            .sort(
              (a, b) =>
                new Date(b.date).getTime() -
                new Date(a.date).getTime()
            )
            .map((event, index) => (
              <div
                key={`${event.title}-${event.date}-${index}`}
                className="flex gap-4"
              >
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-primary" />

                <div>
                  <p className="font-medium">
                    {event.title}
                  </p>

                  <p className="text-sm text-slate-400">
                    {event.description}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(event.date)}
                  </p>
                </div>
              </div>
            ))}

          {assignments.length === 0 &&
            returnRequests.length === 0 &&
            serviceRecords.length === 0 &&
            conditionHistory.length === 0 &&
            auditLogs.length === 0 && (
              <p className="text-sm text-slate-400">
                No timeline events found.
              </p>
            )}
        </div>
      </Section>
    </div>
  );
}