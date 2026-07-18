import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

// GET /api/category-spending - Get expense spending grouped by category
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const startDateParam = searchParams.get('startDate');
            const endDateParam = searchParams.get('endDate');
            const typeParam = searchParams.get('type');
            const type = typeParam === 'income' ? 'income' : 'expense';

            // Build where clause
            const where: any = {
                userId: req.userId!,
            };

            // Only filter by date if parameters are provided
            if (startDateParam && endDateParam) {
                const startDate = new Date(startDateParam);
                const endDate = new Date(endDateParam);
                
                where.tanggal = {
                    gte: startDate,
                    lte: endDate,
                };
            }

            let transactions: any[] = [];

            if (type === 'income') {
                transactions = await prisma.incomeTransaction.findMany({
                    where,
                    include: {
                        category: true,
                    },
                });
            } else {
                transactions = await prisma.expenseTransaction.findMany({
                    where,
                    include: {
                        category: true,
                    },
                });
            }

            // Group by category and calculate totals
            const categoryMap = new Map<string, { name: string; amount: number; icon: string }>();

            transactions.forEach((transaction) => {
                const categoryId = transaction.categoryId;
                const categoryName = transaction.category.name;
                const categoryIcon = transaction.category.icon || 'wallet';
                const amount = Number(transaction.nominal);

                if (categoryMap.has(categoryId)) {
                    const existing = categoryMap.get(categoryId)!;
                    existing.amount += amount;
                } else {
                    categoryMap.set(categoryId, {
                        name: categoryName,
                        amount: amount,
                        icon: categoryIcon,
                    });
                }
            });

            // Convert to array and sort by amount (descending)
            const categorySpending = Array.from(categoryMap.entries())
                .map(([categoryId, data]) => ({
                    category: categoryId,
                    name: data.name,
                    amount: data.amount,
                    color: type === 'income' ? '#10B981' : '#EF4444', // Green for income, Red for expense
                }))
                .sort((a, b) => b.amount - a.amount);

            return NextResponse.json(
                {
                    success: true,
                    data: categorySpending,
                },
                { status: 200 }
            );
        } catch (error: any) {
            console.error('Error fetching category spending:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch category spending',
                    message: 'Gagal mengambil data pengeluaran per kategori',
                },
                { status: 500 }
            );
        }
    });
}
