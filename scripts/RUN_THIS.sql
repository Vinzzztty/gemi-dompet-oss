-- ============================================================================
-- 🚀 COPY-PASTE THIS ENTIRE FILE TO YOUR DATABASE CLIENT
-- ============================================================================
-- This will:
-- 1. Create "Others" wallet for users who don't have it
-- 2. Move all orphan transactions to "Others" wallet
-- 3. Show before/after summary
-- ============================================================================

-- BEFORE CHECK
SELECT 'BEFORE MIGRATION' AS status, COUNT(*) AS users_without_others
FROM user_account ua
WHERE NOT EXISTS (SELECT 1 FROM wallet w WHERE w.user_id = ua.id AND w.nama_dompet = 'Others');

-- CREATE WALLETS
INSERT INTO wallet (id, user_id, nama_dompet, norek, created_at, updated_at)
SELECT gen_random_uuid(), ua.id, 'Others', NULL, NOW(), NOW()
FROM user_account ua
WHERE NOT EXISTS (SELECT 1 FROM wallet w WHERE w.user_id = ua.id AND w.nama_dompet = 'Others');

-- MIGRATE INCOME
UPDATE income_transaction it
SET wallet_id = (SELECT w.id FROM wallet w WHERE w.user_id = it.user_id AND w.nama_dompet = 'Others')
WHERE it.wallet_id IS NULL;

-- MIGRATE EXPENSE
UPDATE expense_transaction et
SET wallet_id = (SELECT w.id FROM wallet w WHERE w.user_id = et.user_id AND w.nama_dompet = 'Others')
WHERE et.wallet_id IS NULL;

-- AFTER CHECK
SELECT 'AFTER MIGRATION' AS status, COUNT(*) AS users_without_others
FROM user_account ua
WHERE NOT EXISTS (SELECT 1 FROM wallet w WHERE w.user_id = ua.id AND w.nama_dompet = 'Others');

-- VERIFY (should be 0)
SELECT 
    (SELECT COUNT(*) FROM income_transaction WHERE wallet_id IS NULL) AS orphan_income,
    (SELECT COUNT(*) FROM expense_transaction WHERE wallet_id IS NULL) AS orphan_expense;

-- ✅ DONE! Refresh your dashboard.
