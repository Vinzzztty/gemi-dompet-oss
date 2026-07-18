import type { BillStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  addMonths,
  compareYearMonth,
  dueDateInMonth,
  startOfMonth,
} from '@/lib/bill-dates';

export type BillReminderBuckets = {
  /** Sudah lewat tenggat, belum dibayar */
  overdue: Awaited<ReturnType<typeof prisma.bill.findMany>>;
  /** Jatuh tempo hari ini s/d `withinDays` ke depan (belum lewat), belum dibayar */
  upcoming: Awaited<ReturnType<typeof prisma.bill.findMany>>;
  /** Jumlah semua tagihan UNPAID (untuk badge/ringkasan) */
  totalUnpaid: number;
};

const billIncludeSeries = {
  series: {
    select: { id: true, name: true, dayOfMonth: true, isActive: true },
  },
  category: {
    select: { id: true, name: true, icon: true, type: true },
  },
} satisfies Prisma.BillInclude;

/**
 * Untuk setiap seri aktif, pastikan ada instance `Bill` per bulan sampai bulan berjalan
 * (mengisi gap jika user lama tidak membuka app).
 *
 * - Seri **tanpa** instance sebelumnya: mulai **bulan depan** (bukan bulan ini), supaya tidak langsung “terlambat”.
 * - Sebelum membuat baris baru: jika sudah ada tagihan user lain di bulan itu dengan nama mengandung nama seri
 *   (pengecekan case-insensitive, perilaku mirip `ILIKE '%nama%'`), lewati bulan itu.
 */
export async function ensureRecurringBillInstancesForUser(userId: string): Promise<void> {
  const seriesList = await prisma.recurringBillSeries.findMany({
    where: { userId, isActive: true },
  });

  const now = new Date();
  const currentYm = { year: now.getFullYear(), monthIndex0: now.getMonth() };

  for (const series of seriesList) {
    const last = await prisma.bill.findFirst({
      where: { seriesId: series.id },
      orderBy: { dueDate: 'desc' },
    });

    let fromYm: { year: number; monthIndex0: number };
    let toYm = currentYm;

    if (!last) {
      /** Template baru: jangan buat tagihan bulan berjalan (sering sudah lewat); mulai bulan depan. */
      fromYm = addMonths(currentYm.year, currentYm.monthIndex0, 1);
    } else {
      const ly = last.dueDate.getFullYear();
      const lm = last.dueDate.getMonth();
      fromYm = addMonths(ly, lm, 1);
    }

    if (compareYearMonth(fromYm, toYm) > 0) {
      continue;
    }

    const namePattern = series.name.trim();
    if (!namePattern) {
      continue;
    }

    let y = fromYm.year;
    let m = fromYm.monthIndex0;

    while (compareYearMonth({ year: y, monthIndex0: m }, toYm) <= 0) {
      const monthStart = startOfMonth(y, m);
      const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);

      const exists = await prisma.bill.findFirst({
        where: {
          seriesId: series.id,
          dueDate: { gte: monthStart, lte: monthEnd },
        },
      });

      if (!exists) {
        /** Hindari bentrok dengan tagihan lain (sekali bayar / seri lain) nama serupa di bulan ini — mirip ILIKE '%nama%' */
        const nameConflict = await prisma.bill.findFirst({
          where: {
            userId,
            dueDate: { gte: monthStart, lte: monthEnd },
            name: { contains: namePattern, mode: 'insensitive' },
          },
        });

        if (!nameConflict) {
          const due = dueDateInMonth(y, m, series.dayOfMonth);
          await prisma.bill.create({
            data: {
              userId,
              seriesId: series.id,
              name: series.name,
              amount: series.amount,
              dueDate: due,
              status: 'UNPAID',
              notes: series.notes,
              ...(series.categoryId ? { categoryId: series.categoryId } : {}),
            },
          });
        }
      }

      const next = addMonths(y, m, 1);
      y = next.year;
      m = next.monthIndex0;
    }
  }
}

/**
 * Reminder dashboard: lewat tenggat, mendekati tenggat (dalam `withinDays`), semua belum bayar (non-masa depan opsional).
 */
export async function getBillReminders(
  userId: string,
  options: { withinDays?: number } = {}
): Promise<BillReminderBuckets> {
  const withinDays = options.withinDays ?? 7;
  await ensureRecurringBillInstancesForUser(userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + withinDays);

  const common = {
    where: {
      userId,
      status: 'UNPAID' as BillStatus,
    },
    include: billIncludeSeries,
    orderBy: { dueDate: 'asc' as const },
  };

  const overdue = await prisma.bill.findMany({
    ...common,
    where: {
      ...common.where,
      dueDate: { lt: today },
    },
  });

  const upcoming = await prisma.bill.findMany({
    ...common,
    where: {
      ...common.where,
      dueDate: { gte: today, lte: horizon },
    },
  });

  const totalUnpaid = await prisma.bill.count({
    where: { userId, status: 'UNPAID' },
  });

  return { overdue, upcoming, totalUnpaid };
}

/** Tagihan sekali bayar / jadwal masa depan: `dueDate` bebas; untuk reminder biasanya filter `dueDate <= horizon`. */
export async function listBillsForUser(
  userId: string,
  filters: {
    status?: BillStatus;
    fromDue?: Date;
    toDue?: Date;
    seriesId?: string | null;
    page?: number;
    limit?: number;
  }
) {
  await ensureRecurringBillInstancesForUser(userId);

  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(Math.max(1, filters.limit ?? 20), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.BillWhereInput = { userId };

  if (filters.status) where.status = filters.status;
  if (filters.seriesId !== undefined) {
    where.seriesId = filters.seriesId === null ? null : filters.seriesId;
  }
  if (filters.fromDue || filters.toDue) {
    where.dueDate = {};
    if (filters.fromDue) where.dueDate.gte = filters.fromDue;
    if (filters.toDue) where.dueDate.lte = filters.toDue;
  }

  const [total, data] = await prisma.$transaction([
    prisma.bill.count({ where }),
    prisma.bill.findMany({
      where,
      include: billIncludeSeries,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
