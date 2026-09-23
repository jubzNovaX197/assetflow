import { NextResponse } from "next/server";

import { requireEmployeeSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const session = await requireEmployeeSession();

    const assignments = await db.orm.public.Assignment.where({
      employeeId: session.user.employeeId,
    }).all();

    const activeAssignments = assignments.filter(
      (assignment) => !assignment.returnedAt,
    );

    const assets = await Promise.all(
      activeAssignments.map(async (assignment) => {
        const assetResults = await db.orm.public.Asset.where({
          id: assignment.assetId,
        }).all();

        const asset = assetResults[0];

        if (!asset) {
          return null;
        }

        return {
          assignmentId: assignment.id,
          assignedAt: assignment.assignedAt,
          assignedCondition: assignment.assignedCondition,
          notes: assignment.notes,
          asset: {
            id: asset.id,
            assetTag: asset.assetTag,
            name: asset.name,
            assetType: asset.assetType,
            category: asset.category,
            manufacturer: asset.manufacturer,
            model: asset.model,
            serialNumber: asset.serialNumber,
            condition: asset.condition,
            status: asset.status,
            warrantyExpiry: asset.warrantyExpiry,
          },
        };
      }),
    );

    return NextResponse.json({
      assets: assets.filter(Boolean),
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

    console.error("Employee assets API error:", error);

    return NextResponse.json(
      { error: "Unable to load assigned assets." },
      { status: 500 },
    );
  }
}