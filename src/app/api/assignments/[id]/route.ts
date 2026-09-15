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
        message: 'Invalid assignment ID',
      },
      { status: 400 }
    );
  }

  try {
    const assignments = await db.orm.public.Assignment.all();
    const assignment = assignments.find((a) => a.id === id);

    if (!assignment) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Assignment not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch assignment:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch assignment',
      },
      { status: 500 }
    );
  }
}