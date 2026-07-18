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

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bills/recurring-series/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const series = await prisma.recurringBillSeries.findFirst({
        where: { id, userId: req.userId! },
        ...seriesSelect,
      });

      if (!series) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Seri tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: series }, { status: 200 });
    } catch (error) {
      console.error('Error fetching recurring series:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch series',
          message: 'Gagal mengambil seri tagihan',
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/bills/recurring-series/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();

      const existing = await prisma.recurringBillSeries.findFirst({
        where: { id, userId: req.userId! },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Seri tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      const { name, amount, dayOfMonth, notes, isActive, categoryId } = body;

      if (dayOfMonth !== undefined) {
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
      }

      let resolvedCategoryId: string | undefined;
      if (categoryId !== undefined) {
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
        resolvedCategoryId = expenseCategory.id;
      }

      const series = await prisma.recurringBillSeries.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: String(name).trim() } : {}),
          ...(amount !== undefined ? { amount } : {}),
          ...(dayOfMonth !== undefined ? { dayOfMonth: Number(dayOfMonth) } : {}),
          ...(notes !== undefined
            ? { notes: notes?.trim() ? String(notes).trim() : null }
            : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(resolvedCategoryId !== undefined
            ? { categoryId: resolvedCategoryId }
            : {}),
        },
        ...seriesSelect,
      });

      if (resolvedCategoryId !== undefined) {
        await prisma.bill.updateMany({
          where: {
            userId: req.userId!,
            seriesId: id,
            status: 'UNPAID',
          },
          data: { categoryId: resolvedCategoryId },
        });
      }

      await ensureRecurringBillInstancesForUser(req.userId!);

      return NextResponse.json({
        success: true,
        data: series,
        message: 'Tagihan bulanan diperbarui',
      });
    } catch (error) {
      console.error('Error updating recurring series:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update series',
          message: 'Gagal memperbarui tagihan bulanan',
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/bills/recurring-series/[id] — hapus template + semua instance terkait (Cascade)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const existing = await prisma.recurringBillSeries.findFirst({
        where: { id, userId: req.userId! },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Seri tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      await prisma.recurringBillSeries.delete({ where: { id } });

      return NextResponse.json({
        success: true,
        message: 'Seri tagihan dan instansinya dihapus',
      });
    } catch (error) {
      console.error('Error deleting recurring series:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete series',
          message: 'Gagal menghapus seri tagihan',
        },
        { status: 500 }
      );
    }
  });
}
