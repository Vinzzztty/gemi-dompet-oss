'use client';

import React, { useState, useEffect } from 'react';
import { CategoryType } from '@/types';
import { useCategory } from '@/hooks/useCategory';
import { useIncome } from '@/features/income/hooks/useIncome';
import { useExpense } from '@/features/expense/hooks/useExpense';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';
import {
  ModalHeader,
  CategoryManagement,
  WalletManagement,
  TransactionForm,
  TransferForm,
} from '../modal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (transaction: TransactionFormData) => void;
  initialType?: 'income' | 'expense' | 'transaction' | 'wallet';
  hideTypeSelector?: boolean;
}

interface TransactionFormData {
  type: 'income' | 'expense' | 'transaction' | 'wallet' | 'transfer';
  amount: number;
  category: CategoryType;
  date: string;
  name: string;
  notes: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialType = 'expense',
  hideTypeSelector = false,
}) => {
  const [type, setType] = useState<'income' | 'expense' | 'transaction' | 'wallet' | 'transfer'>(initialType as any);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [wallet, setWallet] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Use category hook to manage categories
  const {
    categories,
    loading: loadingCategories,
    fetchIncomeCategories,
    fetchExpenseCategories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategory();

  // Use wallet hook to manage wallets
  const {
    wallets,
    loading: loadingWallets,
    fetchWallets,
    createWallet,
    updateWallet,
    deleteWallet,
  } = useWallet();

  // Use income and expense hooks for transaction creation
  const { create: createIncome, loading: savingIncome } = useIncome();
  const { create: createExpense, loading: savingExpense } = useExpense();

  const savingTransaction = savingIncome || savingExpense;

  // Fetch all categories when category tab is active
  useEffect(() => {
    if (type === 'transaction') {
      fetchCategories(); // Fetch all categories
    } else if (type === 'wallet' || type === 'transfer') {
      fetchWallets(); // Fetch all wallets
    } else if (type === 'expense') {
      fetchExpenseCategories();
      fetchWallets(); // Fetch wallets for expense transactions
    } else if (type === 'income') {
      fetchIncomeCategories();
      fetchWallets(); // Fetch wallets for income transactions
    }
    // Reset selected category when switching types
    setCategory('');
  }, [type, fetchExpenseCategories, fetchIncomeCategories, fetchCategories, fetchWallets]);

  // Update type when initialType changes
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
    }
  }, [isOpen, initialType]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Handle income/expense transaction creation
    if (type === 'income' || type === 'expense') {
      // Validation
      if (!amount || parseFloat(amount.replace(/\D/g, '')) <= 0) {
        toast.error('Nominal harus diisi dan lebih besar dari 0');
        return;
      }

      if (!category) {
        toast.error('Kategori harus dipilih');
        return;
      }

      if (!date) {
        toast.error('Tanggal harus diisi');
        return;
      }

      // Prepare transaction data
      const transactionData = {
        nama: name.trim() || (type === 'income' ? 'Pemasukan' : 'Pengeluaran'), // Add nama field
        nominal: parseFloat(amount.replace(/\D/g, '')),
        categoryId: category,
        walletId: wallet || undefined, // Add walletId (optional)
        tanggal: date,
        catatan: notes.trim() || undefined,
      };

      // Create transaction based on type
      let result;
      if (type === 'income') {
        result = await createIncome(transactionData);
      } else {
        result = await createExpense(transactionData);
      }

      if (result) {
        toast.success(`${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil ditambahkan!`);
        handleClose();
        // Call onSave callback if provided (for parent refresh)
        if (onSave) {
          onSave({
            type,
            amount: transactionData.nominal,
            category: category as CategoryType,
            date,
            name,
            notes,
          });
        }
      } else {
        toast.error(`Gagal menambahkan ${type === 'income' ? 'pemasukan' : 'pengeluaran'}`);
      }
      return;
    }
  };

  const handleClose = () => {
    if (initialType) {
      setType(initialType);
    } else {
      setType('expense');
    }
    setAmount('');
    setCategory('');
    setWallet('');
    setDate(new Date().toISOString().split('T')[0]);
    setName('');
    setNotes('');
    onClose();
  };

  const handleTransferSuccess = () => {
    toast.success('Transfer berhasil!');
    handleClose();
    if (onSave) {
      // Determine what to pass for successful transfer update
      // Maybe just generic trigger, or modify onSave interface if needed.
      // For now passing dummy data to trigger refresh
      onSave({
        type: 'transaction', // Force type to transaction or similar to trigger refresh
        amount: 0,
        category: {} as CategoryType,
        date: new Date().toISOString(),
        name: 'Transfer',
        notes: 'Transfer'
      });
    }
  };

  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(numbers));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatAmount(e.target.value));
  };

  // Category management handlers
  const handleCreateCategory = async (data: { name: string; type: 'INCOME' | 'EXPENSE'; icon: string }) => {
    const result = await createCategory(data);
    if (result) {
      toast.success('Kategori berhasil ditambahkan!');
    } else {
      toast.error('Gagal menambahkan kategori');
    }
    return result;
  };

  const handleUpdateCategory = async (
    id: string,
    data: { name: string; type: 'INCOME' | 'EXPENSE'; icon: string }
  ) => {
    const result = await updateCategory(id, data);
    if (result) {
      toast.success('Kategori berhasil diupdate!');
    } else {
      toast.error('Gagal mengupdate kategori');
    }
    return result;
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const success = await deleteCategory(categoryId);
    if (success) {
      toast.success('Kategori berhasil dihapus!');
    } else {
      toast.error('Gagal menghapus kategori');
    }
    return success;
  };

  // Wallet management handlers
  const handleCreateWallet = async (data: { namaDompet: string; norek?: string }) => {
    const result = await createWallet(data);
    if (result) {
      toast.success('Dompet berhasil ditambahkan!');
    } else {
      toast.error('Gagal menambahkan dompet');
    }
    return result;
  };

  const handleUpdateWallet = async (data: { id: string; namaDompet: string; norek?: string }) => {
    const result = await updateWallet(data);
    if (result) {
      toast.success('Dompet berhasil diupdate!');
    } else {
      toast.error('Gagal mengupdate dompet');
    }
    return result;
  };

  const handleDeleteWallet = async (walletId: string) => {
    try {
      await deleteWallet(walletId);
      toast.success('Dompet berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus dompet');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200 max-sm:items-end max-sm:p-0" onClick={handleClose}>
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 animate-in slide-in-from-bottom-5 duration-300 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:p-5 max-sm:max-h-[85vh] max-sm:animate-in max-sm:slide-in-from-bottom-full" onClick={(e) => e.stopPropagation()}>
          {/* Mobile Drag Handle */}
          <div className="hidden max-sm:block w-9 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

          {/* Header */}
          <ModalHeader onClose={handleClose} />

          {/* Type Selector Dropdown - Hidden when opened from FAB menu */}
          {!hideTypeSelector && (
            <div className="mb-5 mt-5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                </svg>
                Tipe Transaksi
              </label>
              <div className="relative">
                <select
                  className="w-full py-4 px-4 border-2 border-primary-200 rounded-xl bg-primary-50 text-base font-medium text-gray-900 outline-none transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%233b82f6%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-12 hover:border-primary-400 hover:bg-primary-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="expense" className="py-3 text-[0.9375rem] bg-white text-gray-900">💸 Pengeluaran</option>
                  <option value="income" className="py-3 text-[0.9375rem] bg-white text-gray-900">💰 Pemasukan</option>
                  <option value="transfer" className="py-3 text-[0.9375rem] bg-white text-gray-900">🔁 Pindah Dompet</option>
                  <option value="transaction" className="py-3 text-[0.9375rem] bg-white text-gray-900">💳 Kelola Kategori</option>
                  <option value="wallet" className="py-3 text-[0.9375rem] bg-white text-gray-900">👛 Kelola Dompet</option>
                </select>
              </div>
            </div>
          )}

          {/* Conditional rendering based on tab */}
          {type === 'wallet' ? (
            <WalletManagement
              wallets={wallets}
              loading={loadingWallets}
              onCreateWallet={handleCreateWallet}
              onUpdateWallet={handleUpdateWallet}
              onDeleteWallet={handleDeleteWallet}
            />
          ) : type === 'transaction' ? (
            <CategoryManagement
              categories={categories}
              loading={loadingCategories}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          ) : type === 'transfer' ? (
            <TransferForm
              wallets={wallets}
              loadingWallets={loadingWallets}
              onClose={handleClose}
              onSuccess={handleTransferSuccess}
            />
          ) : (
            <form onSubmit={handleSubmit}>
              <TransactionForm
                type={type}
                amount={amount}
                category={category}
                wallet={wallet}
                date={date}
                name={name}
                notes={notes}
                categories={categories}
                wallets={wallets}
                loadingCategories={loadingCategories}
                loadingWallets={loadingWallets}
                onAmountChange={handleAmountChange}
                onCategoryChange={setCategory}
                onWalletChange={setWallet}
                onDateChange={setDate}
                onNameChange={setName}
                onNotesChange={setNotes}
                onSwitchToCategory={() => setType('transaction')}
                onSwitchToWallet={() => setType('wallet')}
              />

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full p-4 border-none rounded-xl bg-blue-500 text-white text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-blue-600 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={savingTransaction}
              >
                {savingTransaction ? 'Menyimpan...' : 'Simpan'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default AddTransactionModal;