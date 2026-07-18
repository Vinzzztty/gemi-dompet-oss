'use client';

import React, { useState } from 'react';
import {
  ShoppingBagIcon,
  CarIcon,
  UtensilsIcon,
  FilmIcon
} from '@/components/icons';
import { formatNumber } from '@/utils/format';
import { CategoryType } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CategoryDetail {
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

interface CategoryDetailListProps {
  data: CategoryDetail[];
  previousMonthName: string;
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    belanja: <ShoppingBagIcon size={20} />,
    transport: <CarIcon size={20} />,
    makan_minum: <UtensilsIcon size={20} />,
    hiburan: <FilmIcon size={20} />,
  };
  return iconMap[category] || <ShoppingBagIcon size={20} />;
};

export const CategoryDetailList: React.FC<CategoryDetailListProps> = ({
  data,
  previousMonthName
}) => {
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Separate income and expense categories
  const incomeCategories = data.filter(item => item.type === 'income');
  const expenseCategories = data.filter(item => item.type === 'expense');

  const maxIncomeAmount = incomeCategories.length > 0 ? Math.max(...incomeCategories.map(item => item.amount)) : 0;
  const maxExpenseAmount = expenseCategories.length > 0 ? Math.max(...expenseCategories.map(item => item.amount)) : 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm animate-in fade-in duration-300 max-md:p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 m-0">Detail per Kategori</h3>
        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">vs {previousMonthName}</span>
      </div>

      <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1 max-lg:gap-6">
        {/* Income Section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <span className="text-lg leading-none">💰</span>
            </div>
            <h4 className="text-base font-bold text-gray-900 m-0">Pemasukan</h4>
          </div>

          {incomeCategories.length > 0 ? (
            <div className="flex flex-col gap-4">
              {incomeCategories.map((item, index) => {
                const isExpanded = expandedCategories.has(item.category);
                const hasWalletBreakdown = item.walletBreakdown && item.walletBreakdown.length > 0;

                return (
                  <div key={item.category} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-4 transition-all hover:shadow-md hover:bg-white border border-transparent hover:border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-gray-900">{item.name}</span>
                          <span className="text-xs font-medium text-gray-500">{item.percentage}% dari total</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-bold text-gray-900">Rp {formatNumber(item.amount)}</span>
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${item.isIncrease ? 'text-green-500' : 'text-red-500'
                          }`}>
                          {item.isIncrease ? '↗' : '↘'} {item.changePercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${(item.amount / maxIncomeAmount) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    {/* Wallet Breakdown Toggle Button */}
                    {hasWalletBreakdown && item.walletBreakdown && (
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 w-full py-2 mt-1 text-xs font-semibold text-gray-500 hover:text-blue-600 bg-transparent border-none cursor-pointer transition-colors"
                        onClick={() => toggleCategory(item.category)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            Sembunyikan Detail
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            Lihat Detail ({item.walletBreakdown.length} dompet)
                          </>
                        )}
                      </button>
                    )}

                    {/* Wallet Breakdown List */}
                    {isExpanded && hasWalletBreakdown && item.walletBreakdown && (
                      <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-200">
                        {item.walletBreakdown.map(wallet => {
                          const walletPercentage = (wallet.amount / item.amount) * 100;
                          return (
                            <div key={wallet.walletId} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">💼</span>
                                <span className="font-medium text-gray-700">{wallet.walletName}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-semibold text-gray-900">Rp {formatNumber(wallet.amount)}</span>
                                <span className="text-[10px] text-gray-500 font-medium">{walletPercentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl mb-2 opacity-50">💰</span>
              <p className="text-sm font-medium text-gray-500 m-0">Belum ada pemasukan</p>
            </div>
          )}
        </div>

        {/* Expense Section */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-gray-100">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <span className="text-lg leading-none">💸</span>
            </div>
            <h4 className="text-base font-bold text-gray-900 m-0">Pengeluaran</h4>
          </div>

          {expenseCategories.length > 0 ? (
            <div className="flex flex-col gap-4">
              {expenseCategories.map((item, index) => {
                const isExpanded = expandedCategories.has(item.category);
                const hasWalletBreakdown = item.walletBreakdown && item.walletBreakdown.length > 0;

                return (
                  <div key={item.category} className="flex flex-col gap-2 bg-gray-50 rounded-xl p-4 transition-all hover:shadow-md hover:bg-white border border-transparent hover:border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-gray-900">{item.name}</span>
                          <span className="text-xs font-medium text-gray-500">{item.percentage}% dari total</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-bold text-gray-900">Rp {formatNumber(item.amount)}</span>
                        <span className={`text-[11px] font-semibold flex items-center gap-1 ${item.isIncrease ? 'text-red-500' : 'text-green-500' // Note: For expenses, increase is usually bad (red)
                          }`}>
                          {item.isIncrease ? '↗' : '↘'} {item.changePercentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${(item.amount / maxExpenseAmount) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>

                    {/* Wallet Breakdown Toggle Button */}
                    {hasWalletBreakdown && item.walletBreakdown && (
                      <button
                        type="button"
                        className="flex items-center justify-center gap-1.5 w-full py-2 mt-1 text-xs font-semibold text-gray-500 hover:text-red-600 bg-transparent border-none cursor-pointer transition-colors"
                        onClick={() => toggleCategory(item.category)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            Sembunyikan Detail
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            Lihat Detail ({item.walletBreakdown.length} dompet)
                          </>
                        )}
                      </button>
                    )}

                    {/* Wallet Breakdown List */}
                    {isExpanded && hasWalletBreakdown && item.walletBreakdown && (
                      <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-200">
                        {item.walletBreakdown.map(wallet => {
                          const walletPercentage = (wallet.amount / item.amount) * 100;
                          return (
                            <div key={wallet.walletId} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">💼</span>
                                <span className="font-medium text-gray-700">{wallet.walletName}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-semibold text-gray-900">Rp {formatNumber(wallet.amount)}</span>
                                <span className="text-[10px] text-gray-500 font-medium">{walletPercentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <span className="text-3xl mb-2 opacity-50">💸</span>
              <p className="text-sm font-medium text-gray-500 m-0">Belum ada pengeluaran</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailList;
