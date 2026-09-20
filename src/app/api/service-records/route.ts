import { NextResponse } from "next/server";

import { db } from "@/prisma/db";

const ALLOWED_FIELDS = [
  "assetId",
  "issue",
  "vendor",
  "cost",
  "openedAt",
  "resolvedAt",
  "status",
  "resolution",
  "notes",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SERVICE_RECORD_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

type ServiceRecordStatus =
  (typeof SERVICE_RECORD_STATUSES)[number];

function isServiceRecordStatus(
  value: unknown
): value is ServiceRecordStatus {
  return (
    typeof value === "string" &&
    SERVICE_RECORD_STATUSES.includes(
      value as ServiceRecordStatus
    )
  );
}

export async function GET() {
  try {
    const serviceRecords =
      await db.orm.public.ServiceRecord.all();

    return NextResponse.json(serviceRecords, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch service records:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch service records",
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
    assetId,
    issue,
    vendor,
    cost,
    openedAt,
    resolvedAt,
    status,
    resolution,
    notes,
  } = data;

  if (
    typeof assetId !== "string" ||
    !UUID_REGEX.test(assetId)
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "assetId is required and must be a valid UUID",
      },
      { status: 400 }
    );
  }

  if (
    typeof issue !== "string" ||
    issue.trim().length === 0
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "issue is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (vendor !== undefined && typeof vendor !== "string") {
    return NextResponse.json(
      {
        status: "error",
        message: "vendor must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (cost !== undefined && typeof cost !== "number") {
    return NextResponse.json(
      {
        status: "error",
        message: "cost must be a number if provided",
      },
      { status: 400 }
    );
  }

  if (
    openedAt !== undefined &&
    (typeof openedAt !== "string" ||
      Number.isNaN(Date.parse(openedAt)))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "openedAt must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  if (
    resolvedAt !== undefined &&
    (typeof resolvedAt !== "string" ||
      Number.isNaN(Date.parse(resolvedAt)))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "resolvedAt must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  if (status !== undefined && !isServiceRecordStatus(status)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "status must be one of OPEN, IN_PROGRESS, COMPLETED, or CANCELLED if provided",
      },
      { status: 400 }
    );
  }

  if (
    resolution !== undefined &&
    typeof resolution !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "resolution must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (notes !== undefined && typeof notes !== "string") {
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
    issue,
    status: status ?? ("OPEN" as const),
    openedAt:
      openedAt !== undefined
        ? openedAt
        : new Date().toISOString(),
    ...(vendor !== undefined && { vendor }),
    ...(cost !== undefined && { cost: String(cost) }),
    ...(resolvedAt !== undefined && { resolvedAt }),
    ...(resolution !== undefined && { resolution }),
    ...(notes !== undefined && { notes }),
  };

  try {
    const assets = await db.orm.public.Asset.all();

    const asset = assets.find((a) => a.id === assetId);

    if (!asset) {
      return NextResponse.json(
        {
          status: "error",
          message: "Asset not found",
        },
        { status: 404 }
      );
    }

    const serviceRecord =
      await db.orm.public.ServiceRecord.create(
        validatedData
      );

    return NextResponse.json(serviceRecord, { status: 201 });
  } catch (error) {
    console.error(
      "Failed to create service record:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create service record",
      },
      { status: 500 }
    );
  }
}