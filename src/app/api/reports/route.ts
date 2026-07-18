import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

// Indonesian month names
const INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Color palette for income categories - green theme
const INCOME_COLORS = [
    '#2ECC71', // Emerald Green
    '#27AE60', // Nephritis Green
    '#1ABC9C', // Turquoise
    '#16A085', // Green Sea
    '#3498DB', // Peter River Blue
    '#2980B9', // Belize Hole Blue
    '#1E8449', // Dark Green
    '#58D68D', // Light Green
];

// Color palette for expense categories - red/orange theme
const EXPENSE_COLORS = [
    '#E74C3C', // Alizarin Red
    '#C0392B', // Pomegranate Red
    '#E67E22', // Carrot Orange
    '#D35400', // Pumpkin Orange
    '#F39C12', // Orange
    '#E59866', // Light Orange
    '#EC7063', // Light Red
    '#CB4335', // Dark Red
];

// GET /api/reports - Get comprehensive report data for a specific month
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: AuthenticatedRequest) => {
        try {
            const { searchParams } = new URL(req.url);
            const monthParam = searchParams.get('month');
            const yearParam = searchParams.get('year');

            // Default to current month/year if not specified
            const now = new Date();
            const month = monthParam ? parseInt(monthParam) : now.getMonth();
            const year = yearParam ? parseInt(yearParam) : now.getFullYear();

            // Validate month and year
            if (month < 0 || month > 11) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid month',
                        message: 'Bulan harus antara 0-11',
                    },
                    { status: 400 }
                );
            }

            // Calculate date ranges for current and previous month
            const currentMonthStart = new Date(year, month, 1);
            const currentMonthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

            const previousMonth = month === 0 ? 11 : month - 1;
            const previousYear = month === 0 ? year - 1 : year;
            const previousMonthStart = new Date(previousYear, previousMonth, 1);
            const previousMonthEnd = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59, 999);

            const userId = req.userId!;

            // Fetch current month data
            const [currentIncome, currentExpense, currentExpensesByCategory, currentIncomesByCategory] = await Promise.all([
                // Current month income
                prisma.incomeTransaction.aggregate({
                    where: {
                        userId,
                        tanggal: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                    },
                    _sum: { nominal: true },
                }),
                // Current month expense
                prisma.expenseTransaction.aggregate({
                    where: {
                        userId,
                        tanggal: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                    },
                    _sum: { nominal: true },
                }),
                // Current month expenses by category
                prisma.expenseTransaction.findMany({
                    where: {
                        userId,
                        tanggal: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                    },
                    include: {
                        category: true,
                        wallet: true,
                    },
                }),
                // Current month income by category
                prisma.incomeTransaction.findMany({
                    where: {
                        userId,
                        tanggal: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                    },
                    include: {
                        category: true,
                        wallet: true,
                    },
                }),
            ]);

            // Fetch previous month data
            const [previousIncome, previousExpense, previousExpensesByCategory, previousIncomesByCategory] = await Promise.all([
                // Previous month income
                prisma.incomeTransaction.aggregate({
                    where: {
                        userId,
                        tanggal: {
                            gte: previousMonthStart,
                            lte: previousMonthEnd,
                        },
                    },
                    _sum: { nominal: true },
                }),
                // Previous month expense
                prisma.expenseTransaction.aggregate({
                    where: {
                        userId,
                        tanggal: {
                            gte: previousMonthStart,
                            lte: previousMonthEnd,
                        },
                    },
                    _sum: { nominal: true },
                }),
                // Previous month expenses by category
                prisma.expenseTransaction.findMany({
                    where: {
                        userId,
                        tanggal: {
                            gte: previousMonthStart,
                            lte: previousMonthEnd,
                        },
                    },
                    include: {
                        category: true,
                    },
                }),
                // Previous month income by category
                prisma.incomeTransaction.findMany({
                    where: {
                        userId,
                        tanggal: {
                            gte: previousMonthStart,
                            lte: previousMonthEnd,
                        },
                    },
                    include: {
                        category: true,
                    },
                }),
            ]);

            // Calculate totals
            const currentIncomeTotal = Number(currentIncome._sum.nominal || 0);
            const currentExpenseTotal = Number(currentExpense._sum.nominal || 0);
            const currentBalance = currentIncomeTotal - currentExpenseTotal;

            const previousIncomeTotal = Number(previousIncome._sum.nominal || 0);
            const previousExpenseTotal = Number(previousExpense._sum.nominal || 0);

            // Group current month expenses by category
            const currentExpenseCategoryMap = new Map<string, { name: string; amount: number; icon: string }>();
            currentExpensesByCategory.forEach((transaction) => {
                const categoryId = transaction.categoryId;
                const categoryName = transaction.category.name;
                const categoryIcon = transaction.category.icon || 'wallet';
                const amount = Number(transaction.nominal);

                if (currentExpenseCategoryMap.has(categoryId)) {
                    const existing = currentExpenseCategoryMap.get(categoryId)!;
                    existing.amount += amount;
                } else {
                    currentExpenseCategoryMap.set(categoryId, {
                        name: categoryName,
                        amount: amount,
                        icon: categoryIcon,
                    });
                }
            });

            // Group current month income by category
            const currentIncomeCategoryMap = new Map<string, { name: string; amount: number; icon: string }>();
            currentIncomesByCategory.forEach((transaction) => {
                const categoryId = transaction.categoryId;
                const categoryName = transaction.category.name;
                const categoryIcon = transaction.category.icon || 'wallet';
                const amount = Number(transaction.nominal);

                if (currentIncomeCategoryMap.has(categoryId)) {
                    const existing = currentIncomeCategoryMap.get(categoryId)!;
                    existing.amount += amount;
                } else {
                    currentIncomeCategoryMap.set(categoryId, {
                        name: categoryName,
                        amount: amount,
                        icon: categoryIcon,
                    });
                }
            });

            // Group previous month expenses by category
            const previousExpenseCategoryMap = new Map<string, number>();
            previousExpensesByCategory.forEach((transaction) => {
                const categoryId = transaction.categoryId;
                const amount = Number(transaction.nominal);

                if (previousExpenseCategoryMap.has(categoryId)) {
                    previousExpenseCategoryMap.set(categoryId, previousExpenseCategoryMap.get(categoryId)! + amount);
                } else {
                    previousExpenseCategoryMap.set(categoryId, amount);
                }
            });

            // Group previous month income by category
            const previousIncomeCategoryMap = new Map<string, number>();
            previousIncomesByCategory.forEach((transaction) => {
                const categoryId = transaction.categoryId;
                const amount = Number(transaction.nominal);

                if (previousIncomeCategoryMap.has(categoryId)) {
                    previousIncomeCategoryMap.set(categoryId, previousIncomeCategoryMap.get(categoryId)! + amount);
                } else {
                    previousIncomeCategoryMap.set(categoryId, amount);
                }
            });

            // Calculate expense category details with percentages and comparisons
            const expenseCategoryDetails = Array.from(currentExpenseCategoryMap.entries())
                .map(([categoryId, data], index) => {
                    const previousAmount = previousExpenseCategoryMap.get(categoryId) || 0;
                    const percentage = currentExpenseTotal > 0
                        ? (data.amount / currentExpenseTotal) * 100
                        : 0;

                    let changePercentage = 0;
                    let isIncrease = false;

                    if (previousAmount > 0) {
                        changePercentage = ((data.amount - previousAmount) / previousAmount) * 100;
                        isIncrease = changePercentage > 0;
                    } else if (data.amount > 0) {
                        changePercentage = 100;
                        isIncrease = true;
                    }

                    // Calculate wallet breakdown for this category
                    const walletBreakdownMap = new Map<string, { walletId: string; walletName: string; amount: number }>();
                    currentExpensesByCategory
                        .filter(t => t.categoryId === categoryId)
                        .forEach(transaction => {
                            const walletId = transaction.walletId || 'no-wallet';
                            const walletName = transaction.wallet?.namaDompet || 'Tanpa Dompet';
                            const amount = Number(transaction.nominal);

                            if (walletBreakdownMap.has(walletId)) {
                                const existing = walletBreakdownMap.get(walletId)!;
                                existing.amount += amount;
                            } else {
                                walletBreakdownMap.set(walletId, { walletId, walletName, amount });
                            }
                        });

                    const walletBreakdown = Array.from(walletBreakdownMap.values())
                        .sort((a, b) => b.amount - a.amount);

                    return {
                        category: categoryId,
                        name: data.name,
                        amount: data.amount,
                        percentage: Math.round(percentage * 10) / 10,
                        previousAmount,
                        changePercentage: Math.abs(Math.round(changePercentage * 10) / 10),
                        isIncrease,
                        color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
                        type: 'expense' as const,
                        walletBreakdown,
                    };
                })
                .sort((a, b) => b.amount - a.amount);

            // Calculate income category details with percentages and comparisons
            const incomeCategoryDetails = Array.from(currentIncomeCategoryMap.entries())
                .map(([categoryId, data], index) => {
                    const previousAmount = previousIncomeCategoryMap.get(categoryId) || 0;
                    const percentage = currentIncomeTotal > 0
                        ? (data.amount / currentIncomeTotal) * 100
                        : 0;

                    let changePercentage = 0;
                    let isIncrease = false;

                    if (previousAmount > 0) {
                        changePercentage = ((data.amount - previousAmount) / previousAmount) * 100;
                        isIncrease = changePercentage > 0;
                    } else if (data.amount > 0) {
                        changePercentage = 100;
                        isIncrease = true;
                    }

                    // Calculate wallet breakdown for this category
                    const walletBreakdownMap = new Map<string, { walletId: string; walletName: string; amount: number }>();
                    currentIncomesByCategory
                        .filter(t => t.categoryId === categoryId)
                        .forEach(transaction => {
                            const walletId = transaction.walletId || 'no-wallet';
                            const walletName = transaction.wallet?.namaDompet || 'Tanpa Dompet';
                            const amount = Number(transaction.nominal);

                            if (walletBreakdownMap.has(walletId)) {
                                const existing = walletBreakdownMap.get(walletId)!;
                                existing.amount += amount;
                            } else {
                                walletBreakdownMap.set(walletId, { walletId, walletName, amount });
                            }
                        });

                    const walletBreakdown = Array.from(walletBreakdownMap.values())
                        .sort((a, b) => b.amount - a.amount);

                    return {
                        category: categoryId,
                        name: data.name,
                        amount: data.amount,
                        percentage: Math.round(percentage * 10) / 10,
                        previousAmount,
                        changePercentage: Math.abs(Math.round(changePercentage * 10) / 10),
                        isIncrease,
                        color: INCOME_COLORS[index % INCOME_COLORS.length],
                        type: 'income' as const,
                        walletBreakdown,
                    };
                })
                .sort((a, b) => b.amount - a.amount);

            // Combine income and expense categories
            const categoryDetails = [...incomeCategoryDetails, ...expenseCategoryDetails];

            // Calculate wallet breakdown
            const walletBreakdownMap = new Map<string, { walletId: string; walletName: string; income: number; expense: number }>();
            
            // Process income transactions by wallet
            currentIncomesByCategory.forEach((transaction) => {
                const walletId = transaction.walletId || 'no-wallet';
                const walletName = transaction.wallet?.namaDompet || 'Tanpa Dompet';
                const amount = Number(transaction.nominal);

                if (walletBreakdownMap.has(walletId)) {
                    const existing = walletBreakdownMap.get(walletId)!;
                    existing.income += amount;
                } else {
                    walletBreakdownMap.set(walletId, {
                        walletId,
                        walletName,
                        income: amount,
                        expense: 0,
                    });
                }
            });

            // Process expense transactions by wallet
            currentExpensesByCategory.forEach((transaction) => {
                const walletId = transaction.walletId || 'no-wallet';
                const walletName = transaction.wallet?.namaDompet || 'Tanpa Dompet';
                const amount = Number(transaction.nominal);

                if (walletBreakdownMap.has(walletId)) {
                    const existing = walletBreakdownMap.get(walletId)!;
                    existing.expense += amount;
                } else {
                    walletBreakdownMap.set(walletId, {
                        walletId,
                        walletName,
                        income: 0,
                        expense: amount,
                    });
                }
            });

            // Convert wallet breakdown map to array and calculate balance
            const walletBreakdown = Array.from(walletBreakdownMap.values())
                .map(wallet => ({
                    ...wallet,
                    balance: wallet.income - wallet.expense,
                }))
                .sort((a, b) => b.balance - a.balance); // Sort by balance descending

            // Count transactions
            const transactionCount = await prisma.$transaction([
                prisma.incomeTransaction.count({
                    where: {
                        userId,
                        tanggal: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                    },
                }),
                prisma.expenseTransaction.count({
                    where: {
                        userId,
                        tanggal: {
                            gte: currentMonthStart,
                            lte: currentMonthEnd,
                        },
                    },
                }),
            ]);

            const totalTransactions = transactionCount[0] + transactionCount[1];

            // Prepare pie chart data
            const pieChartData = categoryDetails.map((detail) => ({
                category: detail.category,
                name: detail.name,
                amount: detail.amount,
                color: detail.color,
            }));

            // Prepare response
            const reportData = {
                summary: {
                    balance: currentBalance,
                    income: currentIncomeTotal,
                    expense: currentExpenseTotal,
                    month: INDONESIAN_MONTHS[month],
                    year: year,
                    transactionCount: totalTransactions,
                },
                monthlyComparison: {
                    currentMonth: {
                        income: currentIncomeTotal,
                        expense: currentExpenseTotal,
                    },
                    previousMonth: {
                        income: previousIncomeTotal,
                        expense: previousExpenseTotal,
                    },
                },
                categoryDetails,
                pieChartData,
                walletBreakdown,
            };

            return NextResponse.json(
                {
                    success: true,
                    data: reportData,
                },
                { status: 200 }
            );
        } catch (error: any) {
            console.error('Error fetching report data:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to fetch report data',
                    message: 'Gagal mengambil data laporan',
                },
                { status: 500 }
            );
        }
    });
}
