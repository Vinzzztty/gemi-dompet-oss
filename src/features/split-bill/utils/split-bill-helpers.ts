import { formatCurrency } from '@/utils/format';
import type {
  SplitBillSessionDto,
  SplitBillSessionStatus,
} from '@/features/split-bill/services/split-bill.service';

export function parseSplitBillAmount(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatSplitBillAmount(
  value: string | number | null | undefined,
  currency = 'IDR',
): string {
  const amount = parseSplitBillAmount(value);

  if (currency === 'IDR') {
    return formatCurrency(amount);
  }

  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${new Intl.NumberFormat('id-ID').format(amount)}`;
  }
}

export function getSplitBillStatusMeta(status: SplitBillSessionStatus) {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Aktif',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      };
    case 'CLOSED':
      return {
        label: 'Ditutup',
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
      };
    case 'ARCHIVED':
      return {
        label: 'Arsip',
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
  }
}

export function getShareAmountForParticipant(
  session: SplitBillSessionDto,
  participantId: string,
): number {
  const share = session.shares.find(
    (item) => item.participantId === participantId,
  );

  return parseSplitBillAmount(share?.amount);
}

export function getAssignedTotal(session: SplitBillSessionDto): number {
  return session.shares.reduce(
    (total, share) => total + parseSplitBillAmount(share.amount),
    0,
  );
}

export function getJoinLinkHref(sessionCode: string): string {
  return `/split-bill/join?sessionCode=${encodeURIComponent(sessionCode)}`;
}
