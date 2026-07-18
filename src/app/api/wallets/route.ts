import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
    assertWalletBalanceDeltas,
    getOrCreateOthersWallet,
    WalletAccessError,
    WalletBalanceValidationError,
} from '@/lib/wallet-balance';

// GET /api/wallets - Get all wallets for authenticated user with balance
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const userId = req.user!.id;

            const wallets = await prisma.wallet.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            // Calculate aggregated balance for each wallet
            const incomeByWallet = await prisma.incomeTransaction.groupBy({
                by: ['walletId'],
                where: {
                    userId,
                    walletId: { not: null }
                },
                _sum: { nominal: true }
            });

            const expenseByWallet = await prisma.expenseTransaction.groupBy({
                by: ['walletId'],
                where: {
                    userId,
                    walletId: { not: null }
                },
                _sum: { nominal: true }
            });

            const outgoingTransfersByWallet = await prisma.transferTransaction.groupBy({
                by: ['fromWalletId'],
                where: { userId },
                _sum: { amount: true }
            });

            const incomingTransfersByWallet = await prisma.transferTransaction.groupBy({
                by: ['toWalletId'],
                where: { userId },
                _sum: { amount: true }
            });

            const walletsWithBalance = wallets.map(wallet => {
                const income = Number(incomeByWallet.find(w => w.walletId === wallet.id)?._sum.nominal || 0);
                const expense = Number(expenseByWallet.find(w => w.walletId === wallet.id)?._sum.nominal || 0);
                const outgoingTransfer = Number(outgoingTransfersByWallet.find(w => w.fromWalletId === wallet.id)?._sum.amount || 0);
                const incomingTransfer = Number(incomingTransfersByWallet.find(w => w.toWalletId === wallet.id)?._sum.amount || 0);
                return {
                    ...wallet,
                    balance: income - expense - outgoingTransfer + incomingTransfer
                };
            });

            return NextResponse.json(walletsWithBalance);
        } catch (error) {
            console.error('Error fetching wallets:', error);
            return NextResponse.json(
                { error: 'Failed to fetch wallets' },
                { status: 500 }
            );
        }
    });
}

// POST /api/wallets - Create new wallet
export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const userId = req.user!.id;
            const body = await request.json();
            const { namaDompet, norek } = body;

            if (!namaDompet) {
                return NextResponse.json(
                    { error: 'Nama dompet is required' },
                    { status: 400 }
                );
            }

            const wallet = await prisma.wallet.create({
                data: {
                    userId,
                    namaDompet,
                    norek: norek || null,
                },
            });

            return NextResponse.json(wallet, { status: 201 });
        } catch (error) {
            console.error('Error creating wallet:', error);
            return NextResponse.json(
                { error: 'Failed to create wallet' },
                { status: 500 }
            );
        }
    });
}

// PUT /api/wallets - Update existing wallet
export async function PUT(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const userId = req.user!.id;
            const body = await request.json();
            const { id, namaDompet, norek } = body;

            if (!id || !namaDompet) {
                return NextResponse.json(
                    { error: 'Wallet ID and nama dompet are required' },
                    { status: 400 }
                );
            }

            // Verify wallet belongs to user
            const existingWallet = await prisma.wallet.findFirst({
                where: { id, userId },
            });

            if (!existingWallet) {
                return NextResponse.json(
                    { error: 'Wallet not found' },
                    { status: 404 }
                );
            }

            const wallet = await prisma.wallet.update({
                where: { id },
                data: {
                    namaDompet,
                    norek: norek || null,
                },
            });

            return NextResponse.json(wallet);
        } catch (error) {
            console.error('Error updating wallet:', error);
            return NextResponse.json(
                { error: 'Failed to update wallet' },
                { status: 500 }
            );
        }
    });
}

// DELETE /api/wallets - Delete wallet
export async function DELETE(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const userId = req.user!.id;
            const { searchParams } = new URL(request.url);
            const id = searchParams.get('id');

            if (!id) {
                return NextResponse.json(
                    { error: 'Wallet ID is required' },
                    { status: 400 }
                );
            }

            // Verify wallet belongs to user
            const existingWallet = await prisma.wallet.findFirst({
                where: { id, userId },
            });

            if (!existingWallet) {
                return NextResponse.json(
                    { error: 'Wallet not found' },
                    { status: 404 }
                );
            }

            // Prevent deletion of "Others" wallet
            if (existingWallet.namaDompet === 'Others') {
                return NextResponse.json(
                    { error: 'Cannot delete "Others" wallet. This wallet is used for orphan transactions.' },
                    { status: 400 }
                );
            }

            await prisma.$transaction(async (tx) => {
                const othersWallet = await getOrCreateOthersWallet(tx, userId);

                const transferCount = await tx.transferTransaction.count({
                    where: {
                        userId,
                        OR: [
                            { fromWalletId: id },
                            { toWalletId: id },
                        ],
                    },
                });

                if (transferCount > 0) {
                    throw new Error('WALLET_HAS_TRANSFERS');
                }

                const [incomeSum, expenseSum] = await Promise.all([
                    tx.incomeTransaction.aggregate({
                        where: {
                            userId,
                            walletId: id,
                        },
                        _sum: { nominal: true },
                    }),
                    tx.expenseTransaction.aggregate({
                        where: {
                            userId,
                            walletId: id,
                        },
                        _sum: { nominal: true },
                    }),
                ]);

                const netDeltaToOthers =
                    Number(incomeSum._sum.nominal || 0) - Number(expenseSum._sum.nominal || 0);

                if (netDeltaToOthers !== 0) {
                    await assertWalletBalanceDeltas(tx, userId, [
                        { walletId: othersWallet.id, delta: netDeltaToOthers }
                    ]);
                }

                await tx.incomeTransaction.updateMany({
                    where: {
                        userId,
                        walletId: id
                    },
                    data: {
                        walletId: othersWallet.id
                    }
                });

                await tx.expenseTransaction.updateMany({
                    where: {
                        userId,
                        walletId: id
                    },
                    data: {
                        walletId: othersWallet.id
                    }
                });

                await tx.wallet.delete({
                    where: { id }
                });
            });

            return NextResponse.json({
                message: 'Wallet deleted successfully. Transactions have been moved to "Others" wallet.'
            });
        } catch (error) {
            if (error instanceof WalletAccessError) {
                return NextResponse.json(
                    { error: 'Wallet not found' },
                    { status: 404 }
                );
            }

            if (error instanceof WalletBalanceValidationError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }

            if ((error as Error).message === 'WALLET_HAS_TRANSFERS') {
                return NextResponse.json(
                    { error: 'Wallet memiliki riwayat transfer dan belum bisa dihapus dengan aman.' },
                    { status: 400 }
                );
            }

            console.error('Error deleting wallet:', error);
            return NextResponse.json(
                { error: 'Failed to delete wallet' },
                { status: 500 }
            );
        }
    });
}
