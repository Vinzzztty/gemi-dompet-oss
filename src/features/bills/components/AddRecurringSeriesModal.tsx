'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { RecurringSeriesDto } from '@/features/bills/services/bills.service';
import { formatNumber } from '@/utils/format';
import { useCategory } from '@/hooks/useCategory';
import { CATEGORY_TYPES } from '@/lib/constants';

type Mode = 'create' | 'edit';

interface AddRecurringSeriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  initial?: RecurringSeriesDto | null;
  onSubmit: (payload: {
    name: string;
    amount: number;
    dayOfMonth: number;
    categoryId: string;
    notes: string | null;
    isActive: boolean;
  }) => Promise<void>;
}

export function AddRecurringSeriesModal({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: AddRecurringSeriesModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  const { categories, loading: loadingCategories, fetchExpenseCategories } =
    useCategory(CATEGORY_TYPES.EXPENSE);

  useEffect(() => {
    if (open) {
      fetchExpenseCategories();
    }
  }, [open, fetchExpenseCategories]);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setName(initial.name);
      const initAmt = parseAmount(initial.amount);
      setAmount(initAmt > 0 ? String(Math.round(initAmt)) : '');
      setDayOfMonth(String(initial.dayOfMonth));
      setNotes(initial.notes ?? '');
      setIsActive(initial.isActive);
      setCategoryId(initial.categoryId ?? '');
    } else {
      setName('');
      setAmount('');
      setDayOfMonth('1');
      setNotes('');
      setIsActive(true);
      setCategoryId('');
    }
  }, [open, mode, initial]);

  useEffect(() => {
    if (!open || categories.length === 0 || categoryId) return;
    if (mode === 'create') {
      setCategoryId(categories[0].id);
    } else if (mode === 'edit' && initial && !initial.categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [open, mode, initial, categories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    const dom = parseInt(dayOfMonth, 10);
    if (!name.trim() || !Number.isFinite(num) || num <= 0) return;
    if (!Number.isInteger(dom) || dom < 1 || dom > 31) return;
    if (!categoryId.trim()) return;
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: num,
        dayOfMonth: dom,
        categoryId: categoryId.trim(),
        notes: notes.trim() ? notes.trim() : null,
        isActive,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {mode === 'create' ? 'Tagihan bulanan baru' : 'Ubah tagihan bulanan'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nominal per bulan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
              value={amount ? formatNumber(Number(amount)) : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setAmount(digits);
              }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            {loadingCategories ? (
              <div className="flex justify-center py-6 text-gray-400 text-sm">
                Memuat kategori…
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 m-0 border border-amber-100">
                Belum ada kategori pengeluaran. Tambahkan di kelola kategori /
                transaksi pengeluaran terlebih dahulu.
              </p>
            ) : (
              <select
                className="w-full py-3 px-4 border border-gray-200 rounded-xl bg-gray-50 text-[0.9375rem] text-gray-900 outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10 hover:border-blue-400 hover:bg-blue-50/50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-[#3b82f6]/20"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Pilih kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal jatuh tempo tiap bulan (1–31)
            </label>
            <input
              type="number"
              min={1}
              max={31}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-[#3b82f6] focus:ring-[#3b82f6]"
            />
            <span className="text-sm text-gray-700">Aktif (generate tagihan bulanan)</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (opsional)
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 min-h-[72px] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                loading || loadingCategories || categories.length === 0
              }
              className="rounded-full bg-[#3b82f6] text-white px-6 py-2.5 text-sm font-semibold hover:bg-[#2563eb] disabled:opacity-50"
            >
              {loading ? 'Menyimpan…' : 'Simpan'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parseAmount(a: string | number): number {
  const n = typeof a === 'string' ? parseFloat(a) : Number(a);
  return Number.isFinite(n) ? n : 0;
}
