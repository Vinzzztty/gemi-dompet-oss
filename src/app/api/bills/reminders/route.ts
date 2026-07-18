import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { getBillReminders } from '@/lib/bills';

// GET /api/bills/reminders?withinDays=7
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const withinDays = Math.min(
        Math.max(parseInt(searchParams.get('withinDays') || '7', 10) || 7, 1),
        90
      );

      const reminders = await getBillReminders(req.userId!, { withinDays });

      return NextResponse.json(
        {
          success: true,
          data: {
            overdue: reminders.overdue,
            upcoming: reminders.upcoming,
            totalUnpaid: reminders.totalUnpaid,
            withinDays,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching bill reminders:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch reminders',
          message: 'Gagal mengambil pengingat tagihan',
        },
        { status: 500 }
      );
    }
  });
}
