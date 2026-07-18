'use client';

import React from 'react';
import { TrendingUpIcon, TrendingDownIcon, WalletIcon } from '@/components/icons';
import { formatCurrency } from '@/utils/format';

interface ReportSummaryCardProps {
  title: string;
  amount: number;
  type: 'balance' | 'income' | 'expense';
  subtitle?: string;
  changePercentage?: number;
  isIncrease?: boolean;
}

export const ReportSummaryCard: React.FC<ReportSummaryCardProps> = ({
  title,
  amount,
  type,
  subtitle,
  changePercentage,
  isIncrease,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'balance':
        return <WalletIcon size={20} />;
      case 'income':
        return <TrendingUpIcon size={20} />;
      case 'expense':
        return <TrendingDownIcon size={20} />;
    }
  };

  const getAmountClass = () => {
    switch (type) {
      case 'income':
        return 'amount-income';
      case 'expense':
        return 'amount-expense';
      default:
        return 'amount-balance';
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 max-sm:p-3">
      <div className="flex items-start justify-between mb-3 max-sm:mb-2">
        <span className="text-sm text-blue-600 font-medium max-sm:text-xs">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center max-sm:w-8 max-sm:h-8 ${
          type === 'balance' ? 'bg-blue-100 text-blue-600' : 
          type === 'income' ? 'bg-green-50 text-green-500' : 
          'bg-blue-100 text-blue-600'
        }`}>
          {getIcon()}
        </div>
      </div>
      <div className={`text-2xl font-bold mb-1 max-sm:text-lg ${
        type === 'balance' ? 'text-blue-600' :
        type === 'income' ? 'text-gray-900' :
        'text-red-500'
      }`}>
        {formatCurrency(amount)}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-400">{subtitle}</div>
      )}
      {changePercentage !== undefined && (
        <div className={`text-xs mt-2 ${
          isIncrease ? 'text-green-500' : 'text-red-500'
        }`}>
          {isIncrease ? '↗' : '↘'} {changePercentage}% vs bulan lalu
        </div>
      )}
    </div>
  );
};

export default ReportSummaryCard;
