import { Transaction, Category, CategorySpending, Summary, CategoryType } from '@/types';

// Categories definition
export const categories: Record<CategoryType, Category> = {
    belanja: {
        id: 'belanja',
        name: 'Belanja',
        color: '#4176ED',
        icon: 'shopping-bag',
    },
    transport: {
        id: 'transport',
        name: 'Transport',
        color: '#4176ED',
        icon: 'car',
    },
    makan_minum: {
        id: 'makan_minum',
        name: 'Makan & Minum',
        color: '#4176ED',
        icon: 'utensils',
    },
    hiburan: {
        id: 'hiburan',
        name: 'Hiburan',
        color: '#4176ED',
        icon: 'film',
    },
    gaji: {
        id: 'gaji',
        name: 'Gaji',
        color: '#10B981',
        icon: 'wallet',
    },
    investasi: {
        id: 'investasi',
        name: 'Investasi',
        color: '#10B981',
        icon: 'trending-up',
    },
    lainnya: {
        id: 'lainnya',
        name: 'Lainnya',
        color: '#6B7280',
        icon: 'more',
    },
};

// Mock transactions data
export const mockTransactions: Transaction[] = [
    {
        id: '1',
        description: 'Gaji Bulanan',
        amount: 10500000,
        type: 'income',
        category: 'gaji',
        date: new Date(2026, 0, 1),
    },
    {
        id: '2',
        description: 'Gojek/Grab',
        amount: 200000,
        type: 'expense',
        category: 'transport',
        date: new Date(2026, 0, 20),
    },
    {
        id: '3',
        description: 'Kopi & snack',
        amount: 85000,
        type: 'expense',
        category: 'makan_minum',
        date: new Date(2026, 0, 18),
    },
    {
        id: '4',
        description: 'Nonton bioskop',
        amount: 120000,
        type: 'expense',
        category: 'hiburan',
        date: new Date(2026, 0, 15),
    },
    {
        id: '5',
        description: 'Beli baju',
        amount: 500000,
        type: 'expense',
        category: 'belanja',
        date: new Date(2026, 0, 12),
    },
    {
        id: '6',
        description: 'Groceries',
        amount: 400000,
        type: 'expense',
        category: 'belanja',
        date: new Date(2026, 0, 10),
    },
];

// Mock summary data
export const mockSummary: Summary = {
    balance: 9195000,
    income: 10500000,
    expense: 1305000,
    month: 'Januari',
    year: 2026,
};

// Category spending for chart
export const mockCategorySpending: CategorySpending[] = [
    { category: 'belanja', name: 'Belanja', amount: 500000, color: '#4176ED' },
    { category: 'transport', name: 'Transport', amount: 350000, color: '#4176ED' },
    { category: 'makan_minum', name: 'Makan & Minum', amount: 300000, color: '#4176ED' },
    { category: 'hiburan', name: 'Hiburan', amount: 120000, color: '#4176ED' },
];
