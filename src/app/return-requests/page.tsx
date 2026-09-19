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

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
}

interface Asset {
  id: string;
  assetTag: string;
  name: string;
}

interface ReturnRequest {
  id: string;
  assetId: string;
  employeeId: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedAt: string;
  processedAt: string | null;
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

function getStatusBadgeVariant(
  status: ReturnRequest["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "COMPLETED":
      return "outline";
    default:
      return "outline";
  }
}

export default function ReturnRequestsPage() {
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [returnRequestsData, employeesData, assetsData] = await Promise.all([
          fetchJson<ReturnRequest[]>("/api/return-requests"),
          fetchJson<Employee[]>("/api/employees"),
          fetchJson<Asset[]>("/api/assets"),
        ]);

        if (isMounted) {
          setReturnRequests(returnRequestsData);
          setEmployees(employeesData);
          setAssets(assetsData);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load return requests:", err);
        setError(
          "Unable to load return requests right now. Please try again later."
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

  const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <AppShell title="Return Requests">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Return Requests
          </h1>
          <p className="text-sm text-muted-foreground">
            Review requests submitted by employees to return assigned assets.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading return requests...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : returnRequests.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No return requests found
            </p>
            <p className="text-sm text-muted-foreground">
              Return requests will appear here once employees request to
              return assets.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Processed At</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnRequests.map((request) => {
                  const asset = assetMap.get(request.assetId);
                  const employee = employeeMap.get(request.employeeId);

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium text-foreground">
                        {asset ? `${asset.name} (${asset.assetTag})` : "Unknown asset"}
                      </TableCell>
                      <TableCell>
                        {employee
                          ? `${employee.name} (${employee.employeeCode})`
                          : "Unknown employee"}
                      </TableCell>
                      <TableCell>{request.reason}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(request.status)}>
                          {request.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(request.requestedAt)}</TableCell>
                      <TableCell>{formatDateTime(request.processedAt)}</TableCell>
                      <TableCell>{request.notes ?? "—"}</TableCell>
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