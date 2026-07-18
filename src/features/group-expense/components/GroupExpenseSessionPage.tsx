'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Copy,
  HandCoins,
  Loader2,
  MapPin,
  PauseCircle,
  PlayCircle,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Trash2,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { LogoIcon } from '@/components/icons';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { Loading } from '@/components/ui/loading';
import { getCurrentUser } from '@/lib/auth-client';
import {
  groupExpenseService,
  type GroupExpenseItemDto,
  type GroupExpenseParticipantDto,
  type GroupExpenseBalanceSummaryDto,
  type GroupExpenseRepaymentDto,
  type GroupExpenseSessionDto,
  type GroupExpenseSessionStatus,
  type GroupExpenseSplitMode,
} from '@/features/group-expense/services/group-expense.service';
import {
  buildGroupExpenseShareSummary,
  formatGroupExpenseAmount,
  formatGroupExpenseInputAmount,
  getGroupExpenseBalanceMeta,
  getGroupExpenseJoinLinkHref,
  getGroupExpenseOutstandingSettlement,
  getGroupExpenseStatusMeta,
  getNowDateTimeLocalValue,
  parseGroupExpenseInputAmount,
  toDateTimeLocalValue,
} from '@/features/group-expense/utils/group-expense-helpers';
import { formatDate } from '@/utils/format';

interface GroupExpenseSessionPageProps {
  sessionCode: string;
}

type ItemShareDraft = {
  participantId: string;
  displayName: string;
  selected: boolean;
  amount: string;
  notes: string;
  isOwner: boolean;
};

type ItemFormState = {
  itemId: string | null;
  title: string;
  locationLabel: string;
  amount: string;
  currency: string;
  paidByParticipantId: string;
  incurredAt: string;
  notes: string;
  splitMode: GroupExpenseSplitMode;
  shareDrafts: ItemShareDraft[];
};

type RepaymentFormState = {
  repaymentId: string | null;
  fromParticipantId: string;
  toParticipantId: string;
  amount: string;
  currency: string;
  paidAt: string;
  notes: string;
};

type DeleteTarget =
  | { type: 'participant'; id: string; label: string }
  | { type: 'item'; id: string; label: string }
  | { type: 'repayment'; id: string; label: string }
  | null;

const inputClassName =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#4176ED] focus:ring-4 focus:ring-[#4176ED]/10';

function buildShareDrafts(
  participants: GroupExpenseParticipantDto[],
  item?: GroupExpenseItemDto,
): ItemShareDraft[] {
  return participants.map((participant) => {
    const share = item?.shares.find(
      (shareItem) => shareItem.participantId === participant.id,
    );

    return {
      participantId: participant.id,
      displayName: participant.displayName,
      selected: Boolean(share) || !item,
      amount: share ? formatGroupExpenseInputAmount(String(Number(share.amount))) : '',
      notes: share?.notes ?? '',
      isOwner: participant.isOwner,
    };
  });
}

function buildItemFormState(
  session: GroupExpenseSessionDto,
  item?: GroupExpenseItemDto,
): ItemFormState {
  return {
    itemId: item?.id ?? null,
    title: item?.title ?? '',
    locationLabel: item?.locationLabel ?? '',
    amount: item
      ? formatGroupExpenseInputAmount(String(Number(item.amount)))
      : '',
    currency: item?.currency ?? session.currency ?? 'IDR',
    paidByParticipantId:
      item?.paidByParticipantId ?? session.participants[0]?.id ?? '',
    incurredAt: item ? toDateTimeLocalValue(item.incurredAt) : getNowDateTimeLocalValue(),
    notes: item?.notes ?? '',
    splitMode: item?.splitMode ?? 'EQUAL',
    shareDrafts: buildShareDrafts(session.participants, item),
  };
}

function buildRepaymentFormState(
  session: GroupExpenseSessionDto,
  repayment?: GroupExpenseRepaymentDto,
): RepaymentFormState {
  return {
    repaymentId: repayment?.id ?? null,
    fromParticipantId:
      repayment?.fromParticipantId ?? session.participants[0]?.id ?? '',
    toParticipantId:
      repayment?.toParticipantId ??
      session.participants.find((participant) => !participant.isOwner)?.id ??
      session.participants[0]?.id ??
      '',
    amount: repayment
      ? formatGroupExpenseInputAmount(String(Number(repayment.amount)))
      : '',
    currency: repayment?.currency ?? session.currency ?? 'IDR',
    paidAt: repayment ? toDateTimeLocalValue(repayment.paidAt) : getNowDateTimeLocalValue(),
    notes: repayment?.notes ?? '',
  };
}

export function GroupExpenseSessionPage({
  sessionCode,
}: GroupExpenseSessionPageProps) {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<GroupExpenseSessionDto | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [itemForm, setItemForm] = useState<ItemFormState | null>(null);
  const [repaymentForm, setRepaymentForm] = useState<RepaymentFormState | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingRepayment, setIsSavingRepayment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settlementLabel, setSettlementLabel] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [closeSessionAfterFinalize, setCloseSessionAfterFinalize] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const joinedAs = searchParams.get('joinedAs')?.trim() || '';

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  const applySessionState = useCallback((nextSession: GroupExpenseSessionDto) => {
    setSession(nextSession);
    setItemForm(buildItemFormState(nextSession));
    setRepaymentForm(buildRepaymentFormState(nextSession));
    setErrorMessage(null);
  }, []);

  const loadSession = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await groupExpenseService.getSessionByCode(sessionCode);

      if (!response.success || !response.data) {
        setSession(null);
        setErrorMessage(response.message || 'Session talangan tidak ditemukan');
        return;
      }

      applySessionState(response.data);
    } catch (error: any) {
      setSession(null);
      setErrorMessage(error?.message || 'Gagal memuat session talangan');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [applySessionState, sessionCode]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const isOwner = Boolean(
    session &&
      currentUser?.id &&
      session.owner.id === currentUser.id,
  );

  const canManageParticipants = isOwner && session?.status === 'ACTIVE';
  const canManageItems = isOwner && session?.status === 'ACTIVE';
  const canManageRepayments =
    isOwner && session && ['ACTIVE', 'FROZEN'].includes(session.status);

  const balanceMap = useMemo(() => {
    const map = new Map<string, GroupExpenseBalanceSummaryDto>();
    session?.summary.balances.forEach((balance) => {
      map.set(balance.participantId, balance);
    });
    return map;
  }, [session]);

  const itemManualTotal = useMemo(() => {
    if (!itemForm || itemForm.splitMode !== 'MANUAL') return 0;

    return itemForm.shareDrafts.reduce((total, draft) => {
      if (!draft.selected) return total;
      return total + parseGroupExpenseInputAmount(draft.amount);
    }, 0);
  }, [itemForm]);

  const itemSelectedCount = useMemo(() => {
    if (!itemForm) return 0;
    return itemForm.shareDrafts.filter((draft) => draft.selected).length;
  }, [itemForm]);

  const itemAmountValue = itemForm
    ? parseGroupExpenseInputAmount(itemForm.amount)
    : 0;

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  const resetItemForm = useCallback(() => {
    if (!session) return;
    setItemForm(buildItemFormState(session));
  }, [session]);

  const resetRepaymentForm = useCallback(() => {
    if (!session) return;
    setRepaymentForm(buildRepaymentFormState(session));
  }, [session]);

  const handleAddParticipant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageParticipants || !session) {
      return;
    }

    if (!newParticipantName.trim()) {
      toast.error('Nama participant harus diisi');
      return;
    }

    setIsAddingParticipant(true);

    try {
      const response = await groupExpenseService.addParticipant(session.sessionCode, {
        displayName: newParticipantName.trim(),
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menambahkan participant');
        return;
      }

      applySessionState(response.data);
      setNewParticipantName('');
      toast.success('Participant berhasil ditambahkan');
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menambahkan participant');
    } finally {
      setIsAddingParticipant(false);
    }
  };

  const handleSaveItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageItems || !session || !itemForm) {
      return;
    }

    const amount = parseGroupExpenseInputAmount(itemForm.amount);

    if (!itemForm.title.trim()) {
      toast.error('Judul item talangan harus diisi');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Nominal item harus lebih besar dari 0');
      return;
    }

    if (!itemForm.paidByParticipantId) {
      toast.error('Payer item talangan harus dipilih');
      return;
    }

    const selectedDrafts = itemForm.shareDrafts.filter((draft) => draft.selected);
    if (selectedDrafts.length === 0) {
      toast.error('Pilih minimal satu participant untuk pembagian item');
      return;
    }

    if (itemForm.splitMode === 'MANUAL' && itemManualTotal !== amount) {
      toast.error('Total share manual harus sama dengan nominal item');
      return;
    }

    setIsSavingItem(true);

    try {
      const payload = {
        title: itemForm.title.trim(),
        locationLabel: itemForm.locationLabel.trim() || null,
        amount,
        currency: itemForm.currency.trim().toUpperCase() || session.currency,
        incurredAt: new Date(itemForm.incurredAt).toISOString(),
        notes: itemForm.notes.trim() || null,
        paidByParticipantId: itemForm.paidByParticipantId,
        splitMode: itemForm.splitMode,
        participantIds:
          itemForm.splitMode === 'EQUAL'
            ? selectedDrafts.map((draft) => draft.participantId)
            : undefined,
        shares:
          itemForm.splitMode === 'MANUAL'
            ? selectedDrafts.map((draft) => ({
                participantId: draft.participantId,
                amount: parseGroupExpenseInputAmount(draft.amount),
                notes: draft.notes.trim() || null,
              }))
            : undefined,
      };

      const response = itemForm.itemId
        ? await groupExpenseService.updateItem(
            session.sessionCode,
            itemForm.itemId,
            payload,
          )
        : await groupExpenseService.createItem(session.sessionCode, payload);

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menyimpan item talangan');
        return;
      }

      applySessionState(response.data);
      toast.success(
        itemForm.itemId
          ? 'Item talangan berhasil diperbarui'
          : 'Item talangan berhasil ditambahkan',
      );
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan item talangan');
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleSaveRepayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManageRepayments || !session || !repaymentForm) {
      return;
    }

    const amount = parseGroupExpenseInputAmount(repaymentForm.amount);

    if (!repaymentForm.fromParticipantId || !repaymentForm.toParticipantId) {
      toast.error('Pilih pengirim dan penerima repayment');
      return;
    }

    if (repaymentForm.fromParticipantId === repaymentForm.toParticipantId) {
      toast.error('Pengirim dan penerima repayment tidak boleh sama');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Nominal repayment harus lebih besar dari 0');
      return;
    }

    setIsSavingRepayment(true);

    try {
      const payload = {
        fromParticipantId: repaymentForm.fromParticipantId,
        toParticipantId: repaymentForm.toParticipantId,
        amount,
        currency:
          repaymentForm.currency.trim().toUpperCase() || session.currency,
        paidAt: new Date(repaymentForm.paidAt).toISOString(),
        notes: repaymentForm.notes.trim() || null,
      };

      const response = repaymentForm.repaymentId
        ? await groupExpenseService.updateRepayment(
            session.sessionCode,
            repaymentForm.repaymentId,
            payload,
          )
        : await groupExpenseService.createRepayment(session.sessionCode, payload);

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menyimpan repayment');
        return;
      }

      applySessionState(response.data);
      toast.success(
        repaymentForm.repaymentId
          ? 'Repayment berhasil diperbarui'
          : 'Repayment berhasil dicatat',
      );
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan repayment');
    } finally {
      setIsSavingRepayment(false);
    }
  };

  const handleDeleteTarget = async () => {
    if (!session || !deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response =
        deleteTarget.type === 'participant'
          ? await groupExpenseService.removeParticipant(
              session.sessionCode,
              deleteTarget.id,
            )
          : deleteTarget.type === 'item'
            ? await groupExpenseService.deleteItem(
                session.sessionCode,
                deleteTarget.id,
              )
            : await groupExpenseService.deleteRepayment(
                session.sessionCode,
                deleteTarget.id,
              );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal menghapus data');
        return;
      }

      applySessionState(response.data);
      toast.success(
        deleteTarget.type === 'participant'
          ? 'Participant berhasil dihapus'
          : deleteTarget.type === 'item'
            ? 'Item talangan berhasil dihapus'
            : 'Repayment berhasil dihapus',
      );
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (status: GroupExpenseSessionStatus) => {
    if (!session || !isOwner) {
      return;
    }

    try {
      const response = await groupExpenseService.updateSession(session.sessionCode, {
        status,
      });

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal memperbarui status session');
        return;
      }

      applySessionState(response.data);
      toast.success(
        status === 'FROZEN'
          ? 'Session dibekukan. Item baru dihentikan sementara.'
          : 'Session aktif kembali.',
      );
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memperbarui status session');
    }
  };

  const handleFinalizeSession = async () => {
    if (!session || !isOwner) {
      return;
    }

    setIsFinalizing(true);

    try {
      const response = await groupExpenseService.finalizeSession(
        session.sessionCode,
        {
          label: settlementLabel.trim() || null,
          notes: settlementNotes.trim() || null,
          closeSession: closeSessionAfterFinalize,
        },
      );

      if (!response.success || !response.data) {
        toast.error(response.message || 'Gagal membuat settlement');
        return;
      }

      toast.success(
        closeSessionAfterFinalize
          ? 'Settlement dibuat dan session ditutup'
          : 'Snapshot settlement berhasil dibuat',
      );

      setSettlementLabel('');
      setSettlementNotes('');
      setCloseSessionAfterFinalize(false);
      await loadSession(false);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal membuat settlement');
    } finally {
      setIsFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <Loading text="Memuat session talangan..." />
        </div>
      </div>
    );
  }

  if (!session || errorMessage || !itemForm || !repaymentForm) {
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
                href="/group-expense/join"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc]"
              >
                Kembali ke form join
              </Link>
              <Link
                href="/group-expense"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Dashboard group expense
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = getGroupExpenseStatusMeta(session.status);
  const joinHref = getGroupExpenseJoinLinkHref(session.sessionCode);
  const outstandingSettlement = getGroupExpenseOutstandingSettlement(session);
  const latestSnapshot = session.settlementSnapshots[0];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_24%),#f8fafc] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={isOwner ? '/group-expense' : '/group-expense/join'}
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
                <p className="text-lg font-bold">Session Group Expense</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {isOwner && session.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => void handleToggleStatus('FROZEN')}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <PauseCircle size={16} />
                Bekukan session
              </button>
            ) : null}
            {isOwner && session.status === 'FROZEN' ? (
              <button
                type="button"
                onClick={() => void handleToggleStatus('ACTIVE')}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                <PlayCircle size={16} />
                Aktifkan lagi
              </button>
            ) : null}
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
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
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
                  : 'Belum ada catatan tambahan untuk session talangan ini.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/75">
                <span>Dibuat oleh {session.owner.fullName}</span>
                <span>•</span>
                <span>{formatDate(session.createdAt)}</span>
                <span>•</span>
                <span>{session.currency}</span>
                {session.startedAt ? (
                  <>
                    <span>•</span>
                    <span>Mulai {formatDate(session.startedAt)}</span>
                  </>
                ) : null}
                {session.endedAt ? (
                  <>
                    <span>•</span>
                    <span>Selesai {formatDate(session.endedAt)}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Total Talangan
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatGroupExpenseAmount(session.summary.totalExpenses, session.currency)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Repayment
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatGroupExpenseAmount(
                    session.summary.totalRepayments,
                    session.currency,
                  )}
                </p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/12 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.2em] text-white/65">
                  Piutang Berjalan
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatGroupExpenseAmount(outstandingSettlement, session.currency)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {joinedAs && !isOwner ? (
          <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            Kamu masuk sebagai <span className="font-semibold">{joinedAs}</span>.
            Ringkasan session di bawah akan terus ikut berubah saat owner menambah item atau repayment.
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <aside className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Participants
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {session.summary.participantCount} orang
                  </h2>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {status.label}
                </span>
              </div>

              <div className="space-y-3">
                {session.participants.map((participant) => {
                  const balance = balanceMap.get(participant.id);
                  const balanceMeta = getGroupExpenseBalanceMeta(
                    balance?.role ?? 'SETTLED',
                  );

                  return (
                    <div
                      key={participant.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-bold text-slate-900">
                              {participant.displayName}
                            </p>
                            {participant.isOwner ? (
                              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-white">
                                OWNER
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${balanceMeta.className}`}
                            >
                              {balanceMeta.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            Talangan: {formatGroupExpenseAmount(balance?.grossPaid ?? 0, session.currency)}
                          </p>
                          <p className="text-sm text-slate-500">
                            Konsumsi: {formatGroupExpenseAmount(balance?.grossConsumed ?? 0, session.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              (balance?.netBalance ?? 0) > 0
                                ? 'text-emerald-600'
                                : (balance?.netBalance ?? 0) < 0
                                  ? 'text-amber-600'
                                  : 'text-slate-600'
                            }`}
                          >
                            {formatGroupExpenseAmount(balance?.netBalance ?? 0, session.currency)}
                          </p>
                          {isOwner && !participant.isOwner ? (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'participant',
                                  id: participant.id,
                                  label: participant.displayName,
                                })
                              }
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition hover:text-red-600"
                            >
                              <Trash2 size={14} />
                              Hapus
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {canManageParticipants ? (
                <form
                  onSubmit={handleAddParticipant}
                  className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4"
                >
                  <p className="text-lg font-bold text-slate-900">
                    Tambah participant manual
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Cocok untuk teman yang belum membuka link join tapi ingin kamu masukkan lebih dulu.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newParticipantName}
                      onChange={(event) => setNewParticipantName(event.target.value)}
                      placeholder="Nama participant baru"
                      className={inputClassName}
                      disabled={isAddingParticipant}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
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

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Live Summary
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Settlement berjalan
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sistem menghitung siapa yang nombok, siapa yang masih harus bayar,
                  dan rekomendasi transfer paling ringkas.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Item aktif
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {session.summary.activeItemCount}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Split terisi
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatGroupExpenseAmount(session.summary.totalAssigned, session.currency)}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Sisa belum dibagi
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatGroupExpenseAmount(session.summary.outstandingSplit, session.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Rekomendasi transfer
                </h3>
                {session.summary.recommendedTransfers.length === 0 ? (
                  <p className="mt-3 rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    Belum ada transfer yang perlu dilakukan. Session ini sedang seimbang atau masih menunggu item berikutnya.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {session.summary.recommendedTransfers.map((transfer, index) => (
                      <div
                        key={`${transfer.fromParticipantId}-${transfer.toParticipantId}-${index}`}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {transfer.fromDisplayName} bayar ke {transfer.toDisplayName}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-[#4176ED]">
                          {formatGroupExpenseAmount(transfer.amount, session.currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Snapshot terakhir</p>
                {latestSnapshot ? (
                  <>
                    <p className="mt-2 text-sm text-slate-500">
                      {latestSnapshot.label?.trim()
                        ? latestSnapshot.label
                        : 'Snapshot tanpa label'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(latestSnapshot.snapshotAt)}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Belum ada snapshot settlement yang dibuat.
                  </p>
                )}
              </div>
            </section>

            {isOwner ? (
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Finalize
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    Tutup atau checkpoint settlement
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Buat snapshot kapan saja untuk checkpoint. Kalau ingin mengakhiri session, aktifkan opsi tutup session.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Label settlement
                    </label>
                    <input
                      value={settlementLabel}
                      onChange={(event) => setSettlementLabel(event.target.value)}
                      placeholder="Contoh: Penutupan hari ke-2"
                      className={inputClassName}
                      disabled={isFinalizing}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Catatan settlement
                    </label>
                    <textarea
                      value={settlementNotes}
                      onChange={(event) => setSettlementNotes(event.target.value)}
                      placeholder="Opsional: catatan tambahan untuk snapshot ini"
                      className={`${inputClassName} min-h-[96px] resize-none`}
                      disabled={isFinalizing}
                    />
                  </div>
                  <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={closeSessionAfterFinalize}
                      onChange={(event) =>
                        setCloseSessionAfterFinalize(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4176ED] focus:ring-[#4176ED]"
                      disabled={isFinalizing}
                    />
                    <span className="text-sm leading-6 text-slate-600">
                      Tutup session setelah snapshot ini. Cocok dipakai saat perjalanan atau event benar-benar selesai.
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleFinalizeSession()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isFinalizing}
                  >
                    {isFinalizing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menyimpan settlement...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {closeSessionAfterFinalize
                          ? 'Finalize dan tutup session'
                          : 'Buat snapshot settlement'}
                      </>
                    )}
                  </button>
                </div>
              </section>
            ) : null}
          </aside>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Expense Items
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    Talangan per lokasi atau momen
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Setiap item bisa punya payer berbeda dan peserta split yang berbeda juga.
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {session.summary.activeItemCount} item aktif
                </span>
              </div>

              {isOwner ? (
                <form
                  onSubmit={handleSaveItem}
                  className="mb-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {itemForm.itemId ? 'Edit item talangan' : 'Tambah item talangan'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Catat item per tempat seperti Lokasi A, bensin, makan, parkir, atau tiket.
                      </p>
                    </div>
                    {itemForm.itemId ? (
                      <button
                        type="button"
                        onClick={resetItemForm}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <XCircle size={16} />
                        Batal edit
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Judul item
                      </label>
                      <input
                        value={itemForm.title}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev ? { ...prev, title: event.target.value } : prev,
                          )
                        }
                        placeholder="Contoh: Makan siang di Lokasi A"
                        className={inputClassName}
                        disabled={!canManageItems || isSavingItem}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Lokasi / label
                      </label>
                      <input
                        value={itemForm.locationLabel}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev
                              ? { ...prev, locationLabel: event.target.value }
                              : prev,
                          )
                        }
                        placeholder="Contoh: Lokasi A / SPBU / Rest Area"
                        className={inputClassName}
                        disabled={!canManageItems || isSavingItem}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Nominal
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={itemForm.amount}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  amount: formatGroupExpenseInputAmount(
                                    event.target.value,
                                  ),
                                }
                              : prev,
                          )
                        }
                        placeholder="300000"
                        className={inputClassName}
                        disabled={!canManageItems || isSavingItem}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Dibayar oleh
                      </label>
                      <select
                        value={itemForm.paidByParticipantId}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  paidByParticipantId: event.target.value,
                                }
                              : prev,
                          )
                        }
                        className={inputClassName}
                        disabled={!canManageItems || isSavingItem}
                      >
                        {session.participants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Waktu pengeluaran
                      </label>
                      <input
                        type="datetime-local"
                        value={itemForm.incurredAt}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev ? { ...prev, incurredAt: event.target.value } : prev,
                          )
                        }
                        className={inputClassName}
                        disabled={!canManageItems || isSavingItem}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Currency
                      </label>
                      <input
                        value={itemForm.currency}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  currency: event.target.value.toUpperCase(),
                                }
                              : prev,
                          )
                        }
                        className={inputClassName}
                        maxLength={10}
                        disabled={!canManageItems || isSavingItem}
                      />
                    </div>

                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Catatan item
                      </label>
                      <textarea
                        value={itemForm.notes}
                        onChange={(event) =>
                          setItemForm((prev) =>
                            prev ? { ...prev, notes: event.target.value } : prev,
                          )
                        }
                        placeholder="Opsional: detail item, siapa yang ikut, atau kondisi khusus"
                        className={`${inputClassName} min-h-[88px] resize-none`}
                        disabled={!canManageItems || isSavingItem}
                      />
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setItemForm((prev) =>
                            prev ? { ...prev, splitMode: 'EQUAL' } : prev,
                          )
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                          itemForm.splitMode === 'EQUAL'
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Check size={16} />
                        Bagi rata otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setItemForm((prev) =>
                            prev ? { ...prev, splitMode: 'MANUAL' } : prev,
                          )
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                          itemForm.splitMode === 'MANUAL'
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Save size={16} />
                        Simpan split manual
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Total item
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatGroupExpenseAmount(itemAmountValue, itemForm.currency)}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Participant dipilih
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {itemSelectedCount}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Total manual
                        </p>
                        <p
                          className={`mt-2 text-2xl font-bold ${
                            itemForm.splitMode === 'MANUAL' &&
                            itemManualTotal !== itemAmountValue
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {formatGroupExpenseAmount(itemManualTotal, itemForm.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {itemForm.shareDrafts.map((draft) => (
                        <div
                          key={draft.participantId}
                          className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={draft.selected}
                              onChange={(event) =>
                                setItemForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        shareDrafts: prev.shareDrafts.map((item) =>
                                          item.participantId === draft.participantId
                                            ? {
                                                ...item,
                                                selected: event.target.checked,
                                              }
                                            : item,
                                        ),
                                      }
                                    : prev,
                                )
                              }
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4176ED] focus:ring-[#4176ED]"
                              disabled={!canManageItems || isSavingItem}
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                  {draft.displayName}
                                </p>
                                {draft.isOwner ? (
                                  <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-white">
                                    OWNER
                                  </span>
                                ) : null}
                              </div>

                              {itemForm.splitMode === 'MANUAL' ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={draft.amount}
                                    onChange={(event) =>
                                      setItemForm((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              shareDrafts: prev.shareDrafts.map((item) =>
                                                item.participantId === draft.participantId
                                                  ? {
                                                      ...item,
                                                      amount: formatGroupExpenseInputAmount(
                                                        event.target.value,
                                                      ),
                                                    }
                                                  : item,
                                              ),
                                            }
                                          : prev,
                                      )
                                    }
                                    placeholder="Nominal porsi"
                                    className={inputClassName}
                                    disabled={
                                      !canManageItems ||
                                      isSavingItem ||
                                      !draft.selected
                                    }
                                  />
                                  <input
                                    value={draft.notes}
                                    onChange={(event) =>
                                      setItemForm((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              shareDrafts: prev.shareDrafts.map((item) =>
                                                item.participantId === draft.participantId
                                                  ? {
                                                      ...item,
                                                      notes: event.target.value,
                                                    }
                                                  : item,
                                              ),
                                            }
                                          : prev,
                                      )
                                    }
                                    placeholder="Catatan share opsional"
                                    className={inputClassName}
                                    disabled={
                                      !canManageItems ||
                                      isSavingItem ||
                                      !draft.selected
                                    }
                                  />
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                  Participant ini ikut dalam pembagian rata otomatis.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {itemForm.itemId ? (
                      <button
                        type="button"
                        onClick={resetItemForm}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        disabled={isSavingItem}
                      >
                        Reset form
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                      disabled={!canManageItems || isSavingItem}
                    >
                      {isSavingItem ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Menyimpan item...
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          {itemForm.itemId ? 'Update item' : 'Tambah item'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : null}

              {session.items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Belum ada item talangan di session ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {session.items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-bold text-slate-900">
                              {item.title}
                            </p>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-slate-600">
                              {item.splitMode === 'EQUAL' ? 'BAGI RATA' : 'MANUAL'}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <WalletCards size={15} />
                              Dibayar {item.paidByParticipant.displayName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={15} />
                              {formatDate(item.incurredAt)}
                            </span>
                            {item.locationLabel ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={15} />
                                {item.locationLabel}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">
                            {formatGroupExpenseAmount(item.amount, item.currency)}
                          </p>
                          {isOwner ? (
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setItemForm(buildItemFormState(session, item))}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'item',
                                    id: item.id,
                                    label: item.title,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Hapus
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {item.notes?.trim() ? (
                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          {item.notes}
                        </p>
                      ) : null}

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Rincian pembagian
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {buildGroupExpenseShareSummary(item)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Repayments
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Catat pembayaran balik
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Gunakan bagian ini saat ada teman yang sudah mengembalikan uang ke orang yang nombok lebih dulu.
                </p>
              </div>

              {isOwner ? (
                <form
                  onSubmit={handleSaveRepayment}
                  className="mb-6 rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-slate-900">
                        {repaymentForm.repaymentId
                          ? 'Edit repayment'
                          : 'Tambah repayment'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Catat siapa membayar ke siapa agar saldo utang live langsung berkurang.
                      </p>
                    </div>
                    {repaymentForm.repaymentId ? (
                      <button
                        type="button"
                        onClick={resetRepaymentForm}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <XCircle size={16} />
                        Batal edit
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Dari participant
                      </label>
                      <select
                        value={repaymentForm.fromParticipantId}
                        onChange={(event) =>
                          setRepaymentForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  fromParticipantId: event.target.value,
                                }
                              : prev,
                          )
                        }
                        className={inputClassName}
                        disabled={!canManageRepayments || isSavingRepayment}
                      >
                        {session.participants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Ke participant
                      </label>
                      <select
                        value={repaymentForm.toParticipantId}
                        onChange={(event) =>
                          setRepaymentForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  toParticipantId: event.target.value,
                                }
                              : prev,
                          )
                        }
                        className={inputClassName}
                        disabled={!canManageRepayments || isSavingRepayment}
                      >
                        {session.participants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Nominal repayment
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={repaymentForm.amount}
                        onChange={(event) =>
                          setRepaymentForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  amount: formatGroupExpenseInputAmount(
                                    event.target.value,
                                  ),
                                }
                              : prev,
                          )
                        }
                        placeholder="100000"
                        className={inputClassName}
                        disabled={!canManageRepayments || isSavingRepayment}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Waktu repayment
                      </label>
                      <input
                        type="datetime-local"
                        value={repaymentForm.paidAt}
                        onChange={(event) =>
                          setRepaymentForm((prev) =>
                            prev ? { ...prev, paidAt: event.target.value } : prev,
                          )
                        }
                        className={inputClassName}
                        disabled={!canManageRepayments || isSavingRepayment}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Currency
                      </label>
                      <input
                        value={repaymentForm.currency}
                        onChange={(event) =>
                          setRepaymentForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  currency: event.target.value.toUpperCase(),
                                }
                              : prev,
                          )
                        }
                        className={inputClassName}
                        maxLength={10}
                        disabled={!canManageRepayments || isSavingRepayment}
                      />
                    </div>

                    <div className="xl:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-800">
                        Catatan repayment
                      </label>
                      <textarea
                        value={repaymentForm.notes}
                        onChange={(event) =>
                          setRepaymentForm((prev) =>
                            prev ? { ...prev, notes: event.target.value } : prev,
                          )
                        }
                        placeholder="Opsional: transfer ke Kevin untuk bensin, cash balik setelah dinner, dll"
                        className={`${inputClassName} min-h-[88px] resize-none`}
                        disabled={!canManageRepayments || isSavingRepayment}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {repaymentForm.repaymentId ? (
                      <button
                        type="button"
                        onClick={resetRepaymentForm}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        disabled={isSavingRepayment}
                      >
                        Reset form
                      </button>
                    ) : null}
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4176ED] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(65,118,237,0.28)] transition hover:-translate-y-0.5 hover:bg-[#2f63dc] disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                      disabled={!canManageRepayments || isSavingRepayment}
                    >
                      {isSavingRepayment ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Menyimpan repayment...
                        </>
                      ) : (
                        <>
                          <HandCoins size={18} />
                          {repaymentForm.repaymentId
                            ? 'Update repayment'
                            : 'Tambah repayment'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : null}

              {session.repayments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Belum ada repayment yang dicatat di session ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {session.repayments.map((repayment) => (
                    <article
                      key={repayment.id}
                      className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-bold text-slate-900">
                            {repayment.fromParticipant.displayName} bayar ke{' '}
                            {repayment.toParticipant.displayName}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays size={15} />
                              {formatDate(repayment.paidAt)}
                            </span>
                            {repayment.notes?.trim() ? (
                              <span>{repayment.notes}</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">
                            {formatGroupExpenseAmount(
                              repayment.amount,
                              repayment.currency,
                            )}
                          </p>
                          {isOwner ? (
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setRepaymentForm(
                                    buildRepaymentFormState(session, repayment),
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({
                                    type: 'repayment',
                                    id: repayment.id,
                                    label: `${repayment.fromParticipant.displayName} ke ${repayment.toParticipant.displayName}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                <Trash2 size={14} />
                                Hapus
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <DeleteConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => {
            if (!isDeleting) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={() => void handleDeleteTarget()}
          title={
            deleteTarget?.type === 'participant'
              ? 'Hapus Participant'
              : deleteTarget?.type === 'item'
                ? 'Hapus Item Talangan'
                : 'Hapus Repayment'
          }
          message={
            deleteTarget?.type === 'participant'
              ? 'Participant akan dihapus dari session ini jika belum memiliki histori talangan.'
              : deleteTarget?.type === 'item'
                ? 'Item talangan ini akan dihapus dari session dan semua perhitungannya ikut diperbarui.'
                : 'Repayment ini akan dihapus dari histori session dan saldo peserta akan dihitung ulang.'
          }
          itemName={deleteTarget?.label}
          loading={isDeleting}
        />
      </div>
    </div>
  );
}
