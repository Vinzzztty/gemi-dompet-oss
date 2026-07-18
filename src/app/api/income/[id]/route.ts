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
  params: Promise<{
    id: string;
  }>;
}

// GET /api/income/[id] - Get single income transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      const income = await prisma.incomeTransaction.findUnique({
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

      if (!income) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Pemasukan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: income,
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error fetching income:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch income',
          message: 'Gagal mengambil data pemasukan',
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/income/[id] - Update income transaction
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { nama, nominal, categoryId, walletId, tanggal, catatan } = body;

      // Check if income exists and belongs to user
      const existingIncome = await prisma.incomeTransaction.findUnique({
        where: { id, userId: req.userId! },
      });

      if (!existingIncome) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Pemasukan tidak ditemukan',
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
              error: 'Validation error',
              message: 'Kategori tidak ditemukan',
            },
            { status: 400 }
          );
        }

        if (category.type !== 'INCOME') {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation error',
              message: 'Kategori harus bertipe INCOME',
            },
            { status: 400 }
          );
        }
      }

      const updatedIncome = await prisma.$transaction(async (tx) => {
        let finalWalletId =
          walletId !== undefined ? walletId : existingIncome.walletId;

        if (!finalWalletId) {
          const othersWallet = await getOrCreateOthersWallet(tx, req.userId!);
          finalWalletId = othersWallet.id;
        }

        const nextNominal =
          nominal !== undefined ? Number(nominal) : Number(existingIncome.nominal);

        await assertWalletBalanceDeltas(tx, req.userId!, [
          ...(existingIncome.walletId
            ? [{ walletId: existingIncome.walletId, delta: -Number(existingIncome.nominal) }]
            : []),
          { walletId: finalWalletId, delta: nextNominal },
        ]);

        const updateData: Record<string, unknown> = {};
        if (nama !== undefined) updateData.nama = nama.trim();
        if (nominal !== undefined) updateData.nominal = nextNominal;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (walletId !== undefined || !existingIncome.walletId) {
          updateData.walletId = finalWalletId;
        }
        if (tanggal !== undefined) updateData.tanggal = new Date(tanggal);
        if (catatan !== undefined) updateData.catatan = catatan?.trim() || null;

        return tx.incomeTransaction.update({
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
          data: updatedIncome,
          message: 'Pemasukan berhasil diperbarui',
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

      console.error('Error updating income:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update income',
          message: 'Gagal memperbarui pemasukan',
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/income/[id] - Delete income transaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      // Check if income exists and belongs to user
      const income = await prisma.incomeTransaction.findUnique({
        where: { id, userId: req.userId! },
      });

      if (!income) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Pemasukan tidak ditemukan',
          },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        if (income.walletId) {
          await assertWalletBalanceDeltas(tx, req.userId!, [
            { walletId: income.walletId, delta: -Number(income.nominal) },
          ]);
        }

        await tx.incomeTransaction.delete({
          where: { id },
        });
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Pemasukan berhasil dihapus',
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

      console.error('Error deleting income:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete income',
          message: 'Gagal menghapus pemasukan',
        },
        { status: 500 }
      );
    }
  });
}
