import { NextResponse } from "next/server";

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

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await context.params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Invalid return request ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
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
          error:
            "returnedCondition must be EXCELLENT, GOOD, FAIR, or DAMAGED",
        },
        { status: 400 }
      );
    }

    const returnRequests =
      await db.orm.public.ReturnRequest.all();

    const returnRequest =
      returnRequests.find(
        (request) => request.id === id
      );

    if (!returnRequest) {
      return NextResponse.json(
        { error: "Return request not found" },
        { status: 404 }
      );
    }

    if (returnRequest.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "Only a PENDING return request can be completed",
        },
        { status: 400 }
      );
    }

    const assignments =
      await db.orm.public.Assignment.all();

    const activeAssignment =
      assignments.find(
        (assignment) =>
          assignment.assetId ===
            returnRequest.assetId &&
          assignment.employeeId ===
            returnRequest.employeeId &&
          assignment.returnedAt === null
      );

    if (!activeAssignment) {
      return NextResponse.json(
        { error: "Active assignment not found" },
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
        error:
          "Failed to process return request",
      },
      { status: 500 }
    );
  }
}