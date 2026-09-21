import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

const ASSET_TYPES = ["HARDWARE", "SOFTWARE"] as const;

const ASSET_CATEGORIES = [
  "LAPTOP",
  "DESKTOP",
  "MONITOR",
  "MOBILE",
  "TABLET",
  "PRINTER",
  "PERIPHERAL",
  "SOFTWARE_LICENSE",
  "OTHER",
] as const;

const ASSET_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "DAMAGED",
] as const;

const ASSET_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "IN_REPAIR",
  "RETURN_REQUESTED",
  "RETIRED",
] as const;

type AssetType = (typeof ASSET_TYPES)[number];
type AssetCategory = (typeof ASSET_CATEGORIES)[number];
type AssetCondition = (typeof ASSET_CONDITIONS)[number];
type AssetStatus = (typeof ASSET_STATUSES)[number];

function isAssetType(value: unknown): value is AssetType {
  return value === "HARDWARE" || value === "SOFTWARE";
}

function isAssetCategory(value: unknown): value is AssetCategory {
  return (
    value === "LAPTOP" ||
    value === "DESKTOP" ||
    value === "MONITOR" ||
    value === "MOBILE" ||
    value === "TABLET" ||
    value === "PRINTER" ||
    value === "PERIPHERAL" ||
    value === "SOFTWARE_LICENSE" ||
    value === "OTHER"
  );
}

function isAssetCondition(value: unknown): value is AssetCondition {
  return (
    value === "EXCELLENT" ||
    value === "GOOD" ||
    value === "FAIR" ||
    value === "DAMAGED"
  );
}

function isAssetStatus(value: unknown): value is AssetStatus {
  return (
    value === "AVAILABLE" ||
    value === "ASSIGNED" ||
    value === "IN_REPAIR" ||
    value === "RETURN_REQUESTED" ||
    value === "RETIRED"
  );
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export async function GET() {
  try {
    const assets = await db.orm.public.Asset.all();

    return NextResponse.json(assets, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch assets:", error);

    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const {
      assetTag,
      name,
      assetType,
      category,
      condition,
      status,
      manufacturer,
      model,
      serialNumber,
      description,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      licenseKey,
      licenseExpiry,
    } = body;

    if (typeof assetTag !== "string" || assetTag.trim() === "") {
      return NextResponse.json(
        { error: "assetTag is required" },
        { status: 400 }
      );
    }

    if (typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (!isAssetType(assetType)) {
      return NextResponse.json(
        { error: "assetType must be HARDWARE or SOFTWARE" },
        { status: 400 }
      );
    }

    if (!isAssetCategory(category)) {
      return NextResponse.json(
        { error: "Invalid asset category" },
        { status: 400 }
      );
    }

    if (!isAssetCondition(condition)) {
      return NextResponse.json(
        { error: "Invalid asset condition" },
        { status: 400 }
      );
    }

    if (!isAssetStatus(status)) {
      return NextResponse.json(
        { error: "Invalid asset status" },
        { status: 400 }
      );
    }

    if (
      manufacturer !== undefined &&
      typeof manufacturer !== "string"
    ) {
      return NextResponse.json(
        { error: "manufacturer must be a string" },
        { status: 400 }
      );
    }

    if (model !== undefined && typeof model !== "string") {
      return NextResponse.json(
        { error: "model must be a string" },
        { status: 400 }
      );
    }

    if (
      serialNumber !== undefined &&
      typeof serialNumber !== "string"
    ) {
      return NextResponse.json(
        { error: "serialNumber must be a string" },
        { status: 400 }
      );
    }

    if (description !== undefined && typeof description !== "string") {
      return NextResponse.json(
        { error: "description must be a string" },
        { status: 400 }
      );
    }

    if (
      purchaseDate !== undefined &&
      !isValidDateString(purchaseDate)
    ) {
      return NextResponse.json(
        { error: "purchaseDate must be a valid date string" },
        { status: 400 }
      );
    }

    if (
      purchasePrice !== undefined &&
      (typeof purchasePrice !== "number" ||
        !Number.isFinite(purchasePrice))
    ) {
      return NextResponse.json(
        { error: "purchasePrice must be a valid number" },
        { status: 400 }
      );
    }

    if (
      warrantyExpiry !== undefined &&
      !isValidDateString(warrantyExpiry)
    ) {
      return NextResponse.json(
        { error: "warrantyExpiry must be a valid date string" },
        { status: 400 }
      );
    }

    if (
      licenseKey !== undefined &&
      licenseKey !== null &&
      typeof licenseKey !== "string"
    ) {
      return NextResponse.json(
        { error: "licenseKey must be a string or null" },
        { status: 400 }
      );
    }

    if (
      licenseExpiry !== undefined &&
      !isValidDateString(licenseExpiry)
    ) {
      return NextResponse.json(
        { error: "licenseExpiry must be a valid date string" },
        { status: 400 }
      );
    }

    const existingAssets = await db.orm.public.Asset.all();

    const duplicateAssetTag = existingAssets.some(
      (asset) => asset.assetTag === assetTag
    );

    if (duplicateAssetTag) {
      return NextResponse.json(
        { error: "Asset tag already exists" },
        { status: 409 }
      );
    }

    const validatedData = {
      assetTag,
      name,
      assetType,
      category,
      condition,
      status,
      ...(manufacturer !== undefined && { manufacturer }),
      ...(model !== undefined && { model }),
      ...(serialNumber !== undefined && { serialNumber }),
      ...(description !== undefined && { description }),
      ...(purchaseDate !== undefined && { purchaseDate }),
      ...(purchasePrice !== undefined && {
        purchasePrice: purchasePrice.toString(),
      }),
      ...(warrantyExpiry !== undefined && { warrantyExpiry }),
      ...(licenseKey !== undefined && { licenseKey }),
      ...(licenseExpiry !== undefined && { licenseExpiry }),
    };

    const asset = await db.orm.public.Asset.create(validatedData);

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Failed to create asset:", error);

    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}