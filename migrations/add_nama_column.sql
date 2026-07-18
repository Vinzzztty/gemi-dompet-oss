-- Migration: Add nama field to income_transaction
-- Date: 2026-01-10
-- Description: Add transaction name field

BEGIN;

-- Add nama column
ALTER TABLE income_transaction 
ADD COLUMN nama VARCHAR(255);

-- Optional: Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_income_transaction_nama 
ON income_transaction(nama);

COMMIT;

-- Verify
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'income_transaction' 
AND column_name = 'nama';
