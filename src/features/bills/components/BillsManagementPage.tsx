'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Receipt,
  Zap,
  CalendarClock,
  Pencil,
  Trash2,
  Lightbulb,
  Loader2,
  RefreshCw,
  Shield,
  Home,
  Dumbbell,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/features/dashboard';
import { AuthGuard } from '@/features/auth/components';
import {
  billsService,
  type BillDto,
  type RecurringSeriesDto,
} from '@/features/bills/services/bills.service';
import { formatCurrency } from '@/utils/format';
import {
  billMatchesTab,
  dueDateLabel,
  isBillOverdue,
  isBillPaidInMonth,
  parseBillAmount,
  startEndOfMonth,
  type BillTab,
} from '@/features/bills/utils/bill-helpers';
import { AddBillModal } from './AddBillModal';
import { AddRecurringSeriesModal } from './AddRecurringSeriesModal';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';

const iconForBill = (b: BillDto, overdue: boolean) => {
  if (overdue) return Zap;
  if (b.seriesId) return CalendarClock;
  return Receipt;
};

const iconForSeries = (index: number) => {
  const icons = [Shield, Home, Dumbbell, Receipt];
  return icons[index % icons.length];
};

export function BillsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<BillDto[]>([]);
  const [series, setSeries] = useState<RecurringSeriesDto[]>([]);
  const [tab, setTab] = useState<BillTab>('upcoming');

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billModalMode, setBillModalMode] = useState<'create' | 'edit'>('create');
  const [editingBill, setEditingBill] = useState<BillDto | null>(null);

  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [recurringMode, setRecurringMode] = useState<'create' | 'edit'>('create');
  const [editingSeries, setEditingSeries] = useState<RecurringSeriesDto | null>(null);

  const [deleteBillId, setDeleteBillId] = useState<string | null>(null);
  const [deleteSeriesId, setDeleteSeriesId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, seriesRes] = await Promise.all([
        billsService.list({ page: 1, limit: 500 }),
        billsService.listRecurringSeries(),
      ]);
      if (listRes.success && listRes.data) setBills(listRes.data);
      else setBills([]);
      if (seriesRes.success && seriesRes.data) setSeries(seriesRes.data);
      else setSeries([]);
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memuat tagihan');
      setBills([]);
      setSeries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const stats = useMemo(() => {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = startEndOfMonth(now);
    let dueThisMonthUnpaid = 0;
    let dueThisMonthUnpaidCount = 0;
    let paidThisMonth = 0;
    let paidThisMonthCount = 0;
    let overdueTotal = 0;
    let overdueCount = 0;

    for (const b of bills) {
      const amt = parseBillAmount(b);
      const due = new Date(b.dueDate);
      const inMonth =
        due >= monthStart && due <= monthEnd;

      if (b.status === 'UNPAID' && isBillOverdue(b)) {
        overdueTotal += amt;
        overdueCount += 1;
      }

      if (b.status === 'UNPAID' && inMonth) {
        dueThisMonthUnpaid += amt;
        dueThisMonthUnpaidCount += 1;
      }

      if (isBillPaidInMonth(b, now)) {
        paidThisMonth += amt;
        paidThisMonthCount += 1;
      }
    }

    return {
      dueThisMonthUnpaid,
      dueThisMonthUnpaidCount,
      paidThisMonth,
      paidThisMonthCount,
      overdueTotal,
      overdueCount,
    };
  }, [bills]);

  const filteredBills = useMemo(() => {
    const now = new Date();
    return bills.filter((b) => billMatchesTab(b, tab, now));
  }, [bills, tab]);

  const sortedFiltered = useMemo(() => {
    const copy = [...filteredBills];
    copy.sort((a, b) => {
      const da = new Date(a.dueDate).getTime();
      const db = new Date(b.dueDate).getTime();
      if (tab === 'paid') return db - da;
      return da - db;
    });
    return copy;
  }, [filteredBills, tab]);

  const togglePaid = async (b: BillDto) => {
    const next = b.status === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      const res = await billsService.patch(b.id, { status: next });
      if (res.success) {
        toast.success(next === 'PAID' ? 'Ditandai lunas' : 'Ditandai belum bayar');
        await loadAll();
      } else toast.error(res.message || 'Gagal memperbarui');
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memperbarui');
    }
  };

  const openCreateBill = () => {
    setBillModalMode('create');
    setEditingBill(null);
    setBillModalOpen(true);
  };

  const openEditBill = (b: BillDto) => {
    setBillModalMode('edit');
    setEditingBill(b);
    setBillModalOpen(true);
  };

  const handleBillSubmit = async (payload: {
    name: string;
    amount: number;
    dueDate: string;
    categoryId: string;
    notes: string | null;
  }) => {
    try {
      if (billModalMode === 'create') {
        const res = await billsService.createOneTime(payload);
        if (res.success) {
          toast.success('Tagihan ditambahkan');
          await loadAll();
        } else toast.error(res.message || 'Gagal menambah');
      } else if (editingBill) {
        const res = await billsService.update(editingBill.id, {
          name: payload.name,
          amount: payload.amount,
          dueDate: payload.dueDate,
          categoryId: payload.categoryId,
          notes: payload.notes,
        });
        if (res.success) {
          toast.success('Tagihan diperbarui');
          await loadAll();
        } else toast.error(res.message || 'Gagal menyimpan');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menyimpan');
      throw e;
    }
  };

  const openCreateRecurring = () => {
    setRecurringMode('create');
    setEditingSeries(null);
    setRecurringModalOpen(true);
  };

  const openEditRecurring = (s: RecurringSeriesDto) => {
    setRecurringMode('edit');
    setEditingSeries(s);
    setRecurringModalOpen(true);
  };

  const handleRecurringSubmit = async (payload: {
    name: string;
    amount: number;
    dayOfMonth: number;
    categoryId: string;
    notes: string | null;
    isActive: boolean;
  }) => {
    try {
      if (recurringMode === 'create') {
        const res = await billsService.createRecurringSeries(payload);
        if (res.success) {
          toast.success('Tagihan bulanan dibuat');
          await loadAll();
        } else toast.error(res.message || 'Gagal menambah');
      } else if (editingSeries) {
        const res = await billsService.updateRecurringSeries(editingSeries.id, {
          name: payload.name,
          amount: payload.amount,
          dayOfMonth: payload.dayOfMonth,
          categoryId: payload.categoryId,
          notes: payload.notes,
          isActive: payload.isActive,
        });
        if (res.success) {
          toast.success('Tagihan bulanan diperbarui');
          await loadAll();
        } else toast.error(res.message || 'Gagal menyimpan');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menyimpan');
      throw e;
    }
  };

  const confirmDeleteBill = async () => {
    if (!deleteBillId) return;
    setDeleting(true);
    try {
      const res = await billsService.delete(deleteBillId);
      if (res.success !== false) {
        toast.success('Tagihan dihapus');
        setDeleteBillId(null);
        await loadAll();
      } else toast.error('Gagal menghapus');
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteSeries = async () => {
    if (!deleteSeriesId) return;
    setDeleting(true);
    try {
      const res = await billsService.deleteRecurringSeries(deleteSeriesId);
      if (res.success !== false) {
        toast.success('Seri tagihan dihapus');
        setDeleteSeriesId(null);
        await loadAll();
      } else toast.error('Gagal menghapus');
    } catch (e: any) {
      toast.error(e?.message || 'Gagal menghapus');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="animate-in fade-in zoom-in-95 duration-300 pb-8">
        <Header />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50"
              aria-label="Kembali"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                Ringkasan
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Manajemen Tagihan
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreateBill}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3b82f6] text-white font-semibold py-3 px-6 shadow-md shadow-blue-500/20 hover:bg-[#2563eb] active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus size={20} />
            Tagihan baru
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-sm">Memuat data…</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-gray-100 shadow-sm min-h-[140px] flex flex-col justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Jatuh tempo bulan ini
                </span>
                <div className="mt-3">
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(stats.dueThisMonthUnpaid)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stats.dueThisMonthUnpaidCount} tagihan belum lunas
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-emerald-100 bg-emerald-50/50 min-h-[140px] flex flex-col justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                  Sudah dibayar (bulan ini)
                </span>
                <div className="mt-3">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-700 tracking-tight">
                    {formatCurrency(stats.paidThisMonth)}
                  </p>
                  <p className="text-sm text-emerald-700/80 mt-1">
                    {stats.paidThisMonthCount} tagihan lunas
                  </p>
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 rounded-[20px] border border-rose-100 bg-rose-50/40 min-h-[140px] flex flex-col justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-700">
                  Terlambat
                </span>
                <div className="mt-3">
                  <p className="text-2xl md:text-3xl font-bold text-rose-700 tracking-tight">
                    {formatCurrency(stats.overdueTotal)}
                  </p>
                  <p className="text-sm text-rose-700/80 mt-1">
                    {stats.overdueCount} perlu perhatian
                  </p>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              <div className="lg:col-span-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
                  <div className="flex gap-4 sm:gap-8">
                    {(
                      [
                        ['upcoming', 'Mendatang'],
                        ['paid', 'Lunas bulan ini'],
                        ['overdue', 'Terlambat'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTab(key)}
                        className={`pb-3 -mb-px text-sm font-semibold border-b-2 transition-colors ${
                          tab === key
                            ? 'border-[#3b82f6] text-[#3b82f6]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => loadAll()}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 self-end sm:self-auto"
                  >
                    <RefreshCw size={16} />
                    Muat ulang
                  </button>
                </div>

                {sortedFiltered.length === 0 ? (
                  <div className="bg-gray-50 rounded-[20px] p-12 md:p-16 flex flex-col items-center text-center border border-dashed border-gray-200">
                    <Receipt className="w-14 h-14 text-gray-300 mb-4" strokeWidth={1.25} />
                    <h3 className="text-lg font-bold text-gray-900">Belum ada tagihan</h3>
                    <p className="text-gray-500 mt-2 max-w-sm text-sm">
                      {tab === 'upcoming' &&
                        'Tidak ada tagihan mendatang. Tambahkan tagihan baru atau aktifkan tagihan bulanan.'}
                      {tab === 'paid' &&
                        'Belum ada pembayaran tagihan tercatat di bulan ini.'}
                      {tab === 'overdue' && 'Tidak ada tagihan terlambat. Bagus!'}
                    </p>
                    <button
                      type="button"
                      onClick={openCreateBill}
                      className="mt-6 rounded-full bg-[#3b82f6] text-white text-sm font-semibold px-6 py-2.5 hover:bg-[#2563eb]"
                    >
                      Tambah tagihan
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {sortedFiltered.map((b) => {
                      const overdue = b.status === 'UNPAID' && isBillOverdue(b);
                      const Icon = iconForBill(b, overdue);
                      return (
                        <li
                          key={b.id}
                          className={`bg-white p-5 md:p-6 rounded-[20px] border flex flex-col md:flex-row md:items-center gap-4 md:gap-6 shadow-sm transition-shadow hover:shadow-md group ${
                            overdue
                              ? 'border-rose-200'
                              : 'border-gray-100'
                          }`}
                        >
                          <div
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 ${
                              overdue
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-blue-50 text-[#3b82f6]'
                            }`}
                          >
                            <Icon size={22} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-gray-900 truncate">
                                {b.name}
                              </h3>
                              {overdue && (
                                <span className="text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                  Terlambat
                                </span>
                              )}
                              {!overdue && b.status === 'UNPAID' && (
                                <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  Mendatang
                                </span>
                              )}
                              {b.status === 'PAID' && (
                                <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                  Lunas
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {b.category?.name ? (
                                <>
                                  <span className="font-medium text-gray-600">
                                    {b.category.name}
                                  </span>
                                  <span className="text-gray-400"> · </span>
                                </>
                              ) : null}
                              {dueDateLabel(b)}
                            </p>
                          </div>
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:text-right gap-3 md:border-l md:border-gray-100 md:pl-6 w-full md:w-auto">
                            <p
                              className={`text-lg font-bold ${
                                overdue ? 'text-rose-700' : 'text-gray-900'
                              }`}
                            >
                              {formatCurrency(parseBillAmount(b))}
                            </p>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditBill(b)}
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
                                aria-label="Edit"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteBillId(b.id)}
                                className="p-2 rounded-full text-rose-500 hover:bg-rose-50"
                                aria-label="Hapus"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-end md:justify-center md:pl-2">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={b.status === 'PAID'}
                              onClick={() => togglePaid(b)}
                              className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
                                b.status === 'PAID'
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-gray-300 hover:border-[#3b82f6]'
                              }`}
                            >
                              {b.status === 'PAID' ? (
                                <span className="text-xs font-bold">✓</span>
                              ) : null}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-[20px] border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Tagihan bulanan</h2>
                    <button
                      type="button"
                      onClick={openCreateRecurring}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100"
                    >
                      + Tambah
                    </button>
                  </div>
                  {series.length === 0 ? (
                    <p className="text-sm text-gray-500 mb-4">
                      Belum ada template bulanan. Tambahkan agar tagihan ter-generate otomatis.
                    </p>
                  ) : (
                    <ul className="space-y-5">
                      {series.map((s, i) => {
                        const Icon = iconForSeries(i);
                        return (
                          <li key={s.id} className="flex gap-3">
                            <div className="p-2 rounded-full bg-gray-50 text-[#3b82f6] shrink-0 h-fit">
                              <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {s.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {s.category?.name ? (
                                  <>
                                    <span className="font-medium text-gray-600">
                                      {s.category.name}
                                    </span>
                                    <span className="text-gray-400"> · </span>
                                  </>
                                ) : null}
                                {formatCurrency(parseSeriesAmount(s.amount))} • tanggal{' '}
                                {s.dayOfMonth} tiap bulan
                              </p>
                              <div className="flex gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={() => openEditRecurring(s)}
                                  className="text-xs font-semibold text-[#3b82f6] hover:underline"
                                >
                                  Ubah
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteSeriesId(s.id)}
                                  className="text-xs font-semibold text-rose-600 hover:underline"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={openCreateRecurring}
                    className="w-full mt-6 py-3 rounded-full border border-[#3b82f6]/25 text-[#3b82f6] font-semibold text-sm hover:bg-[#3b82f6] hover:text-white transition-colors"
                  >
                    Kelola tagihan bulanan
                  </button>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-6 md:p-8 rounded-[20px] text-white shadow-lg shadow-blue-500/25">
                  <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-2">Tips hemat</h3>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      Tandai tagihan lunas setelah transfer supaya ringkasan bulanan akurat. Atur
                      tagihan bulanan agar jatuh tempo mengikuti gajian.
                    </p>
                    <Link
                      href="/"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold border-b border-blue-200 text-white hover:text-blue-100"
                    >
                      Ke beranda
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                  <Lightbulb
                    className="absolute -right-2 -bottom-2 opacity-[0.12] w-28 h-28"
                    strokeWidth={1}
                  />
                </div>
              </aside>
            </div>
          </>
        )}

        <AddBillModal
          open={billModalOpen}
          onOpenChange={setBillModalOpen}
          mode={billModalMode}
          initial={editingBill}
          onSubmit={handleBillSubmit}
        />

        <AddRecurringSeriesModal
          open={recurringModalOpen}
          onOpenChange={setRecurringModalOpen}
          mode={recurringMode}
          initial={editingSeries}
          onSubmit={handleRecurringSubmit}
        />

        <DeleteConfirmDialog
          isOpen={!!deleteBillId}
          onClose={() => !deleting && setDeleteBillId(null)}
          onConfirm={confirmDeleteBill}
          title="Hapus tagihan?"
          message="Tagihan ini akan dihapus permanen dari daftar."
          loading={deleting}
        />

        <DeleteConfirmDialog
          isOpen={!!deleteSeriesId}
          onClose={() => !deleting && setDeleteSeriesId(null)}
          onConfirm={confirmDeleteSeries}
          title="Hapus tagihan bulanan?"
          message="Semua instance tagihan yang terhubung ke seri ini juga akan ikut terhapus."
          loading={deleting}
        />
      </div>
    </AuthGuard>
  );
}

function parseSeriesAmount(a: string | number): number {
  const n = typeof a === 'string' ? parseFloat(a) : Number(a);
  return Number.isFinite(n) ? n : 0;
}
