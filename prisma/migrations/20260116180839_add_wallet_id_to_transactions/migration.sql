-- AlterTable: Add wallet_id column to income_transaction
-- Note: This migration assumes you will manually set wallet_id for existing records
-- or you can add a default wallet for each user first

-- Add wallet_id column to income_transaction (nullable first)
ALTER TABLE "income_transaction" ADD COLUMN "wallet_id" UUID;

-- Add wallet_id column to expense_transaction (nullable first)
ALTER TABLE "expense_transaction" ADD COLUMN "wallet_id" UUID;

-- Create indexes
CREATE INDEX "idx_income_wallet_id" ON "income_transaction"("wallet_id");
CREATE INDEX "idx_expense_wallet_id" ON "expense_transaction"("wallet_id");

-- Add foreign key constraints
ALTER TABLE "income_transaction" ADD CONSTRAINT "income_transaction_wallet_id_fkey" 
    FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expense_transaction" ADD CONSTRAINT "expense_transaction_wallet_id_fkey" 
    FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IMPORTANT: After running this migration, you need to:
-- 1. Create a default wallet for each user OR
-- 2. Update existing transactions to reference appropriate wallets
-- 3. Then run another migration to make wallet_id NOT NULL
