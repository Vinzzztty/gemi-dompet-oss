import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import {
    assertWalletBalanceDeltas,
    getOrCreateOthersWallet,
    WalletAccessError,
    WalletBalanceValidationError,
} from '@/lib/wallet-balance';

/**
 * POST /api/migrate/orphan-transactions
 * Migrate all orphan transactions (walletId = null) to "Others" wallet
 * This endpoint should only be called once during setup or maintenance
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const userId = req.user!.id;

            console.log(`🚀 Starting orphan transactions migration for user: ${userId}`);

            const migrationResult = await prisma.$transaction(async (tx) => {
                const othersWallet = await getOrCreateOthersWallet(tx, userId);

                console.log(`ℹ️  Using "Others" wallet: ${othersWallet.id}`);

                const [orphanIncomeCount, orphanExpenseCount, orphanIncomeSum, orphanExpenseSum] = await Promise.all([
                    tx.incomeTransaction.count({
                        where: {
                            userId,
                            walletId: null
                        }
                    }),
                    tx.expenseTransaction.count({
                        where: {
                            userId,
                            walletId: null
                        }
                    }),
                    tx.incomeTransaction.aggregate({
                        where: {
                            userId,
                            walletId: null
                        },
                        _sum: { nominal: true }
                    }),
                    tx.expenseTransaction.aggregate({
                        where: {
                            userId,
                            walletId: null
                        },
                        _sum: { nominal: true }
                    }),
                ]);

                const incomeDelta = Number(orphanIncomeSum._sum.nominal || 0);
                const expenseDelta = Number(orphanExpenseSum._sum.nominal || 0);
                const netDelta = incomeDelta - expenseDelta;

                if (netDelta !== 0) {
                    await assertWalletBalanceDeltas(tx, userId, [
                        { walletId: othersWallet.id, delta: netDelta }
                    ]);
                }

                await tx.incomeTransaction.updateMany({
                    where: {
                        userId,
                        walletId: null
                    },
                    data: {
                        walletId: othersWallet.id
                    }
                });

                await tx.expenseTransaction.updateMany({
                    where: {
                        userId,
                        walletId: null
                    },
                    data: {
                        walletId: othersWallet.id
                    }
                });

                return {
                    orphanIncomeCount,
                    orphanExpenseCount,
                    totalMigrated: orphanIncomeCount + orphanExpenseCount,
                };
            });

            console.log(`✅ Migration completed. Total transactions migrated: ${migrationResult.totalMigrated}`);

            return NextResponse.json({
                success: true,
                message: 'Orphan transactions migrated successfully',
                data: {
                    incomeTransactionsMigrated: migrationResult.orphanIncomeCount,
                    expenseTransactionsMigrated: migrationResult.orphanExpenseCount,
                    totalTransactionsMigrated: migrationResult.totalMigrated
                }
            }, { status: 200 });

        } catch (error: any) {
            if (error instanceof WalletAccessError) {
                return NextResponse.json({
                    success: false,
                    error: 'Wallet not found',
                    message: 'Dompet tidak ditemukan'
                }, { status: 404 });
            }

            if (error instanceof WalletBalanceValidationError) {
                return NextResponse.json({
                    success: false,
                    error: 'Insufficient wallet balance',
                    message: error.message
                }, { status: 400 });
            }

            console.error('Error migrating orphan transactions:', error);

            return NextResponse.json({
                success: false,
                error: 'Failed to migrate orphan transactions',
                message: error.message || 'Terjadi kesalahan saat migrasi transaksi'
            }, { status: 500 });
        }
    });
}
