import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

const ALLOWED_FIELDS = [
  "assetId",
  "condition",
  "notes",
  "recordedBy",
  "recordedAt",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ASSET_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "DAMAGED",
] as const;

type AssetCondition =
  (typeof ASSET_CONDITIONS)[number];

function isAssetCondition(
  value: unknown
): value is AssetCondition {
  return (
    value === "EXCELLENT" ||
    value === "GOOD" ||
    value === "FAIR" ||
    value === "DAMAGED"
  );
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
    "Condition history authorization error:",
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
    const conditionHistory =
      await db.orm.public.ConditionHistory.all();

    return NextResponse.json(
      conditionHistory,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to fetch condition history:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Failed to fetch condition history",
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
    condition,
    notes,
    recordedBy,
    recordedAt,
  } = data;

  if (
    typeof assetId !== "string" ||
    !UUID_REGEX.test(assetId)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "assetId is required and must be a valid UUID",
      },
      { status: 400 }
    );
  }

  if (!isAssetCondition(condition)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "condition is required and must be one of EXCELLENT, GOOD, FAIR, or DAMAGED",
      },
      { status: 400 }
    );
  }

  if (
    notes !== undefined &&
    notes !== null &&
    typeof notes !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "notes must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (
    recordedBy !== undefined &&
    recordedBy !== null &&
    typeof recordedBy !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "recordedBy must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (
    recordedAt !== undefined &&
    !isValidDateString(recordedAt)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "recordedAt must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  const validatedData = {
    assetId,
    condition,
    ...(notes !== undefined && {
      notes,
    }),
    ...(recordedBy !== undefined && {
      recordedBy,
    }),
    recordedAt:
      recordedAt !== undefined
        ? recordedAt
        : new Date().toISOString(),
  };

  try {
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

    const conditionHistory =
      await db.orm.public.ConditionHistory.create(
        validatedData
      );

    return NextResponse.json(
      conditionHistory,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create condition history:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Failed to create condition history",
      },
      { status: 500 }
    );
  }
}