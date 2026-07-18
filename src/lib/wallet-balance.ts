import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaClient;

export type WalletBalanceDelta = {
  walletId: string;
  delta: number;
};

type LockedWalletRow = {
  id: string;
  nama_dompet: string;
};

const OTHERS_WALLET_NAME = 'Others';

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  return Number(value ?? 0);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 2,
  }).format(value);
}

export class WalletAccessError extends Error {
  constructor(walletId: string) {
    super(`Dompet tidak ditemukan atau bukan milik pengguna: ${walletId}`);
    this.name = 'WalletAccessError';
  }
}

export class WalletBalanceValidationError extends Error {
  constructor(
    public readonly walletId: string,
    public readonly walletName: string,
    public readonly balanceBefore: number,
    public readonly balanceAfter: number,
  ) {
    super(
      `Saldo dompet "${walletName}" tidak cukup. Saldo saat ini ${formatCurrency(
        balanceBefore,
      )} dan setelah transaksi akan menjadi ${formatCurrency(balanceAfter)}.`,
    );
    this.name = 'WalletBalanceValidationError';
  }
}

export async function getOrCreateOthersWallet(
  tx: DbClient,
  userId: string,
): Promise<{ id: string; namaDompet: string; norek: string | null }> {
  let wallet = await tx.wallet.findFirst({
    where: {
      userId,
      namaDompet: OTHERS_WALLET_NAME,
    },
    select: {
      id: true,
      namaDompet: true,
      norek: true,
    },
  });

  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        userId,
        namaDompet: OTHERS_WALLET_NAME,
        norek: null,
      },
      select: {
        id: true,
        namaDompet: true,
        norek: true,
      },
    });
  }

  return wallet;
}

async function getWalletBalanceMap(
  tx: DbClient,
  userId: string,
  walletIds: string[],
): Promise<Map<string, number>> {
  const [incomeByWallet, expenseByWallet, outgoingTransfersByWallet, incomingTransfersByWallet] =
    await Promise.all([
      tx.incomeTransaction.groupBy({
        by: ['walletId'],
        where: {
          userId,
          walletId: { in: walletIds },
        },
        _sum: { nominal: true },
      }),
      tx.expenseTransaction.groupBy({
        by: ['walletId'],
        where: {
          userId,
          walletId: { in: walletIds },
        },
        _sum: { nominal: true },
      }),
      tx.transferTransaction.groupBy({
        by: ['fromWalletId'],
        where: {
          userId,
          fromWalletId: { in: walletIds },
        },
        _sum: { amount: true },
      }),
      tx.transferTransaction.groupBy({
        by: ['toWalletId'],
        where: {
          userId,
          toWalletId: { in: walletIds },
        },
        _sum: { amount: true },
      }),
    ]);

  const balanceMap = new Map<string, number>();

  for (const walletId of walletIds) {
    const income = toNumber(
      incomeByWallet.find((row) => row.walletId === walletId)?._sum.nominal,
    );
    const expense = toNumber(
      expenseByWallet.find((row) => row.walletId === walletId)?._sum.nominal,
    );
    const outgoing = toNumber(
      outgoingTransfersByWallet.find((row) => row.fromWalletId === walletId)?._sum.amount,
    );
    const incoming = toNumber(
      incomingTransfersByWallet.find((row) => row.toWalletId === walletId)?._sum.amount,
    );

    balanceMap.set(walletId, roundCurrency(income - expense - outgoing + incoming));
  }

  return balanceMap;
}

export async function assertWalletBalanceDeltas(
  tx: DbClient,
  userId: string,
  deltas: WalletBalanceDelta[],
): Promise<void> {
  const mergedDeltas = new Map<string, number>();

  for (const entry of deltas) {
    if (!entry.walletId) continue;
    mergedDeltas.set(
      entry.walletId,
      roundCurrency((mergedDeltas.get(entry.walletId) ?? 0) + entry.delta),
    );
  }

  if (mergedDeltas.size === 0) {
    return;
  }

  const walletIds = [...mergedDeltas.keys()].sort();

  const lockedWallets = await tx.$queryRaw<LockedWalletRow[]>(Prisma.sql`
    SELECT id, nama_dompet
    FROM wallet
    WHERE user_id = ${userId}
      AND id IN (${Prisma.join(walletIds)})
    ORDER BY id
    FOR UPDATE
  `);

  if (lockedWallets.length !== walletIds.length) {
    const lockedIds = new Set(lockedWallets.map((wallet) => wallet.id));
    const missingWalletId = walletIds.find((walletId) => !lockedIds.has(walletId));
    throw new WalletAccessError(missingWalletId ?? walletIds[0]);
  }

  const currentBalanceMap = await getWalletBalanceMap(tx, userId, walletIds);

  for (const wallet of lockedWallets) {
    const balanceBefore = currentBalanceMap.get(wallet.id) ?? 0;
    const delta = mergedDeltas.get(wallet.id) ?? 0;
    const balanceAfter = roundCurrency(balanceBefore + delta);

    if (balanceAfter < 0) {
      throw new WalletBalanceValidationError(
        wallet.id,
        wallet.nama_dompet,
        balanceBefore,
        balanceAfter,
      );
    }
  }
}
