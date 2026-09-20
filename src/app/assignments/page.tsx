"use client";

import { useEffect, useState } from "react";

import { AlertCircle, Loader2, X } from "lucide-react";

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

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
}

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  status: string;
}

interface Assignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt: string | null;
  assignedCondition: "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";
  returnedCondition: "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED" | null;
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

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returningAssignment, setReturningAssignment] =
    useState<Assignment | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnFormError, setReturnFormError] = useState<string | null>(null);
  const [isReturnSubmitting, setIsReturnSubmitting] = useState(false);

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      const [assignmentsData, employeesData, assetsData] = await Promise.all([
        fetchJson<Assignment[]>("/api/assignments"),
        fetchJson<Employee[]>("/api/employees"),
        fetchJson<Asset[]>("/api/assets"),
      ]);

      setAssignments(assignmentsData);
      setEmployees(employeesData);
      setAssets(assetsData);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setError(
        "Unable to load assignments right now. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const employeeMap = new Map(
    employees.map((employee) => [employee.id, employee])
  );

  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  function openReturnDialog(assignment: Assignment) {
    setReturningAssignment(assignment);
    setReturnReason("");
    setReturnNotes("");
    setReturnFormError(null);
    setIsReturnDialogOpen(true);
  }

  function closeReturnDialog() {
    if (isReturnSubmitting) {
      return;
    }

    setIsReturnDialogOpen(false);
    setReturningAssignment(null);
    setReturnReason("");
    setReturnNotes("");
    setReturnFormError(null);
  }

  async function handleReturnSubmit() {
    if (!returningAssignment) {
      return;
    }

    const trimmedReason = returnReason.trim();
    const trimmedNotes = returnNotes.trim();

    if (!trimmedReason) {
      setReturnFormError("Reason is required.");
      return;
    }

    setReturnFormError(null);
    setIsReturnSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        assetId: returningAssignment.assetId,
        employeeId: returningAssignment.employeeId,
        reason: trimmedReason,
      };

      if (trimmedNotes) {
        payload.notes = trimmedNotes;
      }

      const response = await fetch("/api/return-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData &&
          typeof responseData.message === "string"
            ? responseData.message
            : "Unable to submit the return request.";

        throw new Error(message);
      }

      setIsReturnDialogOpen(false);
      setReturningAssignment(null);
      setReturnReason("");
      setReturnNotes("");
      setReturnFormError(null);

      await loadData();
    } catch (err) {
      console.error("Failed to submit return request:", err);

      setReturnFormError(
        err instanceof Error
          ? err.message
          : "Unable to submit the return request."
      );
    } finally {
      setIsReturnSubmitting(false);
    }
  }

  return (
    <AppShell title="Assignments">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Assignments
          </h1>

          <p className="text-sm text-muted-foreground">
            Track custody history of assets assigned to employees.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading assignments...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />

            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No assignments found
            </p>

            <p className="text-sm text-muted-foreground">
              Assignments will appear here once assets are assigned to
              employees.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Assigned Condition</TableHead>
                  <TableHead>Returned At</TableHead>
                  <TableHead>Returned Condition</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {assignments.map((assignment) => {
                  const asset = assetMap.get(assignment.assetId);
                  const employee = employeeMap.get(assignment.employeeId);

                  const isActive = assignment.returnedAt === null;

                  const canRequestReturn =
                    isActive && asset?.status === "ASSIGNED";

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-foreground">
                        {asset
                          ? `${asset.name} (${asset.assetTag})`
                          : "Unknown asset"}
                      </TableCell>

                      <TableCell>
                        {employee
                          ? `${employee.name} (${employee.employeeCode})`
                          : "Unknown employee"}
                      </TableCell>

                      <TableCell>
                        {formatDateTime(assignment.assignedAt)}
                      </TableCell>

                      <TableCell>{assignment.assignedCondition}</TableCell>

                      <TableCell>
                        {assignment.returnedAt
                          ? formatDateTime(assignment.returnedAt)
                          : "Active"}
                      </TableCell>

                      <TableCell>
                        {assignment.returnedCondition ?? "—"}
                      </TableCell>

                      <TableCell>{assignment.notes ?? "—"}</TableCell>

                      <TableCell>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                        >
                          {isActive ? "Active" : "Returned"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {canRequestReturn ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openReturnDialog(assignment)}
                          >
                            Request Return
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {isReturnDialogOpen && returningAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-dialog-title"
        >
          <div className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="return-dialog-title"
                  className="text-lg font-semibold text-foreground"
                >
                  Request Asset Return
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Submit a request to return this assigned asset.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeReturnDialog}
                disabled={isReturnSubmitting}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-md border bg-muted/30 p-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">
                      Asset:
                    </span>{" "}
                    {assetMap.get(returningAssignment.assetId)
                      ? `${assetMap.get(returningAssignment.assetId)?.name} (${assetMap.get(returningAssignment.assetId)?.assetTag})`
                      : "Unknown asset"}
                  </div>

                  <div>
                    <span className="font-medium text-foreground">
                      Employee:
                    </span>{" "}
                    {employeeMap.get(returningAssignment.employeeId)
                      ? `${employeeMap.get(returningAssignment.employeeId)?.name} (${employeeMap.get(returningAssignment.employeeId)?.employeeCode})`
                      : "Unknown employee"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="return-reason"
                  className="text-sm font-medium text-foreground"
                >
                  Reason <span className="text-destructive">*</span>
                </label>

                <input
                  id="return-reason"
                  type="text"
                  value={returnReason}
                  onChange={(event) => setReturnReason(event.target.value)}
                  disabled={isReturnSubmitting}
                  placeholder="Enter reason for returning the asset"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="return-notes"
                  className="text-sm font-medium text-foreground"
                >
                  Notes
                </label>

                <textarea
                  id="return-notes"
                  value={returnNotes}
                  onChange={(event) => setReturnNotes(event.target.value)}
                  disabled={isReturnSubmitting}
                  placeholder="Add any additional notes"
                  rows={4}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {returnFormError && (
                <div
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  {returnFormError}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeReturnDialog}
                disabled={isReturnSubmitting}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleReturnSubmit}
                disabled={isReturnSubmitting}
              >
                {isReturnSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Return Request"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}