# Database Migration - Add Nama Field

## Migration File
`migrations/add_nama_to_income_transaction.sql`

## What This Does
Adds a `nama` (VARCHAR 255) column to the `income_transaction` table for storing transaction names.

## How to Run

### Option 1: Supabase Dashboard (Easiest)
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from `migrations/add_nama_to_income_transaction.sql`
5. Click "Run" or press `Ctrl+Enter`
6. Verify success message

### Option 2: psql Command Line
```bash
psql -h <your-host> -U postgres -d <your-database> -f migrations/add_nama_to_income_transaction.sql
```

### Option 3: Supabase CLI
```bash
supabase migration new add_nama_to_income_transaction
# Copy SQL content to the generated file
supabase db push
```

## Verification

After running the migration, verify with:
```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'income_transaction' 
AND column_name = 'nama';
```

You should see:
```
 column_name | data_type | character_maximum_length 
-------------+-----------+-------------------------
 nama        | varchar   | 255
```

## Optional: Migrate Existing Data

If you want to copy existing `catatan` values to `nama` for old records:
```sql
UPDATE income_transaction 
SET nama = catatan 
WHERE nama IS NULL AND catatan IS NOT NULL;
```

## After Migration

1. ✅ Column `nama` is now available
2. ✅ Frontend code already updated to use `nama`
3. ✅ Forms will start saving transaction names
4. ✅ Old transactions will have NULL nama (will use category name as fallback)

## Rollback (if needed)

If you need to remove the column:
```sql
ALTER TABLE income_transaction 
DROP COLUMN IF EXISTS nama;
```

⚠️ **Warning**: This will delete all nama data!
