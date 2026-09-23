import { NextResponse } from "next/server";

import { requireEmployeeSession } from "@/lib/auth-guard";
import { db } from "@/prisma/db";

export async function GET() {
  try {
    const session = await requireEmployeeSession();

    const assignments = await db.orm.public.Assignment.where({
      employeeId: session.user.employeeId,
    }).all();

    const results = await Promise.all(
      assignments.map(async (assignment) => {
        const assetResults = await db.orm.public.Asset.where({
          id: assignment.assetId,
        }).all();

        const asset = assetResults[0];

        if (!asset) {
          return null;
        }

        return {
          id: assignment.id,
          assignedAt: assignment.assignedAt,
          returnedAt: assignment.returnedAt,
          assignedCondition: assignment.assignedCondition,
          returnedCondition: assignment.returnedCondition,
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
          },
        };
      }),
    );

    return NextResponse.json({
      assignments: results.filter(Boolean),
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

    console.error("Employee assignments API error:", error);

    return NextResponse.json(
      { error: "Unable to load assignment history." },
      { status: 500 },
    );
  }
}