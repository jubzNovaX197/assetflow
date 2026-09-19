"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
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

  return value.replace(/_/g, " ");
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "—";
  }

  const summary = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(", ");

  return summary.length > 60 ? `${summary.slice(0, 60)}…` : summary;
}

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (!isMounted) return;
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

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <AppShell title="Audit Trail">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground">
            Review the immutable history of important actions taken on
            assets.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading audit trail...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No audit logs found
            </p>
            <p className="text-sm text-muted-foreground">
              Audit log entries will appear here as actions are taken on
              assets.
            </p>
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
                {auditLogs.map((log) => {
                  const asset = log.assetId ? assetMap.get(log.assetId) : undefined;

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {formatEnumLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {log.assetId
                          ? asset
                            ? `${asset.name} (${asset.assetTag})`
                            : "Unknown asset"
                          : "—"}
                      </TableCell>
                      <TableCell>{log.actor}</TableCell>
                      <TableCell>{formatEnumLabel(log.oldStatus)}</TableCell>
                      <TableCell>{formatEnumLabel(log.newStatus)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {formatMetadata(log.metadata)}
                      </TableCell>
                      <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}