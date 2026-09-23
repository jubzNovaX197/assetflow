"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
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

interface CreateEmployeeForm {
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  password: string;
}

const initialForm: CreateEmployeeForm = {
  employeeCode: "",
  name: "",
  email: "",
  department: "",
  designation: "",
  phone: "",
  password: "",
};

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

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateEmployeeForm>(initialForm);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  async function loadEmployees() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError(
        "Unable to load employees right now. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialEmployees() {
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
          "Unable to load employees right now. Please try again later.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateForm(
    field: keyof CreateEmployeeForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateForm() {
    setCreateError(null);
    setCreateSuccess(null);
    setForm(initialForm);
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (isCreating) return;

    setShowCreateForm(false);
    setCreateError(null);
    setCreateSuccess(null);
    setForm(initialForm);
  }

  async function handleCreateEmployee(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeCode: form.employeeCode,
          name: form.name,
          email: form.email,
          department: form.department,
          designation: form.designation || null,
          phone: form.phone || null,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(
          data?.error ?? "Failed to create employee account.",
        );
        return;
      }

      setCreateSuccess(
        `${data.employee.name} has been added successfully.`,
      );

      setForm(initialForm);

      await loadEmployees();
    } catch (err) {
      console.error("Failed to create employee:", err);
      setCreateError(
        "Unable to create the employee account right now. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <AppShell title="Employees">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-6 bg-[#080b12] -m-4 p-4 md:-m-6 md:p-6 lg:-m-8 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Employees
            </h1>

            <p className="text-sm text-slate-400">
              Manage the employees in your organization and their custody
              records.
            </p>
          </div>

          <Button
            type="button"
            onClick={openCreateForm}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Employee
          </Button>
        </div>

        {showCreateForm && (
          <section className="rounded-2xl border border-slate-800/80 bg-[#0d121c] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Create Employee Account
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create the employee profile and their Assquere login
                  account.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeCreateForm}
                disabled={isCreating}
                aria-label="Close form"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {createError && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                <p>{createError}</p>
              </div>
            )}

            {createSuccess && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                <p>{createSuccess}</p>
              </div>
            )}

            <form
              onSubmit={handleCreateEmployee}
              className="flex flex-col gap-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="employeeCode"
                    className="text-sm font-medium"
                  >
                    Employee Code
                  </label>

                  <input
                    id="employeeCode"
                    type="text"
                    required
                    value={form.employeeCode}
                    onChange={(event) =>
                      updateForm("employeeCode", event.target.value)
                    }
                    placeholder="EMP003"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="employeeName"
                    className="text-sm font-medium"
                  >
                    Full Name
                  </label>

                  <input
                    id="employeeName"
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) =>
                      updateForm("name", event.target.value)
                    }
                    placeholder="John Doe"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="employeeEmail"
                    className="text-sm font-medium"
                  >
                    Work Email
                  </label>

                  <input
                    id="employeeEmail"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    placeholder="john@company.com"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="employeeDepartment"
                    className="text-sm font-medium"
                  >
                    Department
                  </label>

                  <input
                    id="employeeDepartment"
                    type="text"
                    required
                    value={form.department}
                    onChange={(event) =>
                      updateForm("department", event.target.value)
                    }
                    placeholder="Engineering"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="employeeDesignation"
                    className="text-sm font-medium"
                  >
                    Designation
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="employeeDesignation"
                    type="text"
                    value={form.designation}
                    onChange={(event) =>
                      updateForm("designation", event.target.value)
                    }
                    placeholder="Software Engineer"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="employeePhone"
                    className="text-sm font-medium"
                  >
                    Phone
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="employeePhone"
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateForm("phone", event.target.value)
                    }
                    placeholder="+91 98765 43210"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label
                    htmlFor="employeePassword"
                    className="text-sm font-medium"
                  >
                    Temporary Password
                  </label>

                  <input
                    id="employeePassword"
                    type="password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(event) =>
                      updateForm("password", event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    disabled={isCreating}
                    className="h-10 rounded-md border border-slate-700 bg-[#080b12] px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <p className="text-xs text-muted-foreground">
                    The employee will use this password to sign in for the
                    first time.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCreateForm}
                  disabled={isCreating}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </section>
        )}

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

            <p className="text-sm text-slate-400">
              Employees will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#0d121c] shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
            <Table>
              <TableHeader className="bg-slate-900/70">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Employee Code</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Name</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Email</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Department</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Designation</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Status</TableHead>
                  <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-slate-800/70">
                {employees.map((employee) => (
                  <TableRow key={employee.id} className="border-slate-800/70 transition-colors hover:bg-violet-500/[0.05]">
                    <TableCell className="font-semibold text-white">
                      {employee.employeeCode}
                    </TableCell>

                    <TableCell className="text-sm font-medium text-white">{employee.name}</TableCell>

                    <TableCell className="text-sm text-slate-400">{employee.email}</TableCell>

                    <TableCell className="text-sm text-slate-300">{employee.department}</TableCell>

                    <TableCell>
                      {employee.designation ?? "—"}
                    </TableCell>

                    <TableCell className="text-sm text-slate-400">{employee.phone ?? "—"}</TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          employee.isActive ? "default" : "secondary"
                        }
                      >
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Link href={`/employees/${employee.id}`} className="inline-flex">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </Link>
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