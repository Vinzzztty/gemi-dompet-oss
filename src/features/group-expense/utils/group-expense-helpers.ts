import { formatCurrency } from '@/utils/format';
import type {
  GroupExpenseItemDto,
  GroupExpenseSessionDto,
  GroupExpenseSessionStatus,
  GroupExpenseSettlementRole,
} from '@/features/group-expense/services/group-expense.service';

export function parseGroupExpenseAmount(
  value: string | number | null | undefined,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatGroupExpenseAmount(
  value: string | number | null | undefined,
  currency = 'IDR',
): string {
  const amount = parseGroupExpenseAmount(value);

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

export function formatGroupExpenseInputAmount(rawValue: string): string {
  const normalized = rawValue.replace(/[^0-9.]/g, '');
  if (!normalized) return '';

  const [integerPart, decimalPart] = normalized.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (decimalPart === undefined) {
    return formattedInteger;
  }

  return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
}

export function parseGroupExpenseInputAmount(rawValue: string): number {
  return Number(rawValue.replace(/,/g, ''));
}

export function getGroupExpenseStatusMeta(status: GroupExpenseSessionStatus) {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Aktif',
        className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      };
    case 'FROZEN':
      return {
        label: 'Dibekukan',
        className: 'bg-amber-100 text-amber-700 border border-amber-200',
      };
    case 'SETTLED':
      return {
        label: 'Selesai',
        className: 'bg-blue-100 text-blue-700 border border-blue-200',
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

export function getGroupExpenseBalanceMeta(role: GroupExpenseSettlementRole) {
  switch (role) {
    case 'RECEIVABLE':
      return {
        label: 'Piutang',
        className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    case 'PAYABLE':
      return {
        label: 'Utang',
        className: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    default:
      return {
        label: 'Imbang',
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
  }
}

export function getGroupExpenseJoinLinkHref(sessionCode: string): string {
  return `/group-expense/join?sessionCode=${encodeURIComponent(sessionCode)}`;
}

export function toDateTimeLocalValue(
  value: string | Date | null | undefined,
): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function getNowDateTimeLocalValue(): string {
  return toDateTimeLocalValue(new Date());
}

export function buildGroupExpenseShareSummary(item: GroupExpenseItemDto): string {
  if (item.shares.length === 0) {
    return 'Belum ada pembagian';
  }

  return item.shares
    .map(
      (share) =>
        `${share.participant.displayName}: ${formatGroupExpenseAmount(share.amount, item.currency)}`,
    )
    .join(' • ');
}

export function getGroupExpenseOutstandingSettlement(
  session: GroupExpenseSessionDto,
): number {
  return session.summary.balances
    .filter((balance) => balance.netBalance > 0)
    .reduce((total, balance) => total + balance.netBalance, 0);
}
