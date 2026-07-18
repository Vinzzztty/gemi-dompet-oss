import type { Bill, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  assertWalletBalanceDeltas,
  getOrCreateOthersWallet,
} from '@/lib/wallet-balance';

export type BillFieldSnapshot = {
  name: string;
  amount: Bill['amount'];
  dueDate: Date;
  notes: string | null;
  categoryId: string | null;
};

export function mergeBillSnapshot(
  existing: Bill,
  body: {
    name?: string;
    amount?: string | number;
    dueDate?: string;
    notes?: string | null;
    categoryId?: string | null;
  }
): BillFieldSnapshot {
  return {
    name:
      body.name !== undefined ? String(body.name).trim() : existing.name,
    amount:
      body.amount !== undefined
        ? (Number(body.amount) as unknown as Bill['amount'])
        : existing.amount,
    dueDate:
      body.dueDate !== undefined
        ? new Date(body.dueDate)
        : existing.dueDate,
    notes:
      body.notes !== undefined
        ? body.notes?.trim()
          ? String(body.notes).trim()
          : null
        : existing.notes,
    categoryId:
      body.categoryId !== undefined
        ? body.categoryId || null
        : existing.categoryId ?? null,
  };
}

/** Update relasi kategori tagihan (EXPENSE) dari snapshot */
export function billCategoryUpdateData(
  snapshot: BillFieldSnapshot
): Pick<Prisma.BillUpdateInput, 'category'> {
  return {
    category: snapshot.categoryId
      ? { connect: { id: snapshot.categoryId } }
      : { disconnect: true },
  };
}

const TAGIHAN_CATEGORY_NAME = 'Tagihan';
async function getOrCreateTagihanCategoryId(userId: string): Promise<string> {
  const found = await prisma.category.findFirst({
    where: { userId, type: 'EXPENSE', name: TAGIHAN_CATEGORY_NAME },
  });
  if (found) return found.id;
  const created = await prisma.category.create({
    data: {
      userId,
      name: TAGIHAN_CATEGORY_NAME,
      type: 'EXPENSE',
      icon: 'wallet',
    },
  });
  return created.id;
}

/**
 * Tandai lunas + buat pengeluaran (dompet "Others") + hubungkan ke tagihan.
 * Hanya untuk transisi ke PAID saat belum ada `expenseTransactionId`.
 */
export async function markBillPaidWithExpense(
  userId: string,
  billId: string,
  snapshot: BillFieldSnapshot,
  include: Prisma.BillInclude
) {
  const existing = await prisma.bill.findFirst({ where: { id: billId, userId } });
  if (!existing) return null;
  if (existing.expenseTransactionId) {
    return null;
  }

  const categoryId =
    snapshot.categoryId ?? (await getOrCreateTagihanCategoryId(userId));
  const now = new Date();
  const tanggal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const catatan = snapshot.notes?.trim()
    ? `Tagihan: ${snapshot.notes.trim()}`
    : `Pembayaran tagihan: ${snapshot.name}`;

  return prisma.$transaction(async (tx) => {
    const othersWallet = await getOrCreateOthersWallet(tx, userId);

    await assertWalletBalanceDeltas(tx, userId, [
      { walletId: othersWallet.id, delta: -Number(snapshot.amount) },
    ]);

    const expense = await tx.expenseTransaction.create({
      data: {
        userId,
        nama: snapshot.name,
        nominal: snapshot.amount,
        categoryId,
        tanggal,
        catatan,
        walletId: othersWallet.id,
      },
    });
    return tx.bill.update({
      where: { id: billId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        expenseTransaction: { connect: { id: expense.id } },
        name: snapshot.name,
        amount: snapshot.amount,
        dueDate: snapshot.dueDate,
        notes: snapshot.notes,
        ...billCategoryUpdateData(snapshot),
      },
      include,
    });
  });
}

/**
 * Tandai belum bayar + hapus pengeluaran terkait (saldo dompet ikut kembali).
 */
export async function markBillUnpaidRemoveExpense(
  userId: string,
  billId: string,
  snapshot: BillFieldSnapshot,
  include: Prisma.BillInclude
) {
  const existing = await prisma.bill.findFirst({ where: { id: billId, userId } });
  if (!existing) return null;

  const baseData: Prisma.BillUpdateInput = {
    status: 'UNPAID',
    paidAt: null,
    name: snapshot.name,
    amount: snapshot.amount,
    dueDate: snapshot.dueDate,
    notes: snapshot.notes,
    ...billCategoryUpdateData(snapshot),
  };

  if (!existing.expenseTransactionId) {
    return prisma.bill.update({
      where: { id: billId },
      data: baseData,
      include,
    });
  }

  const exp = await prisma.expenseTransaction.findFirst({
    where: { id: existing.expenseTransactionId, userId },
  });

  if (!exp) {
    return prisma.bill.update({
      where: { id: billId },
      data: {
        ...baseData,
        expenseTransaction: { disconnect: true },
      },
      include,
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.expenseTransaction.delete({ where: { id: exp.id } });
    return tx.bill.update({
      where: { id: billId },
      data: baseData,
      include,
    });
  });
}
