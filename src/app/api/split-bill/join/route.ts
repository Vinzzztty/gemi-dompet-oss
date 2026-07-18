import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getSplitBillSessionByCode,
  SplitBillValidationError,
} from '@/lib/split-bill';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'split-bill:join', 10, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const sessionCode = String(body.sessionCode ?? '').trim().toUpperCase();
    const displayName = String(body.displayName ?? '').trim();

    if (!sessionCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'SESSION_ID harus diisi',
        },
        { status: 400 },
      );
    }

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
      const existingSession = await getSplitBillSessionByCode(tx, sessionCode);

      if (!existingSession) {
        throw new SplitBillValidationError('Session split bill tidak ditemukan');
      }

      if (existingSession.status !== 'OPEN') {
        throw new SplitBillValidationError(
          'Session split bill sudah ditutup dan tidak bisa di-join',
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
          joinedViaCode: true,
        },
      });

      return getSplitBillSessionByCode(tx, sessionCode);
    });

    return NextResponse.json(
      {
        success: true,
        data: session,
        message: 'Berhasil join session split bill',
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

    console.error('Error joining split bill session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to join split bill session',
        message: 'Gagal join ke session split bill',
      },
      { status: 500 },
    );
  }
}
