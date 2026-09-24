import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireAuthenticatedSession() {
  const session = await getCurrentSession();

  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireAdminSession() {
  const session = await getCurrentSession();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/employee/dashboard");
  }

  return session;
}

export async function requireAdminApiSession() {
  const session = await requireAuthenticatedSession();

  if (session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function requireEmployeeSession() {
  const session = await getCurrentSession();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }

  if (session.user.role !== "EMPLOYEE") {
    redirect("/");
  }

  return session;
}