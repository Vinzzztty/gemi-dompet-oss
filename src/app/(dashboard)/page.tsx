'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Header,
  BalanceCard,
  TransactionHistory,
  ActiveSplitBillsWidget,
  UpcomingBillsWidget,
  SavingsGoalsWidget,
  FloatingActionButton,
  AddTransactionModal,
  ImportCSVModal
} from '@/features/dashboard';
import Toast from '@/components/ui/Toast';
import Link from 'next/link';
import { AuthGuard } from '@/features/auth/components';
import { mockSummary } from '@/data/mockData';
import { summaryService } from '@/services/summary.service';
import type { Summary } from '@/types';
import { ArrowRight, Users } from 'lucide-react';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'income' | 'expense' | 'transaction' | 'wallet'>('expense');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Summary data state
  const [summary, setSummary] = useState<Summary>(mockSummary);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Refresh trigger for TransactionHistory
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /** Rentang bulan berjalan (ringkasan saldo di kartu biru) */
  const getDateRange = useCallback(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }, []);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryError(null);
      // setIsLoadingSummary(true); // Optional: keep existing behavior or uncomment

      const { startDate, endDate } = getDateRange();
      const response = await summaryService.getSummary(startDate, endDate);

      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        setSummaryError(response.message || 'Gagal memuat ringkasan');
        console.error('Failed to fetch summary:', response);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaryError('Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoadingSummary(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOpenModal = (type: 'income' | 'expense' | 'transaction' | 'wallet' | 'transfer') => {
    setModalInitialType(type as any);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveTransaction = () => {
    fetchSummary();
    setRefreshTrigger((prev) => prev + 1);

    setIsModalOpen(false);

    // Note: Toast is already handled in AddTransactionModal
  };

  return (
    <AuthGuard>
      <div className="animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <Header />

        {/* Greeting with Import CSV */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Halo! 👋</h2>
            <p className="text-sm text-gray-500">Kelola keuanganmu dengan tenang</p>
          </div>
          <div className="w-full sm:w-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/group-expense"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold shadow-sm hover:shadow-md transition-all text-sm active:scale-95"
              title="Split Bill"
            >
              <Users size={18} />
              <span>Split Bill</span>
              <ArrowRight size={16} />
            </Link>
            <button
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-full font-semibold shadow-sm hover:shadow-md transition-all text-sm active:scale-95"
              onClick={() => setIsImportModalOpen(true)}
              title="Import Data"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Import Data</span>
            </button>
          </div>
        </div>

        {/* Balance Card */}
        {isLoadingSummary ? (
          <div className="bg-gradient-to-br from-[#4a90e2] to-[#3b7dd8] rounded-[24px] p-6 mb-6 animate-pulse">
            <div className="w-32 h-5 bg-white/30 rounded-md mb-4"></div>
            <div className="w-52 h-10 bg-white/30 rounded-md mb-6"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-[60px] bg-white/20 rounded-xl"></div>
              <div className="h-[60px] bg-white/20 rounded-xl"></div>
            </div>
          </div>
        ) : summaryError ? (
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-[24px] p-6 mb-6 text-white text-center">
            <p className="mb-4 text-base">⚠️ {summaryError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg cursor-pointer text-sm hover:bg-white/30 transition-all"
            >
              Muat Ulang
            </button>
          </div>
        ) : (
          <BalanceCard 
            summary={summary}
          />
        )}

        {/* Riwayat transaksi (2) + widget tagihan & tabungan (1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 lg:items-start">
          <div className="lg:col-span-2 min-w-0">
            <TransactionHistory refreshTrigger={refreshTrigger} />
          </div>
          <aside className="flex flex-col gap-6 min-w-0">
            <ActiveSplitBillsWidget refreshSignal={refreshTrigger} />
            <UpcomingBillsWidget
              refreshSignal={refreshTrigger}
              onBillUpdated={() => {
                void fetchSummary();
                setRefreshTrigger((p) => p + 1);
              }}
            />
            <SavingsGoalsWidget />
          </aside>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton onOpenModal={handleOpenModal} />

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveTransaction}
          initialType={modalInitialType}
          hideTypeSelector={true}
        />

        {/* Import CSV Modal */}
        <ImportCSVModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={() => window.location.reload()}
        />

        {/* Toast Notification */}
        <Toast
          message={toastMessage}
          type={toastType}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      </div>
    </AuthGuard>
  );
}
