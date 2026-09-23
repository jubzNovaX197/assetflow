import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

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
    typeof value === "string" &&
    ASSET_CONDITIONS.includes(
      value as AssetCondition
    )
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
    "Return request authorization error:",
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

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  // Only administrators can complete a return.
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  const { id } = await context.params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid return request ID",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid request body",
        },
        { status: 400 }
      );
    }

    const returnedCondition =
      "returnedCondition" in body
        ? body.returnedCondition
        : undefined;

    if (!isAssetCondition(returnedCondition)) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "returnedCondition must be EXCELLENT, GOOD, FAIR, or DAMAGED",
        },
        { status: 400 }
      );
    }

    const returnRequests =
      await db.orm.public.ReturnRequest.all();

    const returnRequest = returnRequests.find(
      (request) => request.id === id
    );

    if (!returnRequest) {
      return NextResponse.json(
        {
          status: "error",
          message: "Return request not found",
        },
        { status: 404 }
      );
    }

    if (returnRequest.status !== "PENDING") {
      return NextResponse.json(
        {
          status: "error",
          message:
            "Only a PENDING return request can be completed",
        },
        { status: 400 }
      );
    }

    const assignments =
      await db.orm.public.Assignment.all();

    const activeAssignment = assignments.find(
      (assignment) =>
        assignment.assetId ===
          returnRequest.assetId &&
        assignment.employeeId ===
          returnRequest.employeeId &&
        assignment.returnedAt === null
    );

    if (!activeAssignment) {
      return NextResponse.json(
        {
          status: "error",
          message: "Active assignment not found",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await db.orm.public.ReturnRequest.where({
      id,
    }).update({
      status: "COMPLETED",
      processedAt: now,
    });

    await db.orm.public.Assignment.where({
      id: activeAssignment.id,
    }).update({
      returnedAt: now,
      returnedCondition,
    });

    await db.orm.public.Asset.where({
      id: returnRequest.assetId,
    }).update({
      status: "AVAILABLE",
    });

    await db.orm.public.AuditLog.create({
      assetId: returnRequest.assetId,
      action: "ASSET_RETURNED",
      actor: "Admin",
      oldStatus: "RETURN_REQUESTED",
      newStatus: "AVAILABLE",
      metadata: {
        returnRequestId: returnRequest.id,
        assignmentId: activeAssignment.id,
        employeeId: returnRequest.employeeId,
        returnedCondition,
      },
      createdAt: now,
    });

    const updatedReturnRequests =
      await db.orm.public.ReturnRequest.all();

    const updatedReturnRequest =
      updatedReturnRequests.find(
        (request) => request.id === id
      );

    return NextResponse.json(
      updatedReturnRequest,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to process return request:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process return request",
      },
      { status: 500 }
    );
  }
}