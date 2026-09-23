import { requireEmployeeSession } from "@/lib/auth-guard";

import EmployeeReturns from "./employee-returns";

export default async function EmployeeReturnsPage() {
  await requireEmployeeSession();

  return <EmployeeReturns />;
}