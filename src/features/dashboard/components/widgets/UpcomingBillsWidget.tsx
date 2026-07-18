'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Wifi, Home, Zap, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { billsService, type BillDto } from '@/features/bills/services/bills.service';
import { formatCurrency, formatDate } from '@/utils/format';
import { parseBillAmount } from '@/features/bills/utils/bill-helpers';
import { DeleteConfirmationDialog } from '@/features/dashboard/components/modal/DeleteConfirmationDialog';

const icons = [Wifi, Home, Zap, Receipt];

function pickIcon(index: number) {
  return icons[index % icons.length];
}

function iconColors(index: number): { wrap: string; icon: string } {
  const palettes = [
    { wrap: 'bg-blue-100 text-blue-700', icon: 'text-blue-700' },
    { wrap: 'bg-rose-100 text-rose-600', icon: 'text-rose-600' },
    { wrap: 'bg-amber-100 text-amber-600', icon: 'text-amber-600' },
    { wrap: 'bg-emerald-100 text-emerald-700', icon: 'text-emerald-700' },
  ];
  return palettes[index % palettes.length];
}

function mergeAndSort(overdue: BillDto[], upcoming: BillDto[]): BillDto[] {
  const seen = new Set<string>();
  const merged: BillDto[] = [];
  for (const b of [...overdue, ...upcoming]) {
    if (seen.has(b.id)) continue;
    seen.add(b.id);
    merged.push(b);
  }
  merged.sort(
    (a, b) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  return merged.slice(0, 3);
}

export interface UpcomingBillsWidgetProps {
  refreshSignal: number;
  onBillUpdated?: () => void;
}

export const UpcomingBillsWidget: React.FC<UpcomingBillsWidgetProps> = ({
  refreshSignal,
  onBillUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BillDto[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [confirmPaidId, setConfirmPaidId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billsService.reminders(30);
      if (res.success && res.data) {
        const { overdue, upcoming } = res.data;
        setItems(mergeAndSort(overdue ?? [], upcoming ?? []));
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshSignal]);

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await billsService.patch(id, { status: 'PAID' });
      if (res.success) {
        toast.success('Ditandai lunas');
        await load();
        onBillUpdated?.();
      } else toast.error(res.message || 'Gagal memperbarui');
    } catch (e: any) {
      toast.error(e?.message || 'Gagal memperbarui');
    } finally {
      setMarkingId(null);
    }
  };

  const confirmMarkPaid = () => {
    const id = confirmPaidId;
    setConfirmPaidId(null);
    if (id) void handleMarkPaid(id);
  };

  return (
    <section className="rounded-[20px] bg-[#eef0f8] p-4 sm:p-5 border border-gray-200/60">
      <DeleteConfirmationDialog
        isOpen={confirmPaidId !== null}
        title="Tandai tagihan lunas?"
        message="Nominal akan dicatat sebagai pengeluaran dan saldo diperbarui."
        confirmLabel="Tandai lunas"
        cancelLabel="Batal"
        variant="primary"
        onCancel={() => setConfirmPaidId(null)}
        onConfirm={confirmMarkPaid}
      />
      <div className="flex items-start justify-between gap-2 mb-4">
        <h3 className="text-base font-bold text-gray-900 m-0 leading-tight">
          Tagihan mendatang
        </h3>
        <Link
          href="/bills"
          className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6] hover:underline shrink-0"
        >
          Kelola tagihan
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8 px-2 m-0">
          Tidak ada tagihan yang perlu dibayar segera.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((bill, i) => {
            const Icon = pickIcon(i);
            const colors = iconColors(i);
            return (
              <li
                key={bill.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/80"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colors.wrap}`}
                  >
                    <Icon size={20} className={colors.icon} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate m-0">
                      {bill.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 m-0">
                      Jatuh tempo {formatDate(bill.dueDate)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0 tabular-nums">
                    {formatCurrency(parseBillAmount(bill))}
                  </p>
                </div>
                {bill.status === 'UNPAID' && (
                  <button
                    type="button"
                    disabled={markingId === bill.id}
                    onClick={() => setConfirmPaidId(bill.id)}
                    className="w-full mt-3 rounded-xl bg-blue-50 text-[#3b82f6] text-sm font-semibold py-2.5 hover:bg-blue-100 transition-colors disabled:opacity-60"
                  >
                    {markingId === bill.id ? 'Menyimpan…' : 'Tandai lunas'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
