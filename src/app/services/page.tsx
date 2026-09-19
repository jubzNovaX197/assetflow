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

interface ServiceRecord {
  id: string;
  assetId: string;
  issue: string;
  vendor: string | null;
  cost: number | null;
  openedAt: string;
  resolvedAt: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  resolution: string | null;
  notes: string | null;
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

function formatCost(value: number | null): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
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

export default function ServicesPage() {
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [serviceRecordsData, assetsData] = await Promise.all([
          fetchJson<ServiceRecord[]>("/api/service-records"),
          fetchJson<Asset[]>("/api/assets"),
        ]);

        if (isMounted) {
          setServiceRecords(serviceRecordsData);
          setAssets(assetsData);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load service records:", err);
        setError(
          "Unable to load service records right now. Please try again later."
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
    <AppShell title="Services">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Services
          </h1>
          <p className="text-sm text-muted-foreground">
            Track maintenance and repair history for assets in your
            organization.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading service records...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : serviceRecords.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No service records found
            </p>
            <p className="text-sm text-muted-foreground">
              Service records will appear here once assets are sent for
              maintenance or repair.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Opened At</TableHead>
                  <TableHead>Resolved At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRecords.map((record) => {
                  const asset = assetMap.get(record.assetId);

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium text-foreground">
                        {asset ? `${asset.name} (${asset.assetTag})` : "Unknown asset"}
                      </TableCell>
                      <TableCell>{record.issue}</TableCell>
                      <TableCell>{record.vendor ?? "—"}</TableCell>
                      <TableCell>{formatCost(record.cost)}</TableCell>
                      <TableCell>{formatDateTime(record.openedAt)}</TableCell>
                      <TableCell>{formatDateTime(record.resolvedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.resolution ?? "—"}</TableCell>
                      <TableCell>{record.notes ?? "—"}</TableCell>
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