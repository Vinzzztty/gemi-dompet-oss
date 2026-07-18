'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { LogoIcon } from '@/components/icons';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Loading } from '@/components/ui/loading';
import { getCurrentUser } from '@/lib/auth-client';
import {
  splitBillService,
  type SplitBillSessionDto,
} from '@/features/split-bill/services/split-bill.service';
import {
  formatSplitBillAmount,
  getAssignedTotal,
  getJoinLinkHref,
  getShareAmountForParticipant,
  getSplitBillStatusMeta,
} from '@/features/split-bill/utils/split-bill-helpers';
import { formatDate } from '@/utils/format';

interface SplitBillSessionPageProps {
  sessionCode: string;
}

type ManualShareDraft = {
  participantId: string;
  displayName: string;
  amount: string;
  notes: string;
  isOwner: boolean;
};

function buildManualDrafts(session: SplitBillSessionDto): ManualShareDraft[] {
  return session.participants.map((participant) => {
    const share = session.shares.find(
      (item) => item.participantId === participant.id,
    );

    return {
      participantId: participant.id,
      displayName: participant.displayName,
      amount: share ? String(Number(share.amount)) : '',
      notes: share?.notes ?? '',
      isOwner: participant.isOwner,
    };
  });
}

export function SplitBillSessionPage({
  sessionCode,
}: SplitBillSessionPageProps) {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SplitBillSessionDto | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [manualShares, setManualShares] = useState<ManualShareDraft[]>([]);
  const [isApplyingEqual, setIsApplyingEqual] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const joinedAs = searchParams.get('joinedAs')?.trim() || '';

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const loadSession = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await splitBillService.getSessionByCode(sessionCode);

      if (!response.success || !response.data) {
        setSession(null);
        setErrorMessage(response.message || 'Session split bill tidak ditemukan');
        return;
      }

      setSession(response.data);
      setManualShares(buildManualDrafts(response.data));
      setErrorMessage(null);
    } catch (error: any) {
      setSession(null);
      setErrorMessage(error?.message || 'Gagal memuat session split bill');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const isOwner = Boolean(
    session &&
      currentUser?.id &&
      session.owner.id === currentUser.id,
  );

  const assignedTotal = useMemo(() => {
    if (!session) return 0;
    return getAssignedTotal(session);
  }, [session]);

  const totalAmount = Number(session?.totalAmount || 0);
  const remainingAmount = totalAmount - assignedTotal;

  const manualTotal = useMemo(
    () =>
      manualShares.reduce((total, item) => {
        const amount = Number(item.amount || 0);
        return total + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [manualShares],
  );

  const manualRemaining = totalAmount - manualTotal;

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  const handleAddParticipant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isOwner || !session) {
      return;
    }

    if (!newParticipantName.trim()) {
      toast.error('Nama participant harus diisi');
      return;
    }

    setIsAddingParticipant(true);

    try {
      const response = await splitBillService.addParticipant(session.sessionCode, {
        displayName: newParticipantName.trim(),
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menambahkan participant');
        return;
      }

      setSession(response.data);
      setManualShares(buildManualDrafts(response.data));
      setNewParticipantName('');
      toast.success('Participant berhasil ditambahkan');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menambahkan participant');
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleApplyEqualSplit = async () => {
    if (!isOwner || !session) {
      return;
    }

    setIsApplyingEqual(true);

    try {
      const response = await splitBillService.updateShares(session.sessionCode, {
        mode: 'equal',
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal membagi split bill');
        return;
      }

      setSession(response.data);
      setManualShares(buildManualDrafts(response.data));
      toast.success('Split bill berhasil dibagi rata');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal membagi split bill');
    } finally {
      setIsApplyingEqual(false);
    }
  };

  const handleSaveManualShares = async () => {
    if (!isOwner || !session) {
      return;
    }

    setIsSavingManual(true);

    try {
      const response = await splitBillService.updateShares(session.sessionCode, {
        mode: 'manual',
        shares: manualShares.map((item) => ({
          participantId: item.participantId,
          amount: Number(item.amount || 0),
          notes: item.notes.trim() || null,
        })),
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menyimpan split manual');
        return;
      }

      setSession(response.data);
      setManualShares(buildManualDrafts(response.data));
      toast.success('Split manual berhasil disimpan');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan split manual');
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleDeleteParticipant = async () => {
    if (!isOwner || !session || !participantToDelete) {
      return;
    }

    try {
      const response = await splitBillService.removeParticipant(
        session.sessionCode,
        participantToDelete.id,
      );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menghapus participant');
        return;
      }

      setSession(response.data);
      setManualShares(buildManualDrafts(response.data));
      toast.success('Participant berhasil dihapus');
      setParticipantToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus participant');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Loading text="Memuat session split bill..." />
        </div>
      </div>
    );
  }

  if (!session || errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Users size={28} />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Session tidak ditemukan
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {errorMessage || 'Kode session tidak valid atau sudah tidak tersedia.'}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/split-bill/join"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc]"
              >
                Kembali ke form join
              </Link>
              <Link
                href="/split-bill"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Dashboard split bill
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = getSplitBillStatusMeta(session.status);
  const joinHref = getJoinLinkHref(session.sessionCode);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_24%),#f8fafc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={isOwner ? '/split-bill' : '/split-bill/join'}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
              aria-label="Kembali"
            >
              <ArrowLeft size={20} />
            </Link>
            <Link href="/" className="flex items-center gap-3 text-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <LogoIcon size={28} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Gemiku
                </p>
                <p className="text-lg font-bold">Session Split Bill</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadSession(false)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
            <button
              type="button"
              onClick={() =>
                void copyToClipboard(session.sessionCode, 'SESSION_ID disalin')
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Copy size={16} />
              Copy kode
            </button>
            <button
              type="button"
              onClick={() =>
                void copyToClipboard(
                  `${window.location.origin}${joinHref}`,
                  'Link join disalin',
                )
              }
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Users size={16} />
              Copy link join
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_38%),linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#38bdf8_100%)] p-6 text-white shadow-[0_30px_65px_rgba(29,78,216,0.24)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className} bg-white/90`}
                >
                  {status.label}
                </span>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/85 backdrop-blur">
                  {session.sessionCode}
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight">
                {session.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-white/82">
                {session.notes?.trim()
                  ? session.notes
                  : 'Belum ada catatan tambahan untuk session split bill ini.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/75">
                <span>Dibuat oleh {session.owner.fullName}</span>
                <span>•</span>
                <span>{formatDate(session.createdAt)}</span>
                <span>•</span>
                <span>{session.currency}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[440px]">
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Tagihan
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatSplitBillAmount(session.totalAmount, session.currency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Assigned
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatSplitBillAmount(assignedTotal, session.currency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Sisa Split
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatSplitBillAmount(remainingAmount, session.currency)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {joinedAs && !isOwner ? (
          <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            Kamu sedang melihat session ini sebagai <strong>{joinedAs}</strong>.
          </div>
        ) : null}

        {!isOwner ? (
          <div className="mt-5 rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Belum join sebagai member?
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Isi nama dulu supaya owner bisa mengenali kamu di session ini.
                </p>
              </div>
              <Link
                href={joinHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(65,118,237,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc]"
              >
                Join session ini
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Participants
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {session.participants.length} orang
                </h2>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {session.status}
              </div>
            </div>

            <div className="space-y-3">
              {session.participants.map((participant) => {
                const shareAmount = getShareAmountForParticipant(session, participant.id);
                const isJoinedUser =
                  joinedAs &&
                  joinedAs.toLowerCase() === participant.displayName.toLowerCase();

                return (
                  <div
                    key={participant.id}
                    className={`rounded-[24px] border p-4 transition ${
                      isJoinedUser
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {participant.displayName}
                          </p>
                          {participant.isOwner ? (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                              Owner
                            </span>
                          ) : null}
                          {participant.joinedViaCode ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">
                              Join via code
                            </span>
                          ) : null}
                          {isJoinedUser ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                              Kamu
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Porsi saat ini:{' '}
                          <span className="font-semibold text-slate-900">
                            {formatSplitBillAmount(shareAmount, session.currency)}
                          </span>
                        </p>
                      </div>

                      {isOwner && !participant.isOwner ? (
                        <button
                          type="button"
                          onClick={() =>
                            setParticipantToDelete({
                              id: participant.id,
                              displayName: participant.displayName,
                            })
                          }
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                          aria-label={`Hapus ${participant.displayName}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {isOwner ? (
              <form onSubmit={handleAddParticipant} className="mt-5 space-y-3 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Tambah participant manual
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Cocok untuk teman yang belum membuka link join tapi ingin kamu masukkan lebih dulu.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={newParticipantName}
                    onChange={(event) => setNewParticipantName(event.target.value)}
                    placeholder="Nama participant baru"
                    className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10"
                    disabled={isAddingParticipant}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(65,118,237,0.24)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                    disabled={isAddingParticipant}
                  >
                    {isAddingParticipant ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Menambah...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Tambah
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Split Summary
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Pembagian nominal
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {isOwner
                    ? 'Gunakan bagi rata untuk cepat, lalu sesuaikan manual kalau ada nominal yang berbeda.'
                    : 'Berikut pembagian nominal yang sedang disusun owner session.'}
                </p>
              </div>

              {isOwner ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleApplyEqualSplit}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isApplyingEqual}
                  >
                    {isApplyingEqual ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Bagi rata otomatis
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualShares}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isSavingManual}
                  >
                    {isSavingManual ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    Simpan split manual
                  </button>
                </div>
              ) : null}
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total session
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatSplitBillAmount(session.totalAmount, session.currency)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Total terisi
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {formatSplitBillAmount(
                    isOwner ? manualTotal : assignedTotal,
                    session.currency,
                  )}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Sisa
                </p>
                <p
                  className={`mt-2 text-lg font-bold ${
                    (isOwner ? manualRemaining : remainingAmount) === 0
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {formatSplitBillAmount(
                    isOwner ? manualRemaining : remainingAmount,
                    session.currency,
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {manualShares.map((item) => (
                <div
                  key={item.participantId}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {item.displayName}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                        {item.isOwner ? 'Owner session' : 'Participant'}
                      </p>
                    </div>
                    {!isOwner ? (
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm">
                        {formatSplitBillAmount(
                          getShareAmountForParticipant(session, item.participantId),
                          session.currency,
                        )}
                      </div>
                    ) : null}
                  </div>

                  {isOwner ? (
                    <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Nominal
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(event) =>
                            setManualShares((previous) =>
                              previous.map((draft) =>
                                draft.participantId === item.participantId
                                  ? { ...draft, amount: event.target.value }
                                  : draft,
                              ),
                            )
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Catatan share
                        </label>
                        <input
                          value={item.notes}
                          onChange={(event) =>
                            setManualShares((previous) =>
                              previous.map((draft) =>
                                draft.participantId === item.participantId
                                  ? { ...draft, notes: event.target.value }
                                  : draft,
                              ),
                            )
                          }
                          placeholder="Opsional: bayar parkir, dessert, dll"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">
                      {session.shares.find(
                        (share) => share.participantId === item.participantId,
                      )?.notes || 'Belum ada catatan untuk nominal participant ini.'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <DeleteConfirmDialog
          isOpen={Boolean(participantToDelete)}
          onClose={() => setParticipantToDelete(null)}
          onConfirm={() => void handleDeleteParticipant()}
          title="Hapus Participant"
          message="Participant akan dihapus dari session split bill ini beserta share nominalnya."
          itemName={participantToDelete?.displayName}
        />
      </div>
    </div>
  );
}
