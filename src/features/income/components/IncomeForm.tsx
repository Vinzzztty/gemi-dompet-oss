"use client";

import React, { useState } from "react";
import { Loader2, Calendar, DollarSign, FileText } from "lucide-react";
import { useCategory } from "@/hooks/useCategory";
import type { CreateIncomeRequest } from "@/features/income/types/income";

interface IncomeFormProps {
  onSubmit: (data: CreateIncomeRequest) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateIncomeRequest>;
  isSubmitting?: boolean;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting = false,
}) => {
  const { categories, loading: loadingCategories } = useCategory('INCOME');

  const [formData, setFormData] = useState<CreateIncomeRequest>({
    nama: initialData?.nama || '',
    nominal: initialData?.nominal || 0,
    catatan: initialData?.catatan || '',
    tanggal: initialData?.tanggal || new Date().toISOString().split('T')[0],
    categoryId: initialData?.categoryId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama || formData.nama.trim() === '') {
      newErrors.nama = 'Nama transaksi harus diisi';
    }

    if (!formData.nominal || formData.nominal <= 0) {
      newErrors.nominal = 'Nominal harus lebih dari 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Kategori harus dipilih';
    }

    if (!formData.tanggal) {
      newErrors.tanggal = 'Tanggal harus diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const formatCurrency = (value: number) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, nominal: value ? parseInt(value) : 0 });
  };

  const handleChange = (field: keyof CreateIncomeRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-xl border border-slate-100">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {initialData ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
        </h2>
        <p className="text-slate-500">
          Catat pemasukan Anda untuk melacak keuangan dengan lebih baik
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nama Transaksi Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Nama Transaksi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nama}
            onChange={(e) => handleChange('nama', e.target.value)}
            placeholder="Contoh: Gaji Bulanan"
            className={`w-full h-14 px-4 rounded-xl border-2 font-medium transition-all ${
              errors.nama
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
            } focus:ring-4 outline-none`}
            disabled={isSubmitting}
          />
          {errors.nama && (
            <p className="text-red-500 text-sm ml-1">{errors.nama}</p>
          )}
        </div>

        {/* Nominal Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Nominal <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <DollarSign className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={formatCurrency(formData.nominal)}
              onChange={handleNominalChange}
              placeholder="0"
              className={`w-full h-14 pl-12 pr-4 rounded-xl border-2 font-semibold text-lg transition-all ${
                errors.nominal
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
              } focus:ring-4 outline-none`}
              disabled={isSubmitting}
            />
            {formData.nominal > 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600">
                IDR
              </div>
            )}
          </div>
          {errors.nominal && (
            <p className="text-red-500 text-sm ml-1">{errors.nominal}</p>
          )}
        </div>

        {/* Category Select */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Kategori <span className="text-red-500">*</span>
          </label>
          {loadingCategories ? (
            <div className="flex items-center justify-center h-14 bg-slate-50 rounded-xl">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <select
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className={`w-full h-14 px-4 rounded-xl border-2 font-medium transition-all ${
                errors.categoryId
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
              } focus:ring-4 outline-none`}
              disabled={isSubmitting}
            >
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
          {errors.categoryId && (
            <p className="text-red-500 text-sm ml-1">{errors.categoryId}</p>
          )}
        </div>

        {/* Date Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Calendar className="h-5 w-5" />
            </div>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) =>
                setFormData({ ...formData, tanggal: e.target.value })
              }
              className={`w-full h-14 pl-12 pr-4 rounded-xl border-2 font-medium transition-all ${
                errors.tanggal
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
              } focus:ring-4 outline-none`}
              disabled={isSubmitting}
            />
          </div>
          {errors.tanggal && (
            <p className="text-red-500 text-sm ml-1">{errors.tanggal}</p>
          )}
        </div>

        {/* Notes Textarea */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">
            Catatan (Opsional)
          </label>
          <div className="relative">
            <div className="absolute left-4 top-4 text-slate-400 pointer-events-none">
              <FileText className="h-5 w-5" />
            </div>
            <textarea
              value={formData.catatan || ''}
              onChange={(e) =>
                setFormData({ ...formData, catatan: e.target.value })
              }
              placeholder="Tambahkan catatan..."
              rows={4}
              maxLength={500}
              className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 font-medium transition-all resize-none ${
                errors.catatan
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                  : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
              } focus:ring-4 outline-none`}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-between items-center">
            {errors.catatan && (
              <p className="text-red-500 text-sm ml-1">{errors.catatan}</p>
            )}
            <p className="text-sm text-slate-400 ml-auto">
              {(formData.catatan || '').length}/500
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 h-14 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Batal
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Pemasukan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IncomeForm;
