import { requireEmployeeSession } from "@/lib/auth-guard";

import EmployeeAssets from "./employee-assets";

export default async function EmployeeAssetsPage() {
  await requireEmployeeSession();

  return <EmployeeAssets />;
}