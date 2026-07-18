import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getGroupExpenseSessionByCode,
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
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
        data: session.repayments,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching group expense repayments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch group expense repayments',
        message: 'Gagal mengambil daftar repayment talangan',
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode } = await params;
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
          'Session talangan tidak bisa menerima repayment baru',
        );
      }

      const fromParticipantId = String(body.fromParticipantId ?? '').trim();
      const toParticipantId = String(body.toParticipantId ?? '').trim();
      const amount = Number(body.amount);
      const currency = String(
        body.currency ?? existingSession.currency ?? 'IDR',
      )
        .trim()
        .toUpperCase();
      const notes =
        typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim()
          : null;
      const paidAt = new Date(String(body.paidAt ?? ''));

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

      if (!participantIds.has(fromParticipantId) || !participantIds.has(toParticipantId)) {
        throw new GroupExpenseValidationError(
          'Participant repayment tidak valid untuk session ini',
        );
      }

      await prisma.groupExpenseRepayment.create({
        data: {
          sessionId: existingSession.id,
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
          'Gagal memuat session talangan setelah repayment dibuat',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Repayment berhasil dicatat',
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

      console.error('Error creating group expense repayment:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create group expense repayment',
          message: 'Gagal mencatat repayment talangan',
        },
        { status: 500 },
      );
    }
  });
}
