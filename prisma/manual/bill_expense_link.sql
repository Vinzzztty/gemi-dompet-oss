-- Link Bill → ExpenseTransaction (pembayaran tagihan → pengeluaran).
-- Jalankan manual di PostgreSQL, lalu: npx prisma generate

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bill'
      AND column_name = 'expense_transaction_id'
  ) THEN
    ALTER TABLE bill
      ADD COLUMN expense_transaction_id uuid UNIQUE
      REFERENCES expense_transaction (id) ON DELETE SET NULL;
  END IF;
END
$$;
