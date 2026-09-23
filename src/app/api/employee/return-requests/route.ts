import { NextResponse } from "next/server";

import { requireEmployeeSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const session = await requireEmployeeSession();

    const returnRequests =
      await db.orm.public.ReturnRequest.where({
        employeeId: session.user.employeeId,
      }).all();

    return NextResponse.json(returnRequests, {
      status: 200,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "Authentication required",
        },
        { status: 401 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: "Employee access required",
        },
        { status: 403 },
      );
    }

    console.error(
      "Failed to fetch employee return requests:",
      error,
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch return requests",
      },
      { status: 500 },
    );
  }
}
