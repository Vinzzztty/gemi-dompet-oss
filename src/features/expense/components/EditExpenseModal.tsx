'use client';

import React, { useState, useEffect } from 'react';
import { useCategory } from '@/hooks/useCategory';
import { useExpense } from '@/features/expense/hooks/useExpense';
import { useWallet } from '@/hooks/useWallet';
import type { ExpenseTransaction, CreateExpenseRequest } from '@/features/expense/types/expense';
import { CategoryType } from '@/types';
import { WalletIcon, CalendarIcon } from '@/components/icons';
import { FontAwesomeIconDisplay } from '@/components/ui/FontAwesomeIconDisplay';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: ExpenseTransaction | null;
  onSuccess?: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}) => {
  const { categories, loading: loadingCategories, fetchCategories } = useCategory();
  const { update, loading } = useExpense();
  const { wallets, loading: loadingWallets, fetchWallets } = useWallet();

  const [formData, setFormData] = useState({
    nama: '',
    nominal: '',
    categoryId: '',
    walletId: '',
    tanggal: '',
    catatan: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories, wallets and populate form
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchWallets();
      if (transaction) {
        setFormData({
          nama: transaction.nama || '',
          nominal: formatAmount(transaction.nominal.toString()),
          categoryId: transaction.categoryId,
          walletId: transaction.walletId || '',
          tanggal: transaction.tanggal.split('T')[0],
          catatan: transaction.catatan || '',
        });
      }
    }
  }, [isOpen, transaction, fetchCategories, fetchWallets]);

  // Filter expense categories
  const expenseCategories = categories.filter((cat) => cat.type === 'EXPENSE');

  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numbers));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, nominal: formatAmount(e.target.value) });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama transaksi harus diisi';
    }

    if (!formData.nominal || Number(formData.nominal.replace(/\D/g, '')) <= 0) {
      newErrors.nominal = 'Nominal harus lebih besar dari 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori harus dipilih';
    }

    if (!formData.walletId) {
      newErrors.walletId = 'Dompet harus dipilih';
    }

    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !transaction) return;

    const updatePayload = {
      nama: formData.nama.trim(),
      nominal: Number(formData.nominal.replace(/\D/g, '')),
      categoryId: formData.categoryId,
      walletId: formData.walletId,
      tanggal: new Date(formData.tanggal).toISOString(),
      catatan: formData.catatan.trim() || undefined,
    };

    const result = await update(transaction.id, updatePayload);

    if (!result) {
      return;
    }

    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ nama: '', nominal: '', categoryId: '', walletId: '', tanggal: '', catatan: '' });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200 max-sm:items-end max-sm:p-0" onClick={handleClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom-5 duration-300 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:p-5 max-sm:max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Drag Handle */}
        <div className="hidden max-sm:block w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 max-sm:mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <WalletIcon size={20} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900 m-0 max-sm:text-base">Edit Pengeluaran</h2>
              <p className="text-xs text-gray-500 m-0 max-sm:hidden">Perbarui data pengeluaran Anda</p>
            </div>
          </div>
          <button 
            className="bg-transparent border-none text-gray-400 cursor-pointer p-1 rounded transition-all duration-200 hover:bg-gray-100 hover:text-gray-900" 
            onClick={handleClose}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nominal Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
              <WalletIcon size={16} />
              Nominal
            </label>
            <div className={`flex items-center gap-2 px-4 py-4 border rounded-xl bg-gray-50 transition-all duration-200 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10 ${errors.nominal ? 'border-red-500' : 'border-gray-200'}`}>
              <span className="text-base font-medium text-red-600">Rp</span>
              <input
                type="text"
                className="flex-1 border-none bg-transparent text-xl font-semibold text-gray-900 outline-none placeholder:text-gray-400 placeholder:font-normal"
                value={formData.nominal}
                onChange={handleAmountChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
            {errors.nominal && <span className="block text-xs text-red-600 mt-2">{errors.nominal}</span>}
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="relative">
                <select 
                  className={`w-full py-4 px-4 border rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10 hover:border-red-400 hover:bg-red-50 focus:border-red-500 focus:bg-white ${errors.walletId ? 'border-red-500' : 'border-gray-200'}`}
                  value={formData.walletId} 
                  onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                  disabled={loading}
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
            {errors.walletId && <span className="block text-xs text-red-600 mt-2">{errors.walletId}</span>}
          </div>

          {/* Category Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">Kategori</label>
            {loadingCategories ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
                {expenseCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl bg-white cursor-pointer transition-all duration-200 relative ${
                      formData.categoryId === cat.id 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                    onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                    disabled={loading}
                  >
                    {formData.categoryId === cat.id && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                        ✓
                      </span>
                    )}
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-red-600 ${
                      formData.categoryId === cat.id ? 'bg-red-200' : 'bg-red-50'
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
            {errors.categoryId && <span className="block text-xs text-red-600 mt-2">{errors.categoryId}</span>}
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
                className={`w-full py-4 px-4 border rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 focus:border-red-500 focus:bg-white ${errors.tanggal ? 'border-red-500' : 'border-gray-200'}`}
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                disabled={loading}
              />
            </div>
            {errors.tanggal && <span className="block text-xs text-red-600 mt-2">{errors.tanggal}</span>}
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
              className={`w-full py-4 px-4 border rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 focus:border-red-500 focus:bg-white placeholder:text-gray-400 ${errors.nama ? 'border-red-500' : 'border-gray-200'}`}
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Belanja Bulanan"
              disabled={loading}
            />
            {errors.nama && <span className="block text-xs text-red-600 mt-2">{errors.nama}</span>}
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
              className="w-full py-4 px-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 resize-none font-inherit focus:border-red-500 focus:bg-white placeholder:text-gray-400"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              placeholder="Tambahkan catatan..."
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full p-4 border-none rounded-xl bg-red-500 text-white text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-red-600 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  );
};
