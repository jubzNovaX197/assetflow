"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
  Search,
  Wrench,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  status: string;
}

interface ServiceRecord {
  id: string;
  assetId: string;
  issue: string;
  vendor: string | null;
  cost: string | null;
  openedAt: string;
  resolvedAt: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  resolution: string | null;
  notes: string | null;
}

type ServiceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

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

function formatCost(value: string | null): string {
  if (value === null || value === undefined) {
    return "—";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(numericValue);
}

function getStatusBadgeVariant(
  status: ServiceRecord["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "OPEN":
      return "destructive";
    case "IN_PROGRESS":
      return "secondary";
    case "COMPLETED":
      return "default";
    case "CANCELLED":
      return "outline";
    default:
      return "outline";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export default function ServicesPage() {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | "ALL">(
    "ALL"
  );

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<ServiceRecord | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formAssetId, setFormAssetId] = useState("");
  const [formIssue, setFormIssue] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formStatus, setFormStatus] = useState<ServiceStatus>("OPEN");
  const [formNotes, setFormNotes] = useState("");

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [serviceRecordsData, assetsData] = await Promise.all([
        fetchJson<ServiceRecord[]>("/api/service-records"),
        fetchJson<Asset[]>("/api/assets"),
      ]);

      setServiceRecords(serviceRecordsData);
      setAssets(assetsData);
    } catch (err) {
      console.error("Failed to load service records:", err);
      setError(
        "Unable to load service records right now. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const assetMap = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return serviceRecords.filter((record) => {
      const asset = assetMap.get(record.assetId);

      const matchesSearch =
        !query ||
        record.issue.toLowerCase().includes(query) ||
        (record.vendor ?? "").toLowerCase().includes(query) ||
        (asset?.name ?? "").toLowerCase().includes(query) ||
        (asset?.assetTag ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serviceRecords, assetMap, search, statusFilter]);

  const summary = useMemo(() => {
    const totalCost = serviceRecords.reduce((total, record) => {
      const cost = Number(record.cost ?? 0);

      return Number.isNaN(cost) ? total : total + cost;
    }, 0);

    return {
      total: serviceRecords.length,
      open: serviceRecords.filter((record) => record.status === "OPEN").length,
      inProgress: serviceRecords.filter(
        (record) => record.status === "IN_PROGRESS"
      ).length,
      completed: serviceRecords.filter(
        (record) => record.status === "COMPLETED"
      ).length,
      totalCost,
    };
  }, [serviceRecords]);

  const repairableAssets = assets.filter(
    (asset) => asset.status === "AVAILABLE" || asset.status === "ASSIGNED"
  );

  function resetForm() {
    setFormAssetId("");
    setFormIssue("");
    setFormVendor("");
    setFormCost("");
    setFormStatus("OPEN");
    setFormNotes("");
  }

  async function handleCreateServiceRecord() {
    if (!formAssetId || !formIssue.trim()) {
      setActionError("Asset and issue are required.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch("/api/service-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: formAssetId,
          issue: formIssue.trim(),
          ...(formVendor.trim() && {
            vendor: formVendor.trim(),
          }),
          ...(formCost.trim() && {
            cost: Number(formCost),
          }),
          status: formStatus,
          ...(formNotes.trim() && {
            notes: formNotes.trim(),
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to create service record.");
      }

      resetForm();
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      console.error("Failed to create service record:", err);
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to create service record."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLifecycleAction(
    assetId: string,
    action: "SEND_TO_REPAIR" | "COMPLETE_REPAIR",
    recordId: string
  ) {
    setActionId(recordId);
    setActionError(null);

    try {
      const response = await fetch(`/api/assets/${assetId}/lifecycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ?? `Failed to perform ${formatStatus(action)}.`
        );
      }

      setSelectedRecord(null);
      await loadData();
    } catch (err) {
      console.error("Lifecycle action failed:", err);
      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to perform the requested action."
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <AppShell title="Services">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Services
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Track maintenance, repairs, service costs, and asset recovery.
            </p>
          </div>

          <Button
            onClick={() => {
              setActionError(null);
              setShowCreateForm((value) => !value);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Service
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Services</p>
            <p className="mt-2 text-2xl font-semibold">{summary.total}</p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="mt-2 text-2xl font-semibold">{summary.open}</p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.inProgress}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.completed}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Service Cost</p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCost(String(summary.totalCost))}
            </p>
          </div>
        </div>

        {/* Create Service Form */}
        {showCreateForm && (
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Wrench className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">Create Service Record</h2>
                <p className="text-sm text-muted-foreground">
                  Record a maintenance or repair event for an asset.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Asset *</label>

                <select
                  value={formAssetId}
                  onChange={(event) => setFormAssetId(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select an asset</option>

                  {repairableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetTag} — {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>

                <select
                  value={formStatus}
                  onChange={(event) =>
                    setFormStatus(event.target.value as ServiceStatus)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Issue *</label>

                <input
                  value={formIssue}
                  onChange={(event) => setFormIssue(event.target.value)}
                  placeholder="e.g. Laptop keyboard not working"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor</label>

                <input
                  value={formVendor}
                  onChange={(event) => setFormVendor(event.target.value)}
                  placeholder="e.g. Dell Service Center"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost</label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formCost}
                  onChange={(event) => setFormCost(event.target.value)}
                  placeholder="e.g. 1500"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Notes</label>

                <textarea
                  value={formNotes}
                  onChange={(event) => setFormNotes(event.target.value)}
                  placeholder="Additional service details..."
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            {actionError && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {actionError}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowCreateForm(false);
                  setActionError(null);
                }}
              >
                Cancel
              </Button>

              <Button
                disabled={isSubmitting}
                onClick={handleCreateServiceRecord}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Service
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search asset, issue, or vendor..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as ServiceStatus | "ALL"
              )
            }
            className="h-10 rounded-md border bg-background px-3 text-sm sm:w-48"
          >
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Global Action Error */}
        {actionError && !showCreateForm && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {actionError}
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading service records...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />

            <p className="text-sm font-medium text-foreground">{error}</p>

            <Button variant="outline" onClick={loadData}>
              Try Again
            </Button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
            <Wrench className="h-8 w-8 text-muted-foreground" />

            <p className="text-sm font-medium text-foreground">
              {serviceRecords.length === 0
                ? "No service records found"
                : "No matching service records"}
            </p>

            <p className="max-w-md text-sm text-muted-foreground">
              {serviceRecords.length === 0
                ? "Create a service record when an asset requires maintenance or repair."
                : "Try changing your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.map((record) => {
                  const asset = assetMap.get(record.assetId);
                  const isActionRunning = actionId === record.id;

                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {asset?.name ?? "Unknown asset"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {asset?.assetTag ?? "Unknown"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="max-w-[280px]">
                        <p className="truncate">{record.issue}</p>
                      </TableCell>

                      <TableCell>{record.vendor ?? "—"}</TableCell>

                      <TableCell>{formatCost(record.cost)}</TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(record.openedAt)}
                      </TableCell>

                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {formatStatus(record.status)}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setActionError(null);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>

                          {asset?.status !== "IN_REPAIR" &&
                            (asset?.status === "AVAILABLE" ||
                              asset?.status === "ASSIGNED") && (
                              <Button
                                size="sm"
                                disabled={isActionRunning}
                                onClick={() =>
                                  handleLifecycleAction(
                                    record.assetId,
                                    "SEND_TO_REPAIR",
                                    record.id
                                  )
                                }
                              >
                                {isActionRunning ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Send to Repair"
                                )}
                              </Button>
                            )}

                          {asset?.status === "IN_REPAIR" && (
                            <Button
                              size="sm"
                              disabled={isActionRunning}
                              onClick={() =>
                                handleLifecycleAction(
                                  record.assetId,
                                  "COMPLETE_REPAIR",
                                  record.id
                                )
                              }
                            >
                              {isActionRunning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Complete Repair
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && serviceRecords.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Showing {filteredRecords.length} of {serviceRecords.length} service
            records
          </p>
        )}

        {/* Service Details */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-background shadow-xl">
              <div className="flex items-start justify-between border-b p-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    Service Details
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {assetMap.get(selectedRecord.assetId)?.assetTag ??
                      "Unknown asset"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </Button>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Asset</p>
                  <p className="mt-1 font-medium">
                    {assetMap.get(selectedRecord.assetId)?.name ??
                      "Unknown asset"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <Badge
                      variant={getStatusBadgeVariant(selectedRecord.status)}
                    >
                      {formatStatus(selectedRecord.status)}
                    </Badge>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Issue</p>
                  <p className="mt-1 text-sm">{selectedRecord.issue}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Vendor</p>
                  <p className="mt-1 text-sm">
                    {selectedRecord.vendor ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="mt-1 text-sm">
                    {formatCost(selectedRecord.cost)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Opened At</p>
                  <p className="mt-1 text-sm">
                    {formatDateTime(selectedRecord.openedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Resolved At</p>
                  <p className="mt-1 text-sm">
                    {formatDateTime(selectedRecord.resolvedAt)}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Resolution</p>
                  <p className="mt-1 text-sm">
                    {selectedRecord.resolution ?? "—"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {selectedRecord.notes ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}