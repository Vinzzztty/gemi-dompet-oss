-- ============================================================================
-- Zero negative wallet balances safely
-- ============================================================================
-- Strategy:
-- 1. Do NOT rewrite/delete historical expenses or transfers.
-- 2. Insert one auditable INCOME adjustment per negative wallet.
-- 3. Result: every currently negative wallet becomes exactly 0 according to
--    the same formula used by the app:
--
--      income - expense - outgoing_transfer + incoming_transfer
--
-- IMPORTANT:
-- - This increases users' total balances by the total negative amount.
-- - Based on the audit on 2026-05-28, the current correction total is
--   expected to be 14300627 across 12 wallets.
-- - These adjustments WILL appear as income unless the report layer later
--   excludes category "Penyesuaian Saldo".
-- - Run this during a quiet period.
-- - Backup first if this is production/shared DB.
--
-- If you want a dry run first:
-- - Execute everything up to the verification queries.
-- - Replace COMMIT with ROLLBACK.
-- ============================================================================

BEGIN;

SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

CREATE TEMP TABLE tmp_negative_wallet_fix
ON COMMIT DROP
AS
WITH income AS (
    SELECT
        wallet_id,
        SUM(nominal)::numeric AS income
    FROM income_transaction
    WHERE wallet_id IS NOT NULL
    GROUP BY wallet_id
),
expense AS (
    SELECT
        wallet_id,
        SUM(nominal)::numeric AS expense
    FROM expense_transaction
    WHERE wallet_id IS NOT NULL
    GROUP BY wallet_id
),
outgoing AS (
    SELECT
        from_wallet_id AS wallet_id,
        SUM(amount)::numeric AS outgoing_transfer
    FROM transfer_transaction
    GROUP BY from_wallet_id
),
incoming AS (
    SELECT
        to_wallet_id AS wallet_id,
        SUM(amount)::numeric AS incoming_transfer
    FROM transfer_transaction
    GROUP BY to_wallet_id
),
wallet_balances AS (
    SELECT
        w.id AS wallet_id,
        w.user_id,
        w.nama_dompet,
        COALESCE(i.income, 0) AS income,
        COALESCE(e.expense, 0) AS expense,
        COALESCE(o.outgoing_transfer, 0) AS outgoing_transfer,
        COALESCE(inc.incoming_transfer, 0) AS incoming_transfer,
        COALESCE(i.income, 0)
        - COALESCE(e.expense, 0)
        - COALESCE(o.outgoing_transfer, 0)
        + COALESCE(inc.incoming_transfer, 0) AS balance
    FROM wallet w
    LEFT JOIN income i ON i.wallet_id = w.id
    LEFT JOIN expense e ON e.wallet_id = w.id
    LEFT JOIN outgoing o ON o.wallet_id = w.id
    LEFT JOIN incoming inc ON inc.wallet_id = w.id
)
SELECT
    wb.user_id,
    ua.email,
    ua.full_name,
    wb.wallet_id,
    wb.nama_dompet,
    wb.income,
    wb.expense,
    wb.outgoing_transfer,
    wb.incoming_transfer,
    wb.balance AS balance_before,
    ABS(wb.balance) AS adjustment_amount
FROM wallet_balances wb
JOIN user_account ua ON ua.id = wb.user_id
WHERE wb.balance < 0;

-- Preview summary
SELECT
    COUNT(*)::int AS affected_wallets,
    COUNT(DISTINCT user_id)::int AS affected_users,
    COALESCE(SUM(adjustment_amount), 0)::numeric(15, 2) AS total_adjustment_needed
FROM tmp_negative_wallet_fix;

-- Preview detail
SELECT
    user_id,
    email,
    full_name,
    wallet_id,
    nama_dompet,
    balance_before,
    adjustment_amount,
    income,
    expense,
    outgoing_transfer,
    incoming_transfer
FROM tmp_negative_wallet_fix
ORDER BY adjustment_amount DESC, email ASC, nama_dompet ASC;

-- Ensure one INCOME category exists per affected user.
INSERT INTO category (
    id,
    user_id,
    name,
    type,
    icon,
    created_at
)
SELECT
    gen_random_uuid(),
    u.user_id,
    'Penyesuaian Saldo',
    'INCOME'::category_type,
    'wallet',
    NOW()
FROM (
    SELECT DISTINCT user_id
    FROM tmp_negative_wallet_fix
) u
WHERE NOT EXISTS (
    SELECT 1
    FROM category c
    WHERE c.user_id = u.user_id
      AND c.name = 'Penyesuaian Saldo'
      AND c.type = 'INCOME'::category_type
);

-- Insert one correction INCOME transaction per negative wallet.
WITH inserted AS (
    INSERT INTO income_transaction (
        id,
        user_id,
        wallet_id,
        nama,
        nominal,
        category_id,
        tanggal,
        catatan,
        created_at
    )
    SELECT
        gen_random_uuid(),
        t.user_id,
        t.wallet_id,
        'Penyesuaian saldo wallet: ' || t.nama_dompet,
        t.adjustment_amount,
        c.id,
        CURRENT_DATE,
        'AUTO_ZERO_NEGATIVE_WALLET | previous_balance='
            || t.balance_before::text
            || ' | wallet_id='
            || t.wallet_id::text,
        NOW()
    FROM tmp_negative_wallet_fix t
    JOIN category c
      ON c.user_id = t.user_id
     AND c.name = 'Penyesuaian Saldo'
     AND c.type = 'INCOME'::category_type
    RETURNING user_id, wallet_id, nominal
)
SELECT
    COUNT(*)::int AS inserted_adjustments,
    COALESCE(SUM(nominal), 0)::numeric(15, 2) AS inserted_total
FROM inserted;

-- Verification: all currently negative wallets should now be zero or positive.
WITH income AS (
    SELECT
        wallet_id,
        SUM(nominal)::numeric AS income
    FROM income_transaction
    WHERE wallet_id IS NOT NULL
    GROUP BY wallet_id
),
expense AS (
    SELECT
        wallet_id,
        SUM(nominal)::numeric AS expense
    FROM expense_transaction
    WHERE wallet_id IS NOT NULL
    GROUP BY wallet_id
),
outgoing AS (
    SELECT
        from_wallet_id AS wallet_id,
        SUM(amount)::numeric AS outgoing_transfer
    FROM transfer_transaction
    GROUP BY from_wallet_id
),
incoming AS (
    SELECT
        to_wallet_id AS wallet_id,
        SUM(amount)::numeric AS incoming_transfer
    FROM transfer_transaction
    GROUP BY to_wallet_id
),
wallet_balances AS (
    SELECT
        w.id AS wallet_id,
        w.user_id,
        w.nama_dompet,
        COALESCE(i.income, 0)
        - COALESCE(e.expense, 0)
        - COALESCE(o.outgoing_transfer, 0)
        + COALESCE(inc.incoming_transfer, 0) AS balance
    FROM wallet w
    LEFT JOIN income i ON i.wallet_id = w.id
    LEFT JOIN expense e ON e.wallet_id = w.id
    LEFT JOIN outgoing o ON o.wallet_id = w.id
    LEFT JOIN incoming inc ON inc.wallet_id = w.id
)
SELECT
    COUNT(*)::int AS remaining_negative_wallets,
    COALESCE(SUM(ABS(balance)), 0)::numeric(15, 2) AS remaining_negative_total
FROM wallet_balances
WHERE balance < 0;

COMMIT;
