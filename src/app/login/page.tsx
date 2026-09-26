"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Boxes,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setIsLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (!result?.ok) {
      setError(
        "Unable to sign in. Check your credentials or contact your administrator.",
      );

      setIsLoading(false);
      return;
    }

    const session = await getSession();

    if (session?.user.role === "ADMIN") {
      window.location.href = "/";
      return;
    }

    if (session?.user.role === "EMPLOYEE") {
      window.location.href = "/employee/dashboard";
      return;
    }

    setError("Your account does not have a valid access role.");
    setIsLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#080b12] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        {/* Branding panel */}
        <section className="relative hidden overflow-hidden border-r border-slate-800/80 lg:flex">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.12)]">
                <ShieldCheck className="h-5 w-5 text-blue-300" />
              </div>

              <div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  Assquere
                </p>

                <p className="text-xs text-slate-600">
                  Asset lifecycle management
                </p>
              </div>
            </div>

            {/* Main message */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-blue-300">
                <Boxes className="h-3.5 w-3.5" />
                Secure workspace
              </div>

              <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-white xl:text-6xl">
                Every asset.
                <br />
                Every responsibility.
                <br />
                <span className="text-blue-300">
                  One workspace.
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-sm leading-7 text-slate-500 xl:text-base">
                Manage organizational assets, employee custody,
                service lifecycle, returns, and operational audit
                history from one centralized platform.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  "Asset tracking",
                  "Employee custody",
                  "Lifecycle control",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-500"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Security footer */}
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60">
                <LockKeyhole className="h-3.5 w-3.5" />
              </div>

              <div>
                <p className="font-medium text-slate-500">
                  Protected organizational access
                </p>

                <p className="mt-0.5">
                  Secure authentication and audit controls
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Login panel */}
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl lg:hidden" />

          <div className="relative w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-12 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
                <ShieldCheck className="h-5 w-5 text-blue-300" />
              </div>

              <div>
                <p className="font-semibold tracking-tight text-white">
                  Assquere
                </p>

                <p className="text-xs text-slate-600">
                  Asset lifecycle management
                </p>
              </div>
            </div>

            {/* Login heading */}
            <div className="mb-8">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10">
                <LockKeyhole className="h-4 w-4 text-blue-300" />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Sign in with your authorized organizational
                account to continue.
              </p>
            </div>

            {/* Login card */}
            <div className="rounded-3xl border border-slate-800/80 bg-[#10151f] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500"
                  >
                    Work email
                  </label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    disabled={isLoading}
                    required
                    className="h-11 border-slate-800 bg-slate-900/70 text-slate-200 placeholder:text-slate-700 focus-visible:border-blue-400/40 focus-visible:ring-blue-500/10"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      disabled={isLoading}
                      required
                      className="h-11 border-slate-800 bg-slate-900/70 pr-11 text-slate-200 placeholder:text-slate-700 focus-visible:border-blue-400/40 focus-visible:ring-blue-500/10"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={isLoading}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Demo admin login */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail("testuser@example.com");
                    setPassword("AssetFlow@Admin2026!");
                    setError("");
                  }}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-violet-400/15 bg-violet-500/5 px-4 py-2.5 text-xs font-medium text-violet-300 transition hover:border-violet-400/30 hover:bg-violet-500/10 disabled:opacity-50"
                >
                  Use Admin Demo Account
                </button>
                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-5 text-red-300"
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="h-11 w-full gap-2 bg-blue-600 font-medium text-white shadow-[0_8px_25px_rgba(37,99,235,0.2)] hover:bg-blue-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Signing in..."
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              {/* Security message */}
              <div className="mt-7 border-t border-slate-800/80 pt-5">
                <div className="flex items-start gap-3 text-xs leading-5 text-slate-600">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-700" />

                  <p>
                    Access is restricted to authorized Assquere
                    accounts. Account activity may be recorded for
                    security and audit purposes.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-[11px] text-slate-700">
              Assquere • Secure organizational asset management
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}