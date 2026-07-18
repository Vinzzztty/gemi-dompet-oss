-- Manual migration: Split Bill Session (shared DB / run manually in PostgreSQL)
-- ============================================================================
-- What this creates:
-- 1. ENUM split_bill_session_status
-- 2. TABLE split_bill_session
-- 3. TABLE split_bill_participant
-- 4. TABLE split_bill_share
--
-- Notes:
-- - `id` tetap internal UUID.
-- - `session_code` adalah kode publik yang dibagikan owner ke member.
-- - Member guest boleh join tanpa akun, jadi `split_bill_participant.user_id` nullable.
-- - `gen_random_uuid()` dipakai, jadi pastikan extension pgcrypto sudah tersedia
--   (di database ini seharusnya sudah ada karena tabel existing juga memakainya).
-- ============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'split_bill_session_status'
  ) THEN
    CREATE TYPE split_bill_session_status AS ENUM (
      'OPEN',
      'CLOSED',
      'ARCHIVED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS split_bill_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
  session_code VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
  status split_bill_session_status NOT NULL DEFAULT 'OPEN',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS split_bill_participant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES split_bill_session(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES user_account(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  joined_via_code BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS split_bill_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES split_bill_session(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES split_bill_participant(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS split_bill_session_session_code_unique
  ON split_bill_session(session_code);

CREATE INDEX IF NOT EXISTS idx_split_bill_session_owner_user_id
  ON split_bill_session(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_split_bill_session_status
  ON split_bill_session(status);

CREATE UNIQUE INDEX IF NOT EXISTS split_bill_participant_session_user_unique
  ON split_bill_participant(session_id, user_id);

CREATE INDEX IF NOT EXISTS idx_split_bill_participant_session_id
  ON split_bill_participant(session_id);

CREATE INDEX IF NOT EXISTS idx_split_bill_participant_user_id
  ON split_bill_participant(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS split_bill_share_session_participant_unique
  ON split_bill_share(session_id, participant_id);

CREATE INDEX IF NOT EXISTS idx_split_bill_share_session_id
  ON split_bill_share(session_id);

CREATE INDEX IF NOT EXISTS idx_split_bill_share_participant_id
  ON split_bill_share(participant_id);

COMMIT;

-- Optional verification
-- SELECT * FROM split_bill_session LIMIT 5;
-- SELECT * FROM split_bill_participant LIMIT 5;
-- SELECT * FROM split_bill_share LIMIT 5;
