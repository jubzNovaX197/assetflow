import { NextResponse } from 'next/server';

import { db } from '@/prisma/db';

const ALLOWED_FIELDS = [
  'assetTag',
  'name',
  'assetType',
  'category',
  'manufacturer',
  'model',
  'serialNumber',
  'description',
  'purchaseDate',
  'purchasePrice',
  'warrantyExpiry',
  'licenseKey',
  'licenseExpiry',
  'condition',
  'status',
] as const;

export async function GET() {
  try {
    const assets = await db.orm.public.Asset.all();

    return NextResponse.json(assets, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch assets:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch assets',
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

  const {
    assetTag,
    name,
    assetType,
    category,
    manufacturer,
    model,
    serialNumber,
    description,
    purchaseDate,
    purchasePrice,
    warrantyExpiry,
    licenseKey,
    licenseExpiry,
    condition,
    status,
  } = data;

  if (typeof assetTag !== 'string' || assetTag.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'assetTag is required and must be a non-empty string',
      },
      { status: 400 }
    );
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'name is required and must be a non-empty string',
      },
      { status: 400 }
    );
  }

  if (typeof assetType !== 'string' || assetType.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'assetType is required and must be a non-empty string',
      },
      { status: 400 }
    );
  }

  if (typeof category !== 'string' || category.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'category is required and must be a non-empty string',
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

  if (typeof status !== 'string' || status.trim().length === 0) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'status is required and must be a non-empty string',
      },
      { status: 400 }
    );
  }

  const optionalStringFields = {
    manufacturer,
    model,
    serialNumber,
    description,
    licenseKey,
  };

  for (const [field, value] of Object.entries(optionalStringFields)) {
    if (value !== undefined && typeof value !== 'string') {
      return NextResponse.json(
        {
          status: 'error',
          message: `${field} must be a string if provided`,
        },
        { status: 400 }
      );
    }
  }

  if (
    purchaseDate !== undefined &&
    (typeof purchaseDate !== 'string' || Number.isNaN(Date.parse(purchaseDate)))
  ) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'purchaseDate must be a valid date string if provided',
      },
      { status: 400 }
    );
  }

  if (
    warrantyExpiry !== undefined &&
    (typeof warrantyExpiry !== 'string' ||
      Number.isNaN(Date.parse(warrantyExpiry)))
  ) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'warrantyExpiry must be a valid date string if provided',
      },
      { status: 400 }
    );
  }

  if (
    licenseExpiry !== undefined &&
    (typeof licenseExpiry !== 'string' ||
      Number.isNaN(Date.parse(licenseExpiry)))
  ) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'licenseExpiry must be a valid date string if provided',
      },
      { status: 400 }
    );
  }

  if (purchasePrice !== undefined && typeof purchasePrice !== 'number') {
    return NextResponse.json(
      {
        status: 'error',
        message: 'purchasePrice must be a number if provided',
      },
      { status: 400 }
    );
  }

  const validatedData: Record<string, unknown> = {
    assetTag,
    name,
    assetType,
    category,
    condition,
    status,
  };

  if (manufacturer !== undefined) validatedData.manufacturer = manufacturer;
  if (model !== undefined) validatedData.model = model;
  if (serialNumber !== undefined) validatedData.serialNumber = serialNumber;
  if (description !== undefined) validatedData.description = description;
  if (purchaseDate !== undefined) validatedData.purchaseDate = purchaseDate;
  if (purchasePrice !== undefined) validatedData.purchasePrice = purchasePrice;
  if (warrantyExpiry !== undefined) {
    validatedData.warrantyExpiry = warrantyExpiry;
  }
  if (licenseKey !== undefined) validatedData.licenseKey = licenseKey;
  if (licenseExpiry !== undefined) validatedData.licenseExpiry = licenseExpiry;

  try {
    const asset = await db.orm.public.Asset.create(validatedData);

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Failed to create asset:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create asset',
      },
      { status: 500 }
    );
  }
}