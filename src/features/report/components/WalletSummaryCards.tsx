'use client';

import React from 'react';
import { WalletBreakdown } from '@/data/reportData';
import { formatCurrency } from '@/utils/format';
import { Wallet } from 'lucide-react';

interface WalletSummaryCardsProps {
  walletBreakdown: WalletBreakdown[];
}

export const WalletSummaryCards: React.FC<WalletSummaryCardsProps> = ({ walletBreakdown }) => {
  if (!walletBreakdown || walletBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-gray-600 tracking-wider m-0 mb-4">RINGKASAN PER DOMPET</h3>
      <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-lg:[&>:first-child]:col-span-1">
        {walletBreakdown.map((wallet) => (
          <div key={wallet.walletId} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5 hover:shadow-md max-sm:p-4">
            <div className="flex items-center gap-4 mb-6 max-sm:mb-4 max-sm:gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 max-sm:w-10 max-sm:h-10">
                <Wallet size={24} className="stroke-[1.5px] max-sm:w-5 max-sm:h-5" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 m-0 leading-tight max-sm:text-[15px]">{wallet.walletName}</h4>
            </div>
            <div className="flex flex-col gap-4 max-sm:gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Pemasukan</span>
                <span className="font-bold text-[#10b981]">+Rp {formatCurrency(wallet.income).replace('Rp ', '')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-medium">Pengeluaran</span>
                <span className="font-bold text-[#ef4444]">-Rp {formatCurrency(wallet.expense).replace('Rp ', '')}</span>
              </div>
              <div className="h-px bg-gray-100 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium text-sm">Saldo</span>
                <span className={`text-base font-bold ${
                  wallet.balance >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}>Rp {formatCurrency(wallet.balance).replace('Rp ', '')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletSummaryCards;
