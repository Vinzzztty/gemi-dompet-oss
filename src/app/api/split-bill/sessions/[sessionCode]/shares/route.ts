import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  buildEqualSplitShares,
  getOwnedSplitBillSessionByCode,
  SplitBillValidationError,
  validateManualSplitShares,
} from '@/lib/split-bill';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

type ManualShareBody = {
  participantId: string;
  amount: number;
  notes?: string | null;
};

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode } = await params;
      const body = await request.json();
      const mode = String(body.mode ?? '').trim().toLowerCase();

      if (!['equal', 'manual'].includes(mode)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Mode split harus equal atau manual',
          },
          { status: 400 },
        );
      }

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

        const participantIds = existingSession.participants.map((participant) => participant.id);
        if (participantIds.length === 0) {
          throw new SplitBillValidationError(
            'Belum ada participant di session split bill',
          );
        }

        const shares =
          mode === 'equal'
            ? buildEqualSplitShares(existingSession.totalAmount, participantIds)
            : validateManualSplitShares(
                existingSession.totalAmount,
                participantIds,
                (body.shares ?? []) as ManualShareBody[],
              );

        await tx.splitBillShare.deleteMany({
          where: {
            sessionId: existingSession.id,
          },
        });

        await tx.splitBillShare.createMany({
          data: shares.map((share) => ({
            sessionId: existingSession.id,
            participantId: share.participantId,
            amount: share.amount,
            notes: share.notes ?? null,
          })),
        });

        return getOwnedSplitBillSessionByCode(tx, sessionCode, req.userId!);
      });

      return NextResponse.json(
        {
          success: true,
          data: session,
          message:
            mode === 'equal'
              ? 'Split bill dibagi rata'
              : 'Split bill manual berhasil disimpan',
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

      console.error('Error updating split bill shares:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update split bill shares',
          message: 'Gagal memperbarui pembagian split bill',
        },
        { status: 500 },
      );
    }
  });
}
