import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  buildGroupExpenseSessionSummary,
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode } = await params;
      const body = await request.json();
      const label =
        typeof body.label === 'string' && body.label.trim()
          ? body.label.trim()
          : null;
      const notes =
        typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim()
          : null;
      const closeSession = Boolean(body.closeSession);

      const existingSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!existingSession) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Session talangan tidak ditemukan atau bukan milik Anda',
          },
          { status: 404 },
        );
      }

      const summary = buildGroupExpenseSessionSummary(existingSession);

      const snapshot = await prisma.groupExpenseSettlementSnapshot.create({
        data: {
          sessionId: existingSession.id,
          createdByUserId: req.userId!,
          label,
          notes,
          entries: {
            create: summary.balances.map((balance) => ({
              participantId: balance.participantId,
              netAmount: balance.netBalance,
              role: balance.role,
            })),
          },
        },
        include: {
          entries: {
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              participant: {
                select: {
                  id: true,
                  displayName: true,
                  userId: true,
                  isOwner: true,
                },
              },
            },
          },
        },
      });

      if (closeSession) {
        await prisma.groupExpenseSession.update({
          where: {
            id: existingSession.id,
          },
          data: {
            status: 'SETTLED',
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            snapshot,
            summary,
            sessionStatus: closeSession ? 'SETTLED' : existingSession.status,
          },
          message: closeSession
            ? 'Session talangan berhasil difinalkan'
            : 'Snapshot settlement berhasil dibuat',
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof GroupExpenseValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: error.message,
          },
          { status: 400 },
        );
      }

      console.error('Error finalizing group expense session:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to finalize group expense session',
          message: 'Gagal membuat settlement talangan',
        },
        { status: 500 },
      );
    }
  });
}
