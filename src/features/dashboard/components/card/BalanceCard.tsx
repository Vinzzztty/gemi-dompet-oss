"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import {
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "@/components/icons";
import { formatCurrency } from "@/utils/format";
import { Summary } from "@/types";

interface BalanceCardProps {
  summary: Summary;
  onIncomeClick?: () => void;
  onExpenseClick?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  summary,
  onIncomeClick,
  onExpenseClick
}) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const { wallets, fetchWallets } = useWallet();

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  return (
    <div className="bg-[#3b82f6] text-white rounded-[24px] p-6 mb-6 shadow-sm overflow-hidden relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <WalletIcon size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium opacity-90">Total Saldo</span>
            <span className="text-xs opacity-70">Keseluruhan</span>
          </div>
        </div>
      </div>

      <div className="text-4xl font-bold mb-6 tracking-tight flex items-center gap-3">
        {isBalanceVisible ? formatCurrency(summary.balance) : "Rp •••••••"}
        <button
          onClick={toggleBalanceVisibility}
          className="bg-transparent border-none cursor-pointer opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center"
          aria-label={
            isBalanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"
          }
        >
          {isBalanceVisible ? <Eye size={30} /> : <EyeOff size={30} />}
        </button>
      </div>

      {wallets.length > 0 && (
        <div className="flex flex-nowrap overflow-x-auto gap-3 mb-6 pb-2 scrollbar-hide -mx-2 px-2 mask-linear">
          {wallets.map((wallet) => (
            <div 
              key={wallet.id} 
              className="flex-shrink-0 flex items-center gap-3 bg-white/20 px-4 py-2 rounded-xl text-xs transition-colors hover:bg-white/30 cursor-default min-w-[140px] border border-white/10"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/90 font-bold text-[10px] uppercase">
                {wallet.namaDompet.substring(0, 2)}
              </div>
              <div className="flex flex-col">
                <span className="opacity-80 text-[10px] mb-0.5">{wallet.namaDompet}</span>
                <span className="font-semibold text-sm">
                  {isBalanceVisible ? formatCurrency(wallet.balance ?? 0) : "•••"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/20 ${onIncomeClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''}`}
          onClick={onIncomeClick}
        >
          <div className="flex items-center gap-2 text-xs opacity-90 mb-2">
            <TrendingUpIcon size={16} />
            <span>Pemasukan</span>
          </div>
          <div className="text-xl font-semibold">
            {isBalanceVisible ? formatCurrency(summary.income) : "Rp •••••••"}
          </div>
        </div>
        <div
          className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 transition-all hover:bg-white/20 ${onExpenseClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : ''}`}
          onClick={onExpenseClick}
        >
          <div className="flex items-center gap-2 text-xs opacity-90 mb-2">
            <TrendingDownIcon size={16} />
            <span>Pengeluaran</span>
          </div>
          <div className="text-xl font-semibold">
            {isBalanceVisible ? formatCurrency(summary.expense) : "Rp •••••••"}
          </div>
        </div>
      </div>
    </div >
  );
};

export default BalanceCard;