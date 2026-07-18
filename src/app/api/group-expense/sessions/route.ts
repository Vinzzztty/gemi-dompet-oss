import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  generateGroupExpenseSessionCode,
  normalizeGroupExpenseSessionCode,
  GroupExpenseValidationError,
  groupExpenseSessionInclude,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

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

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const sessions = await prisma.groupExpenseSession.findMany({
        where: {
          ownerUserId: req.userId!,
        },
        include: groupExpenseSessionInclude,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: sessions.map(toGroupExpenseSessionResponse),
        },
        { status: 200 },
      );
    } catch (error) {
      console.error('Error fetching group expense sessions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch group expense sessions',
          message: 'Gagal mengambil daftar session talangan',
        },
        { status: 500 },
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const trimmedTitle = String(body.title ?? '').trim();
      const normalizedCurrency = String(body.currency ?? 'IDR').trim().toUpperCase();
      const normalizedNotes =
        typeof body.notes === 'string' && body.notes.trim()
          ? body.notes.trim()
          : null;
      const startedAt = parseOptionalTimestamp(body.startedAt, 'Tanggal mulai');
      const endedAt = parseOptionalTimestamp(body.endedAt, 'Tanggal selesai');

      if (!trimmedTitle) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Judul session harus diisi',
          },
          { status: 400 },
        );
      }

      if (!normalizedCurrency || normalizedCurrency.length > 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Currency tidak valid',
          },
          { status: 400 },
        );
      }

      if (startedAt && endedAt && startedAt.getTime() > endedAt.getTime()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai',
          },
          { status: 400 },
        );
      }

      const owner = await prisma.userAccount.findUnique({
        where: {
          id: req.userId!,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      });

      if (!owner) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'User owner tidak ditemukan',
          },
          { status: 404 },
        );
      }

      let createdSession = null;

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const sessionCode = normalizeGroupExpenseSessionCode(
          generateGroupExpenseSessionCode(trimmedTitle),
        );

        try {
          createdSession = await prisma.groupExpenseSession.create({
            data: {
              ownerUserId: req.userId!,
              sessionCode,
              title: trimmedTitle,
              currency: normalizedCurrency,
              notes: normalizedNotes,
              startedAt,
              endedAt,
              participants: {
                create: {
                  userId: req.userId!,
                  displayName: owner.fullName?.trim() || owner.email,
                  isOwner: true,
                  joinedViaCode: false,
                },
              },
            },
            include: groupExpenseSessionInclude,
          });
          break;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            continue;
          }

          throw error;
        }
      }

      if (!createdSession) {
        throw new GroupExpenseValidationError(
          'Gagal membuat session code unik. Silakan coba lagi.',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(createdSession),
          message: 'Session talangan berhasil dibuat',
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

      console.error('Error creating group expense session:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create group expense session',
          message: 'Gagal membuat session talangan',
        },
        { status: 500 },
      );
    }
  });
}
