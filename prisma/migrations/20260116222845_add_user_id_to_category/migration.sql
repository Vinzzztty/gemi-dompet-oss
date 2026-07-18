-- AddUserIdToCategory
-- Add user_id column to category table to support multi-user categories

-- Step 1: Add user_id column as nullable
ALTER TABLE "category" ADD COLUMN "user_id" uuid;

-- Step 2: Add foreign key constraint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Create index for better query performance
CREATE INDEX "idx_category_user_id" ON "category"("user_id");

-- Step 4: Drop old unique constraint
ALTER TABLE "category" DROP CONSTRAINT "name_type";

-- Step 5: Create new unique constraint including user_id
ALTER TABLE "category" ADD CONSTRAINT "user_name_type" UNIQUE ("user_id", "name", "type");

-- IMPORTANT: After running this migration, you need to:
-- 1. Update existing categories to have user_id (if any exist)
-- 2. Optionally make user_id NOT NULL after data migration
