'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Loader2, ReceiptText, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  groupExpenseService,
  type GroupExpenseSessionDto,
} from '@/features/group-expense/services/group-expense.service';
import { getNowDateTimeLocalValue } from '@/features/group-expense/utils/group-expense-helpers';

interface CreateGroupExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (session: GroupExpenseSessionDto) => void;
}

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10';

const sessionCurrencyOptions = [
  { value: 'IDR', label: 'IDR - Rupiah' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'MYR', label: 'MYR - Ringgit' },
  { value: 'JPY', label: 'JPY - Yen' },
] as const;

export function CreateGroupExpenseDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateGroupExpenseDialogProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [startedAt, setStartedAt] = useState(getNowDateTimeLocalValue());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setNotes('');
      setCurrency('IDR');
      setStartedAt(getNowDateTimeLocalValue());
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Judul session harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await groupExpenseService.createSession({
        title: title.trim(),
        currency: currency.trim().toUpperCase() || 'IDR',
        notes: notes.trim() || null,
        startedAt: startedAt || null,
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal membuat session talangan');
        return;
      }

      toast.success('Session talangan berhasil dibuat');
      onCreated(response.data);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal membuat session talangan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border-0 p-0 shadow-[0_32px_80px_rgba(15,23,42,0.24)]">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_38%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#38bdf8_100%)] px-6 py-5 text-white sm:px-8">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <Sparkles size={14} />
              Session Talangan
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              Buat room perjalanan atau event patungan
            </DialogTitle>
            <DialogDescription className="max-w-xl text-sm leading-6 text-white/80">
              Session ini akan jadi tempat mencatat semua talangan per lokasi,
              pembagian utang, repayment, dan settlement akhir.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Nama event / trip
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Contoh: Trip Bandung Tim Produk"
                className={inputClassName}
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Currency
              </label>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className={inputClassName}
                disabled={isSubmitting}
              >
                {sessionCurrencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Mulai session
              </label>
              <input
                type="datetime-local"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Catatan tambahan
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Misalnya: road trip 4 hari, talangan makanan, bensin, parkir, tiket, dan penginapan"
                className={`${inputClassName} min-h-[120px] resize-none`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <ReceiptText className="mb-3 text-[#4176ED]" size={20} />
              <p className="text-sm font-semibold text-slate-900">Banyak item</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Satu session bisa berisi banyak talangan seperti makan, bensin,
                tiket, dan parkir.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Users className="mb-3 text-emerald-500" size={20} />
              <p className="text-sm font-semibold text-slate-900">Join mudah</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Teman cukup isi kode session dan nama. Tidak wajib punya akun
                Gemiku.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <CalendarDays className="mb-3 text-amber-500" size={20} />
              <p className="text-sm font-semibold text-slate-900">Settlement fleksibel</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Pantau live kapan saja, lalu finalize saat trip sudah selesai
                atau saat ingin checkpoint.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Membuat session...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Buat Session
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
