'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuard } from '@/features/auth/components';
import { Header } from '@/features/dashboard';
import { Loading } from '@/components/ui/loading';
import {
  splitBillService,
  type SplitBillSessionDto,
} from '@/features/split-bill/services/split-bill.service';
import {
  formatSplitBillAmount,
  getAssignedTotal,
  getJoinLinkHref,
  getSplitBillStatusMeta,
} from '@/features/split-bill/utils/split-bill-helpers';
import { formatDate } from '@/utils/format';
import { CreateSplitBillDialog } from './CreateSplitBillDialog';

export function SplitBillHubPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SplitBillSessionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadSessions = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await splitBillService.listOwnedSessions();

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal memuat session split bill');
        setSessions([]);
        return;
      }

      setSessions(response.data);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat session split bill');
      setSessions([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const summary = useMemo(() => {
    const totalNominal = sessions.reduce(
      (sum, session) => sum + Number(session.totalAmount || 0),
      0,
    );
    const openSessions = sessions.filter((session) => session.status === 'OPEN').length;
    const participantCount = sessions.reduce(
      (sum, session) => sum + session.participants.length,
      0,
    );

    return {
      totalNominal,
      openSessions,
      participantCount,
    };
  }, [sessions]);

  const handleCopy = async (value: string, message: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="pb-10">
          <Header />
          <Loading text="Memuat split bill..." />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="animate-in fade-in zoom-in-95 duration-300 pb-10">
        <Header />

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
              aria-label="Kembali ke dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Patungan
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Split Bill Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Buat session, bagikan `SESSION_ID`, lalu atur pembagian nominal
                untuk teman-temanmu dalam satu tempat.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/split-bill/join"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Users size={18} />
              Join sebagai member
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc]"
            >
              <Plus size={18} />
              Split Bill Baru
            </button>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_36%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_50%,#38bdf8_100%)] p-6 text-white shadow-[0_28px_60px_rgba(29,78,216,0.25)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">
                Session yang kamu kelola
              </p>
              <div className="mt-3 text-4xl font-bold tracking-tight">
                {summary.openSessions}
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                Session aktif siap dibagikan ke member. Kamu bisa copy kode,
                kirim link join, lalu atur nominal per orang dari detail session.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Session
                </p>
                <p className="mt-2 text-2xl font-bold">{sessions.length}</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Nominal
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatSplitBillAmount(summary.totalNominal)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Member
                </p>
                <p className="mt-2 text-2xl font-bold">{summary.participantCount}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Session</h2>
            <p className="mt-1 text-sm text-slate-500">
              Buka detail session untuk atur participant dan nominal split.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadSessions(false)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4176ED]/10 text-[#4176ED]">
              <Users size={28} />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-slate-900">
              Belum ada session split bill
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Mulai dari satu session sederhana. Setelah itu kamu bisa bagikan
              kode ke teman dan pantau pembagian tagihannya dari halaman detail.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4176ED] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc]"
            >
              <Plus size={18} />
              Buat Session Pertama
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {sessions.map((session) => {
              const status = getSplitBillStatusMeta(session.status);
              const assigned = getAssignedTotal(session);
              const joinHref = getJoinLinkHref(session.sessionCode);

              return (
                <article
                  key={session.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-500">
                          {session.sessionCode}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-bold text-slate-900">
                        {session.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {session.notes?.trim()
                          ? session.notes
                          : 'Belum ada catatan tambahan untuk session ini.'}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-slate-50 px-4 py-3 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Total
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatSplitBillAmount(session.totalAmount, session.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Participant
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {session.participants.length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Sudah dibagi
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatSplitBillAmount(assigned, session.currency)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Dibuat
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatDate(session.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(session.sessionCode, 'SESSION_ID disalin')
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Copy size={16} />
                        Copy kode
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopy(
                            `${window.location.origin}${joinHref}`,
                            'Link join disalin',
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <CalendarClock size={16} />
                        Copy link join
                      </button>
                    </div>

                    <Link
                      href={`/split-bill/session/${encodeURIComponent(session.sessionCode)}`}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Buka detail
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <CreateSplitBillDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={(session) => {
            setSessions((previous) => [session, ...previous]);
            router.push(`/split-bill/session/${encodeURIComponent(session.sessionCode)}`);
          }}
        />
      </div>
    </AuthGuard>
  );
}
