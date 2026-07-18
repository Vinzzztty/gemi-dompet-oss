import { CategorySpending, Summary } from '@/types';

// Report-specific data types
export interface MonthlyComparison {
    currentMonth: {
        income: number;
        expense: number;
    };
    previousMonth: {
        income: number;
        expense: number;
    };
}

export interface CategoryDetail {
    category: string;
    name: string;
    amount: number;
    percentage: number;
    previousAmount: number;
    changePercentage: number;
    isIncrease: boolean;
    color: string;
    type: 'income' | 'expense';
    walletBreakdown?: Array<{
        walletId: string;
        walletName: string;
        amount: number;
    }>;
}

export interface WalletBreakdown {
    walletId: string;
    walletName: string;
    income: number;
    expense: number;
    balance: number;
}

export interface ReportData {
    summary: {
        balance: number;
        income: number;
        expense: number;
        month: string;
        year: number;
        transactionCount?: number;
    };
    monthlyComparison: MonthlyComparison;
    categoryDetails: CategoryDetail[];
    pieChartData: Array<{
        category: string;
        name: string;
        amount: number;
        color: string;
    }>;
    walletBreakdown: WalletBreakdown[];
}

// Mock data for report page
export const mockMonthlyComparison: MonthlyComparison = {
    currentMonth: {
        income: 10500000,
        expense: 1305000,
    },
    previousMonth: {
        income: 10000000,
        expense: 1000000,
    },
};

export const mockCategoryDetails: CategoryDetail[] = [
    {
        category: 'belanja',
        name: 'Belanja',
        amount: 500000,
        percentage: 38.3,
        previousAmount: 750000,
        changePercentage: 33.3,
        isIncrease: false,
        color: '#4176ED',
        type: 'expense',
    },
    {
        category: 'transport',
        name: 'Transport',
        amount: 350000,
        percentage: 26.8,
        previousAmount: 300000,
        changePercentage: 16.7,
        isIncrease: true,
        color: '#3160D8',
        type: 'expense',
    },
    {
        category: 'makan_minum',
        name: 'Makan & Minum',
        amount: 335000,
        percentage: 25.7,
        previousAmount: 630000,
        changePercentage: 46.8,
        isIncrease: false,
        color: '#5BA4F5',
        type: 'expense',
    },
    {
        category: 'hiburan',
        name: 'Hiburan',
        amount: 120000,
        percentage: 9.2,
        previousAmount: 200000,
        changePercentage: 40.0,
        isIncrease: false,
        color: '#7AB8FF',
        type: 'expense',
    },
];

// Pie chart data for category breakdown
export const mockPieChartData: CategorySpending[] = [
    { category: 'belanja', name: 'Belanja', amount: 500000, color: '#4176ED' },
    { category: 'transport', name: 'Transport', amount: 350000, color: '#3160D8' },
    { category: 'makan_minum', name: 'Makan & Minum', amount: 335000, color: '#5BA4F5' },
    { category: 'hiburan', name: 'Hiburan', amount: 120000, color: '#7AB8FF' },
];

export const mockReportSummary: Summary = {
    balance: 9195000,
    income: 10500000,
    expense: 1305000,
    month: 'Januari',
    year: 2026,
};
