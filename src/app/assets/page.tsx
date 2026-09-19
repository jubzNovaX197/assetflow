"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Asset {
  id: string;
  assetTag: string;
  name: string;
  assetType: "HARDWARE" | "SOFTWARE";
  category:
    | "LAPTOP"
    | "DESKTOP"
    | "MONITOR"
    | "MOBILE"
    | "TABLET"
    | "PRINTER"
    | "PERIPHERAL"
    | "SOFTWARE_LICENSE"
    | "OTHER";
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED";
  status: "AVAILABLE" | "ASSIGNED" | "IN_REPAIR" | "RETURN_REQUESTED" | "RETIRED";
}

async function fetchAssets(): Promise<Asset[]> {
  const res = await fetch("/api/assets");

  if (!res.ok) {
    throw new Error("Failed to fetch assets");
  }

  return res.json() as Promise<Asset[]>;
}

function getStatusBadgeVariant(
  status: Asset["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "AVAILABLE":
      return "default";
    case "ASSIGNED":
      return "secondary";
    case "IN_REPAIR":
      return "destructive";
    case "RETURN_REQUESTED":
      return "outline";
    case "RETIRED":
      return "outline";
    default:
      return "outline";
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAssets() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAssets();

        if (isMounted) {
          setAssets(data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load assets:", err);
        setError("Unable to load assets right now. Please try again later.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppShell title="Assets">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Assets
          </h1>
          <p className="text-sm text-muted-foreground">
            View and track all hardware and software assets in your
            organization.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading assets...</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium text-foreground">
              No assets found
            </p>
            <p className="text-sm text-muted-foreground">
              Assets will appear here once they are added.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium text-foreground">
                      {asset.assetTag}
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>{asset.assetType}</TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell>{asset.manufacturer ?? "—"}</TableCell>
                    <TableCell>{asset.model ?? "—"}</TableCell>
                    <TableCell>{asset.serialNumber ?? "—"}</TableCell>
                    <TableCell>{asset.condition}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(asset.status)}>
                        {asset.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}