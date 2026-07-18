-- Draft manual SQL for Group Expense / Talangan Session V2
-- IMPORTANT:
-- - This file is a design draft only.
-- - Do not execute on production before implementation branch is ready.
-- - V2 is intentionally created side-by-side with existing split_bill_* tables.

-- =========================================================
-- 1. Enums
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'group_expense_session_status'
  ) THEN
    CREATE TYPE group_expense_session_status AS ENUM (
      'ACTIVE',
      'FROZEN',
      'SETTLED',
      'ARCHIVED'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'group_expense_item_status'
  ) THEN
    CREATE TYPE group_expense_item_status AS ENUM (
      'ACTIVE',
      'VOID'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'group_expense_split_mode'
  ) THEN
    CREATE TYPE group_expense_split_mode AS ENUM (
      'EQUAL',
      'MANUAL'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'group_expense_settlement_role'
  ) THEN
    CREATE TYPE group_expense_settlement_role AS ENUM (
      'RECEIVABLE',
      'PAYABLE',
      'SETTLED'
    );
  END IF;
END $$;

-- =========================================================
-- 2. Session
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  session_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  status group_expense_session_status NOT NULL DEFAULT 'ACTIVE',
  notes TEXT NULL,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_expense_session_session_code_unique
  ON group_expense_session(session_code);

CREATE INDEX IF NOT EXISTS idx_group_expense_session_owner_user_id
  ON group_expense_session(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_session_status
  ON group_expense_session(status);

-- =========================================================
-- 3. Participants
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_participant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_expense_session(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES user_account(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  is_owner BOOLEAN NOT NULL DEFAULT false,
  joined_via_code BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_expense_participant_session_user_unique
  ON group_expense_participant(session_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_group_expense_participant_session_id
  ON group_expense_participant(session_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_participant_user_id
  ON group_expense_participant(user_id);

-- =========================================================
-- 4. Expense Items
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_expense_session(id) ON DELETE CASCADE,
  paid_by_participant_id UUID NOT NULL REFERENCES group_expense_participant(id) ON DELETE RESTRICT,
  title VARCHAR(255) NOT NULL,
  location_label VARCHAR(255) NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  incurred_at TIMESTAMP NOT NULL,
  notes TEXT NULL,
  split_mode group_expense_split_mode NOT NULL DEFAULT 'EQUAL',
  status group_expense_item_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_expense_item_session_id
  ON group_expense_item(session_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_item_paid_by_participant_id
  ON group_expense_item(paid_by_participant_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_item_incurred_at
  ON group_expense_item(incurred_at);

-- =========================================================
-- 5. Expense Shares
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_item_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES group_expense_item(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES group_expense_participant(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_expense_item_share_item_participant_unique
  ON group_expense_item_share(item_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_item_share_item_id
  ON group_expense_item_share(item_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_item_share_participant_id
  ON group_expense_item_share(participant_id);

-- =========================================================
-- 6. Repayments
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_repayment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_expense_session(id) ON DELETE CASCADE,
  from_participant_id UUID NOT NULL REFERENCES group_expense_participant(id) ON DELETE RESTRICT,
  to_participant_id UUID NOT NULL REFERENCES group_expense_participant(id) ON DELETE RESTRICT,
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  paid_at TIMESTAMP NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT group_expense_repayment_from_to_different
    CHECK (from_participant_id <> to_participant_id)
);

CREATE INDEX IF NOT EXISTS idx_group_expense_repayment_session_id
  ON group_expense_repayment(session_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_repayment_from_participant_id
  ON group_expense_repayment(from_participant_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_repayment_to_participant_id
  ON group_expense_repayment(to_participant_id);

-- =========================================================
-- 7. Settlement Snapshots
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_settlement_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES group_expense_session(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  label VARCHAR(255) NULL,
  snapshot_at TIMESTAMP NOT NULL DEFAULT now(),
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_expense_settlement_snapshot_session_id
  ON group_expense_settlement_snapshot(session_id);

-- =========================================================
-- 8. Settlement Entries
-- =========================================================

CREATE TABLE IF NOT EXISTS group_expense_settlement_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID NOT NULL REFERENCES group_expense_settlement_snapshot(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES group_expense_participant(id) ON DELETE CASCADE,
  net_amount NUMERIC(15, 2) NOT NULL,
  role group_expense_settlement_role NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_expense_settlement_entry_snapshot_participant_unique
  ON group_expense_settlement_entry(snapshot_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_settlement_entry_snapshot_id
  ON group_expense_settlement_entry(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_group_expense_settlement_entry_participant_id
  ON group_expense_settlement_entry(participant_id);

-- =========================================================
-- 9. Optional migration concept from V1
-- =========================================================

-- Each existing split_bill_session can become:
-- - 1 row in group_expense_session
-- - 1 synthetic row in group_expense_item
-- - N rows in group_expense_item_share copied from split_bill_share

-- =========================================================
-- 10. Optional verification queries
-- =========================================================

-- SELECT * FROM group_expense_session LIMIT 5;
-- SELECT * FROM group_expense_item LIMIT 5;
-- SELECT * FROM group_expense_repayment LIMIT 5;
