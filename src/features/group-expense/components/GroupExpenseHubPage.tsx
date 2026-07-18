'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthGuard } from '@/features/auth/components';
import { Header } from '@/features/dashboard';
import { Loading } from '@/components/ui/loading';
import {
  groupExpenseService,
  type GroupExpenseSessionDto,
} from '@/features/group-expense/services/group-expense.service';
import {
  formatGroupExpenseAmount,
  getGroupExpenseJoinLinkHref,
  getGroupExpenseOutstandingSettlement,
  getGroupExpenseStatusMeta,
} from '@/features/group-expense/utils/group-expense-helpers';
import { formatDate } from '@/utils/format';
import { CreateGroupExpenseDialog } from './CreateGroupExpenseDialog';

export function GroupExpenseHubPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GroupExpenseSessionDto[]>([]);
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
      const response = await groupExpenseService.listOwnedSessions();

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal memuat session talangan');
        setSessions([]);
        return;
      }

      setSessions(response.data);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat session talangan');
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
    const totalExpenses = sessions.reduce(
      (sum, session) => sum + session.summary.totalExpenses,
      0,
    );
    const totalReceivables = sessions.reduce(
      (sum, session) => sum + getGroupExpenseOutstandingSettlement(session),
      0,
    );
    const activeSessions = sessions.filter((session) => session.status === 'ACTIVE').length;
    const activeParticipants = sessions.reduce(
      (sum, session) => sum + session.summary.participantCount,
      0,
    );

    return {
      totalExpenses,
      totalReceivables,
      activeSessions,
      activeParticipants,
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
          <Loading text="Memuat session talangan..." />
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
                Patungan adaptif
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Group Expense Center
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Catat talangan per lokasi atau momen, pantau siapa yang nombok,
                siapa yang masih utang, lalu finalize settlement saat sudah siap.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/group-expense/join"
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
              Session Talangan Baru
            </button>
          </div>
        </div>

        <section className="mb-8 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.2),_transparent_36%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_50%,#38bdf8_100%)] p-6 text-white shadow-[0_28px_60px_rgba(29,78,216,0.25)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">
                Session talangan yang kamu kelola
              </p>
              <div className="mt-3 text-4xl font-bold tracking-tight">
                {summary.activeSessions}
              </div>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">
                Room aktif siap dipakai untuk monitoring trip, nongkrong,
                project, atau pengeluaran bareng yang dibayar bergantian.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Session
                </p>
                <p className="mt-2 text-2xl font-bold">{sessions.length}</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Talangan
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatGroupExpenseAmount(summary.totalExpenses)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Piutang Berjalan
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatGroupExpenseAmount(summary.totalReceivables)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Session</h2>
            <p className="mt-1 text-sm text-slate-500">
              Buka detail session untuk menambah item, repayment, dan melihat settlement live.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 sm:inline-flex">
              {summary.activeParticipants} participant terlibat
            </span>
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
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4176ED]/10 text-[#4176ED]">
              <WalletCards size={28} />
            </div>
            <h3 className="mt-5 text-2xl font-bold text-slate-900">
              Belum ada session group expense
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Mulai dari satu trip atau event. Setelah itu kamu bisa bagikan kode,
              tambah item talangan satu per satu, lalu pantau utang antarpeserta secara live.
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
              const status = getGroupExpenseStatusMeta(session.status);
              const joinHref = getGroupExpenseJoinLinkHref(session.sessionCode);

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
                        Total Talangan
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatGroupExpenseAmount(
                          session.summary.totalExpenses,
                          session.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Item aktif
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {session.summary.activeItemCount}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Repayment
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatGroupExpenseAmount(
                          session.summary.totalRepayments,
                          session.currency,
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Sisa settlement
                      </p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatGroupExpenseAmount(
                          getGroupExpenseOutstandingSettlement(session),
                          session.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 font-medium">
                      <Users size={14} />
                      {session.summary.participantCount} participant
                    </span>
                    <span>Dibuat {formatDate(session.createdAt)}</span>
                    {session.startedAt ? <span>Mulai {formatDate(session.startedAt)}</span> : null}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          session.sessionCode,
                          'SESSION_ID talangan berhasil disalin',
                        )
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Copy size={16} />
                      Copy kode
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(
                          `${window.location.origin}${joinHref}`,
                          'Link join berhasil disalin',
                        )
                      }
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Users size={16} />
                      Copy link join
                    </button>
                    <Link
                      href={`/group-expense/session/${encodeURIComponent(session.sessionCode)}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Buka session
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <CreateGroupExpenseDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreated={(session) => {
            setSessions((prev) => [session, ...prev]);
            router.push(`/group-expense/session/${encodeURIComponent(session.sessionCode)}`);
          }}
        />
      </div>
    </AuthGuard>
  );
}
