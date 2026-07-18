/**
 * Helpers for recurring bill calendar math (local date, month boundaries).
 */

export function startOfMonth(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0, 1);
}

export function endOfMonth(year: number, monthIndex0: number): Date {
  return new Date(year, monthIndex0 + 1, 0);
}

/** Hari ke-`day` di bulan (year, monthIndex0), dipotong ke hari terakhir bulan jika perlu (mis. 31 → Feb). */
export function dueDateInMonth(
  year: number,
  monthIndex0: number,
  dayOfMonth: number
): Date {
  const lastDay = endOfMonth(year, monthIndex0).getDate();
  const day = Math.min(Math.max(dayOfMonth, 1), 31);
  const actual = Math.min(day, lastDay);
  return new Date(year, monthIndex0, actual);
}

export function yearMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(
  year: number,
  monthIndex0: number,
  delta: number
): { year: number; monthIndex0: number } {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { year: d.getFullYear(), monthIndex0: d.getMonth() };
}

export function compareYearMonth(
  a: { year: number; monthIndex0: number },
  b: { year: number; monthIndex0: number }
): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.monthIndex0 - b.monthIndex0;
}
