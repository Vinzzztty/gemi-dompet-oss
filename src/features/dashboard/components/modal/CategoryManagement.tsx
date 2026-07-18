'use client';

import React, { useState } from 'react';
import { IconPicker } from '@/components/ui/IconPicker';
import { FontAwesomeIconDisplay } from '@/components/ui/FontAwesomeIconDisplay';
import type { Category } from '@/features/income/types/income';

interface CategoryManagementProps {
    categories: Category[];
    loading: boolean;
    onCreateCategory: (data: { name: string; type: 'INCOME' | 'EXPENSE'; icon: string }) => Promise<any>;
    onUpdateCategory: (id: string, data: { name: string; type: 'INCOME' | 'EXPENSE'; icon: string }) => Promise<any>;
    onDeleteCategory: (id: string) => Promise<boolean>;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
    categories,
    loading,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
}) => {
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState<'income' | 'expense'>('income');
    const [selectedIcon, setSelectedIcon] = useState('wallet');

    const handleEditCategory = (category: Category) => {
        setEditingCategoryId(category.id);
        setCategoryName(category.name);
        setCategoryType(category.type === 'INCOME' ? 'income' : 'expense');
        setSelectedIcon(category.icon || 'wallet');
        setIsCreatingNew(false);
    };

    const handleCancelForm = () => {
        setIsCreatingNew(false);
        setEditingCategoryId(null);
        setCategoryName('');
        setCategoryType('income');
        setSelectedIcon('wallet');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCategoryId) {
            await onUpdateCategory(editingCategoryId, {
                name: categoryName,
                type: categoryType === 'income' ? 'INCOME' : 'EXPENSE',
                icon: selectedIcon,
            });
        } else {
            await onCreateCategory({
                name: categoryName,
                type: categoryType === 'income' ? 'INCOME' : 'EXPENSE',
                icon: selectedIcon,
            });
        }

        handleCancelForm();
    };

    if (!isCreatingNew && !editingCategoryId) {
        // LIST VIEW
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 m-0">Daftar Kategori</h3>
                    <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-blue-700 active:scale-95"
                        onClick={() => setIsCreatingNew(true)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Tambah
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Memuat kategori...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="m-0">Belum ada kategori</p>
                        <p className="text-xs mt-2 text-gray-400">Klik "Tambah" untuk membuat kategori baru</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {/* Income Categories */}
                        {categories.filter((cat) => cat.type === 'INCOME').length > 0 && (
                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-semibold text-gray-500 m-0 py-2">💰 Pemasukan</h4>
                                <div className="flex flex-col gap-2">
                                    {categories
                                        .filter((cat) => cat.type === 'INCOME')
                                        .map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 hover:bg-white hover:border-blue-300 hover:shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600">
                                                        <FontAwesomeIconDisplay iconName={cat.icon || 'wallet'} size="lg" />
                                                    </div>
                                                    <span className="text-[0.9375rem] font-medium text-gray-900">{cat.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 text-gray-500 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
                                                        onClick={() => handleEditCategory(cat)}
                                                        title="Edit"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 text-gray-500 hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                                                        onClick={() => setDeletingCategoryId(cat.id)}
                                                        title="Hapus"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Expense Categories */}
                        {categories.filter((cat) => cat.type === 'EXPENSE').length > 0 && (
                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-semibold text-gray-500 m-0 py-2">💸 Pengeluaran</h4>
                                <div className="flex flex-col gap-2">
                                    {categories
                                        .filter((cat) => cat.type === 'EXPENSE')
                                        .map((cat) => (
                                            <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl transition-all duration-200 hover:bg-white hover:border-blue-300 hover:shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 flex items-center justify-center bg-blue-50 rounded-lg text-blue-600">
                                                        <FontAwesomeIconDisplay iconName={cat.icon || 'wallet'} size="lg" />
                                                    </div>
                                                    <span className="text-[0.9375rem] font-medium text-gray-900">{cat.name}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 text-gray-500 hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
                                                        onClick={() => handleEditCategory(cat)}
                                                        title="Edit"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 text-gray-500 hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                                                        onClick={() => setDeletingCategoryId(cat.id)}
                                                        title="Hapus"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete Confirmation */}
                {deletingCategoryId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[101] animate-in fade-in duration-200" onClick={() => setDeletingCategoryId(null)}>
                        <div className="bg-white p-6 rounded-xl max-w-[400px] w-[90%] shadow-xl animate-in slide-in-from-bottom-5 duration-300" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-semibold text-gray-900 m-0 mb-3">Konfirmasi Hapus</h3>
                            <p className="text-gray-600 m-0 mb-6 leading-relaxed">Apakah Anda yakin ingin menghapus kategori ini?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg font-medium cursor-pointer transition-all duration-200 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100"
                                    onClick={() => setDeletingCategoryId(null)}
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-lg font-medium cursor-pointer transition-all duration-200 bg-red-600 text-white border border-red-600 hover:bg-red-700"
                                    onClick={async () => {
                                        await onDeleteCategory(deletingCategoryId);
                                        setDeletingCategoryId(null);
                                    }}
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // FORM VIEW
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 m-0">{editingCategoryId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h3>
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-transparent border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 text-xl text-gray-500 hover:bg-gray-100" onClick={handleCancelForm}>
                    ✕
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 7h16M4 12h16M4 17h10" />
                        </svg>
                        Nama Kategori
                    </label>
                    <input
                        type="text"
                        className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white placeholder:text-gray-400"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Contoh: Makanan & Minuman"
                        required
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">Tipe Kategori</label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                                categoryType === 'income' 
                                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                            }`}
                            onClick={() => setCategoryType('income')}
                        >
                            <span className="text-lg">💰</span>
                            Pemasukan
                        </button>
                        <button
                            type="button"
                            className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ${
                                categoryType === 'expense' 
                                    ? 'border-blue-500 bg-blue-50 text-blue-600' 
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                            }`}
                            onClick={() => setCategoryType('expense')}
                        >
                            <span className="text-lg">💸</span>
                            Pengeluaran
                        </button>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">Icon Kategori</label>
                    <IconPicker value={selectedIcon} onChange={setSelectedIcon} maxDisplay={60} />
                </div>

                <button type="submit" className="w-full p-4 border-none rounded-xl bg-blue-500 text-white text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-blue-600 active:scale-98">
                    {editingCategoryId ? 'Update Kategori' : 'Simpan Kategori'}
                </button>
            </form>
        </div>
    );
};
