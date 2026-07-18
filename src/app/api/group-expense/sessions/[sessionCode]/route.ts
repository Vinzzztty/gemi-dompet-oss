import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getGroupExpenseSessionByCode,
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  groupExpenseSessionInclude,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

function parseOptionalTimestamp(
  value: unknown,
  fieldLabel: string,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new GroupExpenseValidationError(`${fieldLabel} tidak valid`);
  }

  return parsed;
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
        data: toGroupExpenseSessionResponse(session),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching group expense session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch group expense session',
        message: 'Gagal mengambil detail session talangan',
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode } = await params;
      const body = await request.json();

      const session = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!session) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Session talangan tidak ditemukan atau bukan milik Anda',
          },
          { status: 404 },
        );
      }

      const data: Prisma.GroupExpenseSessionUpdateInput = {};
      let parsedStartedAt: Date | null | undefined;
      let parsedEndedAt: Date | null | undefined;

      if (body.title !== undefined) {
        const trimmedTitle = String(body.title ?? '').trim();
        if (!trimmedTitle) {
          throw new GroupExpenseValidationError('Judul session harus diisi');
        }
        data.title = trimmedTitle;
      }

      if (body.currency !== undefined) {
        const normalizedCurrency = String(body.currency ?? '').trim().toUpperCase();
        if (!normalizedCurrency || normalizedCurrency.length > 10) {
          throw new GroupExpenseValidationError('Currency tidak valid');
        }
        data.currency = normalizedCurrency;
      }

      if (body.notes !== undefined) {
        data.notes =
          typeof body.notes === 'string' && body.notes.trim()
            ? body.notes.trim()
            : null;
      }

      if (body.status !== undefined) {
        const status = String(body.status ?? '').trim().toUpperCase();
        if (!['ACTIVE', 'FROZEN', 'SETTLED', 'ARCHIVED'].includes(status)) {
          throw new GroupExpenseValidationError('Status session tidak valid');
        }
        data.status = status as never;
      }

      if (body.startedAt !== undefined) {
        parsedStartedAt = parseOptionalTimestamp(body.startedAt, 'Tanggal mulai');
        data.startedAt = parsedStartedAt;
      }

      if (body.endedAt !== undefined) {
        parsedEndedAt = parseOptionalTimestamp(body.endedAt, 'Tanggal selesai');
        data.endedAt = parsedEndedAt;
      }

      const nextStartedAt =
        parsedStartedAt !== undefined ? parsedStartedAt : session.startedAt;
      const nextEndedAt =
        parsedEndedAt !== undefined ? parsedEndedAt : session.endedAt;

      if (
        nextStartedAt &&
        nextEndedAt &&
        nextStartedAt.getTime() > nextEndedAt.getTime()
      ) {
        throw new GroupExpenseValidationError(
          'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
        );
      }

      await prisma.groupExpenseSession.update({
        where: {
          id: session.id,
        },
        data,
        include: groupExpenseSessionInclude,
      });

      const hydratedSession = await getGroupExpenseSessionByCode(prisma, sessionCode);

      if (!hydratedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah diperbarui',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(hydratedSession),
          message: 'Session talangan berhasil diperbarui',
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

      console.error('Error updating group expense session:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update group expense session',
          message: 'Gagal memperbarui session talangan',
        },
        { status: 500 },
      );
    }
  });
}
