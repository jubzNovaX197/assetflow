import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_FIELDS = [
  "assetTag",
  "name",
  "assetType",
  "category",
  "manufacturer",
  "model",
  "serialNumber",
  "description",
  "purchaseDate",
  "purchasePrice",
  "warrantyExpiry",
  "licenseKey",
  "licenseExpiry",
  "condition",
  "status",
] as const;

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

const NULLABLE_FIELDS = [
  "manufacturer",
  "model",
  "serialNumber",
  "description",
  "purchaseDate",
  "purchasePrice",
  "warrantyExpiry",
  "licenseKey",
  "licenseExpiry",
] as const;

function adminErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      {
        status: "error",
        message: "Authentication required",
      },
      { status: 401 }
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      {
        status: "error",
        message: "Administrator access required",
      },
      { status: 403 }
    );
  }

  console.error("Asset authorization error:", error);

  return NextResponse.json(
    {
      status: "error",
      message: "Unable to verify administrator access",
    },
    { status: 500 }
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid asset ID",
      },
      { status: 400 }
    );
  }

  try {
    const assets = await db.orm.public.Asset.all();
    const asset = assets.find((a) => a.id === id);

    if (!asset) {
      return NextResponse.json(
        {
          status: "error",
          message: "Asset not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(asset, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch asset:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch asset",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid asset ID",
      },
      { status: 400 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error("Failed to parse request JSON:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Request body must be valid JSON",
      },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "Request body must be a JSON object",
      },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;

  const unknownFields = Object.keys(data).filter(
    (key) =>
      !ALLOWED_FIELDS.includes(
        key as (typeof ALLOWED_FIELDS)[number]
      )
  );

  if (unknownFields.length > 0) {
    return NextResponse.json(
      {
        status: "error",
        message: `Unknown field(s): ${unknownFields.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const {
    assetTag,
    name,
    assetType,
    category,
    manufacturer,
    model,
    serialNumber,
    description,
    purchaseDate,
    purchasePrice,
    warrantyExpiry,
    licenseKey,
    licenseExpiry,
    condition,
    status,
  } = data;

  function isNullable(
    field: (typeof NULLABLE_FIELDS)[number],
    value: unknown
  ) {
    return NULLABLE_FIELDS.includes(field) && value === null;
  }

  if (
    assetTag !== undefined &&
    (typeof assetTag !== "string" ||
      assetTag.trim().length === 0)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "assetTag must be a non-empty string when provided",
      },
      { status: 400 }
    );
  }

  if (
    name !== undefined &&
    (typeof name !== "string" ||
      name.trim().length === 0)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "name must be a non-empty string when provided",
      },
      { status: 400 }
    );
  }

  if (
    assetType !== undefined &&
    (typeof assetType !== "string" ||
      !ASSET_TYPES.includes(
        assetType as (typeof ASSET_TYPES)[number]
      ))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: `assetType must be one of: ${ASSET_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (
    category !== undefined &&
    (typeof category !== "string" ||
      !ASSET_CATEGORIES.includes(
        category as (typeof ASSET_CATEGORIES)[number]
      ))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: `category must be one of: ${ASSET_CATEGORIES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (
    condition !== undefined &&
    (typeof condition !== "string" ||
      !ASSET_CONDITIONS.includes(
        condition as (typeof ASSET_CONDITIONS)[number]
      ))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: `condition must be one of: ${ASSET_CONDITIONS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (
    status !== undefined &&
    (typeof status !== "string" ||
      !ASSET_STATUSES.includes(
        status as (typeof ASSET_STATUSES)[number]
      ))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: `status must be one of: ${ASSET_STATUSES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (
    manufacturer !== undefined &&
    !isNullable("manufacturer", manufacturer) &&
    typeof manufacturer !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "manufacturer must be a string or null if provided",
      },
      { status: 400 }
    );
  }

  if (
    model !== undefined &&
    !isNullable("model", model) &&
    typeof model !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "model must be a string or null if provided",
      },
      { status: 400 }
    );
  }

  if (
    serialNumber !== undefined &&
    !isNullable("serialNumber", serialNumber) &&
    typeof serialNumber !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "serialNumber must be a string or null if provided",
      },
      { status: 400 }
    );
  }

  if (
    description !== undefined &&
    !isNullable("description", description) &&
    typeof description !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "description must be a string or null if provided",
      },
      { status: 400 }
    );
  }

  if (
    licenseKey !== undefined &&
    !isNullable("licenseKey", licenseKey) &&
    typeof licenseKey !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "licenseKey must be a string or null if provided",
      },
      { status: 400 }
    );
  }

  if (
    purchasePrice !== undefined &&
    !isNullable("purchasePrice", purchasePrice) &&
    (typeof purchasePrice !== "number" ||
      purchasePrice < 0)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "purchasePrice must be a valid non-negative number if provided",
      },
      { status: 400 }
    );
  }

  if (
    purchaseDate !== undefined &&
    !isNullable("purchaseDate", purchaseDate) &&
    (typeof purchaseDate !== "string" ||
      Number.isNaN(Date.parse(purchaseDate)))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "purchaseDate must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  if (
    warrantyExpiry !== undefined &&
    !isNullable("warrantyExpiry", warrantyExpiry) &&
    (typeof warrantyExpiry !== "string" ||
      Number.isNaN(Date.parse(warrantyExpiry)))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "warrantyExpiry must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  if (
    licenseExpiry !== undefined &&
    !isNullable("licenseExpiry", licenseExpiry) &&
    (typeof licenseExpiry !== "string" ||
      Number.isNaN(Date.parse(licenseExpiry)))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "licenseExpiry must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (assetTag !== undefined) {
    updateData.assetTag = assetTag;
  }

  if (name !== undefined) {
    updateData.name = name;
  }

  if (assetType !== undefined) {
    updateData.assetType = assetType;
  }

  if (category !== undefined) {
    updateData.category = category;
  }

  if (manufacturer !== undefined) {
    updateData.manufacturer = manufacturer;
  }

  if (model !== undefined) {
    updateData.model = model;
  }

  if (serialNumber !== undefined) {
    updateData.serialNumber = serialNumber;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  if (purchaseDate !== undefined) {
    updateData.purchaseDate = purchaseDate;
  }

  if (purchasePrice !== undefined) {
    updateData.purchasePrice = purchasePrice;
  }

  if (warrantyExpiry !== undefined) {
    updateData.warrantyExpiry = warrantyExpiry;
  }

  if (licenseKey !== undefined) {
    updateData.licenseKey = licenseKey;
  }

  if (licenseExpiry !== undefined) {
    updateData.licenseExpiry = licenseExpiry;
  }

  if (condition !== undefined) {
    updateData.condition = condition;
  }

  if (status !== undefined) {
    updateData.status = status;
  }

  try {
    const assets = await db.orm.public.Asset.all();
    const existingAsset = assets.find((a) => a.id === id);

    if (!existingAsset) {
      return NextResponse.json(
        {
          status: "error",
          message: "Asset not found",
        },
        { status: 404 }
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingAsset, {
        status: 200,
      });
    }

    await db.orm.public.Asset.where({ id }).update(updateData);

    const updatedAssets = await db.orm.public.Asset.all();

    const updatedAsset = updatedAssets.find(
      (a) => a.id === id
    );

    return NextResponse.json(updatedAsset, {
      status: 200,
    });
  } catch (error) {
    console.error("Failed to update asset:", error);

    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : "";

    const isUniqueConflict =
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("conflict");

    if (isUniqueConflict) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "An asset with this assetTag already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to update asset",
      },
      { status: 500 }
    );
  }
}