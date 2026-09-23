import { NextResponse } from "next/server";

import { requireEmployeeSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await requireEmployeeSession();

    const { id } = await context.params;

    const assignments =
      await db.orm.public.Assignment.where({
        employeeId: session.user.employeeId,
      }).all();

    const assignment = assignments.find(
      (item) =>
        item.assetId === id &&
        !item.returnedAt,
    );

    if (!assignment) {
      return NextResponse.json(
        {
          error: "Asset not found in your assigned assets.",
        },
        { status: 404 },
      );
    }

    const assets =
      await db.orm.public.Asset.where({
        id,
      }).all();

    const asset = assets[0];

    if (!asset) {
      return NextResponse.json(
        {
          error: "Asset not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        assignedAt: assignment.assignedAt,
        assignedCondition: assignment.assignedCondition,
        returnedAt: assignment.returnedAt,
        returnedCondition: assignment.returnedCondition,
        notes: assignment.notes,
      },
      asset: {
        id: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        assetType: asset.assetType,
        category: asset.category,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serialNumber: asset.serialNumber,
        description: asset.description,
        purchaseDate: asset.purchaseDate,
        purchasePrice: asset.purchasePrice,
        warrantyExpiry: asset.warrantyExpiry,
        licenseKey: asset.licenseKey,
        licenseExpiry: asset.licenseExpiry,
        condition: asset.condition,
        status: asset.status,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        { error: "Employee access required." },
        { status: 403 },
      );
    }

    console.error(
      "Employee asset details API error:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load asset details.",
      },
      { status: 500 },
    );
  }
}
