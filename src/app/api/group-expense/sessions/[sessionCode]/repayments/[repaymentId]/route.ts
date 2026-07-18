import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string; repaymentId: string }>;
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed || null;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode, repaymentId } = await params;
      const body = await request.json();

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

      if (!['ACTIVE', 'FROZEN'].includes(existingSession.status)) {
        throw new GroupExpenseValidationError(
          'Session talangan tidak bisa mengubah repayment saat ini',
        );
      }

      const existingRepayment = existingSession.repayments.find(
        (repayment) => repayment.id === repaymentId,
      );

      if (!existingRepayment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Repayment tidak ditemukan di session ini',
          },
          { status: 404 },
        );
      }

      const fromParticipantId =
        body.fromParticipantId !== undefined
          ? String(body.fromParticipantId ?? '').trim()
          : existingRepayment.fromParticipantId;
      const toParticipantId =
        body.toParticipantId !== undefined
          ? String(body.toParticipantId ?? '').trim()
          : existingRepayment.toParticipantId;
      const amount =
        body.amount !== undefined
          ? Number(body.amount)
          : Number(existingRepayment.amount);
      const currency =
        body.currency !== undefined
          ? String(body.currency ?? '').trim().toUpperCase()
          : existingRepayment.currency;
      const notes =
        body.notes !== undefined
          ? normalizeOptionalText(body.notes)
          : existingRepayment.notes;
      const paidAt =
        body.paidAt !== undefined
          ? new Date(String(body.paidAt ?? ''))
          : existingRepayment.paidAt;

      if (!fromParticipantId || !toParticipantId) {
        throw new GroupExpenseValidationError(
          'Participant pengirim dan penerima repayment harus dipilih',
        );
      }

      if (fromParticipantId === toParticipantId) {
        throw new GroupExpenseValidationError(
          'Pengirim dan penerima repayment tidak boleh sama',
        );
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new GroupExpenseValidationError(
          'Nominal repayment harus lebih besar dari 0',
        );
      }

      if (!currency || currency.length > 10) {
        throw new GroupExpenseValidationError('Currency repayment tidak valid');
      }

      if (Number.isNaN(paidAt.getTime())) {
        throw new GroupExpenseValidationError('Tanggal repayment tidak valid');
      }

      const participantIds = new Set(
        existingSession.participants.map((participant) => participant.id),
      );

      if (
        !participantIds.has(fromParticipantId) ||
        !participantIds.has(toParticipantId)
      ) {
        throw new GroupExpenseValidationError(
          'Participant repayment tidak valid untuk session ini',
        );
      }

      await prisma.groupExpenseRepayment.update({
        where: {
          id: existingRepayment.id,
        },
        data: {
          fromParticipantId,
          toParticipantId,
          amount,
          currency,
          notes,
          paidAt,
        },
      });

      const updatedSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!updatedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah repayment diperbarui',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Repayment berhasil diperbarui',
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

      console.error('Error updating group expense repayment:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update group expense repayment',
          message: 'Gagal memperbarui repayment talangan',
        },
        { status: 500 },
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode, repaymentId } = await params;

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

      if (!['ACTIVE', 'FROZEN'].includes(existingSession.status)) {
        throw new GroupExpenseValidationError(
          'Session talangan tidak bisa menghapus repayment saat ini',
        );
      }

      const existingRepayment = existingSession.repayments.find(
        (repayment) => repayment.id === repaymentId,
      );

      if (!existingRepayment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Repayment tidak ditemukan di session ini',
          },
          { status: 404 },
        );
      }

      await prisma.groupExpenseRepayment.delete({
        where: {
          id: existingRepayment.id,
        },
      });

      const updatedSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!updatedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah repayment dihapus',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Repayment berhasil dihapus',
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

      console.error('Error deleting group expense repayment:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete group expense repayment',
          message: 'Gagal menghapus repayment talangan',
        },
        { status: 500 },
      );
    }
  });
}
