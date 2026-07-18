'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, KeyRound, Loader2, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { LogoIcon } from '@/components/icons';
import { groupExpenseService } from '@/features/group-expense/services/group-expense.service';

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10';

export function GroupExpenseJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionCode, setSessionCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const incomingSessionCode = searchParams.get('sessionCode');
    if (incomingSessionCode) {
      setSessionCode(incomingSessionCode.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionCode.trim()) {
      toast.error('SESSION_ID harus diisi');
      return;
    }

    if (!displayName.trim()) {
      toast.error('Nama participant harus diisi');
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedSessionCode = sessionCode.trim().toUpperCase();
      const response = await groupExpenseService.joinSession({
        sessionCode: normalizedSessionCode,
        displayName: displayName.trim(),
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal join ke session talangan');
        return;
      }

      toast.success('Berhasil join ke session talangan');
      router.push(
        `/group-expense/session/${encodeURIComponent(response.data.sessionCode)}?joinedAs=${encodeURIComponent(displayName.trim())}`,
      );
    } catch (error: any) {
      toast.error(error?.message || 'Gagal join ke session talangan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_26%),#f8fafc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/login" className="inline-flex items-center gap-3 text-slate-800">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <LogoIcon size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Gemiku
              </p>
              <p className="text-lg font-bold">Join Group Expense</p>
            </div>
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/group-expense"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Saya owner session
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc]"
            >
              Buat akun Gemiku
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_35%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#38bdf8_100%)] p-7 text-white shadow-[0_28px_60px_rgba(29,78,216,0.24)] sm:p-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
              <Sparkles size={14} />
              Cocok untuk trip dan talangan ramai-ramai
            </p>
            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight">
              Masuk ke room patungan hanya dengan `SESSION_ID`
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/82">
              Owner tinggal bagikan kodenya. Kamu isi nama, masuk ke halaman
              session, lalu bisa lihat pengeluaran per lokasi, utang, dan
              rekomendasi settlement yang sedang berjalan.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <KeyRound size={20} />
                <p className="mt-3 text-sm font-semibold">Masukkan kode</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Gunakan SESSION_ID uppercase dari owner.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <Users size={20} />
                <p className="mt-3 text-sm font-semibold">Isi nama</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Nama ini akan muncul di daftar participant session.
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <ArrowRight size={20} />
                <p className="mt-3 text-sm font-semibold">Pantau live</p>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  Setelah join, kamu bisa langsung lihat ringkasan talangan dan settlement.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_50px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Join Form
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                Masuk ke session talangan
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tidak perlu login. Cukup isi kode session dan nama yang akan
                ditampilkan ke owner.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  SESSION_ID
                </label>
                <input
                  value={sessionCode}
                  onChange={(event) =>
                    setSessionCode(event.target.value.toUpperCase())
                  }
                  placeholder="GROUP_EXPENSE_OSISI_2026"
                  className={`${inputClassName} font-semibold tracking-[0.14em] uppercase`}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Nama participant
                </label>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Contoh: Kevin / Tim Design / Arif"
                  className={inputClassName}
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#4176ED] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sedang join...
                  </>
                ) : (
                  <>
                    Lanjut ke session
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Belum punya kode?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Minta `SESSION_ID` langsung dari owner session. Kalau kamu owner,
                buat room baru dari dashboard group expense.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
