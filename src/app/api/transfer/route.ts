import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { HTTP_STATUS } from '@/lib/constants';
import {
    assertWalletBalanceDeltas,
    WalletAccessError,
    WalletBalanceValidationError,
} from '@/lib/wallet-balance';

// GET /api/transfer - Get all transfers for authenticated user
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const userId = req.userId!;

            const transfers = await prisma.transferTransaction.findMany({
                where: { userId },
                include: {
                    fromWallet: true,
                    toWallet: true,
                },
                orderBy: { date: 'desc' },
            });

            return NextResponse.json(transfers);
        } catch (error) {
            console.error('Error fetching transfers:', error);
            return NextResponse.json(
                { success: false, message: 'Terjadi kesalahan saat mengambil data transfer' },
                { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
            );
        }
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const body = await req.json();
            const { fromWalletId, toWalletId, amount, date, note } = body;

            // Validation
            if (!fromWalletId || !toWalletId || !amount || !date) {
                return NextResponse.json(
                    { success: false, message: 'Data tidak lengkap' },
                    { status: HTTP_STATUS.BAD_REQUEST }
                );
            }

            if (fromWalletId === toWalletId) {
                return NextResponse.json(
                    { success: false, message: 'Dompet asal dan tujuan tidak boleh sama' },
                    { status: HTTP_STATUS.BAD_REQUEST }
                );
            }

            const transferAmount = Number(amount);
            if (isNaN(transferAmount) || transferAmount <= 0) {
                return NextResponse.json(
                    { success: false, message: 'Jumlah transfer tidak valid' },
                    { status: HTTP_STATUS.BAD_REQUEST }
                );
            }

            const transaction = await prisma.$transaction(async (tx) => {
                await assertWalletBalanceDeltas(tx, req.userId!, [
                    { walletId: fromWalletId, delta: -transferAmount },
                    { walletId: toWalletId, delta: transferAmount },
                ]);

                return tx.transferTransaction.create({
                    data: {
                        userId: req.userId!,
                        fromWalletId,
                        toWalletId,
                        amount: transferAmount,
                        date: new Date(date),
                        note,
                    },
                    include: {
                        fromWallet: true,
                        toWallet: true,
                    }
                });
            });

            return NextResponse.json(
                { success: true, data: transaction, message: 'Transfer berhasil' },
                { status: HTTP_STATUS.CREATED }
            );
        } catch (error) {
            if (error instanceof WalletAccessError) {
                return NextResponse.json(
                    { success: false, message: 'Dompet tidak ditemukan' },
                    { status: HTTP_STATUS.NOT_FOUND }
                );
            }

            if (error instanceof WalletBalanceValidationError) {
                return NextResponse.json(
                    { success: false, message: error.message },
                    { status: HTTP_STATUS.BAD_REQUEST }
                );
            }

            console.error('Error creating transfer:', error);
            return NextResponse.json(
                { success: false, message: 'Terjadi kesalahan saat memproses transfer' },
                { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
            );
        }
    });
}
