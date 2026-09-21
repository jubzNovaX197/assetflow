"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
      return "bg-muted text-muted-foreground";
  }
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function AssetDetailsPage() {
  const params = useParams();

  const assetId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [details, setDetails] = useState<AssetDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);

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
        throw new Error("Invalid asset details response.");
      }

      setDetails(data);
    } catch (err) {
      console.error("Failed to load asset details:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load asset details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssetDetails();
  }, [assetId]);

  async function handleLifecycleAction(
  action: "SEND_TO_REPAIR" | "COMPLETE_REPAIR" | "RETIRE"
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
      `/api/assets/${encodeURIComponent(lifecycleAssetId)}/lifecycle`,
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
      SEND_TO_REPAIR: "Asset sent to repair successfully.",
      COMPLETE_REPAIR: "Repair completed successfully.",
      RETIRE: "Asset retired successfully.",
    };

    setLifecycleMessage(messages[action]);

    await loadAssetDetails();
  } catch (err) {
    console.error("Lifecycle action failed:", err);

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
        <p className="text-muted-foreground">
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

          <p className="mt-2 text-sm text-muted-foreground">
            {error || "Asset details could not be loaded."}
          </p>

          <a
            href="/assets"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to Assets
          </a>
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
        <a
          href="/assets"
          className="mb-3 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Assets
        </a>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {asset.name}
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
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
                handleLifecycleAction("SEND_TO_REPAIR")
              }
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                handleLifecycleAction("COMPLETE_REPAIR")
              }
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={() => handleLifecycleAction("RETIRE")}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {lifecycleLoading
                ? "Processing..."
                : "♻️ Retire Asset"}
            </button>
          )}

          {!canSendToRepair &&
            !canCompleteRepair &&
            !canRetire && (
              <p className="text-sm text-muted-foreground">
                No lifecycle actions are available for the current
                asset status.
              </p>
            )}
        </div>

        {lifecycleMessage && (
          <div className="mt-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {lifecycleMessage}
          </div>
        )}

        {lifecycleError && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {lifecycleError}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Available actions depend on the asset's current lifecycle
          status.
        </p>
      </Section>

      <Section title="Asset Information">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Asset Tag</p>
            <p className="mt-1 font-medium">{asset.assetTag}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="mt-1 font-medium">{asset.name}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="mt-1 font-medium">{asset.assetType}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Category</p>
            <p className="mt-1 font-medium">{asset.category}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Manufacturer</p>
            <p className="mt-1 font-medium">
              {asset.manufacturer || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="mt-1 font-medium">
              {asset.model || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Serial Number
            </p>
            <p className="mt-1 font-medium">
              {asset.serialNumber || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Condition</p>
            <p className="mt-1 font-medium">{asset.condition}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Purchase Date
            </p>
            <p className="mt-1 font-medium">
              {formatDate(asset.purchaseDate)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Purchase Price
            </p>
            <p className="mt-1 font-medium">
              {formatCurrency(asset.purchasePrice)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Warranty Expiry
            </p>
            <p className="mt-1 font-medium">
              {formatDate(asset.warrantyExpiry)}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              License Expiry
            </p>
            <p className="mt-1 font-medium">
              {formatDate(asset.licenseExpiry)}
            </p>
          </div>
        </div>

        {asset.description && (
          <div className="mt-5 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Description
            </p>

            <p className="mt-1 text-sm">
              {asset.description}
            </p>
          </div>
        )}
      </Section>

      <Section title="Current Employee">
        {currentEmployee ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Employee Code
              </p>

              <p className="mt-1 font-medium">
                {currentEmployee.employeeCode}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Name</p>

              <p className="mt-1 font-medium">
                {currentEmployee.name}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Email</p>

              <p className="mt-1 font-medium">
                {currentEmployee.email}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Department
              </p>

              <p className="mt-1 font-medium">
                {currentEmployee.department}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This asset is not currently assigned to an employee.
          </p>
        )}

        {currentAssignment && (
          <div className="mt-4 border-t pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Assigned At
                </p>

                <p className="mt-1 font-medium">
                  {formatDate(currentAssignment.assignedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Assigned Condition
                </p>

                <p className="mt-1 font-medium">
                  {currentAssignment.assignedCondition}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Notes
                </p>

                <p className="mt-1 font-medium">
                  {currentAssignment.notes || "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Assignment History">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No assignment history found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="whitespace-nowrap px-3 py-3 font-medium">
                    Employee ID
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
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-3 py-3">
                      {assignment.employeeId}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDate(assignment.assignedAt)}
                    </td>

                    <td className="px-3 py-3">
                      {assignment.assignedCondition}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDate(assignment.returnedAt)}
                    </td>

                    <td className="px-3 py-3">
                      {assignment.returnedCondition || "—"}
                    </td>

                    <td className="px-3 py-3">
                      {assignment.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Service History">
        {serviceRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">
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

                    <p className="mt-1 text-sm text-muted-foreground">
                      Opened: {formatDate(record.openedAt)}
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
                    <p className="text-xs text-muted-foreground">
                      Vendor
                    </p>

                    <p className="mt-1 text-sm">
                      {record.vendor || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Cost
                    </p>

                    <p className="mt-1 text-sm">
                      {formatCurrency(record.cost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Resolved At
                    </p>

                    <p className="mt-1 text-sm">
                      {formatDate(record.resolvedAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Resolution
                    </p>

                    <p className="mt-1 text-sm">
                      {record.resolution || "—"}
                    </p>
                  </div>
                </div>

                {record.notes && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs text-muted-foreground">
                      Notes
                    </p>

                    <p className="mt-1 text-sm">
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
          <p className="text-sm text-muted-foreground">
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

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(history.recordedAt)}
                    </p>
                  </div>

                  <span className="text-sm text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
            No return requests found.
          </p>
        ) : (
          <div className="space-y-3">
            {returnRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {request.reason}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested: {formatDate(request.requestedAt)}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Employee ID: {request.employeeId}
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
                  <p className="mt-3 text-sm text-muted-foreground">
                    Processed: {formatDate(request.processedAt)}
                  </p>
                )}

                {request.notes && (
                  <p className="mt-2 text-sm">
                    {request.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Audit History">
        {auditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
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
                    className="border-b last:border-0"
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
                      <pre className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
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
            ...assignments.map((item) => ({
              date: item.assignedAt,
              title: "Asset Assigned",
              description: `Assigned to employee ${item.employeeId}`,
            })),

            ...returnRequests.map((item) => ({
              date: item.requestedAt,
              title: "Return Requested",
              description: item.reason,
            })),

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

                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                No timeline events found.
              </p>
            )}
        </div>
      </Section>
    </div>
  );
}