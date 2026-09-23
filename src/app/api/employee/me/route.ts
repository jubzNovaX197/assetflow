import { NextResponse } from "next/server";

import { requireEmployeeSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const session = await requireEmployeeSession();

    const employees = await db.orm.public.Employee.where({
      id: session.user.employeeId,
    }).all();

    const employee = employees[0];

    if (!employee) {
      return NextResponse.json(
        { error: "Employee profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        phone: employee.phone,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Employee access required." },
        { status: 403 },
      );
    }

    console.error("Employee profile API error:", error);

    return NextResponse.json(
      { error: "Unable to load employee profile." },
      { status: 500 },
    );
  }
}