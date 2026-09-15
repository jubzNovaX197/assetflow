import { NextResponse } from 'next/server';

import { db } from '@/prisma/db';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid asset ID',
      },
      { status: 400 }
    );
  }

  try {
    const assets = await db.orm.public.Asset.all();
    const asset = assets.find((a) => a.id === id);

    if (!asset) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Asset not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(asset, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch asset:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch asset',
      },
      { status: 500 }
    );
  }
}