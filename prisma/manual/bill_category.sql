-- Kolom kategori (EXPENSE) untuk tagihan — jalankan manual, lalu npx prisma generate

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bill'
      AND column_name = 'category_id'
  ) THEN
    ALTER TABLE bill
      ADD COLUMN category_id uuid REFERENCES category (id) ON DELETE SET NULL;

    CREATE INDEX idx_bill_category_id ON bill (category_id);
  END IF;
END
$$;
