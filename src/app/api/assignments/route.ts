import { NextResponse } from "next/server";

import { db } from "@/prisma/db";

const ALLOWED_FIELDS = [
  "assetId",
  "employeeId",
  "assignedAt",
  "returnedAt",
  "assignedCondition",
  "returnedCondition",
  "notes",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ASSET_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "FAIR",
  "DAMAGED",
] as const;

type AssetCondition = (typeof ASSET_CONDITIONS)[number];

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
  if (typeof value !== "string") {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

export async function GET() {
  try {
    const assignments =
      await db.orm.public.Assignment.all();

    return NextResponse.json(assignments, {
      status: 200,
    });
  } catch (error) {
    console.error(
      "Failed to fetch assignments:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch assignments",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    assetId,
    employeeId,
    assignedAt,
    returnedAt,
    assignedCondition,
    returnedCondition,
    notes,
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

  if (
    typeof employeeId !== "string" ||
    !UUID_REGEX.test(employeeId)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "employeeId is required and must be a valid UUID",
      },
      { status: 400 }
    );
  }

  if (!isValidDateString(assignedAt)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "assignedAt is required and must be a valid date string",
      },
      { status: 400 }
    );
  }

  if (!isAssetCondition(assignedCondition)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "assignedCondition is required and must be one of EXCELLENT, GOOD, FAIR, or DAMAGED",
      },
      { status: 400 }
    );
  }

  if (
    returnedAt !== undefined &&
    !isValidDateString(returnedAt)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "returnedAt must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  if (
    returnedCondition !== undefined &&
    returnedCondition !== null &&
    !isAssetCondition(returnedCondition)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "returnedCondition must be EXCELLENT, GOOD, FAIR, or DAMAGED if provided",
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
        message: "notes must be a string if provided",
      },
      { status: 400 }
    );
  }

  const validatedData = {
    assetId,
    employeeId,
    assignedAt,
    assignedCondition,
    ...(returnedAt !== undefined && {
      returnedAt,
    }),
    ...(returnedCondition !== undefined && {
      returnedCondition,
    }),
    ...(notes !== undefined && {
      notes,
    }),
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

    if (asset.status !== "AVAILABLE") {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Asset is not available for assignment",
        },
        { status: 409 }
      );
    }

    const assignment =
      await db.orm.public.Assignment.create(
        validatedData
      );

    await db.orm.public.Asset.where({
      id: assetId,
    }).update({
      status: "ASSIGNED",
    });

    await db.orm.public.AuditLog.create({
      assetId,
      action: "ASSET_ASSIGNED",
      actor: "Admin",
      oldStatus: "AVAILABLE",
      newStatus: "ASSIGNED",
      metadata: {
        assignmentId: assignment.id,
        employeeId,
        assignedCondition,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      assignment,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create assignment:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create assignment",
      },
      { status: 500 }
    );
  }
}