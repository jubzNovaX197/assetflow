export type AssetCondition =
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "DAMAGED";

export type AssetStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "IN_REPAIR"
  | "RETURN_REQUESTED"
  | "RETIRED";

export type AssetHealthLevel =
  | "HEALTHY"
  | "ATTENTION"
  | "AT_RISK";

export interface AssetHealthInput {
  condition: AssetCondition;
  status: AssetStatus;
  hasServiceHistory?: boolean;
  warrantyExpired?: boolean;
  licenseExpired?: boolean;
}

export interface AssetHealthResult {
  level: AssetHealthLevel;
  label: string;
  description: string;
}

export function getAssetHealth({
  condition,
  status,
  hasServiceHistory = false,
  warrantyExpired = false,
  licenseExpired = false,
}: AssetHealthInput): AssetHealthResult {
  if (
    condition === "DAMAGED" ||
    status === "IN_REPAIR"
  ) {
    return {
      level: "AT_RISK",
      label: "At Risk",
      description:
        status === "IN_REPAIR"
          ? "Asset is currently in repair."
          : "Asset condition is damaged.",
    };
  }

  if (
    condition === "FAIR" ||
    hasServiceHistory ||
    warrantyExpired ||
    licenseExpired
  ) {
    return {
      level: "ATTENTION",
      label: "Attention",
      description:
        condition === "FAIR"
          ? "Asset condition should be monitored."
          : "Asset has a condition, service, or expiry concern.",
    };
  }

  return {
    level: "HEALTHY",
    label: "Healthy",
    description: "No immediate asset health concerns.",
  };
}