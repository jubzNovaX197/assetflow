import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

const ALLOWED_FIELDS = [
  'assetId',
  'condition',
  'notes',
  'recordedAt',
  'recordedBy',
] as const;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  try {
    const conditionHistory = await db.orm.public.ConditionHistory.all();

    return NextResponse.json(conditionHistory, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch condition history:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch condition history',
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

  const { assetId, condition, notes, recordedAt, recordedBy } = data;

  if (typeof assetId !== 'string' || !UUID_REGEX.test(assetId)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'assetId is required and must be a valid UUID',
      },
      { status: 400 }
    );
  }

  if (typeof condition !== 'string' || condition.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'condition is required and must be a non-empty string',
      },
      { status: 400 }
    );
  }

  if (notes !== undefined && typeof notes !== 'string') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'notes must be a string if provided',
      },
      { status: 400 }
    );
  }

  if (
    recordedAt !== undefined &&
    (typeof recordedAt !== 'string' || Number.isNaN(Date.parse(recordedAt)))
  ) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'recordedAt must be a valid date string if provided',
      },
      { status: 400 }
    );
  }

  if (recordedBy !== undefined && typeof recordedBy !== 'string') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'recordedBy must be a string if provided',
      },
      { status: 400 }
    );
  }

  const validatedData: Record<string, unknown> = {
    assetId,
    condition,
    recordedAt: recordedAt !== undefined ? recordedAt : new Date().toISOString(),
  };

  if (notes !== undefined) {
    validatedData.notes = notes;
  }

  if (recordedBy !== undefined) {
    validatedData.recordedBy = recordedBy;
  }

  try {
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

    const conditionHistoryRecord = await db.orm.public.ConditionHistory.create(validatedData);

    return NextResponse.json(conditionHistoryRecord, { status: 201 });
  } catch (error) {
    console.error('Failed to create condition history record:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create condition history record',
      },
      { status: 500 }
    );
  }
}