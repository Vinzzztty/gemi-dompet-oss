import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  buildEqualGroupExpenseShares,
  getGroupExpenseSessionByCode,
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  validateGroupExpenseSelectedParticipantIds,
  validateManualGroupExpenseShares,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

type ManualShareBody = {
  participantId: string;
  amount: number;
  notes?: string | null;
};

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
        data: session.items,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching group expense items:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch group expense items',
        message: 'Gagal mengambil daftar item talangan',
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

      if (existingSession.status !== 'ACTIVE') {
        throw new GroupExpenseValidationError(
          'Session talangan harus aktif untuk menambah item',
        );
      }

      const title = String(body.title ?? '').trim();
      const locationLabel =
        typeof body.locationLabel === 'string' && body.locationLabel.trim()
          ? body.locationLabel.trim()
          : null;
      const notes =
        typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim()
          : null;
      const currency = String(
        body.currency ?? existingSession.currency ?? 'IDR',
      )
        .trim()
        .toUpperCase();
      const paidByParticipantId = String(body.paidByParticipantId ?? '').trim();
      const splitMode = String(body.splitMode ?? 'EQUAL').trim().toUpperCase();
      const amount = Number(body.amount);
      const incurredAt = new Date(String(body.incurredAt ?? ''));

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
                  : [],
              ),
            )
          : validateManualGroupExpenseShares(
              amount,
              allowedParticipantIds,
              (body.shares ?? []) as ManualShareBody[],
            );

      await prisma.groupExpenseItem.create({
        data: {
          sessionId: existingSession.id,
          paidByParticipantId,
          title,
          locationLabel,
          amount,
          currency,
          incurredAt,
          notes,
          splitMode: splitMode as never,
          shares: {
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
          'Gagal memuat session talangan setelah item ditambahkan',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Item talangan berhasil ditambahkan',
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

      console.error('Error creating group expense item:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create group expense item',
          message: 'Gagal menambahkan item talangan',
        },
        { status: 500 },
      );
    }
  });
}
