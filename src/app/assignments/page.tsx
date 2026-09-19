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

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [assignmentsData, employeesData, assetsData] = await Promise.all([
          fetchJson<Assignment[]>("/api/assignments"),
          fetchJson<Employee[]>("/api/employees"),
          fetchJson<Asset[]>("/api/assets"),
        ]);

        if (isMounted) {
          setAssignments(assignmentsData);
          setEmployees(employeesData);
          setAssets(assetsData);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load assignments:", err);
        setError(
          "Unable to load assignments right now. Please try again later."
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => {
                  const asset = assetMap.get(assignment.assetId);
                  const employee = employeeMap.get(assignment.employeeId);
                  const isActive = assignment.returnedAt === null;

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-foreground">
                        {asset ? `${asset.name} (${asset.assetTag})` : "Unknown asset"}
                      </TableCell>
                      <TableCell>
                        {employee
                          ? `${employee.name} (${employee.employeeCode})`
                          : "Unknown employee"}
                      </TableCell>
                      <TableCell>{formatDateTime(assignment.assignedAt)}</TableCell>
                      <TableCell>{assignment.assignedCondition}</TableCell>
                      <TableCell>
                        {assignment.returnedAt ? formatDateTime(assignment.returnedAt) : "Active"}
                      </TableCell>
                      <TableCell>{assignment.returnedCondition ?? "—"}</TableCell>
                      <TableCell>{assignment.notes ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Returned"}
                        </Badge>
                      </TableCell>
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