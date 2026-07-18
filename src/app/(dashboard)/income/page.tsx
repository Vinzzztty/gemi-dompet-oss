'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useIncome } from '@/features/income/hooks/useIncome';
import { formatCurrency } from '@/utils/format';
import { IncomeTable, IncomeMonthFilter } from '@/features/income/components';
import { EditIncomeModal } from '@/features/income/components/EditIncomeModal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import type { IncomeTransaction } from '@/features/income/types/income';
import { Header } from '@/features/dashboard';

export default function IncomePage() {
  const router = useRouter();
  const { data: transactions, loading, remove, fetch } = useIncome();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Pagination & Sorting state
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit/Delete state
  const [editTransaction, setEditTransaction] = useState<IncomeTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (selectedMonth !== null) {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0).toISOString();
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).toISOString();
      fetch({ startDate, endDate, limit: 1000 });
    } else {
      const startDate = new Date(selectedYear, 0, 1, 0, 0, 0, 0).toISOString();
      const endDate = new Date(selectedYear, 12, 0, 23, 59, 59, 999).toISOString();
      fetch({ startDate, endDate, limit: 1000 });
    }
  }, [fetch, selectedMonth, selectedYear]);

  // Filter transactions based on selected month and year
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((transaction) => {
      const date = new Date(transaction.tanggal);
      const transactionYear = date.getFullYear();
      const transactionMonth = date.getMonth() + 1;

      // Filter by year
      if (transactionYear !== selectedYear) return false;

      // Filter by month if selected
      if (selectedMonth !== null && transactionMonth !== selectedMonth) return false;

      return true;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate total for filtered transactions
  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + Number(t.nominal), 0);
  }, [filteredTransactions]);

  // Reset page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, sortBy]);

  // Sort transactions
  const sortedAndFilteredTransactions = useMemo(() => {
    let result = [...filteredTransactions];

    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      } else if (sortBy === 'amount_desc') {
        return Number(b.nominal) - Number(a.nominal);
      } else if (sortBy === 'amount_asc') {
        return Number(a.nominal) - Number(b.nominal);
      }
      return 0;
    });

    return result;
  }, [filteredTransactions, sortBy]);

  // Calculate pages and paginate
  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredTransactions, currentPage]);

  const handleBack = () => {
    router.push('/');
  };

  // CRUD Handlers
  const handleEdit = (transaction: IncomeTransaction) => {
    setEditTransaction(transaction);
  };

  const handleDelete = (id: string) => {
    const transaction = transactions?.find(t => t.id === id);
    if (transaction) {
      setDeleteId(id);
      setDeleteName(transaction.nama || 'transaksi ini');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    const result = await remove(deleteId);
    setDeleting(false);

    if (result) {
      // Close dialog
      setDeleteId(null);
      setDeleteName('');

      // Show success toast
      toast.success('Pemasukan berhasil dihapus');

      // Refresh list
      fetch();
    }
  };

  const handleEditSuccess = () => {
    // Show success toast
    toast.success('Pemasukan berhasil diperbarui');

    // Refresh list
    fetch();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 max-sm:p-4">
      {/* Header */}
      <Header />
      <div className="mb-6">
        <button onClick={handleBack} className="flex items-center gap-2 bg-transparent border-none text-gray-900 text-sm font-medium cursor-pointer py-2 px-0 mb-4 transition-colors hover:text-blue-500">
          <ArrowLeft size={20} />
          <span>Kembali</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 m-0 max-md:text-2xl">Daftar Pemasukan</h1>
      </div>


      {/* Summary Card */}
      <div className="bg-gradient-to-br from-[#4a90e2] to-[#3b7dd8] rounded-2xl p-6 text-white mb-6 shadow-md">
        <div className="text-5xl leading-none">💰</div>
        <div className="flex flex-col gap-1 mt-4">
          <span className="text-sm opacity-90 font-medium">
            {selectedMonth ? 'Total Pemasukan Bulan Ini' : 'Total Pemasukan'}
          </span>
          <span className="text-3xl font-bold max-md:text-2xl">{formatCurrency(filteredTotal)}</span>
          <span className="text-sm opacity-80">
            {filteredTransactions.length} transaksi
          </span>
        </div>
      </div>

      {/* Month Filter */}
      <IncomeMonthFilter
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
      />

      {/* Transactions Table & Sorting */}
      <div className="flex justify-between items-center mb-4 max-sm:flex-col max-sm:items-stretch max-sm:gap-3">
        <h2 className="text-xl font-bold text-gray-900 m-0">Daftar Transaksi</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 font-medium">Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white cursor-pointer transition-all hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="date_desc">Terbaru</option>
            <option value="date_asc">Terlama</option>
            <option value="amount_desc">Nominal Tertinggi</option>
            <option value="amount_asc">Nominal Terendah</option>
          </select>
        </div>
      </div>

      <IncomeTable
        data={paginatedTransactions}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Sebelumnya
          </button>
          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm text-gray-700 font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Selanjutnya
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <EditIncomeModal
        isOpen={!!editTransaction}
        onClose={() => setEditTransaction(null)}
        transaction={editTransaction}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteName}
        loading={deleting}
      />
    </div>
  );
}
