import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  buildEqualGroupExpenseShares,
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  toGroupExpenseSessionResponse,
  validateGroupExpenseSelectedParticipantIds,
  validateManualGroupExpenseShares,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string; itemId: string }>;
}

type ManualShareBody = {
  participantId: string;
  amount: number;
  notes?: string | null;
};

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
      const { sessionCode, itemId } = await params;
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

      if (existingSession.status !== 'ACTIVE') {
        throw new GroupExpenseValidationError(
          'Session talangan harus aktif untuk mengubah item',
        );
      }

      const existingItem = existingSession.items.find((item) => item.id === itemId);

      if (!existingItem) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Item talangan tidak ditemukan di session ini',
          },
          { status: 404 },
        );
      }

      const title =
        body.title !== undefined
          ? String(body.title ?? '').trim()
          : existingItem.title;
      const locationLabel =
        body.locationLabel !== undefined
          ? normalizeOptionalText(body.locationLabel)
          : existingItem.locationLabel;
      const notes =
        body.notes !== undefined
          ? normalizeOptionalText(body.notes)
          : existingItem.notes;
      const currency =
        body.currency !== undefined
          ? String(body.currency ?? '').trim().toUpperCase()
          : existingItem.currency;
      const paidByParticipantId =
        body.paidByParticipantId !== undefined
          ? String(body.paidByParticipantId ?? '').trim()
          : existingItem.paidByParticipantId;
      const splitMode =
        body.splitMode !== undefined
          ? String(body.splitMode ?? '').trim().toUpperCase()
          : existingItem.splitMode;
      const amount =
        body.amount !== undefined ? Number(body.amount) : Number(existingItem.amount);
      const incurredAt =
        body.incurredAt !== undefined
          ? new Date(String(body.incurredAt ?? ''))
          : existingItem.incurredAt;

      if (!title) {
        throw new GroupExpenseValidationError('Judul item talangan harus diisi');
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new GroupExpenseValidationError(
          'Nominal item talangan harus lebih besar dari 0',
        );
      }

      if (!currency || currency.length > 10) {
        throw new GroupExpenseValidationError('Currency item talangan tidak valid');
      }

      if (!paidByParticipantId) {
        throw new GroupExpenseValidationError('Payer item talangan harus dipilih');
      }

      if (Number.isNaN(incurredAt.getTime())) {
        throw new GroupExpenseValidationError('Waktu pengeluaran tidak valid');
      }

      if (!['EQUAL', 'MANUAL'].includes(splitMode)) {
        throw new GroupExpenseValidationError('Split mode item talangan tidak valid');
      }

      const allowedParticipantIds = existingSession.participants.map(
        (participant) => participant.id,
      );

      if (!allowedParticipantIds.includes(paidByParticipantId)) {
        throw new GroupExpenseValidationError(
          'Payer item talangan tidak ditemukan di session ini',
        );
      }

      const shares =
        splitMode === 'EQUAL'
          ? buildEqualGroupExpenseShares(
              amount,
              validateGroupExpenseSelectedParticipantIds(
                allowedParticipantIds,
                Array.isArray(body.participantIds)
                  ? body.participantIds.map((participantId: unknown) =>
                      String(participantId),
                    )
                  : existingItem.shares.map((share) => share.participantId),
              ),
            )
          : validateManualGroupExpenseShares(
              amount,
              allowedParticipantIds,
              Array.isArray(body.shares)
                ? (body.shares as ManualShareBody[])
                : existingItem.shares.map((share) => ({
                    participantId: share.participantId,
                    amount: Number(share.amount),
                    notes: share.notes,
                  })),
            );

      await prisma.groupExpenseItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          paidByParticipantId,
          title,
          locationLabel,
          amount,
          currency,
          incurredAt,
          notes,
          splitMode: splitMode as never,
          shares: {
            deleteMany: {},
            create: shares.map((share) => ({
              participantId: share.participantId,
              amount: share.amount,
              notes: share.notes ?? null,
            })),
          },
        },
      });

      const updatedSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!updatedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah item diperbarui',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Item talangan berhasil diperbarui',
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

      console.error('Error updating group expense item:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update group expense item',
          message: 'Gagal memperbarui item talangan',
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
      const { sessionCode, itemId } = await params;

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

      if (existingSession.status !== 'ACTIVE') {
        throw new GroupExpenseValidationError(
          'Session talangan harus aktif untuk menghapus item',
        );
      }

      const existingItem = existingSession.items.find((item) => item.id === itemId);

      if (!existingItem) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Item talangan tidak ditemukan di session ini',
          },
          { status: 404 },
        );
      }

      await prisma.groupExpenseItem.delete({
        where: {
          id: existingItem.id,
        },
      });

      const updatedSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!updatedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah item dihapus',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Item talangan berhasil dihapus',
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

      console.error('Error deleting group expense item:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete group expense item',
          message: 'Gagal menghapus item talangan',
        },
        { status: 500 },
      );
    }
  });
}
