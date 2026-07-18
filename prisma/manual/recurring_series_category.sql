-- Kategori (EXPENSE) untuk template tagihan bulanan — jalankan manual, lalu npx prisma generate

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'recurring_bill_series'
      AND column_name = 'category_id'
  ) THEN
    ALTER TABLE recurring_bill_series
      ADD COLUMN category_id uuid REFERENCES category (id) ON DELETE SET NULL;

    CREATE INDEX idx_recurring_series_category_id ON recurring_bill_series (category_id);
  END IF;
END
$$;
