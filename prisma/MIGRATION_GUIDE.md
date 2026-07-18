# Migration Guide: Add user_id to Category

## ⚠️ PENTING - Shared Database

Karena menggunakan **shared database**, migration harus dilakukan dengan **hati-hati** dan **manual**.

## Langkah-langkah Aman:

### 1. **Backup Data Terlebih Dahulu** (WAJIB!)
```sql
-- Export data category yang ada
SELECT * FROM "category";
```

### 2. **Cek User ID yang Ada**
```sql
-- Lihat user ID yang tersedia
SELECT id, email, full_name FROM "user_account";
```

### 3. **Jalankan Migration File**

Buka file: `prisma/migrations/add_user_id_to_category.sql`

**Review terlebih dahulu**, kemudian jalankan di database Anda.

### 4. **Assign Kategori yang Sudah Ada ke User**

Setelah migration berhasil, assign semua kategori existing ke user:

```sql
-- Ganti 'YOUR_USER_ID_HERE' dengan user ID yang sebenarnya
UPDATE "category" 
SET "user_id" = 'YOUR_USER_ID_HERE' 
WHERE "user_id" IS NULL;
```

### 5. **Verifikasi Data**
```sql
-- Pastikan semua kategori sudah punya user_id
SELECT id, name, type, user_id FROM "category" WHERE user_id IS NULL;
```

### 6. **(Opsional) Set user_id sebagai NOT NULL**

Setelah semua kategori punya user_id:

```sql
ALTER TABLE "category" 
ALTER COLUMN "user_id" SET NOT NULL;
```

### 7. **Generate Prisma Client**
```bash
npx prisma generate
```

## Rollback (Jika Ada Masalah)

Jika ada masalah, jalankan rollback:

```sql
-- Hapus constraint dan index baru
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "user_name_type";
ALTER TABLE "category" DROP CONSTRAINT IF EXISTS "category_user_id_fkey";
DROP INDEX IF EXISTS "idx_category_user_id";

-- Hapus kolom user_id
ALTER TABLE "category" DROP COLUMN IF EXISTS "user_id";

-- Restore unique constraint lama
ALTER TABLE "category" ADD CONSTRAINT "name_type" UNIQUE ("name", "type");
```

## Perubahan Schema

### Before:
```prisma
model Category {
  id        String       @id
  name      String
  type      CategoryType
  // ...
  
  @@unique([name, type], name: "name_type")
}
```

### After:
```prisma
model Category {
  id        String       @id
  userId    String       @map("user_id")
  name      String
  type      CategoryType
  // ...
  
  user      UserAccount  @relation(...)
  
  @@unique([userId, name, type], name: "user_name_type")
}
```

## Dampak pada Aplikasi

Setelah migration, aplikasi akan:
- ✅ Setiap kategori terikat dengan user tertentu
- ✅ User hanya bisa melihat kategori milik mereka sendiri
- ✅ Nama kategori bisa duplicate antar user yang berbeda
- ✅ Auto-create kategori saat import CSV akan tersimpan per user

## Testing

Setelah migration selesai, test:
1. ✓ Login dan cek kategori tampil
2. ✓ Buat kategori baru
3. ✓ Edit kategori existing
4. ✓ Import CSV dengan auto-create kategori
5. ✓ Buat transaksi dengan kategori

---

**⚠️ CATATAN PENTING:**
- Migration ini AMAN karena tidak drop table atau data
- user_id dibuat NULLABLE dulu untuk keamanan
- Review SQL sebelum dijalankan
- Pastikan backup data sebelum migration
