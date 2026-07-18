import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { ensureRecurringBillInstancesForUser } from '@/lib/bills';

const seriesSelect = {
  select: {
    id: true,
    name: true,
    amount: true,
    dayOfMonth: true,
    isActive: true,
    notes: true,
    categoryId: true,
    createdAt: true,
    updatedAt: true,
    category: {
      select: { id: true, name: true, icon: true, type: true },
    },
  },
} as const;

async function assertExpenseCategory(
  userId: string,
  categoryId: string
): Promise<{ id: string } | null> {
  return prisma.category.findFirst({
    where: { id: categoryId, userId, type: 'EXPENSE' },
    select: { id: true },
  });
}

// GET /api/bills/recurring-series
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const list = await prisma.recurringBillSeries.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        ...seriesSelect,
      });

      return NextResponse.json({ success: true, data: list }, { status: 200 });
    } catch (error) {
      console.error('Error listing recurring series:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to list series',
          message: 'Gagal mengambil tagihan bulanan',
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/bills/recurring-series — template bulanan (instance bulan ini dibuat otomatis)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, amount, dayOfMonth, notes, isActive, categoryId } = body;

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

      const dom = Number(dayOfMonth);
      if (!Number.isInteger(dom) || dom < 1 || dom > 31) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Tanggal jatuh tempo (hari dalam bulan) harus 1–31',
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

      const expenseCategory = await assertExpenseCategory(
        req.userId!,
        String(categoryId).trim()
      );
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

      const series = await prisma.recurringBillSeries.create({
        data: {
          userId: req.userId!,
          name: String(name).trim(),
          amount,
          dayOfMonth: dom,
          notes: notes?.trim() ? String(notes).trim() : null,
          isActive: isActive !== false,
          categoryId: expenseCategory.id,
        },
        ...seriesSelect,
      });

      await ensureRecurringBillInstancesForUser(req.userId!);

      return NextResponse.json(
        {
          success: true,
          data: series,
          message: 'Tagihan bulanan berhasil dibuat',
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating recurring series:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create series',
          message: 'Gagal membuat tagihan bulanan',
        },
        { status: 500 }
      );
    }
  });
}
