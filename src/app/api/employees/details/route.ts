import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("id");

  if (!employeeId || !UUID_REGEX.test(employeeId)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid employee ID",
      },
      { status: 400 }
    );
  }

  try {
    const employees = await db.orm.public.Employee.all();

    const employee = employees.find(
      (item) => item.id === employeeId
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

    const assignments =
      await db.orm.public.Assignment.all();

    const employeeAssignments = assignments
      .filter(
        (assignment) =>
          assignment.employeeId === employeeId
      )
      .sort(
        (a, b) =>
          new Date(b.assignedAt).getTime() -
          new Date(a.assignedAt).getTime()
      );

    const assets = await db.orm.public.Asset.all();

    const currentAssignments =
      employeeAssignments.filter(
        (assignment) => assignment.returnedAt === null
      );

    const previousAssignments =
      employeeAssignments.filter(
        (assignment) => assignment.returnedAt !== null
      );

    const currentAssets = currentAssignments
      .map((assignment) =>
        assets.find(
          (asset) => asset.id === assignment.assetId
        )
      )
      .filter((asset) => asset !== undefined);

    const previousAssets = previousAssignments
      .map((assignment) =>
        assets.find(
          (asset) => asset.id === assignment.assetId
        )
      )
      .filter((asset) => asset !== undefined);

    const returnRequests =
      await db.orm.public.ReturnRequest.all();

    const employeeReturnRequests = returnRequests
      .filter(
        (request) =>
          request.employeeId === employeeId
      )
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime()
      );

    return NextResponse.json(
      {
        status: "success",
        employee,
        currentAssets,
        previousAssets,
        assignments: employeeAssignments,
        returnRequests: employeeReturnRequests,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to fetch employee details:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch employee details",
      },
      { status: 500 }
    );
  }
}