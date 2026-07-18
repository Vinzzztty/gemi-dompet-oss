import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSplitBillSessionByCode } from '@/lib/split-bill';
import { enforceRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const rateLimitResponse = enforceRateLimit(_request, 'split-bill:public-session', 60, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const { sessionCode } = await params;

    const session = await getSplitBillSessionByCode(prisma, sessionCode);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Session split bill tidak ditemukan',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: session,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching split bill session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch split bill session',
        message: 'Gagal mengambil detail session split bill',
      },
      { status: 500 },
    );
  }
}
