import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

// Indonesian month names
const INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// GET /api/summary - Get financial summary (balance, income, expense)
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const startDateParam = searchParams.get('startDate');
            const endDateParam = searchParams.get('endDate');

            // Build where clause based on parameters
            const where: any = {
                userId: req.userId!,
            };

            let month = 'Semua';
            let year = new Date().getFullYear();

            // Only filter by date if parameters are provided
            if (startDateParam && endDateParam) {
                const startDate = new Date(startDateParam);
                const endDate = new Date(endDateParam);

                where.tanggal = {
                    gte: startDate,
                    lte: endDate,
                };

                month = INDONESIAN_MONTHS[startDate.getMonth()];
                year = startDate.getFullYear();
            }

            // Calculate total income
            const incomeResult = await prisma.incomeTransaction.aggregate({
                where,
                _sum: {
                    nominal: true,
                },
            });

            // Calculate total expense
            const expenseResult = await prisma.expenseTransaction.aggregate({
                where,
                _sum: {
                    nominal: true,
                },
            });

            const totalIncome = Number(incomeResult._sum.nominal || 0);
            const totalExpense = Number(expenseResult._sum.nominal || 0);

            // Calculate balance by summing all wallet balances
            // This ensures the total balance matches the sum of individual wallet balances
            const incomeByWallet = await prisma.incomeTransaction.groupBy({
                by: ['walletId'],
                where: {
                    userId: req.userId!,
                    walletId: { not: null }
                },
                _sum: { nominal: true }
            });

            const expenseByWallet = await prisma.expenseTransaction.groupBy({
                by: ['walletId'],
                where: {
                    userId: req.userId!,
                    walletId: { not: null }
                },
                _sum: { nominal: true }
            });

            // Get all unique wallet IDs
            const walletIds = new Set([
                ...incomeByWallet.map(w => w.walletId),
                ...expenseByWallet.map(w => w.walletId)
            ]);

            // Calculate total balance across all wallets
            let balance = 0;
            walletIds.forEach(walletId => {
                const income = Number(incomeByWallet.find(w => w.walletId === walletId)?._sum.nominal || 0);
                const expense = Number(expenseByWallet.find(w => w.walletId === walletId)?._sum.nominal || 0);
                balance += (income - expense);
            });

            return NextResponse.json(
                {
                    success: true,
                    data: {
                        balance,
                        income: totalIncome,
                        expense: totalExpense,
                        month,
                        year,
                    },
                },
                { status: 200 }
            );
        } catch (error: any) {
            console.error('Error fetching summary:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch summary',
                    message: 'Gagal mengambil ringkasan keuangan',
                },
                { status: 500 }
            );
        }
    });
}
