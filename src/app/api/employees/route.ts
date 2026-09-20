import { NextResponse } from "next/server";

import { db } from "@/prisma/db";

const ALLOWED_FIELDS = [
  "employeeCode",
  "name",
  "email",
  "department",
  "designation",
  "phone",
  "isActive",
] as const;

export async function GET() {
  try {
    const employees = await db.orm.public.Employee.all();

    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch employees:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch employees",
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
    employeeCode,
    name,
    email,
    department,
    designation,
    phone,
    isActive,
  } = data;

  if (
    typeof employeeCode !== "string" ||
    employeeCode.trim().length === 0
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "employeeCode is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      {
        status: "error",
        message: "name is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json(
      {
        status: "error",
        message: "email is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (
    typeof department !== "string" ||
    department.trim().length === 0
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "department is required and must be a non-empty string",
      },
      { status: 400 }
    );
  }

  if (designation !== undefined && typeof designation !== "string") {
    return NextResponse.json(
      {
        status: "error",
        message: "designation must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (phone !== undefined && typeof phone !== "string") {
    return NextResponse.json(
      {
        status: "error",
        message: "phone must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (isActive !== undefined && typeof isActive !== "boolean") {
    return NextResponse.json(
      {
        status: "error",
        message: "isActive must be a boolean if provided",
      },
      { status: 400 }
    );
  }

  const validatedData = {
    employeeCode,
    name,
    email,
    department,
    ...(designation !== undefined && { designation }),
    ...(phone !== undefined && { phone }),
    ...(isActive !== undefined && { isActive }),
  };

  try {
    const employee =
      await db.orm.public.Employee.create(validatedData);

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Failed to create employee:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to create employee",
      },
      { status: 500 }
    );
  }
}