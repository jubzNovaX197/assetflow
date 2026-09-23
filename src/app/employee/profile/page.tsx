import { requireEmployeeSession } from "@/lib/auth-guard";

import EmployeeProfile from "./employee-profile";

export default async function EmployeeProfilePage() {
  await requireEmployeeSession();

  return <EmployeeProfile />;
}