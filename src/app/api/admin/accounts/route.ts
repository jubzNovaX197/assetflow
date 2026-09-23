import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { requireAdminApiSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

function adminErrorResponse(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Administrator access required" },
      { status: 403 },
    );
  }

  console.error("Account authorization error:", error);

  return NextResponse.json(
    { error: "Unable to verify administrator access" },
    { status: 500 },
  );
}

export async function POST(request: Request) {
  try {
    await requireAdminApiSession();
  } catch (error) {
    return adminErrorResponse(error);
  }

  try {
    const body = await request.json();

    const employeeCode =
      typeof body.employeeCode === "string"
        ? body.employeeCode.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const department =
      typeof body.department === "string"
        ? body.department.trim()
        : "";

    const designation =
      typeof body.designation === "string"
        ? body.designation.trim()
        : null;

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : null;

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!employeeCode || !name || !email || !department || !password) {
      return NextResponse.json(
        {
          error:
            "Employee code, name, email, department, and password are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must contain at least 8 characters",
        },
        { status: 400 },
      );
    }

    const existingEmployees =
      await db.orm.public.Employee.where({
        employeeCode,
      }).all();

    if (existingEmployees.length > 0) {
      return NextResponse.json(
        {
          error: "An employee with this employee code already exists",
        },
        { status: 409 },
      );
    }

    const existingAccounts =
      await db.orm.public.UserAccount.where({
        email,
      }).all();

    if (existingAccounts.length > 0) {
      return NextResponse.json(
        {
          error: "An account with this email already exists",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const employee = await db.orm.public.Employee.create({
      employeeCode,
      name,
      email,
      department,
      designation: designation || null,
      phone: phone || null,
      isActive: true,
    });

    try {
      const account = await db.orm.public.UserAccount.create({
        employeeId: employee.id,
        email,
        passwordHash,
        role: "EMPLOYEE",
        status: "ACTIVE",
        provider: "CREDENTIALS",
        failedLoginAttempts: 0,
      });

      return NextResponse.json(
        {
          status: "success",
          message: "Employee account created successfully",
          employee: {
            id: employee.id,
            employeeCode: employee.employeeCode,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            designation: employee.designation,
            phone: employee.phone,
          },
          account: {
            id: account.id,
            email: account.email,
            role: account.role,
            status: account.status,
          },
        },
        { status: 201 },
      );
    } catch (accountError) {
      console.error(
        "Failed to create employee account:",
        accountError,
      );

      try {
        await db.orm.public.Employee.where({
          id: employee.id,
        }).delete();
      } catch (cleanupError) {
        console.error(
          "Failed to clean up employee after account creation failure:",
          cleanupError,
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create employee account",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Failed to create employee account:", error);

    return NextResponse.json(
      {
        error: "Failed to create employee account",
      },
      { status: 500 },
    );
  }
}