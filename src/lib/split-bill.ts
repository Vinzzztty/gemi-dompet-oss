import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaClient;

const SESSION_CODE_PREFIX = 'SPLIT_BILL';
const RANDOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_TITLE_SEGMENT_LENGTH = 16;

export class SplitBillValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SplitBillValidationError';
  }
}

export type SplitBillShareInput = {
  participantId: string;
  amount: number;
  notes?: string | null;
};

export function formatSplitBillTitleSegment(title: string): string {
  const normalized = title
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  return (normalized || 'SESSION').slice(0, MAX_TITLE_SEGMENT_LENGTH);
}

export function generateRandomSessionSuffix(length = 16): string {
  return Array.from(crypto.randomBytes(length))
    .map((byte) => RANDOM_ALPHABET[byte % RANDOM_ALPHABET.length])
    .join('');
}

export function generateSplitBillSessionCode(
  title: string,
  now = new Date(),
  suffix = generateRandomSessionSuffix(),
): string {
  const year = now.getFullYear();
  const titleSegment = formatSplitBillTitleSegment(title);
  return `${SESSION_CODE_PREFIX}_${titleSegment}_${year}_${suffix}`;
}

export function normalizeSplitBillSessionCode(sessionCode: string): string {
  return sessionCode.trim().toUpperCase();
}

export async function createUniqueSplitBillSessionCode(
  tx: DbClient,
  title: string,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const sessionCode = generateSplitBillSessionCode(title);
    const existing = await tx.splitBillSession.findUnique({
      where: { sessionCode },
      select: { id: true },
    });

    if (!existing) {
      return sessionCode;
    }
  }

  throw new SplitBillValidationError(
    'Gagal membuat session code unik. Silakan coba lagi.',
  );
}

export function normalizeAmountToCents(amount: number | string | Prisma.Decimal): number {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    throw new SplitBillValidationError('Nominal tidak valid.');
  }

  return Math.round(numeric * 100);
}

export function centsToAmount(cents: number): number {
  return cents / 100;
}

export function buildEqualSplitShares(
  totalAmount: number | string | Prisma.Decimal,
  participantIds: string[],
): SplitBillShareInput[] {
  if (participantIds.length === 0) {
    throw new SplitBillValidationError(
      'Minimal harus ada satu participant untuk membagi tagihan.',
    );
  }

  const totalCents = normalizeAmountToCents(totalAmount);
  const baseCents = Math.floor(totalCents / participantIds.length);
  const remainder = totalCents % participantIds.length;

  return participantIds.map((participantId, index) => ({
    participantId,
    amount: centsToAmount(baseCents + (index < remainder ? 1 : 0)),
    notes: null,
  }));
}

export function validateManualSplitShares(
  totalAmount: number | string | Prisma.Decimal,
  participantIds: string[],
  shares: SplitBillShareInput[],
): SplitBillShareInput[] {
  if (!Array.isArray(shares) || shares.length === 0) {
    throw new SplitBillValidationError('Daftar share manual harus diisi.');
  }

  const participantIdSet = new Set(participantIds);
  const seen = new Set<string>();
  let totalShareCents = 0;

  for (const share of shares) {
    if (!participantIdSet.has(share.participantId)) {
      throw new SplitBillValidationError(
        'Terdapat participant yang tidak valid di daftar share manual.',
      );
    }

    if (seen.has(share.participantId)) {
      throw new SplitBillValidationError(
        'Setiap participant hanya boleh punya satu share manual.',
      );
    }

    const shareCents = normalizeAmountToCents(share.amount);
    if (shareCents < 0) {
      throw new SplitBillValidationError(
        'Nominal share manual tidak boleh negatif.',
      );
    }

    seen.add(share.participantId);
    totalShareCents += shareCents;
  }

  if (seen.size !== participantIds.length) {
    throw new SplitBillValidationError(
      'Semua participant harus memiliki share manual.',
    );
  }

  const totalAmountCents = normalizeAmountToCents(totalAmount);
  if (totalShareCents !== totalAmountCents) {
    throw new SplitBillValidationError(
      'Total share manual harus sama dengan total tagihan session.',
    );
  }

  return shares.map((share) => ({
    participantId: share.participantId,
    amount: centsToAmount(normalizeAmountToCents(share.amount)),
    notes: share.notes?.trim() ? share.notes.trim() : null,
  }));
}

export const splitBillSessionInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      fullName: true,
    },
  },
  participants: {
    orderBy: [
      { isOwner: 'desc' as const },
      { createdAt: 'asc' as const },
    ],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
  },
  shares: {
    orderBy: [
      { createdAt: 'asc' as const },
    ],
    include: {
      participant: {
        select: {
          id: true,
          displayName: true,
          userId: true,
          isOwner: true,
          joinedViaCode: true,
        },
      },
    },
  },
};

export async function getSplitBillSessionByCode(
  tx: DbClient,
  sessionCode: string,
) {
  return tx.splitBillSession.findUnique({
    where: { sessionCode: normalizeSplitBillSessionCode(sessionCode) },
    include: splitBillSessionInclude,
  });
}

export async function getOwnedSplitBillSessionByCode(
  tx: DbClient,
  sessionCode: string,
  ownerUserId: string,
) {
  return tx.splitBillSession.findFirst({
    where: {
      sessionCode: normalizeSplitBillSessionCode(sessionCode),
      ownerUserId,
    },
    include: splitBillSessionInclude,
  });
}
