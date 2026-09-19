import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

const ALLOWED_FIELDS = [
  'assetId',
  'action',
  'actor',
  'oldStatus',
  'newStatus',
  'metadata',
  'createdAt',
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const auditLogs = await db.orm.public.AuditLog.all();

    return NextResponse.json(auditLogs, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch audit logs',
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
    console.error('Failed to parse request JSON:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Request body must be valid JSON',
      },
      { status: 400 }
    );
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Request body must be a JSON object',
      },
      { status: 400 }
    );
  }

  const data = body as Record<string, unknown>;

  const unknownFields = Object.keys(data).filter(
    (key) => !ALLOWED_FIELDS.includes(key as (typeof ALLOWED_FIELDS)[number])
  );

  if (unknownFields.length > 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: `Unknown field(s): ${unknownFields.join(', ')}`,
      },
      { status: 400 }
    );
  }

  const { assetId, action, actor, oldStatus, newStatus, metadata, createdAt } = data;

  if (assetId !== undefined && (typeof assetId !== 'string' || !UUID_REGEX.test(assetId))) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'assetId must be a valid UUID if provided',
      },
      { status: 400 }
    );
  }

  if (typeof action !== 'string' || action.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'action is required and must be a non-empty string',
      },
      { status: 400 }
    );
  }

  if (actor !== undefined && typeof actor !== 'string') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'actor must be a string if provided',
      },
      { status: 400 }
    );
  }

  if (oldStatus !== undefined && typeof oldStatus !== 'string') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'oldStatus must be a string if provided',
      },
      { status: 400 }
    );
  }

  if (newStatus !== undefined && typeof newStatus !== 'string') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'newStatus must be a string if provided',
      },
      { status: 400 }
    );
  }

  if (
    metadata !== undefined &&
    (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))
  ) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'metadata must be a JSON object if provided',
      },
      { status: 400 }
    );
  }

  if (
    createdAt !== undefined &&
    (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt)))
  ) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'createdAt must be a valid date string if provided',
      },
      { status: 400 }
    );
  }

  const validatedData: Record<string, unknown> = {
    action,
    createdAt: createdAt !== undefined ? createdAt : new Date().toISOString(),
  };

  if (assetId !== undefined) {
    validatedData.assetId = assetId;
  }

  if (actor !== undefined) {
    validatedData.actor = actor;
  }

  if (oldStatus !== undefined) {
    validatedData.oldStatus = oldStatus;
  }

  if (newStatus !== undefined) {
    validatedData.newStatus = newStatus;
  }

  if (metadata !== undefined) {
    validatedData.metadata = metadata;
  }

  try {
    if (assetId !== undefined) {
      const assets = await db.orm.public.Asset.all();
      const asset = assets.find((a) => a.id === assetId);

      if (!asset) {
        return NextResponse.json(
          {
            status: 'error',
            message: 'Asset not found',
          },
          { status: 404 }
        );
      }
    }

    const auditLog = await db.orm.public.AuditLog.create(validatedData);

    return NextResponse.json(auditLog, { status: 201 });
  } catch (error) {
    console.error('Failed to create audit log:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create audit log',
      },
      { status: 500 }
    );
  }
}