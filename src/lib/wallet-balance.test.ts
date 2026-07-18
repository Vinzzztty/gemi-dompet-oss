import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertWalletBalanceDeltas,
  getOrCreateOthersWallet,
  WalletAccessError,
  WalletBalanceValidationError,
} from './wallet-balance';

type LockedWalletRow = {
  id: string;
  nama_dompet: string;
};

function createTxStub(options: {
  lockedWallets?: LockedWalletRow[];
  incomeByWallet?: Array<{ walletId: string; _sum: { nominal: number | null } }>;
  expenseByWallet?: Array<{ walletId: string; _sum: { nominal: number | null } }>;
  outgoingByWallet?: Array<{ fromWalletId: string; _sum: { amount: number | null } }>;
  incomingByWallet?: Array<{ toWalletId: string; _sum: { amount: number | null } }>;
  existingOthersWallet?: { id: string; namaDompet: string; norek: string | null } | null;
}) {
  const createdWallets: Array<{ userId: string; namaDompet: string; norek: string | null }> = [];

  return {
    createdWallets,
    tx: {
      $queryRaw: async () => options.lockedWallets ?? [],
      wallet: {
        findFirst: async () => options.existingOthersWallet ?? null,
        create: async ({ data }: { data: { userId: string; namaDompet: string; norek: string | null } }) => {
          createdWallets.push(data);
          return {
            id: 'others-wallet-id',
            namaDompet: data.namaDompet,
            norek: data.norek,
          };
        },
      },
      incomeTransaction: {
        groupBy: async () => options.incomeByWallet ?? [],
      },
      expenseTransaction: {
        groupBy: async () => options.expenseByWallet ?? [],
      },
      transferTransaction: {
        groupBy: async ({ by }: { by: string[] }) => {
          if (by.includes('fromWalletId')) {
            return options.outgoingByWallet ?? [];
          }
          return options.incomingByWallet ?? [];
        },
      },
    },
  };
}

test('assertWalletBalanceDeltas allows transactions that keep wallet non-negative', async () => {
  const { tx } = createTxStub({
    lockedWallets: [{ id: 'wallet-1', nama_dompet: 'Cash' }],
    incomeByWallet: [{ walletId: 'wallet-1', _sum: { nominal: 100_000 } }],
    expenseByWallet: [{ walletId: 'wallet-1', _sum: { nominal: 20_000 } }],
  });

  await assert.doesNotReject(async () => {
    await assertWalletBalanceDeltas(tx as never, 'user-1', [
      { walletId: 'wallet-1', delta: -30_000 },
    ]);
  });
});

test('assertWalletBalanceDeltas throws WalletBalanceValidationError when projected balance is negative', async () => {
  const { tx } = createTxStub({
    lockedWallets: [{ id: 'wallet-1', nama_dompet: 'Cash' }],
    incomeByWallet: [{ walletId: 'wallet-1', _sum: { nominal: 50_000 } }],
    expenseByWallet: [{ walletId: 'wallet-1', _sum: { nominal: 10_000 } }],
  });

  await assert.rejects(
    async () => {
      await assertWalletBalanceDeltas(tx as never, 'user-1', [
        { walletId: 'wallet-1', delta: -50_000 },
      ]);
    },
    (error: unknown) => {
      assert.ok(error instanceof WalletBalanceValidationError);
      assert.equal(error.walletId, 'wallet-1');
      assert.equal(error.walletName, 'Cash');
      assert.equal(error.balanceBefore, 40_000);
      assert.equal(error.balanceAfter, -10_000);
      return true;
    },
  );
});

test('assertWalletBalanceDeltas merges multiple deltas for the same wallet before validating', async () => {
  const { tx } = createTxStub({
    lockedWallets: [{ id: 'wallet-1', nama_dompet: 'Cash' }],
    incomeByWallet: [{ walletId: 'wallet-1', _sum: { nominal: 10_000 } }],
  });

  await assert.rejects(
    async () => {
      await assertWalletBalanceDeltas(tx as never, 'user-1', [
        { walletId: 'wallet-1', delta: -4_000 },
        { walletId: 'wallet-1', delta: -7_000 },
      ]);
    },
    (error: unknown) => {
      assert.ok(error instanceof WalletBalanceValidationError);
      assert.equal(error.balanceBefore, 10_000);
      assert.equal(error.balanceAfter, -1_000);
      return true;
    },
  );
});

test('assertWalletBalanceDeltas throws WalletAccessError when wallet is missing or not owned by user', async () => {
  const { tx } = createTxStub({
    lockedWallets: [],
  });

  await assert.rejects(
    async () => {
      await assertWalletBalanceDeltas(tx as never, 'user-1', [
        { walletId: 'wallet-404', delta: -10_000 },
      ]);
    },
    (error: unknown) => {
      assert.ok(error instanceof WalletAccessError);
      assert.match(error.message, /wallet-404/);
      return true;
    },
  );
});

test('getOrCreateOthersWallet reuses existing Others wallet', async () => {
  const { tx, createdWallets } = createTxStub({
    existingOthersWallet: {
      id: 'existing-others',
      namaDompet: 'Others',
      norek: null,
    },
  });

  const wallet = await getOrCreateOthersWallet(tx as never, 'user-1');

  assert.equal(wallet.id, 'existing-others');
  assert.equal(createdWallets.length, 0);
});

test('getOrCreateOthersWallet creates Others wallet when it does not exist', async () => {
  const { tx, createdWallets } = createTxStub({
    existingOthersWallet: null,
  });

  const wallet = await getOrCreateOthersWallet(tx as never, 'user-1');

  assert.equal(wallet.id, 'others-wallet-id');
  assert.equal(createdWallets.length, 1);
  assert.deepEqual(createdWallets[0], {
    userId: 'user-1',
    namaDompet: 'Others',
    norek: null,
  });
});
