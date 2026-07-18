-- Manual migration: Manajemen Tagihan (Bills) — jalankan di PostgreSQL (shared DB).
-- Setelah sukses: npx prisma generate
--
-- Jika UI SQL error tanpa detail: jalankan per blok (satu DO / satu CREATE) atau pakai psql
-- untuk melihat pesan asli (mis. type "bill_status" already exists).
--
-- gen_random_uuid(): di PostgreSQL 13+ tersedia tanpa extension.
-- Jika error "function gen_random_uuid() does not exist":
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum status pembayaran (idempotent — aman dijalankan ulang)
DO $$
BEGIN
  CREATE TYPE bill_status AS ENUM ('UNPAID', 'PAID');
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END
$$;

-- Template tagihan bulanan
CREATE TABLE IF NOT EXISTS recurring_bill_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_account (id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  amount decimal(15, 2) NOT NULL,
  day_of_month integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT chk_recurring_day_of_month CHECK (
    day_of_month >= 1
    AND day_of_month <= 31
  )
);

CREATE INDEX IF NOT EXISTS idx_recurring_series_user_id ON recurring_bill_series (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_series_active ON recurring_bill_series (is_active);

-- Instance tagihan (sekali bayar: series_id NULL; bulanan: FK ke recurring_bill_series)
CREATE TABLE IF NOT EXISTS bill (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_account (id) ON DELETE CASCADE,
  series_id uuid REFERENCES recurring_bill_series (id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  amount decimal(15, 2) NOT NULL,
  due_date date NOT NULL,
  status bill_status NOT NULL DEFAULT 'UNPAID',
  paid_at timestamp,
  notes text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bill_user_id ON bill (user_id);
CREATE INDEX IF NOT EXISTS idx_bill_user_due_date ON bill (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_bill_user_status ON bill (user_id, status);
CREATE INDEX IF NOT EXISTS idx_bill_series_id ON bill (series_id);

-- Catatan: updated_at di-update oleh Prisma (@updatedAt), tanpa trigger DB.
