import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApiSession();
  } catch (error) {
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

    console.error("Employee authorization error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to verify administrator access",
      },
      { status: 500 }
    );
  }

  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
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

    const employee = employees.find((e) => e.id === id);

    if (!employee) {
      return NextResponse.json(
        {
          status: "error",
          message: "Employee not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch employee:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch employee",
      },
      { status: 500 }
    );
  }
}