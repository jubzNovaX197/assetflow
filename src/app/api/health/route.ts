// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/prisma/db';

export async function GET() {
  try {
    await db.orm.public.Employee.all();

    return NextResponse.json(
      {
        status: 'ok',
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Database health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        database: 'unreachable',
      },
      { status: 500 }
    );
  }
}