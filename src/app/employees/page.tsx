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
  email: string;
  department: string;
  designation: string | null;
  phone: string | null;
  isActive: boolean;
}

async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch("/api/employees");

  if (!res.ok) {
    throw new Error("Failed to fetch employees");
  }

  return res.json() as Promise<Employee[]>;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmployees() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchEmployees();

        if (isMounted) {
          setEmployees(data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load employees:", err);
        setError(
          "Unable to load employees right now. Please try again later."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell title="Employees">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Employees
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the employees in your organization and their custody
            records.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading employees...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No employees found
            </p>
            <p className="text-sm text-muted-foreground">
              Employees will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium text-foreground">
                      {employee.employeeCode}
                    </TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.designation ?? "—"}</TableCell>
                    <TableCell>{employee.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.isActive ? "default" : "secondary"}
                      >
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}