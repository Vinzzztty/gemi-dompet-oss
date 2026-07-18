'use client';

import React from 'react';
import { Transaction, CategoryType } from '@/types';
import { categories } from '@/data/mockData';
import { formatDate, formatNumber } from '@/utils/format';
import {
  CarIcon,
  ShoppingBagIcon,
  UtensilsIcon,
  FilmIcon,
  WalletIcon,
  TrendingUpIcon,
  CheckIcon,
  FolderIcon,
  CoinIcon
} from '@/components/icons';
import { ArrowRightLeft } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
}

// Icon mapping for categories
const getIcon = (iconName: string) => {
  switch (iconName) {
    // Transfer Icons
    case 'arrow-right-left': return <ArrowRightLeft size={20} />;

    // Expense Icons
    case 'utensils': return <UtensilsIcon size={20} />;
    case 'car': return <CarIcon size={20} />;
    case 'shopping-cart': return <ShoppingBagIcon size={20} />;
    case 'film': return <FilmIcon size={20} />;
    case 'file-text': return <FolderIcon size={20} />;
    case 'heart': return <CheckIcon size={20} />; // Fallback for heart
    case 'book': return <FolderIcon size={20} />; // Fallback for book

    // Income Icons
    case 'briefcase': return <WalletIcon size={20} />; // Fallback for briefcase
    case 'gift': return <CoinIcon size={20} />;
    case 'laptop': return <FolderIcon size={20} />; // Fallback for laptop
    case 'trending-up': return <TrendingUpIcon size={20} />;
    case 'wallet': return <WalletIcon size={20} />;

    // Legacy/Default
    case 'transport': return <CarIcon size={20} />;
    case 'belanja': return <ShoppingBagIcon size={20} />;
    case 'makan_minum': return <UtensilsIcon size={20} />;
    case 'hiburan': return <FilmIcon size={20} />;
    case 'gaji': return <WalletIcon size={20} />;
    case 'investasi': return <TrendingUpIcon size={20} />;
    case 'lainnya': return <CheckIcon size={20} />;

    default: return <CheckIcon size={20} />;
  }
};

const getCategoryIcon = (category: CategoryType) => {
  return getIcon(category);
};

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';

  // Handle both old format (CategoryType) and new format (Category object)
  const category = typeof transaction.category === 'string'
    ? categories[transaction.category]
    : transaction.category;

  const amountDisplay = isTransfer
    ? `Rp ${formatNumber(transaction.amount)}`
    : isExpense
    ? `-Rp ${formatNumber(transaction.amount)}`
    : `+Rp ${formatNumber(transaction.amount)}`;

  const bgColor = isTransfer
    ? 'bg-blue-50 text-blue-500'
    : isExpense
    ? 'bg-red-50 text-red-500'
    : 'bg-green-50 text-green-500';

  const textColor = isTransfer
    ? 'text-blue-500'
    : isExpense
    ? 'text-red-500'
    : 'text-green-500';

  return (
    <div className="flex items-center gap-4 py-5 px-4 border-b border-gray-100 rounded-lg transition-all cursor-pointer overflow-hidden hover:bg-gray-50 last:border-b-0">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-110 ${bgColor}`}>
        {typeof transaction.category === 'string'
          ? getCategoryIcon(transaction.category)
          : getIcon(transaction.icon || 'check')
        }
      </div>
      <div className="flex-1 flex flex-col gap-1 min-w-0 overflow-hidden">
        <span className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{transaction.description}</span>
        <span className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
          {formatDate(transaction.date)} • <span className="text-blue-600">{category?.name}</span>
        </span>
      </div>
      <div className={`text-sm font-semibold whitespace-nowrap shrink-0 text-right mr-2 max-[480px]:text-[13px] max-[480px]:mr-1 ${textColor}`}>
        {amountDisplay}
      </div>
    </div>
  );
};

export default TransactionItem;
