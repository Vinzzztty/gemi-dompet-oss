'use client';

import { useEffect, useState } from 'react';
import { Loader2, ReceiptText, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  splitBillService,
  type SplitBillSessionDto,
} from '@/features/split-bill/services/split-bill.service';

interface CreateSplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (session: SplitBillSessionDto) => void;
}

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10';

function formatSplitBillInputAmount(rawValue: string): string {
  const normalized = rawValue.replace(/[^0-9.]/g, '');
  if (!normalized) return '';

  const [integerPart, decimalPart] = normalized.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimalPart === undefined) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

function parseSplitBillInputAmount(rawValue: string): number {
  return Number(rawValue.replace(/,/g, ''));
}

export function CreateSplitBillDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSplitBillDialogProps) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle('');
      setTotalAmount('');
      setNotes('');
      setCurrency('IDR');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedTotalAmount = parseSplitBillInputAmount(totalAmount);
    if (!title.trim()) {
      toast.error('Judul split bill harus diisi');
      return;
    }

    if (!Number.isFinite(parsedTotalAmount) || parsedTotalAmount <= 0) {
      toast.error('Total tagihan harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await splitBillService.createSession({
        title: title.trim(),
        totalAmount: parsedTotalAmount,
        currency: currency.trim().toUpperCase() || 'IDR',
        notes: notes.trim() || null,
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal membuat session split bill');
        return;
      }

      toast.success('Session split bill berhasil dibuat');
      onCreated(response.data);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal membuat session split bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border-0 p-0 shadow-[0_32px_80px_rgba(15,23,42,0.24)]">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_38%),linear-gradient(135deg,#1d4ed8_0%,#3b82f6_45%,#60a5fa_100%)] px-6 py-5 text-white sm:px-8">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <Sparkles size={14} />
              Split Bill Session
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              Buat ruang patungan yang rapi
            </DialogTitle>
            <DialogDescription className="max-w-xl text-sm leading-6 text-white/80">
              Setelah session dibuat, kamu akan mendapatkan `SESSION_ID` publik
              yang bisa dibagikan ke teman untuk join tanpa perlu akun.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Judul tagihan
              </label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Contoh: Makan malam tim produk"
                className={inputClassName}
                maxLength={255}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Total tagihan
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={totalAmount}
                onChange={(event) =>
                  setTotalAmount(formatSplitBillInputAmount(event.target.value))
                }
                placeholder="350000"
                className={inputClassName}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Currency
              </label>
              <input
                value={currency}
                onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                placeholder="IDR"
                className={inputClassName}
                maxLength={10}
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
                placeholder="Misalnya: sudah termasuk service charge dan pajak"
                className={`${inputClassName} min-h-[120px] resize-none`}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <ReceiptText className="mb-3 text-[#4176ED]" size={20} />
              <p className="text-sm font-semibold text-slate-900">Kode otomatis</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                `SESSION_ID` akan dibuat otomatis dalam format uppercase yang mudah dibagikan.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Users className="mb-3 text-emerald-500" size={20} />
              <p className="text-sm font-semibold text-slate-900">Guest friendly</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Teman cukup isi kode session dan nama. Tidak wajib punya akun Gemiku.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <Sparkles className="mb-3 text-amber-500" size={20} />
              <p className="text-sm font-semibold text-slate-900">Siap dibagi</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Setelah member masuk, kamu bisa pakai split rata atau atur nominal manual.
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
