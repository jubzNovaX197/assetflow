import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth-guard";

import Dashboard from "./dashboard";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "EMPLOYEE") {
    redirect("/employee/dashboard");
  }

  return <Dashboard />;
}
