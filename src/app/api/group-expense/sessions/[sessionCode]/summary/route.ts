import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildGroupExpenseSessionSummary,
  getGroupExpenseSessionByCode,
} from '@/lib/group-expense';
import { enforceRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const rateLimitResponse = enforceRateLimit(_request, 'group-expense:public-summary', 60, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const { sessionCode } = await params;
    const session = await getGroupExpenseSessionByCode(prisma, sessionCode);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
          message: 'Session talangan tidak ditemukan',
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: buildGroupExpenseSessionSummary(session),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching group expense summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch group expense summary',
        message: 'Gagal mengambil ringkasan talangan',
      },
      { status: 500 },
    );
  }
}
