import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

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

  console.error("Assignment authorization error:", error);

  return NextResponse.json(
    {
      status: "error",
      message: "Unable to verify administrator access",
    },
    { status: 500 }
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid assignment ID",
      },
      { status: 400 }
    );
  }

  try {
    const assignments =
      await db.orm.public.Assignment.all();

    const assignment = assignments.find(
      (a) => a.id === id
    );

    if (!assignment) {
      return NextResponse.json(
        {
          status: "error",
          message: "Assignment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      assignment,
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to fetch assignment:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch assignment",
      },
      { status: 500 }
    );
  }
}