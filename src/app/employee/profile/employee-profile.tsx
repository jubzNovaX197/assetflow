"use client";

import EmployeePortalHeader from "@/components/employee/employee-portal-header";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";

type Employee = {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
  phone: string | null;
  isActive: boolean;
};

export default function EmployeeProfile() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/employee/me");

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your profile.");
        }

        const data = await response.json();

        setEmployee(data.employee);
      } catch (error) {
        console.error("Employee profile error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your profile. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#080b12]">
        <EmployeePortalHeader />

        <div className="flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70">
              <User className="h-5 w-5 animate-pulse text-blue-400" />
            </div>

            <p className="text-sm">Loading your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !employee) {
    return (
      <main className="min-h-screen bg-[#080b12]">
        <EmployeePortalHeader />

        <div className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-[#10151f] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
              <User className="h-7 w-7 text-red-400" />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-slate-100">
              Profile unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {error ||
                "We could not find your employee profile."}
            </p>

            <Link
              href="/employee/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-400/20 hover:bg-blue-500/5 hover:text-blue-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b12]">
      <EmployeePortalHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Back navigation */}
        <Link
          href="/employee/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm font-medium text-slate-500 transition hover:border-blue-400/20 hover:bg-blue-500/5 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Page heading */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#101a2b] via-[#0c121e] to-[#080b12] px-6 py-8 shadow-[0_20px_70px_rgba(0,0,0,0.3)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-400/80">
              <ShieldCheck className="h-4 w-4" />
              Employee workspace
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
              My Profile
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              View your employee information and account access
              details.
            </p>
          </div>
        </section>

        {/* Profile card */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800/80 bg-[#10151f] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          {/* Profile hero */}
          <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-br from-[#111b2d] via-[#0d1420] to-[#10151f] px-6 py-8 sm:px-8">
            <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.12)]">
                <User className="h-9 w-9 text-blue-300" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    {employee.name}
                  </h2>

                  {employee.isActive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  {employee.designation || "Employee"}

                  <span className="mx-2 text-slate-700">
                    •
                  </span>

                  {employee.department}
                </p>

                <p className="mt-3 font-mono text-xs text-slate-600">
                  Employee ID • {employee.employeeCode}
                </p>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <ProfileField
              icon={User}
              label="Full name"
              value={employee.name}
            />

            <ProfileField
              icon={BriefcaseBusiness}
              label="Employee ID"
              value={employee.employeeCode}
            />

            <ProfileField
              icon={Mail}
              label="Email address"
              value={employee.email}
            />

            <ProfileField
              icon={Phone}
              label="Phone number"
              value={employee.phone || "Not provided"}
            />

            <ProfileField
              icon={Building2}
              label="Department"
              value={employee.department}
            />

            <ProfileField
              icon={BriefcaseBusiness}
              label="Designation"
              value={employee.designation || "Not provided"}
            />
          </div>
        </section>

        {/* Account access */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-800/80 bg-[#10151f] shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <div className="border-b border-slate-800/80 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/15 bg-indigo-500/10">
                <ShieldCheck className="h-5 w-5 text-indigo-300" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-100">
                  Account access
                </h2>

                <p className="mt-0.5 text-xs text-slate-600">
                  Your current account status
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  employee.isActive
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                    : "bg-slate-600"
                }`}
              />

              <div>
                <p className="font-medium text-slate-200">
                  {employee.isActive
                    ? "Your account is active"
                    : "Your account is inactive"}
                </p>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Your Assquere account is managed by your
                  organization. Employee accounts are provisioned
                  by administrators and access is controlled
                  according to your assigned role.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-slate-700">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-600">
        <Icon className="h-4 w-4 text-slate-500" />
        {label}
      </div>

      <p className="mt-2 break-words text-sm font-medium text-slate-300">
        {value}
      </p>
    </div>
  );
}