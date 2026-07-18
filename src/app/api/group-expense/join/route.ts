import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'group-expense:join', 10, 15 * 60 * 1000);
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

    const existingSession = await getGroupExpenseSessionByCode(prisma, sessionCode);

    if (!existingSession) {
      throw new GroupExpenseValidationError('Session talangan tidak ditemukan');
    }

    if (existingSession.status !== 'ACTIVE') {
      throw new GroupExpenseValidationError(
        'Session talangan sedang tidak menerima participant baru',
      );
    }

    const duplicateName = await prisma.groupExpenseParticipant.findFirst({
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
      throw new GroupExpenseValidationError(
        'Nama participant sudah digunakan di session ini',
      );
    }

    await prisma.groupExpenseParticipant.create({
      data: {
        sessionId: existingSession.id,
        displayName,
        isOwner: false,
        joinedViaCode: true,
      },
    });

    const updatedSession = await getGroupExpenseSessionByCode(prisma, sessionCode);

    if (!updatedSession) {
      throw new GroupExpenseValidationError(
        'Gagal memuat session talangan setelah join',
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: toGroupExpenseSessionResponse(updatedSession),
        message: 'Berhasil join ke session talangan',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof GroupExpenseValidationError) {
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

    console.error('Error joining group expense session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to join group expense session',
        message: 'Gagal join ke session talangan',
      },
      { status: 500 },
    );
  }
}
