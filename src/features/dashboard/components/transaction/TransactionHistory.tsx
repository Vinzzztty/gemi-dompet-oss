'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Calendar, SlidersHorizontal, LayoutList, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import TransactionItem from './TransactionItem';
import { Transaction } from '@/types';
import { useIncome } from '@/features/income/hooks/useIncome';
import { useExpense } from '@/features/expense/hooks/useExpense';
import { useTransfer } from '@/features/transfer/hooks/useTransfer';
import { formatCurrency } from '@/utils/format';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface TransactionHistoryProps {
  refreshTrigger?: number;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ refreshTrigger = 0 }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  // Month navigation state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Category filter state
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch income and expense data
  const { data: incomeData, loading: loadingIncome, fetch: fetchIncome } = useIncome();
  const { data: expenseData, loading: loadingExpense, fetch: fetchExpense } = useExpense();
  const { data: transferData, loading: loadingTransfer, fetch: fetchTransfer } = useTransfer();

  useEffect(() => {
    // Determine the start and end of the selected month
    const startDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0).toISOString();
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999).toISOString();

    fetchIncome({ startDate, endDate, limit: 100 });
    fetchExpense({ startDate, endDate, limit: 100 });
    fetchTransfer();
  }, [fetchIncome, fetchExpense, fetchTransfer, refreshTrigger, selectedMonth, selectedYear]);

  // Transform income data to Transaction format
  const incomeTransactions: Transaction[] = useMemo(() => {
    if (!incomeData || incomeData.length === 0) return [];

    return incomeData.map((income) => {
      const transactionDate = income.tanggal || new Date().toISOString();

      return {
        id: income.id,
        type: 'income' as const,
        amount: income.nominal,
        description: income.nama || income.category?.name || 'Pemasukan',
        category: income.category ? {
          name: income.category.name,
          icon: income.category.icon,
        } : undefined as any,
        date: transactionDate,
        notes: income.catatan || '',
        icon: income.category?.icon || 'wallet',
      } as unknown as Transaction;
    });
  }, [incomeData]);

  // Transform expense data to Transaction format
  const expenseTransactions: Transaction[] = useMemo(() => {
    if (!expenseData || expenseData.length === 0) return [];

    return expenseData.map((expense) => {
      const transactionDate = expense.tanggal || new Date().toISOString();

      return {
        id: expense.id,
        type: 'expense' as const,
        amount: expense.nominal,
        description: expense.nama || expense.category?.name || 'Pengeluaran',
        category: expense.category ? {
          name: expense.category.name,
          icon: expense.category.icon,
        } : undefined as any,
        date: transactionDate,
        notes: expense.catatan || '',
        icon: expense.category?.icon || 'wallet',
      } as unknown as Transaction;
    });
  }, [expenseData]);

  // Transform transfer data to Transaction format
  const transferTransactions: Transaction[] = useMemo(() => {
    if (!transferData || transferData.length === 0) return [];

    return transferData.map((transfer) => {
      const transactionDate = transfer.date || new Date().toISOString();

      return {
        id: transfer.id,
        type: 'transfer' as const,
        amount: transfer.amount,
        description: `${transfer.fromWallet?.namaDompet || 'Dompet'} → ${transfer.toWallet?.namaDompet || 'Dompet'}`,
        category: {
          name: 'Transfer',
          icon: 'arrow-right-left',
        },
        date: transactionDate,
        notes: transfer.note || '',
        icon: 'arrow-right-left',
      } as unknown as Transaction;
    });
  }, [transferData]);

  // Get unique categories based on active tab
  const uniqueCategories = useMemo(() => {
    let transactions: Transaction[] = [];

    if (activeTab === 'all') {
      transactions = [...incomeTransactions, ...expenseTransactions, ...transferTransactions];
    } else if (activeTab === 'income') {
      transactions = incomeTransactions;
    } else if (activeTab === 'expense') {
      transactions = expenseTransactions;
    } else if (activeTab === 'transfer') {
      transactions = transferTransactions;
    }

    const categorySet = new Set<string>();
    transactions.forEach(t => {
      // Type guard: check if category is an object with name property
      if (t.category && typeof t.category === 'object' && 'name' in t.category) {
        categorySet.add((t.category as { name: string }).name);
      }
    });

    return Array.from(categorySet);
  }, [activeTab, incomeTransactions, expenseTransactions, transferTransactions]);

  // Filter transactions based on all filters
  const filteredTransactions = useMemo(() => {
    let transactions: Transaction[] = [];

    // Filter by tab
    if (activeTab === 'all') {
      transactions = [...incomeTransactions, ...expenseTransactions, ...transferTransactions];
    } else if (activeTab === 'income') {
      transactions = incomeTransactions;
    } else if (activeTab === 'expense') {
      transactions = expenseTransactions;
    } else if (activeTab === 'transfer') {
      transactions = transferTransactions;
    }

    // Filter by month and year
    transactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    // Filter by category
    if (selectedCategory) {
      transactions = transactions.filter(t => {
        // Type guard for category object
        return t.category && typeof t.category === 'object' && 'name' in t.category && (t.category as { name: string }).name === selectedCategory;
      });
    }

    // Sort by date (newest first)
    return transactions.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB.getTime() - dateA.getTime();
    });
  }, [activeTab, incomeTransactions, expenseTransactions, transferTransactions, selectedMonth, selectedYear, selectedCategory]);

  // Calculate totals based on filtered transactions
  const { totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        income += Number(t.amount);
      } else {
        expense += Number(t.amount);
      }
    });

    return { totalIncome: income, totalExpense: expense };
  }, [filteredTransactions]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleViewAll = () => {
    if (activeTab === 'income') {
      router.push('/income');
    } else if (activeTab === 'expense') {
      router.push('/expense');
    }
  };

  const isLoading = loadingIncome || loadingExpense || loadingTransfer;

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      {/* Header with Month Navigation */}
      <div className="flex justify-between items-start mb-5 gap-3 max-md:flex-col max-md:items-stretch">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-gray-900 m-0">Riwayat Transaksi</h2>
          <span className="text-sm text-gray-600">{filteredTransactions.length} transaksi</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 py-2 px-3 rounded-xl max-md:justify-center">
          <button className="flex items-center justify-center bg-transparent border-none text-gray-600 cursor-pointer p-1 rounded-md transition-all hover:bg-gray-100 hover:text-gray-900" onClick={handlePrevMonth}>
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-[140px] justify-center max-[480px]:min-w-[120px] max-[480px]:text-[13px]">
            <Calendar size={16} />
            <span>{MONTHS[selectedMonth]} {selectedYear}</span>
          </div>
          <button className="flex items-center justify-center bg-transparent border-none text-gray-600 cursor-pointer p-1 rounded-md transition-all hover:bg-gray-100 hover:text-gray-900" onClick={handleNextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Tabs with Filter Button */}
      <div className="flex justify-between items-center gap-3 mb-4 max-md:flex-col max-md:items-stretch">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-md:w-full">
          <button
            className={`flex items-center gap-2 py-2 px-4 bg-transparent border-none text-sm font-medium cursor-pointer transition-all rounded-lg max-md:flex-1 max-md:justify-center max-md:p-2 ${activeTab === 'all'
              ? 'bg-white text-blue-600 font-semibold shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('all')}
          >
            <LayoutList size={18} />
            <span className={activeTab === 'all' ? 'max-md:hidden' : 'hidden'}>Semua</span>
          </button>
          <button
            className={`flex items-center gap-2 py-2 px-4 bg-transparent border-none text-sm font-medium cursor-pointer transition-all rounded-lg max-md:flex-1 max-md:justify-center max-md:p-2 ${activeTab === 'income'
              ? 'bg-white text-green-600 font-semibold shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('income')}
          >
            <ArrowDownLeft size={18} />
            <span className={activeTab === 'income' ? 'max-md:hidden' : 'hidden'}>Pemasukan</span>
          </button>
          <button
            className={`flex items-center gap-2 py-2 px-4 bg-transparent border-none text-sm font-medium cursor-pointer transition-all rounded-lg max-md:flex-1 max-md:justify-center max-md:p-2 ${activeTab === 'expense'
              ? 'bg-white text-red-600 font-semibold shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('expense')}
          >
            <ArrowUpRight size={18} />
            <span className={activeTab === 'expense' ? 'max-md:hidden' : 'hidden'}>Pengeluaran</span>
          </button>
          <button
            className={`flex items-center gap-2 py-2 px-4 bg-transparent border-none text-sm font-medium cursor-pointer transition-all rounded-lg max-md:flex-1 max-md:justify-center max-md:p-2 ${activeTab === 'transfer'
              ? 'bg-white text-blue-600 font-semibold shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
            onClick={() => setActiveTab('transfer')}
          >
            <ArrowRightLeft size={18} />
            <span className={activeTab === 'transfer' ? 'max-md:hidden' : 'hidden'}>Transfer</span>
          </button>
        </div>
        <button
          className={`flex items-center gap-2 py-2 px-4 bg-white border-2 rounded-full text-blue-600 text-sm font-medium cursor-pointer transition-all max-md:w-full max-md:justify-center ${showCategoryFilter ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400'
            }`}
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
        >
          <SlidersHorizontal size={18} />
          <span>Filter</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      {showCategoryFilter && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <h4 className="text-xs font-semibold text-gray-600 tracking-wider m-0 mb-3">FILTER KATEGORI</h4>
          <div className="flex flex-wrap gap-2">
            <button
              className={`py-2 px-4 rounded-full text-sm font-medium cursor-pointer transition-all max-[480px]:text-[13px] max-[480px]:py-1.5 max-[480px]:px-3 ${selectedCategory === null
                ? 'bg-blue-500 text-white border-2 border-blue-500'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              onClick={() => setSelectedCategory(null)}
            >
              Semua
            </button>
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                className={`py-2 px-4 rounded-full text-sm font-medium cursor-pointer transition-all max-[480px]:text-[13px] max-[480px]:py-1.5 max-[480px]:px-3 ${selectedCategory === cat
                  ? 'bg-blue-500 text-white border-2 border-blue-500'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {activeTab !== 'transfer' && (
        <div className="grid grid-cols-2 gap-4 mb-5 max-[480px]:grid-cols-1 max-[480px]:gap-3">
          <div className="bg-green-500/8 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-sm text-gray-600">Pemasukan</span>
            <span className="text-lg font-bold text-green-500">+{formatCurrency(totalIncome)}</span>
          </div>
          <div className="bg-red-500/8 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-sm text-gray-600">Pengeluaran</span>
            <span className="text-lg font-bold text-red-500">-{formatCurrency(totalExpense)}</span>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="flex flex-col gap-3 max-h-80 overflow-y-auto overflow-x-hidden pr-4 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 max-[480px]:max-h-[280px] max-[480px]:pr-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400">
            <div className="w-8 h-8 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p>Memuat transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>Belum ada transaksi</p>
          </div>
        ) : (
          <>
            {filteredTransactions.map(transaction => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </>
        )}
      </div>

      {/* View All Button */}
      {(activeTab === 'income' || activeTab === 'expense') && filteredTransactions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-200">
          <button onClick={handleViewAll} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-600 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all hover:bg-blue-100 hover:text-blue-700">
            <span>Lihat Semua Transaksi</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <style jsx>{`
        .transaction-history {
          background-color: var(--bg-card);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: var(--shadow);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-5);
          gap: var(--space-3);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .history-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .transaction-count {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .month-navigation {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--gray-50);
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-xl);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: var(--space-1);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: var(--gray-100);
          color: var(--text-primary);
        }

        .month-display {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          min-width: 140px;
          justify-content: center;
        }

        .tabs-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .transaction-tabs {
          display: flex;
          gap: var(--space-1);
          background: var(--gray-100);
          padding: var(--space-1);
          border-radius: var(--radius-xl);
        }

        .tab {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: var(--radius-lg);
        }

        .tab:hover {
          color: var(--text-primary);
        }

        .tab.active {
          background: white;
          color: var(--primary-600);
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-icon {
          font-size: 0.875rem;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
          color: var(--primary-600);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover, .filter-btn.active {
          background: var(--primary-50);
          border-color: var(--primary-200);
        }

        .category-filter {
          background: var(--gray-50);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          margin-bottom: var(--space-4);
        }

        .filter-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
          margin: 0 0 var(--space-3) 0;
        }

        .category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .chip {
          padding: var(--space-2) var(--space-4);
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .chip:hover {
          border-color: var(--primary-300);
          color: var(--primary-600);
        }

        .chip.active {
          background: var(--primary-500);
          border-color: var(--primary-500);
          color: white;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }

        .summary-card {
          background: var(--primary-50);
          border-radius: var(--radius-xl);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .summary-card.income {
          background: rgba(16, 185, 129, 0.08);
        }

        .summary-card.expense {
          background: rgba(239, 68, 68, 0.08);
        }

        .summary-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .summary-card.income .summary-amount {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--success);
        }

        .summary-card.expense .summary-amount {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--danger);
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          max-height: 320px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: var(--space-4);
        }

        .transaction-list::-webkit-scrollbar {
          width: 6px;
        }

        .transaction-list::-webkit-scrollbar-track {
          background: var(--gray-100);
          border-radius: var(--radius);
        }

        .transaction-list::-webkit-scrollbar-thumb {
          background: var(--gray-300);
          border-radius: var(--radius);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
          gap: var(--space-3);
          color: var(--text-muted);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--gray-200);
          border-top-color: var(--primary-500);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: var(--space-8);
          color: var(--text-muted);
        }

        .view-all-container {
          margin-top: var(--space-5);
          padding-top: var(--space-4);
          border-top: 1px solid var(--gray-200);
        }

        .view-all-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          width: 100%;
          padding: var(--space-3);
          background: var(--primary-50);
          color: var(--primary-600);
          border: none;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-all-btn:hover {
          background: var(--primary-100);
          color: var(--primary-700);
        }

        @media (max-width: 768px) {
          .history-header {
            flex-direction: column;
            align-items: stretch;
          }

          .month-navigation {
            justify-content: center;
          }

          .tabs-container {
            flex-direction: column;
            align-items: stretch;
          }

          .transaction-tabs {
            width: 100%;
          }

          .tab {
            flex: 1;
            justify-content: center;
            padding: var(--space-2);
          }

          .tab span:not(.tab-icon) {
            display: none;
          }

          .filter-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .transaction-history {
            padding: var(--space-3);
            margin-bottom: var(--space-8);
          }

          .summary-cards {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }

          .transaction-list {
            max-height: 280px;
            padding-right: var(--space-3);
          }

          .month-display {
            min-width: 120px;
            font-size: 0.8125rem;
          }

          .chip {
            font-size: 0.8125rem;
            padding: var(--space-1-5) var(--space-3);
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionHistory;