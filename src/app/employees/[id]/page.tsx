"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

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
  email: string;
  department: string;
  designation: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  assetType: string;
  category: string;
  status: string;
  condition: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
}

interface Assignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  assignedCondition: string;
  returnedAt: string | null;
  returnedCondition: string | null;
  notes: string | null;
}

interface ReturnRequest {
  id: string;
  assetId: string;
  employeeId: string;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  notes: string | null;
}

interface EmployeeDetailsResponse {
  status: string;
  employee: Employee;
  currentAssets: Asset[];
  previousAssets: Asset[];
  assignments: Assignment[];
  returnRequests: ReturnRequest[];
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function getStatusClass(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "IN_REPAIR":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "RETURN_REQUESTED":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "RETIRED":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "REJECTED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
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
    <section className="rounded-lg border bg-card">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const employeeId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const [details, setDetails] =
    useState<EmployeeDetailsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEmployeeDetails() {
    if (!employeeId) {
      setError("Employee ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/employees/details?id=${encodeURIComponent(
          employeeId
        )}`
      );

      const data =
        (await response.json()) as
          | EmployeeDetailsResponse
          | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to load employee details."
        );
      }

      setDetails(data as EmployeeDetailsResponse);
    } catch (err) {
      console.error(
        "Failed to load employee details:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load employee details."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEmployeeDetails();
  }, [employeeId]);

  if (isLoading) {
    return (
      <AppShell title="Employee Details">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">
            Loading employee details...
          </p>
        </div>
      </AppShell>
    );
  }

  if (error || !details) {
    return (
      <AppShell title="Employee Details">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />

          <div>
            <p className="font-medium text-foreground">
              {error || "Employee details not found."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please go back and try again.
            </p>
          </div>

          <Link href="/employees">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const employee = details.employee;

  return (
    <AppShell title="Employee Details">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {employee.name}
            </h1>

            <p className="text-sm text-muted-foreground">
              Employee Code: {employee.employeeCode}
            </p>
          </div>

          <Link href="/employees">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Employees
            </Button>
          </Link>
        </div>

        <Section title="Employee Information">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Employee Code
              </p>
              <p className="mt-1 font-medium text-foreground">
                {employee.employeeCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Name
              </p>
              <p className="mt-1 font-medium text-foreground">
                {employee.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Email
              </p>
              <p className="mt-1 text-foreground">
                {employee.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Department
              </p>
              <p className="mt-1 text-foreground">
                {employee.department}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Designation
              </p>
              <p className="mt-1 text-foreground">
                {employee.designation ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Phone
              </p>
              <p className="mt-1 text-foreground">
                {employee.phone ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Status
              </p>
              <div className="mt-1">
                <Badge
                  variant={
                    employee.isActive
                      ? "default"
                      : "secondary"
                  }
                >
                  {employee.isActive
                    ? "Active"
                    : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">
      Current Assets
    </p>
    <p className="mt-2 text-2xl font-bold">
      {details.currentAssets.length}
    </p>
  </div>

  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">
      Previous Assets
    </p>
    <p className="mt-2 text-2xl font-bold">
      {details.previousAssets.length}
    </p>
  </div>

  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">
      Total Assignments
    </p>
    <p className="mt-2 text-2xl font-bold">
      {details.assignments.length}
    </p>
  </div>

  <div className="rounded-lg border bg-card p-4">
    <p className="text-sm text-muted-foreground">
      Return Requests
    </p>
    <p className="mt-2 text-2xl font-bold">
      {details.returnRequests.length}
    </p>
  </div>
</div>

        <Section title="Current Assets">
          {details.currentAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assets are currently assigned to this
              employee.
            </p>
          ) : (
            <div className="w-full overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {details.currentAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.assetTag}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/assets/${asset.id}`}
                          className="text-primary hover:underline"
                        >
                          {asset.name}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {asset.category.replace(/_/g, " ")}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={getStatusClass(
                            asset.status
                          )}
                        >
                          {asset.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {asset.condition}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>

        <Section title="Previous Assets">
          {details.previousAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No previous asset assignments found.
            </p>
          ) : (
            <div className="w-full overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {details.previousAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.assetTag}
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/assets/${asset.id}`}
                          className="text-primary hover:underline"
                        >
                          {asset.name}
                        </Link>
                      </TableCell>

                      <TableCell>
                        {asset.category.replace(/_/g, " ")}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={getStatusClass(
                            asset.status
                          )}
                        >
                          {asset.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>

        <Section title="Assignment History">
          {details.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assignment history found.
            </p>
          ) : (
            <div className="w-full overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Assigned Condition</TableHead>
                    <TableHead>Returned At</TableHead>
                    <TableHead>Returned Condition</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {details.assignments.map((assignment) => {
                    const asset = [
                      ...details.currentAssets,
                      ...details.previousAssets,
                    ].find(
                      (item) =>
                        item.id === assignment.assetId
                    );

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {asset ? (
                            <Link
                              href={`/assets/${asset.id}`}
                              className="text-primary hover:underline"
                            >
                              {asset.assetTag}
                            </Link>
                          ) : (
                            assignment.assetId
                          )}
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            assignment.assignedAt
                          )}
                        </TableCell>

                        <TableCell>
                          {assignment.assignedCondition}
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            assignment.returnedAt
                          )}
                        </TableCell>

                        <TableCell>
                          {assignment.returnedCondition ??
                            "—"}
                        </TableCell>

                        <TableCell>
                          {assignment.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>

        <Section title="Return History">
          {details.returnRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No return history found.
            </p>
          ) : (
            <div className="w-full overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead>Processed At</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {details.returnRequests.map(
                    (returnRequest) => (
                      <TableRow key={returnRequest.id}>
                       <TableCell className="font-medium">
  {(() => {
    const asset = [
      ...details.currentAssets,
      ...details.previousAssets,
    ].find(
      (item) => item.id === returnRequest.assetId
    );

    if (!asset) {
      return returnRequest.assetId;
    }

    return (
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
    );
  })()}
</TableCell>

                        <TableCell>
                          {returnRequest.reason}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={getStatusClass(
                              returnRequest.status
                            )}
                          >
                            {returnRequest.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            returnRequest.requestedAt
                          )}
                        </TableCell>

                        <TableCell>
                          {formatDate(
                            returnRequest.processedAt
                          )}
                        </TableCell>

                        <TableCell>
                          {returnRequest.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}