"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Search, X } from "lucide-react";

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
}

interface AuditLog {
  id: string;
  assetId: string | null;
  action: string;
  actor: string;
  oldStatus: string | null;
  newStatus: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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

function formatEnumLabel(value: string | null): string {
  if (!value) {
    return "—";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAction(value: string): string {
  const actionLabels: Record<string, string> = {
    ASSET_CREATED: "Asset Created",
    ASSET_UPDATED: "Asset Updated",
    ASSET_DELETED: "Asset Deleted",
    ASSET_ASSIGNED: "Asset Assigned",
    ASSET_RETURN_REQUESTED: "Return Requested",
    ASSET_RETURNED: "Asset Returned",
    ASSET_SENT_TO_REPAIR: "Sent to Repair",
    ASSET_REPAIR_COMPLETED: "Repair Completed",
    ASSET_RETIRED: "Asset Retired",
    CONDITION_UPDATED: "Condition Updated",
  };

  return actionLabels[value] ?? formatEnumLabel(value);
}

function formatMetadata(
  metadata: Record<string, unknown> | null
): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "—";
  }

  const summary = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");

  return summary.length > 80
    ? `${summary.slice(0, 80)}…`
    : summary;
}

function getStatusBadgeClass(status: string | null): string {
  if (!status) {
    return "";
  }

  switch (status) {
    case "AVAILABLE":
      return "border-green-500/30 text-green-700 dark:text-green-400";

    case "ASSIGNED":
      return "border-blue-500/30 text-blue-700 dark:text-blue-400";

    case "IN_REPAIR":
      return "border-orange-500/30 text-orange-700 dark:text-orange-400";

    case "RETURN_REQUESTED":
      return "border-yellow-500/30 text-yellow-700 dark:text-yellow-400";

    case "RETIRED":
      return "border-red-500/30 text-red-700 dark:text-red-400";

    default:
      return "";
  }
}

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [auditLogsData, assetsData] = await Promise.all([
          fetchJson<AuditLog[]>("/api/audit-logs"),
          fetchJson<Asset[]>("/api/assets"),
        ]);

        if (isMounted) {
          setAuditLogs(auditLogsData);
          setAssets(assetsData);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error("Failed to load audit logs:", err);

        setError(
          "Unable to load the audit trail right now. Please try again later."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const assetMap = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets]
  );

  const actionOptions = useMemo(() => {
    return Array.from(
      new Set(auditLogs.map((log) => log.action))
    ).sort();
  }, [auditLogs]);

  const actorOptions = useMemo(() => {
    return Array.from(
      new Set(auditLogs.map((log) => log.actor))
    ).sort();
  }, [auditLogs]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();

    auditLogs.forEach((log) => {
      if (log.oldStatus) {
        statuses.add(log.oldStatus);
      }

      if (log.newStatus) {
        statuses.add(log.newStatus);
      }
    });

    return Array.from(statuses).sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const asset = log.assetId
        ? assetMap.get(log.assetId)
        : undefined;

      const actionLabel = formatAction(log.action);

      const matchesSearch =
        search.length === 0 ||
        actionLabel.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.actor.toLowerCase().includes(search) ||
        (asset?.assetTag.toLowerCase().includes(search) ?? false) ||
        (asset?.name.toLowerCase().includes(search) ?? false) ||
        (log.oldStatus?.toLowerCase().includes(search) ?? false) ||
        (log.newStatus?.toLowerCase().includes(search) ?? false);

      const matchesAction =
        actionFilter === "ALL" ||
        log.action === actionFilter;

      const matchesActor =
        actorFilter === "ALL" ||
        log.actor === actorFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        log.oldStatus === statusFilter ||
        log.newStatus === statusFilter;

      return (
        matchesSearch &&
        matchesAction &&
        matchesActor &&
        matchesStatus
      );
    });
  }, [
    auditLogs,
    assetMap,
    searchTerm,
    actionFilter,
    actorFilter,
    statusFilter,
  ]);

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    actionFilter !== "ALL" ||
    actorFilter !== "ALL" ||
    statusFilter !== "ALL";

  function clearFilters() {
    setSearchTerm("");
    setActionFilter("ALL");
    setActorFilter("ALL");
    setStatusFilter("ALL");
  }

  return (
    <AppShell title="Audit Trail">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit Trail
          </h1>

          <p className="text-sm text-muted-foreground">
            Review the immutable history of important actions taken
            on assets.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />

            <p className="text-sm">
              Loading audit trail...
            </p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />

            <p className="text-sm font-medium text-foreground">
              {error}
            </p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No audit logs found
            </p>

            <p className="text-sm text-muted-foreground">
              Audit log entries will appear here as actions are
              taken on assets.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-card p-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="audit-search"
                    className="mb-2 block text-sm font-medium"
                  >
                    Search
                  </label>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="audit-search"
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(event.target.value)
                      }
                      placeholder="Search audit trail..."
                      className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="action-filter"
                    className="mb-2 block text-sm font-medium"
                  >
                    Action
                  </label>

                  <select
                    id="action-filter"
                    value={actionFilter}
                    onChange={(event) =>
                      setActionFilter(event.target.value)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ALL">All actions</option>

                    {actionOptions.map((action) => (
                      <option key={action} value={action}>
                        {formatAction(action)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="actor-filter"
                    className="mb-2 block text-sm font-medium"
                  >
                    Actor
                  </label>

                  <select
                    id="actor-filter"
                    value={actorFilter}
                    onChange={(event) =>
                      setActorFilter(event.target.value)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ALL">All actors</option>

                    {actorOptions.map((actor) => (
                      <option key={actor} value={actor}>
                        {actor}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="status-filter"
                    className="mb-2 block text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ALL">All statuses</option>

                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {formatEnumLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {filteredLogs.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {auditLogs.length}
                  </span>{" "}
                  audit records
                </p>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="flex min-h-[30vh] flex-col items-center justify-center gap-2 rounded-md border text-center">
                <p className="text-sm font-medium text-foreground">
                  No matching audit records
                </p>

                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Old Status</TableHead>
                      <TableHead>New Status</TableHead>
                      <TableHead>Metadata</TableHead>
                      <TableHead>Created At</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredLogs.map((log) => {
                      const asset = log.assetId
                        ? assetMap.get(log.assetId)
                        : undefined;

                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {formatAction(log.action)}
                            </Badge>
                          </TableCell>

                          <TableCell className="font-medium text-foreground">
                            {log.assetId ? (
                              asset ? (
                                <div className="flex flex-col">
                                  <Link
                                    href={`/assets/${asset.id}`}
                                    className="text-primary hover:underline"
                                  >
                                    {asset.assetTag}
                                  </Link>

                                  <span className="text-xs text-muted-foreground">
                                    {asset.name}
                                  </span>
                                </div>
                              ) : (
                                "Unknown asset"
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          <TableCell>
                            {log.actor}
                          </TableCell>

                          <TableCell>
                            {log.oldStatus ? (
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(
                                  log.oldStatus
                                )}
                              >
                                {formatEnumLabel(
                                  log.oldStatus
                                )}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          <TableCell>
                            {log.newStatus ? (
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(
                                  log.newStatus
                                )}
                              >
                                {formatEnumLabel(
                                  log.newStatus
                                )}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>

                          <TableCell className="max-w-[240px] truncate">
                            {formatMetadata(log.metadata)}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}