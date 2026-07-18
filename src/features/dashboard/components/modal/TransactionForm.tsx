'use client';

import React from 'react';
import { WalletIcon, CalendarIcon } from '@/components/icons';
import { FontAwesomeIconDisplay } from '@/components/ui/FontAwesomeIconDisplay';
import type { Category } from '@/features/income/types/income';

interface Wallet {
    id: string;
    namaDompet: string;
    norek?: string | null;
}

interface TransactionFormProps {
    type: 'income' | 'expense';
    amount: string;
    category: string;
    wallet: string;
    date: string;
    name: string;
    notes: string;
    categories: Category[];
    wallets: Wallet[];
    loadingCategories: boolean;
    loadingWallets: boolean;
    onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCategoryChange: (categoryId: string) => void;
    onWalletChange: (walletId: string) => void;
    onDateChange: (date: string) => void;
    onNameChange: (name: string) => void;
    onNotesChange: (notes: string) => void;
    onSwitchToCategory: () => void;
    onSwitchToWallet: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
    amount,
    category,
    wallet,
    date,
    name,
    notes,
    categories,
    wallets,
    loadingCategories,
    loadingWallets,
    onAmountChange,
    onCategoryChange,
    onWalletChange,
    onDateChange,
    onNameChange,
    onNotesChange,
    onSwitchToCategory,
    onSwitchToWallet,
}) => {
    return (
        <div className="flex flex-col gap-5">
            {/* Nominal Input */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <WalletIcon size={16} />
                    Nominal
                </label>
                <div className="flex items-center gap-2 px-4 py-4 border border-gray-200 rounded-xl bg-gray-50 transition-all duration-200 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                    <span className="text-base font-medium text-blue-600">Rp</span>
                    <input
                        type="text"
                        className="flex-1 border-none bg-transparent text-xl font-semibold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
                        value={amount}
                        onChange={onAmountChange}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Wallet Selection */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M7 15h.01M11 15h2" />
                    </svg>
                    Dompet
                </label>
                {loadingWallets ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : wallets.length === 0 ? (
                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="m-0 mb-3 text-gray-500 text-sm">Belum ada dompet</p>
                        <button type="button" className="bg-transparent border-none text-blue-600 text-sm font-medium cursor-pointer hover:text-blue-700 hover:underline" onClick={onSwitchToWallet}>
                            Buat dompet baru →
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <select 
                            className="w-full py-4 px-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10 hover:border-blue-400 hover:bg-blue-50 focus:border-blue-500 focus:bg-white"
                            value={wallet} 
                            onChange={(e) => onWalletChange(e.target.value)}
                        >
                            <option value="">Pilih Dompet</option>
                            {wallets.map((w) => (
                                <option key={w.id} value={w.id} className="py-2">
                                    {w.namaDompet} {w.norek ? `- ${w.norek}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Category Selection */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">Kategori</label>
                {loadingCategories ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="m-0 mb-3 text-gray-500 text-sm">Belum ada kategori</p>
                        <button type="button" className="bg-transparent border-none text-blue-600 text-sm font-medium cursor-pointer hover:text-blue-700 hover:underline" onClick={onSwitchToCategory}>
                            Buat kategori baru →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl bg-white cursor-pointer transition-all duration-200 relative ${
                                    category === cat.id 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => onCategoryChange(cat.id)}
                            >
                                {category === cat.id && (
                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                                        ✓
                                    </span>
                                )}
                                <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-blue-600 ${
                                    category === cat.id ? 'bg-blue-200' : 'bg-blue-50'
                                }`}>
                                    <FontAwesomeIconDisplay iconName={cat.icon || 'wallet'} size="lg" />
                                </div>
                                <span className="text-xs text-center text-gray-600 font-medium line-clamp-2 leading-tight w-full">
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Date Input */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <CalendarIcon size={16} />
                    Tanggal
                </label>
                <div className="relative">
                    <input
                        type="date"
                        className="w-full py-4 px-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Transaction Name Input */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    Nama Transaksi
                </label>
                <input
                    type="text"
                    className="w-full py-4 px-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white placeholder:text-gray-400"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Contoh: Beli bahan makanan"
                />
            </div>

            {/* Notes Input */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Catatan <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <textarea
                    className="w-full py-4 px-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 resize-none font-inherit focus:border-blue-500 focus:bg-white placeholder:text-gray-400"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    placeholder="Contoh: Makan siang di warung..."
                    rows={2}
                />
            </div>
        </div>
    );
};
