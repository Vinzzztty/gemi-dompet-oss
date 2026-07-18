import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
  assertWalletBalanceDeltas,
  getOrCreateOthersWallet,
  WalletAccessError,
  WalletBalanceValidationError,
} from '@/lib/wallet-balance';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/expense/[id] - Get single expense
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const expense = await prisma.expenseTransaction.findUnique({
        where: {
          id,
          userId: req.userId!, // Ensure user can only access their own data
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,
              type: true,
            },
          },
          wallet: {
            select: {
              id: true,
              namaDompet: true,
              norek: true,
            },
          },
        },
      });

      if (!expense) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Pengeluaran tidak ditemukan',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: expense,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error fetching expense:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch expense',
          message: 'Gagal mengambil data pengeluaran',
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/expense/[id] - Update expense
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { nama, nominal, categoryId, walletId, tanggal, catatan } = body;

      // Check if expense exists and belongs to user
      const existingExpense = await prisma.expenseTransaction.findUnique({
        where: { id, userId: req.userId! },
      });

      if (!existingExpense) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Pengeluaran tidak ditemukan',
          },
          { status: 404 }
        );
      }

      // Validation
      if (nama !== undefined && nama.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nama transaksi harus diisi',
          },
          { status: 400 }
        );
      }

      if (nominal !== undefined && Number(nominal) <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nominal harus lebih besar dari 0',
          },
          { status: 400 }
        );
      }

      if (categoryId !== undefined) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!category) {
          return NextResponse.json(
            {
              success: false,
              error: 'Category not found',
              message: 'Kategori tidak ditemukan',
            },
            { status: 404 }
          );
        }

        if (category.type !== 'EXPENSE') {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid category type',
              message: 'Kategori harus bertipe EXPENSE',
            },
            { status: 400 }
          );
        }
      }

      const updatedExpense = await prisma.$transaction(async (tx) => {
        let finalWalletId =
          walletId !== undefined ? walletId : existingExpense.walletId;

        if (!finalWalletId) {
          const othersWallet = await getOrCreateOthersWallet(tx, req.userId!);
          finalWalletId = othersWallet.id;
        }

        const nextNominal =
          nominal !== undefined ? Number(nominal) : Number(existingExpense.nominal);

        await assertWalletBalanceDeltas(tx, req.userId!, [
          ...(existingExpense.walletId
            ? [{ walletId: existingExpense.walletId, delta: Number(existingExpense.nominal) }]
            : []),
          { walletId: finalWalletId, delta: -nextNominal },
        ]);

        const updateData: Record<string, unknown> = {};
        if (nama !== undefined) updateData.nama = nama.trim();
        if (nominal !== undefined) updateData.nominal = nextNominal;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (walletId !== undefined || !existingExpense.walletId) {
          updateData.walletId = finalWalletId;
        }
        if (tanggal !== undefined) updateData.tanggal = new Date(tanggal);
        if (catatan !== undefined) updateData.catatan = catatan?.trim() || null;

        return tx.expenseTransaction.update({
          where: { id },
          data: updateData,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                type: true,
              },
            },
            wallet: {
              select: {
                id: true,
                namaDompet: true,
                norek: true,
              },
            },
          },
        });
      });

      return NextResponse.json(
        {
          success: true,
          data: updatedExpense,
          message: 'Pengeluaran berhasil diperbarui',
        },
        { status: 200 }
      );
    } catch (error: any) {
      if (error instanceof WalletAccessError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Wallet not found',
            message: 'Dompet tidak ditemukan',
          },
          { status: 404 }
        );
      }

      if (error instanceof WalletBalanceValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'Insufficient wallet balance',
            message: error.message,
          },
          { status: 400 }
        );
      }

      console.error('Error updating expense:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update expense',
          message: 'Gagal memperbarui pengeluaran',
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/expense/[id] - Delete expense
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      // Check if expense exists and belongs to user
      const expense = await prisma.expenseTransaction.findUnique({
        where: { id, userId: req.userId! },
      });

      if (!expense) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Pengeluaran tidak ditemukan',
          },
          { status: 404 }
        );
      }

      // Delete expense
      await prisma.expenseTransaction.delete({
        where: { id },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Pengeluaran berhasil dihapus',
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error deleting expense:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete expense',
          message: 'Gagal menghapus pengeluaran',
        },
        { status: 500 }
      );
    }
  });
}
