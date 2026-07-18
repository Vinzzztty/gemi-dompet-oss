import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getOwnedSplitBillSessionByCode,
  SplitBillValidationError,
} from '@/lib/split-bill';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { sessionCode } = await params;
      const body = await request.json();
      const displayName = String(body.displayName ?? '').trim();

      if (!displayName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nama participant harus diisi',
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

        const duplicateName = await tx.splitBillParticipant.findFirst({
          where: {
            sessionId: existingSession.id,
            displayName: {
              equals: displayName,
              mode: 'insensitive',
            },
          },
          select: { id: true },
        });

        if (duplicateName) {
          throw new SplitBillValidationError(
            'Nama participant sudah digunakan di session ini',
          );
        }

        await tx.splitBillParticipant.create({
          data: {
            sessionId: existingSession.id,
            displayName,
            isOwner: false,
            joinedViaCode: false,
          },
        });

        return getOwnedSplitBillSessionByCode(tx, sessionCode, req.userId!);
      });

      return NextResponse.json(
        {
          success: true,
          data: session,
          message: 'Participant berhasil ditambahkan',
        },
        { status: 201 },
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

      console.error('Error adding split bill participant:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add participant',
          message: 'Gagal menambahkan participant split bill',
        },
        { status: 500 },
      );
    }
  });
}
