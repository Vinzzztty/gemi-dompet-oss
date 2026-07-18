import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEqualGroupExpenseShares,
  buildGroupExpenseSessionSummary,
  validateManualGroupExpenseShares,
} from './group-expense';

test('buildEqualGroupExpenseShares supports subset participants with rounded cents', () => {
  const shares = buildEqualGroupExpenseShares(400_000, ['p1', 'p2', 'p3']);

  assert.deepEqual(shares, [
    { participantId: 'p1', amount: 133333.34, notes: null },
    { participantId: 'p2', amount: 133333.33, notes: null },
    { participantId: 'p3', amount: 133333.33, notes: null },
  ]);
});

test('validateManualGroupExpenseShares allows partial participant subset', () => {
  const shares = validateManualGroupExpenseShares(
    300_000,
    ['p1', 'p2', 'p3', 'p4'],
    [
      { participantId: 'p2', amount: 100_000, notes: ' makan ' },
      { participantId: 'p3', amount: 200_000, notes: '' },
    ],
  );

  assert.deepEqual(shares, [
    { participantId: 'p2', amount: 100_000, notes: 'makan' },
    { participantId: 'p3', amount: 200_000, notes: null },
  ]);
});

test('buildGroupExpenseSessionSummary calculates balances and transfer recommendations', () => {
  const summary = buildGroupExpenseSessionSummary({
    id: 'session-1',
    ownerUserId: 'user-1',
    sessionCode: 'GROUP_EXPENSE_TRIP_2026_TEST',
    title: 'Trip Jogja',
    currency: 'IDR',
    status: 'ACTIVE',
    notes: null,
    startedAt: null,
    endedAt: null,
    createdAt: new Date('2026-05-29T00:00:00.000Z'),
    updatedAt: new Date('2026-05-29T00:00:00.000Z'),
    owner: {
      id: 'user-1',
      email: 'kevin@example.com',
      fullName: 'Kevin',
    },
    participants: [
      {
        id: 'p1',
        sessionId: 'session-1',
        userId: 'user-1',
        displayName: 'Kevin',
        isOwner: true,
        joinedViaCode: false,
        createdAt: new Date('2026-05-29T00:00:00.000Z'),
        updatedAt: new Date('2026-05-29T00:00:00.000Z'),
        user: {
          id: 'user-1',
          email: 'kevin@example.com',
          fullName: 'Kevin',
        },
      },
      {
        id: 'p2',
        sessionId: 'session-1',
        userId: null,
        displayName: 'Budi',
        isOwner: false,
        joinedViaCode: true,
        createdAt: new Date('2026-05-29T00:00:00.000Z'),
        updatedAt: new Date('2026-05-29T00:00:00.000Z'),
        user: null,
      },
      {
        id: 'p3',
        sessionId: 'session-1',
        userId: null,
        displayName: 'Rina',
        isOwner: false,
        joinedViaCode: true,
        createdAt: new Date('2026-05-29T00:00:00.000Z'),
        updatedAt: new Date('2026-05-29T00:00:00.000Z'),
        user: null,
      },
    ],
    items: [
      {
        id: 'item-1',
        sessionId: 'session-1',
        paidByParticipantId: 'p1',
        title: 'Lokasi A',
        locationLabel: 'A',
        amount: 300_000,
        currency: 'IDR',
        incurredAt: new Date('2026-05-29T09:00:00.000Z'),
        notes: null,
        splitMode: 'EQUAL',
        status: 'ACTIVE',
        createdAt: new Date('2026-05-29T09:00:00.000Z'),
        updatedAt: new Date('2026-05-29T09:00:00.000Z'),
        paidByParticipant: {
          id: 'p1',
          displayName: 'Kevin',
          userId: 'user-1',
          isOwner: true,
        },
        shares: [
          {
            id: 's1',
            itemId: 'item-1',
            participantId: 'p1',
            amount: 100_000,
            notes: null,
            createdAt: new Date('2026-05-29T09:00:00.000Z'),
            updatedAt: new Date('2026-05-29T09:00:00.000Z'),
            participant: {
              id: 'p1',
              displayName: 'Kevin',
              userId: 'user-1',
              isOwner: true,
            },
          },
          {
            id: 's2',
            itemId: 'item-1',
            participantId: 'p2',
            amount: 100_000,
            notes: null,
            createdAt: new Date('2026-05-29T09:00:00.000Z'),
            updatedAt: new Date('2026-05-29T09:00:00.000Z'),
            participant: {
              id: 'p2',
              displayName: 'Budi',
              userId: null,
              isOwner: false,
            },
          },
          {
            id: 's3',
            itemId: 'item-1',
            participantId: 'p3',
            amount: 100_000,
            notes: null,
            createdAt: new Date('2026-05-29T09:00:00.000Z'),
            updatedAt: new Date('2026-05-29T09:00:00.000Z'),
            participant: {
              id: 'p3',
              displayName: 'Rina',
              userId: null,
              isOwner: false,
            },
          },
        ],
      },
      {
        id: 'item-2',
        sessionId: 'session-1',
        paidByParticipantId: 'p2',
        title: 'Lokasi B',
        locationLabel: 'B',
        amount: 200_000,
        currency: 'IDR',
        incurredAt: new Date('2026-05-29T11:00:00.000Z'),
        notes: null,
        splitMode: 'MANUAL',
        status: 'ACTIVE',
        createdAt: new Date('2026-05-29T11:00:00.000Z'),
        updatedAt: new Date('2026-05-29T11:00:00.000Z'),
        paidByParticipant: {
          id: 'p2',
          displayName: 'Budi',
          userId: null,
          isOwner: false,
        },
        shares: [
          {
            id: 's4',
            itemId: 'item-2',
            participantId: 'p2',
            amount: 100_000,
            notes: null,
            createdAt: new Date('2026-05-29T11:00:00.000Z'),
            updatedAt: new Date('2026-05-29T11:00:00.000Z'),
            participant: {
              id: 'p2',
              displayName: 'Budi',
              userId: null,
              isOwner: false,
            },
          },
          {
            id: 's5',
            itemId: 'item-2',
            participantId: 'p3',
            amount: 100_000,
            notes: null,
            createdAt: new Date('2026-05-29T11:00:00.000Z'),
            updatedAt: new Date('2026-05-29T11:00:00.000Z'),
            participant: {
              id: 'p3',
              displayName: 'Rina',
              userId: null,
              isOwner: false,
            },
          },
        ],
      },
    ],
    repayments: [
      {
        id: 'r1',
        sessionId: 'session-1',
        fromParticipantId: 'p2',
        toParticipantId: 'p1',
        amount: 50_000,
        currency: 'IDR',
        paidAt: new Date('2026-05-29T14:00:00.000Z'),
        notes: null,
        createdAt: new Date('2026-05-29T14:00:00.000Z'),
        updatedAt: new Date('2026-05-29T14:00:00.000Z'),
        fromParticipant: {
          id: 'p2',
          displayName: 'Budi',
          userId: null,
          isOwner: false,
        },
        toParticipant: {
          id: 'p1',
          displayName: 'Kevin',
          userId: 'user-1',
          isOwner: true,
        },
      },
    ],
    settlementSnapshots: [],
  } as never);

  assert.equal(summary.totalExpenses, 500_000);
  assert.equal(summary.totalAssigned, 500_000);
  assert.equal(summary.totalRepayments, 50_000);
  assert.equal(summary.outstandingSplit, 0);
  assert.equal(summary.participantCount, 3);
  assert.equal(summary.activeItemCount, 2);

  assert.deepEqual(
    summary.balances.map((balance) => ({
      displayName: balance.displayName,
      netBalance: balance.netBalance,
      role: balance.role,
    })),
    [
      { displayName: 'Kevin', netBalance: 250_000, role: 'RECEIVABLE' },
      { displayName: 'Budi', netBalance: -50_000, role: 'PAYABLE' },
      { displayName: 'Rina', netBalance: -200_000, role: 'PAYABLE' },
    ],
  );

  assert.deepEqual(summary.recommendedTransfers, [
    {
      fromParticipantId: 'p3',
      fromDisplayName: 'Rina',
      toParticipantId: 'p1',
      toDisplayName: 'Kevin',
      amount: 200_000,
    },
    {
      fromParticipantId: 'p2',
      fromDisplayName: 'Budi',
      toParticipantId: 'p1',
      toDisplayName: 'Kevin',
      amount: 50_000,
    },
  ]);
});
