'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/features/dashboard';
import {
  ReportHeader,
  ReportSummaryCard,
  MonthComparisonChart,
  CategoryPieChart,
  CategoryDetailList,
  WalletSummaryCards,
} from '@/features/report/components';
import {
  mockMonthlyComparison,
  mockCategoryDetails,
  mockPieChartData,
  mockReportSummary,
  type ReportData,
} from '@/data/reportData';
import { getMonthName } from '@/utils/format';
import { reportsService } from '@/features/report/services/reports.service';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const router = useRouter();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  // Data state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch report data when month/year changes
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await reportsService.getReportData(currentMonth, currentYear);

        if (response.success && response.data) {
          setReportData(response.data);
        } else {
          setError(response.message || 'Gagal memuat data laporan');
          console.error('Failed to fetch report data:', response);
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Terjadi kesalahan saat memuat data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getPreviousMonthName = () => {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    return getMonthName(prevMonth);
  };

  // Calculate change percentages for summary cards
  const getIncomeChange = () => {
    if (!reportData) return { percentage: 0, isIncrease: false };
    const { currentMonth: curr, previousMonth: prev } = reportData.monthlyComparison;
    if (prev.income === 0) return { percentage: 0, isIncrease: curr.income > 0 };
    const change = ((curr.income - prev.income) / prev.income) * 100;
    return { percentage: Math.abs(Math.round(change * 10) / 10), isIncrease: change > 0 };
  };

  const getExpenseChange = () => {
    if (!reportData) return { percentage: 0, isIncrease: false };
    const { currentMonth: curr, previousMonth: prev } = reportData.monthlyComparison;
    if (prev.expense === 0) return { percentage: 0, isIncrease: curr.expense > 0 };
    const change = ((curr.expense - prev.expense) / prev.expense) * 100;
    return { percentage: Math.abs(Math.round(change * 10) / 10), isIncrease: change > 0 };
  };

  const incomeChange = getIncomeChange();
  const expenseChange = getExpenseChange();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Header */}
      <Header />
      <button onClick={handleBack} className="flex items-center gap-2 bg-transparent border-none text-gray-900 text-sm font-medium cursor-pointer py-2 mb-4 transition-colors duration-200 hover:text-blue-500">
        <ArrowLeft size={20} />
        <span>Kembali</span>
      </button>

      {/* Report Month Navigation Header */}
      <ReportHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {/* Loading State */}
      {isLoading && (
        <>
          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-3 gap-4 mb-6 max-lg:grid-cols-2 max-lg:[&>:first-child]:col-span-2">
            <div className="h-[140px] bg-gray-50 rounded-xl animate-pulse"></div>
            <div className="h-[140px] bg-gray-50 rounded-xl animate-pulse"></div>
            <div className="h-[140px] bg-gray-50 rounded-xl animate-pulse"></div>
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-2 gap-6 mb-6 max-md:grid-cols-1">
            <div className="h-[350px] bg-gray-50 rounded-xl animate-pulse"></div>
            <div className="h-[350px] bg-gray-50 rounded-xl animate-pulse"></div>
          </div>

          {/* Category Details Skeleton */}
          <div className="h-[400px] bg-gray-50 rounded-xl animate-pulse"></div>
        </>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 rounded-2xl p-6 mb-6 text-center text-red-600 border border-red-100">
          <p className="m-0 mb-4 text-base font-medium">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white border border-red-200 text-red-600 py-2 px-4 rounded-lg cursor-pointer text-sm transition-all hover:bg-red-50 hover:border-red-300 font-medium"
          >
            Muat Ulang
          </button>
        </div>
      )}

      {/* Data Display */}
      {!isLoading && !error && reportData && (
        <>
          <h3 className="text-xs font-bold text-gray-500 tracking-wider m-0 mb-4">Ringkasan</h3>
          <div className="grid grid-cols-3 gap-4 mb-6 max-lg:grid-cols-2 max-lg:[&>:first-child]:col-span-2">
            <ReportSummaryCard
              title="Saldo Bulan Ini"
              amount={reportData.summary.balance}
              type="balance"
              subtitle={`${reportData.summary.transactionCount || 0} transaksi`}
            />
            <ReportSummaryCard
              title="Total Pemasukan"
              amount={reportData.summary.income}
              type="income"
              changePercentage={incomeChange.percentage}
              isIncrease={incomeChange.isIncrease}
            />
            <ReportSummaryCard
              title="Total Pengeluaran"
              amount={reportData.summary.expense}
              type="expense"
              changePercentage={expenseChange.percentage}
              isIncrease={expenseChange.isIncrease}
            />
          </div>

          {/* Wallet Breakdown */}
          {reportData.walletBreakdown && reportData.walletBreakdown.length > 0 && (
            <WalletSummaryCards walletBreakdown={reportData.walletBreakdown} />
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6 max-md:grid-cols-1">
            <MonthComparisonChart data={reportData.monthlyComparison} />
            <CategoryPieChart data={reportData.pieChartData as any} />
          </div>

          {/* Category Details */}
          <CategoryDetailList
            data={reportData.categoryDetails}
            previousMonthName={getPreviousMonthName()}
          />
        </>
      )}


    </div>
  );
}
