import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getOwnedSplitBillSessionByCode,
  SplitBillValidationError,
} from '@/lib/split-bill';

interface RouteParams {
  params: Promise<{ sessionCode: string; participantId: string }>;
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(_request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode, participantId } = await params;

      const session = await prisma.$transaction(async (tx) => {
        const existingSession = await getOwnedSplitBillSessionByCode(
          tx,
          sessionCode,
          req.userId!,
        );

        if (!existingSession) {
          throw new SplitBillValidationError(
            'Session split bill tidak ditemukan atau bukan milik Anda',
          );
        }

        if (existingSession.status !== 'OPEN') {
          throw new SplitBillValidationError(
            'Session split bill sudah ditutup dan tidak bisa diubah',
          );
        }

        const participant = await tx.splitBillParticipant.findFirst({
          where: {
            id: participantId,
            sessionId: existingSession.id,
          },
          select: {
            id: true,
            isOwner: true,
          },
        });

        if (!participant) {
          throw new SplitBillValidationError(
            'Participant tidak ditemukan di session ini',
          );
        }

        if (participant.isOwner) {
          throw new SplitBillValidationError(
            'Owner tidak bisa dihapus dari session split bill',
          );
        }

        await tx.splitBillParticipant.delete({
          where: { id: participantId },
        });

        return getOwnedSplitBillSessionByCode(tx, sessionCode, req.userId!);
      });

      return NextResponse.json(
        {
          success: true,
          data: session,
          message: 'Participant berhasil dihapus',
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof SplitBillValidationError) {
        const isNotFound = error.message.includes('tidak ditemukan');
        return NextResponse.json(
          {
            success: false,
            error: isNotFound ? 'Not found' : 'Validation error',
            message: error.message,
          },
          { status: isNotFound ? 404 : 400 },
        );
      }

      console.error('Error removing split bill participant:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to remove participant',
          message: 'Gagal menghapus participant split bill',
        },
        { status: 500 },
      );
    }
  });
}
