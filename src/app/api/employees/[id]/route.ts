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
        message: 'Invalid employee ID',
      },
      { status: 400 }
    );
  }

  try {
    const employees = await db.orm.public.Employee.all();
    const employee = employees.find((e) => e.id === id);

    if (!employee) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Employee not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(employee, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch employee:', error);

    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch employee',
      },
      { status: 500 }
    );
  }
}