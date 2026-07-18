export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string | null;
  createdAt: Date;
}

export interface IncomeTransaction {
  id: string;
  userId: string;
  nama?: string;           // Transaction name
  nominal: number;
  categoryId: string;
  walletId?: string;
  tanggal: string;
  catatan?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    type: string;
  };
  wallet?: {
    id: string;
    namaDompet: string;
    norek?: string | null;
  };
  createdAt: string;
}

export interface IncomeTransactionWithCategory extends Omit<IncomeTransaction, 'categoryId'> {
  category: {
    id: string;
    name: string;
    icon: string;
    type: string;
  };
}

export interface CreateIncomeRequest {
  nama: string;            // Transaction name (required)
  nominal: number;
  catatan?: string;
  tanggal: string;
  categoryId: string;
  walletId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
