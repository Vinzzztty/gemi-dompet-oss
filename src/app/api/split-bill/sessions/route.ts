import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  generateSplitBillSessionCode,
  normalizeSplitBillSessionCode,
  SplitBillValidationError,
  splitBillSessionInclude,
} from '@/lib/split-bill';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const sessions = await prisma.splitBillSession.findMany({
        where: {
          ownerUserId: req.userId!,
        },
        include: splitBillSessionInclude,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: sessions,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error('Error fetching split bill sessions:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch split bill sessions',
          message: 'Gagal mengambil daftar session split bill',
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
      const { title, totalAmount, notes, currency } = body;

      const trimmedTitle = String(title ?? '').trim();
      const normalizedCurrency = String(currency ?? 'IDR').trim().toUpperCase();
      const normalizedNotes =
        typeof notes === 'string' && notes.trim() ? notes.trim() : null;
      const parsedTotalAmount = Number(totalAmount);

      if (!trimmedTitle) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Judul split bill harus diisi',
          },
          { status: 400 },
        );
      }

      if (!Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Total tagihan harus lebih besar dari 0',
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

      let createdSession: any = null;

      // Avoid interactive transaction timeout (P2028) by using a single create call
      // and retrying when generated session code collides.
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const sessionCode = normalizeSplitBillSessionCode(
          generateSplitBillSessionCode(trimmedTitle),
        );

        try {
          createdSession = await prisma.splitBillSession.create({
            data: {
              ownerUserId: req.userId!,
              sessionCode,
              title: trimmedTitle,
              totalAmount: parsedTotalAmount,
              currency: normalizedCurrency,
              notes: normalizedNotes,
              participants: {
                create: {
                  userId: req.userId!,
                  displayName: req.user?.email || req.userId!,
                  isOwner: true,
                  joinedViaCode: false,
                },
              },
            },
            include: splitBillSessionInclude,
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
        throw new SplitBillValidationError(
          'Gagal membuat session split bill unik. Silakan coba lagi.',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: createdSession,
          message: 'Session split bill berhasil dibuat',
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof SplitBillValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: error.message,
          },
          { status: 400 },
        );
      }

      console.error('Error creating split bill session:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create split bill session',
          message: 'Gagal membuat session split bill',
        },
        { status: 500 },
      );
    }
  });
}
