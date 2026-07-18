'use client';

import React, { useState } from 'react';
import { PlusIcon } from '@/components/icons';
import { Wallet, TrendingUp, TrendingDown, FolderOpen } from 'lucide-react';

interface FloatingActionButtonProps {
  onOpenModal?: (type: 'income' | 'expense' | 'transaction' | 'wallet' | 'transfer') => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onOpenModal }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = (type: 'income' | 'expense' | 'transaction' | 'wallet') => {
    onOpenModal?.(type);
    setIsOpen(false);
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 mt-10"
    >
      {/* Transfer */}
      <div
        className={`fixed flex items-center gap-3 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        style={{
          bottom: '420px',
          right: '24px',
          transitionDelay: isOpen ? '0ms' : '200ms',
        }}
      >
        <span className={`bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
          Pindah Dompet
        </span>
        <button
          onClick={() => handleMenuClick('transfer' as any)}
          className="w-16 h-16 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-lg hover:bg-cyan-700 hover:scale-110 transition-all duration-200 active:scale-95 border-none cursor-pointer"
          aria-label="Pindah Dompet"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>

      {/* Pemasukan */}
      <div
        className={`fixed flex items-center gap-3 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        style={{
          bottom: '340px',
          right: '24px',
          transitionDelay: isOpen ? '50ms' : '150ms',
        }}
      >
        <span className={`bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
          Pemasukan
        </span>
        <button
          onClick={() => handleMenuClick('income')}
          className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg hover:bg-green-700 hover:scale-110 transition-all duration-200 active:scale-95 border-none cursor-pointer"
          aria-label="Pemasukan"
        >
          <TrendingUp size={24} />
        </button>
      </div>

      {/* Pengeluaran */}
      <div
        className={`fixed flex items-center gap-3 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        style={{
          bottom: '260px',
          right: '24px',
          transitionDelay: isOpen ? '100ms' : '100ms',
        }}
      >
        <span className={`bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
          Pengeluaran
        </span>
        <button
          onClick={() => handleMenuClick('expense')}
          className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-700 hover:scale-110 transition-all duration-200 active:scale-95 border-none cursor-pointer"
          aria-label="Pengeluaran"
        >
          <TrendingDown size={24} />
        </button>
      </div>

      {/* Kategori */}
      <div
        className={`fixed flex items-center gap-3 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        style={{
          bottom: '180px',
          right: '24px',
          transitionDelay: isOpen ? '150ms' : '50ms',
        }}
      >
        <span className={`bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
          Kategori
        </span>
        <button
          onClick={() => handleMenuClick('transaction')}
          className="w-16 h-16 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg hover:bg-purple-700 hover:scale-110 transition-all duration-200 active:scale-95 border-none cursor-pointer"
          aria-label="Kategori"
        >
          <FolderOpen size={24} />
        </button>
      </div>

      {/* Dompet */}
      <div
        className={`fixed flex items-center gap-3 transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
        style={{
          bottom: '100px',
          right: '24px',
          transitionDelay: isOpen ? '200ms' : '0ms',
        }}
      >
        <span className={`bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md whitespace-nowrap transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}>
          Dompet
        </span>
        <button
          onClick={() => handleMenuClick('wallet')}
          className="w-16 h-16 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg hover:bg-orange-700 hover:scale-110 transition-all duration-200 active:scale-95 border-none cursor-pointer"
          aria-label="Dompet"
        >
          <Wallet size={24} />
        </button>
      </div>

      {/* Main Button */}
      <button
        className={`fixed w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl cursor-pointer transition-all duration-400 ease-in-out border-none hover:bg-blue-700 hover:shadow-2xl hover:scale-110 active:scale-95 ${isOpen ? 'rotate-45 scale-105' : 'rotate-0 scale-100'
          }`}
        style={{
          bottom: '24px',
          right: '24px',
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <PlusIcon size={28} />
      </button>
    </div>
  );
};

export default FloatingActionButton;
