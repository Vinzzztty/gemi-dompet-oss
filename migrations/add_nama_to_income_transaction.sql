-- Migration: Add nama column to income_transaction table
-- Description: Add dedicated 'nama' field for transaction names
-- Date: 2026-01-10

-- Add nama column
ALTER TABLE income_transaction 
ADD COLUMN IF NOT EXISTS nama VARCHAR(255);

-- Optional: Set default value for existing records
-- UPDATE income_transaction 
-- SET nama = catatan 
-- WHERE nama IS NULL AND catatan IS NOT NULL;

-- Optional: Add index for better query performance
-- CREATE INDEX IF NOT EXISTS idx_income_transaction_nama 
-- ON income_transaction(nama);

-- Verify the column was added
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'income_transaction' 
-- AND column_name = 'nama';
