import { requireEmployeeSession } from "@/lib/auth-guard";

import EmployeeDashboard from "./employee-dashboard";

export default async function EmployeeDashboardPage() {
  await requireEmployeeSession();

  return <EmployeeDashboard />;
}