// Transaction types
export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    category: CategoryType | { name: string; icon?: string };
    date: Date | string;
    notes?: string;
    icon?: string;
}

// Category types
export type CategoryType =
    | 'belanja'
    | 'transport'
    | 'makan_minum'
    | 'hiburan'
    | 'gaji'
    | 'investasi'
    | 'lainnya';

export interface Category {
    id: CategoryType;
    name: string;
    color: string;
    icon: string;
}

// Summary data
export interface Summary {
    balance: number;
    income: number;
    expense: number;
    month: string;
    year: number;
}

// Category spending for chart
export interface CategorySpending {
    category: CategoryType;
    name: string;
    amount: number;
    color: string;
}

// Filter types
export type TransactionFilter = 'all' | 'income' | 'expense' | 'transfer';
