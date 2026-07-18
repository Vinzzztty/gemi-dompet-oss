import type { BillDto } from '@/features/bills/services/bills.service';

export function parseBillAmount(b: BillDto): number {
  const n = typeof b.amount === 'string' ? parseFloat(b.amount) : Number(b.amount);
  return Number.isFinite(n) ? n : 0;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function billDueDate(b: BillDto): Date {
  return stripTime(new Date(b.dueDate));
}

export function isBillOverdue(b: BillDto): boolean {
  if (b.status === 'PAID') return false;
  const due = billDueDate(b);
  const today = stripTime(new Date());
  return due < today;
}

export function isBillUpcomingUnpaid(b: BillDto): boolean {
  if (b.status === 'PAID') return false;
  const due = billDueDate(b);
  const today = stripTime(new Date());
  return due >= today;
}

export type BillTab = 'upcoming' | 'paid' | 'overdue';

/**
 * Tagihan lunas yang pembayarannya jatuh di bulan kalender `ref`
 * (pakai `paidAt` dari sinkronisasi pengeluaran; jika null, fallback `dueDate` untuk data lama).
 */
export function isBillPaidInMonth(b: BillDto, ref: Date): boolean {
  if (b.status !== 'PAID') return false;
  const { start, end } = startEndOfMonth(ref);
  const paymentDay = b.paidAt
    ? stripTime(new Date(b.paidAt))
    : stripTime(new Date(b.dueDate));
  return paymentDay >= start && paymentDay <= end;
}

export function billMatchesTab(
  b: BillDto,
  tab: BillTab,
  monthRef: Date = new Date()
): boolean {
  if (tab === 'paid') return isBillPaidInMonth(b, monthRef);
  if (tab === 'overdue') return b.status === 'UNPAID' && isBillOverdue(b);
  return b.status === 'UNPAID' && isBillUpcomingUnpaid(b);
}

export function dueDateLabel(b: BillDto): string {
  const due = billDueDate(b);
  const today = stripTime(new Date());
  const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  const monthly = b.seriesId ? ' • Bulanan' : '';

  if (b.status === 'PAID') {
    return `Lunas${monthly}`;
  }
  if (diffDays < 0) {
    const n = Math.abs(diffDays);
    return `Jatuh tempo ${n} hari lalu${monthly}`;
  }
  if (diffDays === 0) {
    return `Jatuh tempo hari ini${monthly}`;
  }
  if (diffDays === 1) {
    return `Besok${monthly}`;
  }
  return `Jatuh tempo dalam ${diffDays} hari${monthly}`;
}

export function startEndOfMonth(ref: Date): { start: Date; end: Date } {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}
