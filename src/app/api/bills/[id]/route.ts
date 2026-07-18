import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import type { BillStatus } from '@prisma/client';
import {
  mergeBillSnapshot,
  markBillPaidWithExpense,
  markBillUnpaidRemoveExpense,
  billCategoryUpdateData,
} from '@/lib/bill-payment-expense';
import {
  WalletAccessError,
  WalletBalanceValidationError,
} from '@/lib/wallet-balance';

const seriesSelect = {
  select: { id: true, name: true, dayOfMonth: true, isActive: true },
} as const;

const categorySelect = {
  select: { id: true, name: true, icon: true, type: true },
} as const;

const billInclude = { series: seriesSelect, category: categorySelect };

interface RouteParams {
  params: Promise<{ id: string }>;
}

function walletValidationResponse(error: unknown) {
  if (error instanceof WalletAccessError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Wallet not found',
        message: 'Dompet tidak ditemukan',
      },
      { status: 404 },
    );
  }

  if (error instanceof WalletBalanceValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Insufficient wallet balance',
        message: error.message,
      },
      { status: 400 },
    );
  }

  return null;
}

async function assertExpenseCategoryForUser(
  userId: string,
  categoryId: string | null
): Promise<boolean> {
  if (!categoryId) return true;
  const c = await prisma.category.findFirst({
    where: { id: categoryId, userId, type: 'EXPENSE' },
  });
  return !!c;
}

// GET /api/bills/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const bill = await prisma.bill.findFirst({
        where: { id, userId: req.userId! },
        include: billInclude,
      });

      if (!bill) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: bill }, { status: 200 });
    } catch (error) {
      console.error('Error fetching bill:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch bill',
          message: 'Gagal mengambil tagihan',
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/bills/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { name, amount, dueDate, tanggal, notes, status, categoryId } =
        body;

      const existing = await prisma.bill.findFirst({
        where: { id, userId: req.userId! },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      const snapshot = mergeBillSnapshot(existing, {
        name,
        amount,
        dueDate: dueDate ?? tanggal,
        notes,
        categoryId,
      });

      if (
        categoryId !== undefined &&
        snapshot.categoryId &&
        !(await assertExpenseCategoryForUser(req.userId!, snapshot.categoryId))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori tidak ditemukan atau bukan kategori pengeluaran',
          },
          { status: 400 }
        );
      }

      if (status !== undefined) {
        if (status !== 'UNPAID' && status !== 'PAID') {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation error',
              message: 'Status harus UNPAID atau PAID',
            },
            { status: 400 }
          );
        }

        if (status === 'PAID') {
          if (!existing.expenseTransactionId) {
            const bill = await markBillPaidWithExpense(
              req.userId!,
              id,
              snapshot,
              billInclude
            );
            if (!bill) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Failed to create expense',
                  message: 'Gagal mencatat pengeluaran untuk tagihan',
                },
                { status: 500 }
              );
            }
            return NextResponse.json({
              success: true,
              data: bill,
              message: 'Tagihan lunas dan tercatat sebagai pengeluaran',
            });
          }
          const bill = await prisma.bill.update({
            where: { id },
            data: {
              name: snapshot.name,
              amount: snapshot.amount,
              dueDate: snapshot.dueDate,
              notes: snapshot.notes,
              status: 'PAID',
              paidAt: new Date(),
              ...billCategoryUpdateData(snapshot),
            },
            include: billInclude,
          });
          return NextResponse.json({
            success: true,
            data: bill,
            message: 'Tagihan diperbarui',
          });
        }

        const bill = await markBillUnpaidRemoveExpense(
          req.userId!,
          id,
          snapshot,
          billInclude
        );
        if (!bill) {
          return NextResponse.json(
            {
              success: false,
              error: 'Not found',
              message: 'Tagihan tidak ditemukan',
            },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: bill,
          message: 'Tagihan diperbarui',
        });
      }

      const bill = await prisma.bill.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: snapshot.name } : {}),
          ...(amount !== undefined ? { amount: snapshot.amount } : {}),
          ...(dueDate !== undefined || tanggal !== undefined
            ? { dueDate: snapshot.dueDate }
            : {}),
          ...(notes !== undefined ? { notes: snapshot.notes } : {}),
          ...(categoryId !== undefined ? billCategoryUpdateData(snapshot) : {}),
        },
        include: billInclude,
      });

      return NextResponse.json({
        success: true,
        data: bill,
        message: 'Tagihan diperbarui',
      });
    } catch (error) {
      const walletError = walletValidationResponse(error);
      if (walletError) return walletError;

      console.error('Error updating bill:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update bill',
          message: 'Gagal memperbarui tagihan',
        },
        { status: 500 }
      );
    }
  });
}

// PATCH /api/bills/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();

      const existing = await prisma.bill.findFirst({
        where: { id, userId: req.userId! },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      const { status, name, amount, dueDate, notes, categoryId } = body;
      const snapshot = mergeBillSnapshot(existing, {
        name,
        amount,
        dueDate,
        notes,
        categoryId,
      });

      if (
        categoryId !== undefined &&
        snapshot.categoryId &&
        !(await assertExpenseCategoryForUser(req.userId!, snapshot.categoryId))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori tidak ditemukan atau bukan kategori pengeluaran',
          },
          { status: 400 }
        );
      }

      if (status !== undefined) {
        if (status !== 'UNPAID' && status !== 'PAID') {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation error',
              message: 'Status harus UNPAID atau PAID',
            },
            { status: 400 }
          );
        }

        if (status === 'PAID') {
          if (!existing.expenseTransactionId) {
            const bill = await markBillPaidWithExpense(
              req.userId!,
              id,
              snapshot,
              billInclude
            );
            if (!bill) {
              return NextResponse.json(
                {
                  success: false,
                  error: 'Failed to create expense',
                  message: 'Gagal mencatat pengeluaran untuk tagihan',
                },
                { status: 500 }
              );
            }
            return NextResponse.json({
              success: true,
              data: bill,
              message: 'Tagihan lunas dan tercatat sebagai pengeluaran',
            });
          }
          const bill = await prisma.bill.update({
            where: { id },
            data: {
              name: snapshot.name,
              amount: snapshot.amount,
              dueDate: snapshot.dueDate,
              notes: snapshot.notes,
              status: 'PAID' as BillStatus,
              paidAt: new Date(),
              ...billCategoryUpdateData(snapshot),
            },
            include: billInclude,
          });
          return NextResponse.json({
            success: true,
            data: bill,
            message: 'Tagihan diperbarui',
          });
        }

        const bill = await markBillUnpaidRemoveExpense(
          req.userId!,
          id,
          snapshot,
          billInclude
        );
        if (!bill) {
          return NextResponse.json(
            {
              success: false,
              error: 'Not found',
              message: 'Tagihan tidak ditemukan',
            },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          data: bill,
          message: 'Tagihan diperbarui',
        });
      }

      const bill = await prisma.bill.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: snapshot.name } : {}),
          ...(amount !== undefined ? { amount: snapshot.amount } : {}),
          ...(dueDate !== undefined ? { dueDate: snapshot.dueDate } : {}),
          ...(notes !== undefined ? { notes: snapshot.notes } : {}),
          ...(categoryId !== undefined ? billCategoryUpdateData(snapshot) : {}),
        },
        include: billInclude,
      });

      return NextResponse.json({
        success: true,
        data: bill,
        message: 'Tagihan diperbarui',
      });
    } catch (error) {
      const walletError = walletValidationResponse(error);
      if (walletError) return walletError;

      console.error('Error patching bill:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to patch bill',
          message: 'Gagal memperbarui tagihan',
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/bills/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const existing = await prisma.bill.findFirst({
        where: { id, userId: req.userId! },
      });

      if (!existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Tagihan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      if (existing.expenseTransactionId) {
        const exp = await prisma.expenseTransaction.findFirst({
          where: {
            id: existing.expenseTransactionId,
            userId: req.userId!,
          },
        });
        if (exp) {
          await prisma.expenseTransaction.delete({ where: { id: exp.id } });
        }
      }

      await prisma.bill.delete({ where: { id } });

      return NextResponse.json({
        success: true,
        message: 'Tagihan dihapus',
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete bill',
          message: 'Gagal menghapus tagihan',
        },
        { status: 500 }
      );
    }
  });
}
