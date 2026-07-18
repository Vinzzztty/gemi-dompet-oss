import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string; participantId: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode, participantId } = await params;

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

      const participant = await prisma.groupExpenseParticipant.findFirst({
        where: {
          id: participantId,
          sessionId: existingSession.id,
        },
        select: {
          id: true,
          displayName: true,
          isOwner: true,
          _count: {
            select: {
              paidItems: true,
              itemShares: true,
              repaymentsSent: true,
              repaymentsReceived: true,
              settlementEntries: true,
            },
          },
        },
      });

      if (!participant) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Participant tidak ditemukan di session ini',
          },
          { status: 404 },
        );
      }

      if (participant.isOwner) {
        throw new GroupExpenseValidationError(
          'Owner tidak bisa dihapus dari session talangan',
        );
      }

      const hasFinancialHistory =
        participant._count.paidItems > 0 ||
        participant._count.itemShares > 0 ||
        participant._count.repaymentsSent > 0 ||
        participant._count.repaymentsReceived > 0 ||
        participant._count.settlementEntries > 0;

      if (hasFinancialHistory) {
        throw new GroupExpenseValidationError(
          'Participant yang sudah punya histori talangan tidak bisa dihapus',
        );
      }

      await prisma.groupExpenseParticipant.delete({
        where: {
          id: participantId,
        },
      });

      const updatedSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!updatedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah participant dihapus',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Participant berhasil dihapus',
        },
        { status: 200 },
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

      console.error('Error removing group expense participant:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to remove group expense participant',
          message: 'Gagal menghapus participant talangan',
        },
        { status: 500 },
      );
    }
  });
}
