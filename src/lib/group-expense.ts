import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaClient;

const SESSION_CODE_PREFIX = 'GROUP_EXPENSE';
const RANDOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_TITLE_SEGMENT_LENGTH = 16;

export class GroupExpenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroupExpenseValidationError';
  }
}

export type GroupExpenseShareInput = {
  participantId: string;
  amount: number;
  notes?: string | null;
};

export type GroupExpenseParticipantBalanceSummary = {
  participantId: string;
  displayName: string;
  isOwner: boolean;
  userId: string | null;
  grossPaid: number;
  grossConsumed: number;
  repaidOut: number;
  repaidIn: number;
  netBalance: number;
  role: 'RECEIVABLE' | 'PAYABLE' | 'SETTLED';
};

export type GroupExpenseTransferRecommendation = {
  fromParticipantId: string;
  fromDisplayName: string;
  toParticipantId: string;
  toDisplayName: string;
  amount: number;
};

export type GroupExpenseSessionSummary = {
  totalExpenses: number;
  totalAssigned: number;
  totalRepayments: number;
  outstandingSplit: number;
  participantCount: number;
  activeItemCount: number;
  balances: GroupExpenseParticipantBalanceSummary[];
  recommendedTransfers: GroupExpenseTransferRecommendation[];
};

export function formatGroupExpenseTitleSegment(title: string): string {
  const normalized = title
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

  return (normalized || 'SESSION').slice(0, MAX_TITLE_SEGMENT_LENGTH);
}

export function generateGroupExpenseRandomSuffix(length = 16): string {
  return Array.from(crypto.randomBytes(length))
    .map((byte) => RANDOM_ALPHABET[byte % RANDOM_ALPHABET.length])
    .join('');
}

export function generateGroupExpenseSessionCode(
  title: string,
  now = new Date(),
  suffix = generateGroupExpenseRandomSuffix(),
): string {
  const year = now.getFullYear();
  const titleSegment = formatGroupExpenseTitleSegment(title);
  return `${SESSION_CODE_PREFIX}_${titleSegment}_${year}_${suffix}`;
}

export function normalizeGroupExpenseSessionCode(sessionCode: string): string {
  return sessionCode.trim().toUpperCase();
}

export function normalizeGroupExpenseAmountToCents(
  amount: number | string | Prisma.Decimal,
): number {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    throw new GroupExpenseValidationError('Nominal tidak valid.');
  }

  return Math.round(numeric * 100);
}

export function groupExpenseCentsToAmount(cents: number): number {
  return cents / 100;
}

export function buildEqualGroupExpenseShares(
  totalAmount: number | string | Prisma.Decimal,
  participantIds: string[],
): GroupExpenseShareInput[] {
  if (participantIds.length === 0) {
    throw new GroupExpenseValidationError(
      'Minimal harus ada satu participant untuk membagi expense item.',
    );
  }

  const totalCents = normalizeGroupExpenseAmountToCents(totalAmount);
  const baseCents = Math.floor(totalCents / participantIds.length);
  const remainder = totalCents % participantIds.length;

  return participantIds.map((participantId, index) => ({
    participantId,
    amount: groupExpenseCentsToAmount(
      baseCents + (index < remainder ? 1 : 0),
    ),
    notes: null,
  }));
}

export function validateGroupExpenseSelectedParticipantIds(
  allowedParticipantIds: string[],
  participantIds: string[],
): string[] {
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    throw new GroupExpenseValidationError(
      'Minimal harus ada satu participant untuk membagi expense item.',
    );
  }

  const allowedSet = new Set(allowedParticipantIds);
  const seen = new Set<string>();

  return participantIds.map((participantId) => participantId.trim()).filter(Boolean).map((participantId) => {
    if (!allowedSet.has(participantId)) {
      throw new GroupExpenseValidationError(
        'Terdapat participant yang tidak valid di pembagian item.',
      );
    }

    if (seen.has(participantId)) {
      throw new GroupExpenseValidationError(
        'Participant yang sama tidak boleh dipilih berulang kali.',
      );
    }

    seen.add(participantId);
    return participantId;
  });
}

export function validateManualGroupExpenseShares(
  totalAmount: number | string | Prisma.Decimal,
  allowedParticipantIds: string[],
  shares: GroupExpenseShareInput[],
): GroupExpenseShareInput[] {
  if (!Array.isArray(shares) || shares.length === 0) {
    throw new GroupExpenseValidationError('Daftar share manual harus diisi.');
  }

  const participantIdSet = new Set(allowedParticipantIds);
  const seen = new Set<string>();
  let totalShareCents = 0;

  for (const share of shares) {
    if (!participantIdSet.has(share.participantId)) {
      throw new GroupExpenseValidationError(
        'Terdapat participant yang tidak valid di daftar share manual.',
      );
    }

    if (seen.has(share.participantId)) {
      throw new GroupExpenseValidationError(
        'Setiap participant hanya boleh punya satu share manual per item.',
      );
    }

    const shareCents = normalizeGroupExpenseAmountToCents(share.amount);
    if (shareCents <= 0) {
      throw new GroupExpenseValidationError(
        'Nominal share manual harus lebih besar dari 0.',
      );
    }

    seen.add(share.participantId);
    totalShareCents += shareCents;
  }

  const totalAmountCents = normalizeGroupExpenseAmountToCents(totalAmount);
  if (totalShareCents !== totalAmountCents) {
    throw new GroupExpenseValidationError(
      'Total share manual harus sama dengan total expense item.',
    );
  }

  return shares.map((share) => ({
    participantId: share.participantId,
    amount: groupExpenseCentsToAmount(
      normalizeGroupExpenseAmountToCents(share.amount),
    ),
    notes: share.notes?.trim() ? share.notes.trim() : null,
  }));
}

export const groupExpenseSessionInclude = {
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
  items: {
    orderBy: [
      { incurredAt: 'desc' as const },
      { createdAt: 'desc' as const },
    ],
    include: {
      paidByParticipant: {
        select: {
          id: true,
          displayName: true,
          userId: true,
          isOwner: true,
        },
      },
      shares: {
        orderBy: [{ createdAt: 'asc' as const }],
        include: {
          participant: {
            select: {
              id: true,
              displayName: true,
              userId: true,
              isOwner: true,
            },
          },
        },
      },
    },
  },
  repayments: {
    orderBy: [
      { paidAt: 'desc' as const },
      { createdAt: 'desc' as const },
    ],
    include: {
      fromParticipant: {
        select: {
          id: true,
          displayName: true,
          userId: true,
          isOwner: true,
        },
      },
      toParticipant: {
        select: {
          id: true,
          displayName: true,
          userId: true,
          isOwner: true,
        },
      },
    },
  },
  settlementSnapshots: {
    orderBy: [
      { snapshotAt: 'desc' as const },
      { createdAt: 'desc' as const },
    ],
    include: {
      entries: {
        orderBy: [{ createdAt: 'asc' as const }],
        include: {
          participant: {
            select: {
              id: true,
              displayName: true,
              userId: true,
              isOwner: true,
            },
          },
        },
      },
    },
  },
};

export type GroupExpenseSessionWithDetails = Prisma.GroupExpenseSessionGetPayload<{
  include: typeof groupExpenseSessionInclude;
}>;

export type GroupExpenseSessionResponse = GroupExpenseSessionWithDetails & {
  summary: GroupExpenseSessionSummary;
};

export async function getGroupExpenseSessionByCode(
  tx: DbClient,
  sessionCode: string,
) {
  return tx.groupExpenseSession.findUnique({
    where: {
      sessionCode: normalizeGroupExpenseSessionCode(sessionCode),
    },
    include: groupExpenseSessionInclude,
  });
}

export async function getOwnedGroupExpenseSessionByCode(
  tx: DbClient,
  sessionCode: string,
  ownerUserId: string,
) {
  return tx.groupExpenseSession.findFirst({
    where: {
      sessionCode: normalizeGroupExpenseSessionCode(sessionCode),
      ownerUserId,
    },
    include: groupExpenseSessionInclude,
  });
}

function resolveBalanceRole(
  balanceCents: number,
): GroupExpenseParticipantBalanceSummary['role'] {
  if (balanceCents > 0) return 'RECEIVABLE';
  if (balanceCents < 0) return 'PAYABLE';
  return 'SETTLED';
}

export function buildGroupExpenseSessionSummary(
  session: GroupExpenseSessionWithDetails,
): GroupExpenseSessionSummary {
  const activeItems = session.items.filter((item) => item.status === 'ACTIVE');

  const balanceMap = new Map<string, GroupExpenseParticipantBalanceSummary>();

  for (const participant of session.participants) {
    balanceMap.set(participant.id, {
      participantId: participant.id,
      displayName: participant.displayName,
      isOwner: participant.isOwner,
      userId: participant.userId,
      grossPaid: 0,
      grossConsumed: 0,
      repaidOut: 0,
      repaidIn: 0,
      netBalance: 0,
      role: 'SETTLED',
    });
  }

  let totalExpenses = 0;
  let totalAssigned = 0;
  let totalRepayments = 0;

  for (const item of activeItems) {
    const itemAmount = Number(item.amount);
    totalExpenses += itemAmount;

    const paidByBalance = balanceMap.get(item.paidByParticipantId);
    if (paidByBalance) {
      paidByBalance.grossPaid += itemAmount;
    }

    for (const share of item.shares) {
      const shareAmount = Number(share.amount);
      totalAssigned += shareAmount;

      const participantBalance = balanceMap.get(share.participantId);
      if (participantBalance) {
        participantBalance.grossConsumed += shareAmount;
      }
    }
  }

  for (const repayment of session.repayments) {
    const repaymentAmount = Number(repayment.amount);
    totalRepayments += repaymentAmount;

    const fromBalance = balanceMap.get(repayment.fromParticipantId);
    const toBalance = balanceMap.get(repayment.toParticipantId);

    if (fromBalance) {
      fromBalance.repaidOut += repaymentAmount;
    }

    if (toBalance) {
      toBalance.repaidIn += repaymentAmount;
    }
  }

  const balances = Array.from(balanceMap.values()).map((balance) => {
    const netBalanceCents =
      normalizeGroupExpenseAmountToCents(balance.grossPaid) +
      normalizeGroupExpenseAmountToCents(balance.repaidIn) -
      normalizeGroupExpenseAmountToCents(balance.grossConsumed) -
      normalizeGroupExpenseAmountToCents(balance.repaidOut);

    return {
      ...balance,
      netBalance: groupExpenseCentsToAmount(netBalanceCents),
      role: resolveBalanceRole(netBalanceCents),
    };
  });

  const creditors = balances
    .filter((balance) => balance.netBalance > 0)
    .map((balance) => ({
      ...balance,
      remainingCents: normalizeGroupExpenseAmountToCents(balance.netBalance),
    }))
    .sort((a, b) => b.remainingCents - a.remainingCents);

  const debtors = balances
    .filter((balance) => balance.netBalance < 0)
    .map((balance) => ({
      ...balance,
      remainingCents: Math.abs(
        normalizeGroupExpenseAmountToCents(balance.netBalance),
      ),
    }))
    .sort((a, b) => b.remainingCents - a.remainingCents);

  const recommendedTransfers: GroupExpenseTransferRecommendation[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const transferCents = Math.min(
      creditor.remainingCents,
      debtor.remainingCents,
    );

    if (transferCents > 0) {
      recommendedTransfers.push({
        fromParticipantId: debtor.participantId,
        fromDisplayName: debtor.displayName,
        toParticipantId: creditor.participantId,
        toDisplayName: creditor.displayName,
        amount: groupExpenseCentsToAmount(transferCents),
      });
    }

    creditor.remainingCents -= transferCents;
    debtor.remainingCents -= transferCents;

    if (creditor.remainingCents === 0) creditorIndex += 1;
    if (debtor.remainingCents === 0) debtorIndex += 1;
  }

  return {
    totalExpenses,
    totalAssigned,
    totalRepayments,
    outstandingSplit: totalExpenses - totalAssigned,
    participantCount: session.participants.length,
    activeItemCount: activeItems.length,
    balances,
    recommendedTransfers,
  };
}

export function toGroupExpenseSessionResponse(
  session: GroupExpenseSessionWithDetails,
): GroupExpenseSessionResponse {
  return {
    ...session,
    summary: buildGroupExpenseSessionSummary(session),
  };
}
