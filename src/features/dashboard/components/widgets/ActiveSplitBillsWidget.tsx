'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Loader2, ReceiptText, Users, WalletCards } from 'lucide-react';
import {
  groupExpenseService,
  type GroupExpenseSessionDto,
} from '@/features/group-expense/services/group-expense.service';
import {
  formatGroupExpenseAmount,
  getGroupExpenseOutstandingSettlement,
  getGroupExpenseStatusMeta,
} from '@/features/group-expense/utils/group-expense-helpers';
import { formatDate } from '@/utils/format';

export interface ActiveSplitBillsWidgetProps {
  refreshSignal?: number;
}

export const ActiveSplitBillsWidget: React.FC<ActiveSplitBillsWidgetProps> = ({
  refreshSignal = 0,
}) => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<GroupExpenseSessionDto[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupExpenseService.listOwnedSessions();
      if (res.success && res.data) {
        const activeSessions = res.data
          .filter((session) => session.status === 'ACTIVE')
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 3);

        setItems(activeSessions);
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
    void load();
  }, [load, refreshSignal]);

  return (
    <section className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="m-0 text-base font-bold leading-tight text-gray-900">
            Split bill aktif
          </h3>
          <p className="m-0 mt-1 text-xs text-gray-500">
            Session talangan yang masih berjalan
          </p>
        </div>
        <Link
          href="/group-expense"
          className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#3b82f6] hover:underline"
        >
          Kelola split bill
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : items.length === 0 ? (
        <p className="m-0 px-2 py-8 text-center text-sm text-gray-500">
          Belum ada session talangan yang aktif.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((session) => {
            const status = getGroupExpenseStatusMeta(session.status);

            return (
              <li
                key={session.id}
                className="rounded-2xl border border-blue-100/80 bg-[#f8faff] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#3b82f6]">
                    <WalletCards size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="m-0 truncate text-sm font-bold text-gray-900">
                        {session.title}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-xs text-gray-500">
                      {session.sessionCode}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} />
                        {session.summary.participantCount} participant
                      </span>
                      <span>{formatDate(session.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-blue-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Talangan
                    </p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {formatGroupExpenseAmount(
                        session.summary.totalExpenses,
                        session.currency,
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                      Piutang berjalan
                    </p>
                    <p className="mt-2 text-lg font-bold text-gray-900">
                      {formatGroupExpenseAmount(
                        getGroupExpenseOutstandingSettlement(session),
                        session.currency,
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <ReceiptText size={14} />
                    {session.summary.activeItemCount} item aktif
                  </span>
                  <span>
                    Repayment{' '}
                    {formatGroupExpenseAmount(
                      session.summary.totalRepayments,
                      session.currency,
                    )}
                  </span>
                </div>

                <Link
                  href={`/group-expense/session/${encodeURIComponent(session.sessionCode)}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white py-2.5 text-sm font-semibold text-[#3b82f6] transition-colors hover:bg-blue-50"
                >
                  Buka session
                  <ArrowUpRight size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
