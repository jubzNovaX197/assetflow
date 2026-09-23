import { requireEmployeeSession } from "@/lib/auth-guard";

import EmployeeAssetDetails from "./employee-asset-details";

type EmployeeAssetDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EmployeeAssetDetailsPage({
  params,
}: EmployeeAssetDetailsPageProps) {
  await requireEmployeeSession();

  const { id } = await params;

  return <EmployeeAssetDetails assetId={id} />;
}