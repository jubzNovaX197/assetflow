import { NextResponse } from "next/server";

import { db } from "@/prisma/db";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ACTIONS = [
  "SEND_TO_REPAIR",
  "COMPLETE_REPAIR",
  "RETIRE",
] as const;

type LifecycleAction = (typeof ACTIONS)[number];

function isLifecycleAction(
  value: unknown
): value is LifecycleAction {
  return (
    typeof value === "string" &&
    ACTIONS.includes(value as LifecycleAction)
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid asset ID",
      },
      { status: 400 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    console.error(
      "Failed to parse lifecycle request:",
      error
    );

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

  const {
    action,
    vendor,
    issue,
    notes,
    resolution,
  } = data;

  if (!isLifecycleAction(action)) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "action must be one of SEND_TO_REPAIR, COMPLETE_REPAIR, or RETIRE",
      },
      { status: 400 }
    );
  }

  if (
    vendor !== undefined &&
    typeof vendor !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "vendor must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (
    issue !== undefined &&
    typeof issue !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "issue must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (
    notes !== undefined &&
    typeof notes !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message: "notes must be a string if provided",
      },
      { status: 400 }
    );
  }

  if (
    resolution !== undefined &&
    typeof resolution !== "string"
  ) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "resolution must be a string if provided",
      },
      { status: 400 }
    );
  }

  try {
    const assets =
      await db.orm.public.Asset.all();

    const asset = assets.find(
      (item) => item.id === id
    );

    if (!asset) {
      return NextResponse.json(
        {
          status: "error",
          message: "Asset not found",
        },
        { status: 404 }
      );
    }

    /*
     * SEND_TO_REPAIR
     *
     * AVAILABLE -> IN_REPAIR
     * ASSIGNED -> IN_REPAIR
     */

    if (action === "SEND_TO_REPAIR") {
      if (
        asset.status !== "ASSIGNED" &&
        asset.status !== "AVAILABLE"
      ) {
        return NextResponse.json(
          {
            status: "error",
            message:
              "Only AVAILABLE or ASSIGNED assets can be sent for repair",
          },
          { status: 400 }
        );
      }

      const oldStatus = asset.status;

      const serviceRecord =
        await db.orm.public.ServiceRecord.create({
          assetId: id,
          issue:
            typeof issue === "string" &&
            issue.trim().length > 0
              ? issue.trim()
              : "Asset sent for repair",
          status: "OPEN",
          openedAt: new Date().toISOString(),

          ...(typeof vendor === "string" &&
            vendor.trim().length > 0 && {
              vendor: vendor.trim(),
            }),

          ...(typeof notes === "string" &&
            notes.trim().length > 0 && {
              notes: notes.trim(),
            }),
        });

      await db.orm.public.Asset.where({ id }).update({
        status: "IN_REPAIR",
      });

      await db.orm.public.AuditLog.create({
        assetId: id,
        action: "ASSET_SENT_TO_REPAIR",
        actor: "Admin",
        oldStatus,
        newStatus: "IN_REPAIR",
        metadata: {
          serviceRecordId: serviceRecord.id,
          issue: serviceRecord.issue,
        },
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          status: "success",
          message: "Asset sent for repair",
          asset: {
            ...asset,
            status: "IN_REPAIR",
          },
          serviceRecord,
        },
        { status: 200 }
      );
    }

    /*
     * COMPLETE_REPAIR
     *
     * IN_REPAIR -> AVAILABLE
     */

    if (action === "COMPLETE_REPAIR") {
      if (asset.status !== "IN_REPAIR") {
        return NextResponse.json(
          {
            status: "error",
            message:
              "Only an asset currently IN_REPAIR can have its repair completed",
          },
          { status: 400 }
        );
      }

      const serviceRecords =
        await db.orm.public.ServiceRecord.all();

      const openServiceRecord = serviceRecords
        .filter(
          (record) =>
            record.assetId === id &&
            (record.status === "OPEN" ||
              record.status === "IN_PROGRESS")
        )
        .sort(
          (a, b) =>
            new Date(b.openedAt).getTime() -
            new Date(a.openedAt).getTime()
        )[0];

      const now = new Date().toISOString();

      let updatedServiceRecord:
        | typeof openServiceRecord
        | null = openServiceRecord ?? null;

      if (openServiceRecord) {
        await db.orm.public.ServiceRecord.where({
          id: openServiceRecord.id,
        }).update({
          status: "COMPLETED",
          resolvedAt: now,

          ...(typeof resolution === "string" &&
            resolution.trim().length > 0 && {
              resolution: resolution.trim(),
            }),

          ...(typeof notes === "string" &&
            notes.trim().length > 0 && {
              notes: notes.trim(),
            }),
        });

        const updatedServiceRecords =
          await db.orm.public.ServiceRecord.all();

        updatedServiceRecord =
          updatedServiceRecords.find(
            (record) =>
              record.id === openServiceRecord.id
          ) ?? null;
      }

      await db.orm.public.Asset.where({ id }).update({
        status: "AVAILABLE",
      });

      await db.orm.public.AuditLog.create({
        assetId: id,
        action: "ASSET_REPAIR_COMPLETED",
        actor: "Admin",
        oldStatus: "IN_REPAIR",
        newStatus: "AVAILABLE",
        metadata: {
          serviceRecordId:
            openServiceRecord?.id ?? null,
          resolution:
            typeof resolution === "string" &&
            resolution.trim().length > 0
              ? resolution.trim()
              : null,
        },
        createdAt: now,
      });

      return NextResponse.json(
        {
          status: "success",
          message: "Repair completed",
          asset: {
            ...asset,
            status: "AVAILABLE",
          },
          serviceRecord: updatedServiceRecord,
        },
        { status: 200 }
      );
    }

    /*
     * RETIRE
     *
     * AVAILABLE -> RETIRED
     */

    if (action === "RETIRE") {
      if (asset.status !== "AVAILABLE") {
        return NextResponse.json(
          {
            status: "error",
            message:
              "Only AVAILABLE assets can be retired",
          },
          { status: 400 }
        );
      }

      await db.orm.public.Asset.where({ id }).update({
        status: "RETIRED",
      });

      await db.orm.public.AuditLog.create({
        assetId: id,
        action: "ASSET_RETIRED",
        actor: "Admin",
        oldStatus: "AVAILABLE",
        newStatus: "RETIRED",
        metadata: null,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          status: "success",
          message: "Asset retired",
          asset: {
            ...asset,
            status: "RETIRED",
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Unsupported lifecycle action",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "Failed to perform asset lifecycle action:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Failed to perform asset lifecycle action",
      },
      { status: 500 }
    );
  }
}