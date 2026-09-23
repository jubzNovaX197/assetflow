import { requireEmployeeSession } from "@/lib/auth-guard";

import EmployeeAssignments from "./employee-assignments";

export default async function EmployeeAssignmentsPage() {
  await requireEmployeeSession();

  return <EmployeeAssignments />;
}