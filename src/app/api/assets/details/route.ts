import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request
) {
  const url = new URL(request.url);

  const assetId = url.searchParams.get("id");

  if (!assetId || !UUID_REGEX.test(assetId)) {
    return NextResponse.json(
      {
        status: "error",
        message: "A valid asset ID is required",
      },
      { status: 400 }
    );
  }

  try {
    // --------------------------------------------------
    // 1. Get the asset
    // --------------------------------------------------

    const assets = await db.orm.public.Asset.all();

    const asset = assets.find(
      (item) => item.id === assetId
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

    // --------------------------------------------------
    // 2. Get assignments for this asset
    // --------------------------------------------------

    const assignments =
      await db.orm.public.Assignment.all();

    const assetAssignments = assignments
      .filter(
        (assignment) =>
          assignment.assetId === assetId
      )
      .sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() -
          new Date(a.assignedAt).getTime()
      );

    // --------------------------------------------------
    // 3. Find current assignment
    // --------------------------------------------------

    const currentAssignment =
      assetAssignments.find(
        (assignment) =>
          assignment.returnedAt === null
      );

    // --------------------------------------------------
    // 4. Get employees
    // --------------------------------------------------

    const employees =
      await db.orm.public.Employee.all();

    const currentEmployee = currentAssignment
      ? employees.find(
          (employee) =>
            employee.id ===
            currentAssignment.employeeId
        ) ?? null
      : null;

    // --------------------------------------------------
    // 5. Get service records
    // --------------------------------------------------

    const serviceRecords =
      await db.orm.public.ServiceRecord.all();

    const assetServiceRecords =
      serviceRecords
        .filter(
          (record) =>
            record.assetId === assetId
        )
        .sort(
          (a, b) =>
            new Date(b.openedAt).getTime() -
            new Date(a.openedAt).getTime()
        );

    // --------------------------------------------------
    // 6. Get condition history
    // --------------------------------------------------

    const conditionHistory =
      await db.orm.public.ConditionHistory.all();

    const assetConditionHistory =
      conditionHistory
        .filter(
          (record) =>
            record.assetId === assetId
        )
        .sort(
          (a, b) =>
            new Date(b.recordedAt).getTime() -
            new Date(a.recordedAt).getTime()
        );

    // --------------------------------------------------
    // 7. Get return requests
    // --------------------------------------------------

    const returnRequests =
      await db.orm.public.ReturnRequest.all();

    const assetReturnRequests =
      returnRequests
        .filter(
          (request) =>
            request.assetId === assetId
        )
        .sort(
          (a, b) =>
            new Date(b.requestedAt).getTime() -
            new Date(a.requestedAt).getTime()
        );

    // --------------------------------------------------
    // 8. Get audit logs
    // --------------------------------------------------

    const auditLogs =
      await db.orm.public.AuditLog.all();

    const assetAuditLogs =
      auditLogs
        .filter(
          (log) =>
            log.assetId === assetId
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

    // --------------------------------------------------
    // 9. Return complete asset details
    // --------------------------------------------------

    return NextResponse.json(
      {
        status: "success",

        asset,

        currentEmployee,

        currentAssignment:
          currentAssignment ?? null,

        assignments: assetAssignments,

        serviceRecords:
          assetServiceRecords,

        conditionHistory:
          assetConditionHistory,

        returnRequests:
          assetReturnRequests,

        auditLogs:
          assetAuditLogs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to fetch asset details:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Failed to fetch asset details",
      },
      { status: 500 }
    );
  }
}