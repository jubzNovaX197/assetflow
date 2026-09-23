import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

const ALLOWED_FIELDS = [
  "assetId",
  "action",
  "actor",
  "oldStatus",
  "newStatus",
  "metadata",
  "createdAt",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const AUDIT_ACTIONS = [
  "ASSET_CREATED",
  "ASSET_UPDATED",
  "ASSET_DELETED",
  "ASSET_ASSIGNED",
  "ASSET_RETURN_REQUESTED",
  "ASSET_RETURNED",
  "ASSET_SENT_TO_REPAIR",
  "ASSET_REPAIR_COMPLETED",
  "ASSET_RETIRED",
  "CONDITION_UPDATED",
] as const;

type AuditAction = (typeof AUDIT_ACTIONS)[number];

const ASSET_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "IN_REPAIR",
  "RETURN_REQUESTED",
  "RETIRED",
] as const;

type AssetStatus = (typeof ASSET_STATUSES)[number];

type JsonPrimitive = string | number | boolean | null;

type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

function isAuditAction(
  value: unknown
): value is AuditAction {
  return (
    typeof value === "string" &&
    AUDIT_ACTIONS.includes(
      value as AuditAction
    )
  );
}

function isAssetStatus(
  value: unknown
): value is AssetStatus {
  return (
    typeof value === "string" &&
    ASSET_STATUSES.includes(
      value as AssetStatus
    )
  );
}

function isJsonValue(
  value: unknown
): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (typeof value === "object") {
    return Object.values(value).every(isJsonValue);
  }

  return false;
}

function isValidDateString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value))
  );
}

function adminErrorResponse(error: unknown) {
  if (
    error instanceof Error &&
    error.message === "UNAUTHORIZED"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "Authentication required",
      },
      { status: 401 }
    );
  }

  if (
    error instanceof Error &&
    error.message === "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "Administrator access required",
      },
      { status: 403 }
    );
  }

  console.error(
    "Audit log authorization error:",
    error
  );

  return NextResponse.json(
    {
      status: "error",
      message:
        "Unable to verify administrator access",
    },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  try {
    const auditLogs =
      await db.orm.public.AuditLog.all();

    return NextResponse.json(
      auditLogs,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to fetch audit logs:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch audit logs",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error(
      "Failed to parse request JSON:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Request body must be valid JSON",
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
        message:
          "Request body must be a JSON object",
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
    assetId,
    action,
    actor,
    oldStatus,
    newStatus,
    metadata,
    createdAt,
  } = data;

  if (
    assetId !== undefined &&
    (
      typeof assetId !== "string" ||
      !UUID_REGEX.test(assetId)
    )
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "assetId must be a valid UUID if provided",
      },
      { status: 400 }
    );
  }

  if (!isAuditAction(action)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          `action is required and must be one of: ${AUDIT_ACTIONS.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (
    typeof actor !== "string" ||
    actor.trim().length === 0
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "actor is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (
    oldStatus !== undefined &&
    !isAssetStatus(oldStatus)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          `oldStatus must be one of: ${ASSET_STATUSES.join(", ")} if provided`,
      },
      { status: 400 }
    );
  }

  if (
    newStatus !== undefined &&
    !isAssetStatus(newStatus)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          `newStatus must be one of: ${ASSET_STATUSES.join(", ")} if provided`,
      },
      { status: 400 }
    );
  }

  if (
    metadata !== undefined &&
    !isJsonValue(metadata)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "metadata must contain valid JSON values if provided",
      },
      { status: 400 }
    );
  }

  if (
    createdAt !== undefined &&
    !isValidDateString(createdAt)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "createdAt must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  const validatedData = {
    action,
    actor: actor.trim(),
    ...(assetId !== undefined && {
      assetId,
    }),
    ...(oldStatus !== undefined && {
      oldStatus,
    }),
    ...(newStatus !== undefined && {
      newStatus,
    }),
    ...(metadata !== undefined && {
      metadata,
    }),
    createdAt:
      createdAt !== undefined
        ? createdAt
        : new Date().toISOString(),
  };

  try {
    if (assetId !== undefined) {
      const assets =
        await db.orm.public.Asset.all();

      const asset = assets.find(
        (a) => a.id === assetId
      );

      if (!asset) {
        return NextResponse.json(
          {
            status: "error",
            message: "Asset not found",
          },
          { status: 404 }
        );
      }
    }

    const auditLog =
      await db.orm.public.AuditLog.create(
        validatedData
      );

    return NextResponse.json(
      auditLog,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create audit log:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create audit log",
      },
      { status: 500 }
    );
  }
}