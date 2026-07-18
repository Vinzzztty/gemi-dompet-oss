import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  getOwnedGroupExpenseSessionByCode,
  GroupExpenseValidationError,
  toGroupExpenseSessionResponse,
} from '@/lib/group-expense';

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
          joinedViaCode: false,
        },
      });

      const updatedSession = await getOwnedGroupExpenseSessionByCode(
        prisma,
        sessionCode,
        req.userId!,
      );

      if (!updatedSession) {
        throw new GroupExpenseValidationError(
          'Gagal memuat session talangan setelah participant ditambahkan',
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: toGroupExpenseSessionResponse(updatedSession),
          message: 'Participant berhasil ditambahkan',
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

      console.error('Error adding group expense participant:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add group expense participant',
          message: 'Gagal menambahkan participant talangan',
        },
        { status: 500 },
      );
    }
  });
}
