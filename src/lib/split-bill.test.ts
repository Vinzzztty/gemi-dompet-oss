import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEqualSplitShares,
  formatSplitBillTitleSegment,
  generateRandomSessionSuffix,
  generateSplitBillSessionCode,
  normalizeSplitBillSessionCode,
  SplitBillValidationError,
  validateManualSplitShares,
} from './split-bill';

test('formatSplitBillTitleSegment sanitizes title into uppercase session segment', () => {
  assert.equal(
    formatSplitBillTitleSegment('  Makan bareng anak kos!!!  '),
    'MAKAN_BARENG_ANA',
  );
});

test('generateSplitBillSessionCode builds deterministic uppercase public code', () => {
  const code = generateSplitBillSessionCode(
    'Makan bareng',
    new Date('2026-02-14T10:00:00.000Z'),
    'OSISI',
  );

  assert.equal(code, 'SPLIT_BILL_MAKAN_BARENG_2026_OSISI');
});

test('generateRandomSessionSuffix uses 80 bits of randomness by default', () => {
  const suffix = generateRandomSessionSuffix();

  assert.equal(suffix.length, 16);
  assert.match(suffix, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
});

test('normalizeSplitBillSessionCode trims and uppercases join code input', () => {
  assert.equal(
    normalizeSplitBillSessionCode('  split_bill_osisi_2026  '),
    'SPLIT_BILL_OSISI_2026',
  );
});

test('buildEqualSplitShares distributes remainder cents fairly', () => {
  const shares = buildEqualSplitShares(100, ['p1', 'p2', 'p3']);

  assert.deepEqual(shares, [
    { participantId: 'p1', amount: 33.34, notes: null },
    { participantId: 'p2', amount: 33.33, notes: null },
    { participantId: 'p3', amount: 33.33, notes: null },
  ]);
});

test('validateManualSplitShares accepts full participant coverage and trims notes', () => {
  const shares = validateManualSplitShares(50_000, ['p1', 'p2'], [
    { participantId: 'p1', amount: 20_000, notes: '  bayar cash  ' },
    { participantId: 'p2', amount: 30_000, notes: '   ' },
  ]);

  assert.deepEqual(shares, [
    { participantId: 'p1', amount: 20_000, notes: 'bayar cash' },
    { participantId: 'p2', amount: 30_000, notes: null },
  ]);
});

test('validateManualSplitShares rejects when total share does not match session total', () => {
  assert.throws(
    () => {
      validateManualSplitShares(50_000, ['p1', 'p2'], [
        { participantId: 'p1', amount: 10_000 },
        { participantId: 'p2', amount: 20_000 },
      ]);
    },
    (error: unknown) => {
      assert.ok(error instanceof SplitBillValidationError);
      assert.match(
        error.message,
        /Total share manual harus sama dengan total tagihan session/i,
      );
      return true;
    },
  );
});

test('validateManualSplitShares rejects when not all participants are covered', () => {
  assert.throws(
    () => {
      validateManualSplitShares(50_000, ['p1', 'p2'], [
        { participantId: 'p1', amount: 50_000 },
      ]);
    },
    (error: unknown) => {
      assert.ok(error instanceof SplitBillValidationError);
      assert.match(
        error.message,
        /Semua participant harus memiliki share manual/i,
      );
      return true;
    },
  );
});
