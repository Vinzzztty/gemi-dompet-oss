import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { listBillsForUser } from '@/lib/bills';
import type { BillStatus } from '@prisma/client';

// GET /api/bills
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const status = searchParams.get('status') as BillStatus | null;
      const startDue = searchParams.get('startDue');
      const endDue = searchParams.get('endDue');
      const seriesIdRaw = searchParams.get('seriesId');
      let seriesId: string | null | undefined;
      if (seriesIdRaw === null) seriesId = undefined;
      else if (seriesIdRaw === 'none') seriesId = null;
      else seriesId = seriesIdRaw;

      const result = await listBillsForUser(req.userId!, {
        page,
        limit,
        status: status && (status === 'UNPAID' || status === 'PAID') ? status : undefined,
        fromDue: startDue ? new Date(startDue) : undefined,
        toDue: endDue ? new Date(endDue) : undefined,
        seriesId,
      });

      return NextResponse.json(
        { success: true, data: result.data, meta: result.meta },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error listing bills:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to list bills',
          message: 'Gagal mengambil daftar tagihan',
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/bills — tagihan sekali / jadwal (tanpa seri bulanan)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, amount, dueDate, notes, categoryId } = body;

      if (!name || String(name).trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nama tagihan harus diisi',
          },
          { status: 400 }
        );
      }

      if (amount === undefined || amount === null || Number(amount) <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nominal harus lebih besar dari 0',
          },
          { status: 400 }
        );
      }

      if (!dueDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Tanggal jatuh tempo harus diisi',
          },
          { status: 400 }
        );
      }

      if (!categoryId || String(categoryId).trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori harus dipilih',
          },
          { status: 400 }
        );
      }

      const expenseCategory = await prisma.category.findFirst({
        where: {
          id: String(categoryId).trim(),
          userId: req.userId!,
          type: 'EXPENSE',
        },
      });

      if (!expenseCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori tidak ditemukan atau bukan kategori pengeluaran',
          },
          { status: 400 }
        );
      }

      const bill = await prisma.bill.create({
        data: {
          userId: req.userId!,
          name: String(name).trim(),
          amount,
          dueDate: new Date(dueDate),
          notes: notes?.trim() ? String(notes).trim() : null,
          status: 'UNPAID',
          categoryId: expenseCategory.id,
        },
        include: {
          series: {
            select: { id: true, name: true, dayOfMonth: true, isActive: true },
          },
          category: {
            select: { id: true, name: true, icon: true, type: true },
          },
        },
      });

      return NextResponse.json(
        { success: true, data: bill, message: 'Tagihan berhasil dibuat' },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating bill:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create bill',
          message: 'Gagal membuat tagihan',
        },
        { status: 500 }
      );
    }
  });
}
