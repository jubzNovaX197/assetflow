import { NextResponse } from "next/server";

import {
  requireAdminApiSession,
  requireAuthenticatedSession,
} from "@/lib/auth-guard";
import { db } from "@/prisma/db";

const ALLOWED_FIELDS = [
  "assetId",
  "employeeId",
  "reason",
  "processedAt",
  "notes",
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  console.error("Return request authorization error:", error);

  return NextResponse.json(
    {
      status: "error",
      message: "Unable to verify administrator access",
    },
    { status: 500 }
  );
}

function authenticatedErrorResponse(error: unknown) {
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
        message: "Access denied",
      },
      { status: 403 }
    );
  }

  console.error(
    "Return request authentication error:",
    error
  );

  return NextResponse.json(
    {
      status: "error",
      message: "Unable to verify authentication",
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
    const returnRequests =
      await db.orm.public.ReturnRequest.all();

    return NextResponse.json(
      returnRequests,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Failed to fetch return requests:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch return requests",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let session;

  try {
    session = await requireAuthenticatedSession();
  } catch (error) {
    return authenticatedErrorResponse(error);
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
    reason,
    processedAt,
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

  if (
    typeof reason !== "string" ||
    reason.trim().length === 0
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "reason is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (
    processedAt !== undefined &&
    (typeof processedAt !== "string" ||
      Number.isNaN(Date.parse(processedAt)))
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "processedAt must be a valid date string if provided",
      },
      { status: 400 }
    );
  }

  if (
    notes !== undefined &&
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

  /*
   * Employee identity comes from the authenticated session.
   * An employee cannot create a return request on behalf
   * of another employee.
   */
  if (
    session.user.role === "EMPLOYEE" &&
    employeeId !== session.user.employeeId
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "You can only create return requests for your own assigned assets",
      },
      { status: 403 }
    );
  }

  const validatedData = {
    assetId,
    employeeId,
    reason: reason.trim(),
    status: "PENDING" as const,
    requestedAt: new Date().toISOString(),
    ...(processedAt !== undefined && {
      processedAt,
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

    const employees =
      await db.orm.public.Employee.all();

    const employee = employees.find(
      (e) => e.id === employeeId
    );

    if (!employee) {
      return NextResponse.json(
        {
          status: "error",
          message: "Employee not found",
        },
        { status: 404 }
      );
    }

    if (asset.status !== "ASSIGNED") {
      return NextResponse.json(
        {
          status: "error",
          message: "Asset is not currently assigned",
        },
        { status: 409 }
      );
    }

    const assignments =
      await db.orm.public.Assignment.all();

    const activeAssignment =
      assignments.find(
        (a) =>
          a.assetId === assetId &&
          a.employeeId === employeeId &&
          a.returnedAt === null
      );

    if (!activeAssignment) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Employee is not currently assigned this asset",
        },
        { status: 409 }
      );
    }

    const returnRequest =
      await db.orm.public.ReturnRequest.create(
        validatedData
      );

    await db.orm.public.Asset.where({
      id: assetId,
    }).update({
      status: "RETURN_REQUESTED",
    });

    await db.orm.public.AuditLog.create({
      assetId,
      action: "ASSET_RETURN_REQUESTED",
      actor:
        session.user.role === "ADMIN"
          ? "Admin"
          : `Employee:${session.user.employeeId}`,
      oldStatus: "ASSIGNED",
      newStatus: "RETURN_REQUESTED",
      metadata: {
        returnRequestId: returnRequest.id,
        employeeId,
        reason,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      returnRequest,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create return request:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create return request",
      },
      { status: 500 }
    );
  }
}