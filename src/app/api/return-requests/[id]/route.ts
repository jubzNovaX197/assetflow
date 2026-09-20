import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: 'Invalid return request ID' },
      { status: 400 }
    );
  }

  try {
    const returnRequests = await db.orm.public.ReturnRequest.all();
    const returnRequest = returnRequests.find((r) => r.id === id);

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    if (returnRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only a PENDING return request can be completed' },
        { status: 400 }
      );
    }

    const assignments = await db.orm.public.Assignment.all();
    const activeAssignment = assignments.find(
      (a) =>
        a.assetId === returnRequest.assetId &&
        a.employeeId === returnRequest.employeeId &&
        a.returnedAt === null
    );

    if (!activeAssignment) {
      return NextResponse.json(
        { error: 'Active assignment not found' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await db.orm.public.ReturnRequest.where({ id }).update({
      status: 'COMPLETED',
      processedAt: now,
    });

    await db.orm.public.Assignment.where({ id: activeAssignment.id }).update({
      returnedAt: now,
    });

    await db.orm.public.Asset.where({ id: returnRequest.assetId }).update({
      status: 'AVAILABLE',
    });

    const updatedReturnRequests = await db.orm.public.ReturnRequest.all();
    const updatedReturnRequest = updatedReturnRequests.find((r) => r.id === id);

    return NextResponse.json(updatedReturnRequest, { status: 200 });
  } catch (error) {
    console.error('Failed to process return request:', error);

    return NextResponse.json(
      { error: 'Failed to process return request' },
      { status: 500 }
    );
  }
}