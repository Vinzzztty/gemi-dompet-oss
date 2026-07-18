# Default Wallet Strategy - "Others" Wallet

## 📋 Overview

Setiap user **otomatis mendapatkan wallet "Others"** saat pertama kali register. Wallet ini berfungsi sebagai:
- ✅ **Default wallet** untuk user baru
- ✅ **Fallback wallet** untuk transaksi orphan
- ✅ **Safe container** untuk transaksi dari wallet yang dihapus

---

## 🔄 Kapan Wallet "Others" Dibuat?

### 1. **Saat User Register** (Automatic) ✅
**File**: `src/app/api/auth/register/route.ts`

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create user
  const user = await tx.userAccount.create({ ... });

  // Create default "Others" wallet
  await tx.wallet.create({
    data: {
      userId: user.id,
      namaDompet: 'Others',
      norek: null,
    },
  });

  return user;
});
```

**Keuntungan**:
- ✅ User langsung punya wallet default
- ✅ Tidak ada orphan transactions dari awal
- ✅ Atomic operation (user + wallet dibuat bersamaan)

---

### 2. **Saat Wallet Dihapus** (Automatic) ✅
**File**: `src/app/api/wallets/route.ts`

Ketika user menghapus wallet (misalnya "BCA", "Jago"):
1. Cek apakah wallet "Others" sudah ada
2. Jika belum, buat wallet "Others"
3. Pindahkan semua transaksi ke "Others"
4. Hapus wallet yang diminta

```typescript
// Find or create "Others" wallet
let othersWallet = await prisma.wallet.findFirst({
  where: { userId, namaDompet: 'Others' }
});

if (!othersWallet) {
  othersWallet = await prisma.wallet.create({
    data: { userId, namaDompet: 'Others', norek: null }
  });
}

// Migrate transactions
await prisma.$transaction([
  prisma.incomeTransaction.updateMany({ ... }),
  prisma.expenseTransaction.updateMany({ ... }),
  prisma.wallet.delete({ where: { id } })
]);
```

---

### 3. **Saat Migration Manual** (Manual) 📝
**File**: `scripts/migrate-orphan-transactions-simple.sql`

Untuk user lama yang belum punya wallet "Others":

```sql
INSERT INTO wallet (id, user_id, nama_dompet, norek, created_at, updated_at)
SELECT gen_random_uuid(), ua.id, 'Others', NULL, NOW(), NOW()
FROM user_account ua
WHERE NOT EXISTS (
    SELECT 1 FROM wallet w 
    WHERE w.user_id = ua.id AND w.nama_dompet = 'Others'
);
```

---

## 🔒 Proteksi Wallet "Others"

### 1. **Tidak Bisa Dihapus**
```typescript
if (existingWallet.namaDompet === 'Others') {
    return NextResponse.json(
        { error: 'Cannot delete "Others" wallet. This wallet is used for orphan transactions.' },
        { status: 400 }
    );
}
```

### 2. **Selalu Ada untuk Setiap User**
- User baru: Dibuat saat register
- User lama: Dibuat saat pertama kali hapus wallet atau migration

### 3. **Atomic Creation**
Wallet "Others" selalu dibuat dalam transaction untuk memastikan konsistensi data

---

## 📊 Use Cases

### Use Case 1: User Baru Register
```
1. User register dengan email & password
2. System create user account
3. System create wallet "Others" (automatic)
4. User langsung punya 1 wallet default
```

### Use Case 2: User Hapus Wallet
```
1. User punya wallet: Cash, BCA, Jago
2. User hapus wallet "BCA"
3. System cek: apakah "Others" sudah ada?
4. Jika belum, create wallet "Others"
5. Pindahkan semua transaksi dari "BCA" ke "Others"
6. Hapus wallet "BCA"
7. User sekarang punya: Cash, Jago, Others
```

### Use Case 3: Import Transaksi CSV
```
1. User import CSV dengan transaksi tanpa wallet
2. System assign semua transaksi ke wallet "Others"
3. User bisa manual pindahkan ke wallet lain jika perlu
```

---

## 🎯 Best Practices

### 1. **Jangan Rename Wallet "Others"**
Nama "Others" digunakan untuk identifikasi di code. Jika diganti, proteksi tidak akan bekerja.

### 2. **Gunakan "Others" sebagai Temporary Wallet**
- ✅ Untuk transaksi yang belum jelas walletnya
- ✅ Untuk hasil import CSV
- ✅ Untuk transaksi dari wallet yang dihapus

### 3. **Pindahkan Transaksi ke Wallet yang Tepat**
Setelah transaksi masuk ke "Others", user bisa manual pindahkan ke wallet yang sesuai.

---

## 🔄 Migration untuk User Lama

Jika kamu punya user lama yang belum punya wallet "Others", ada 3 cara:

### Opsi 1: SQL Script (Recommended)
```bash
# Jalankan di database client
scripts/migrate-orphan-transactions-simple.sql
```

### Opsi 2: API Endpoint
```bash
curl -X POST http://localhost:3000/api/migrate/orphan-transactions \
  -H "Authorization: Bearer TOKEN"
```

### Opsi 3: Tunggu User Hapus Wallet
Wallet "Others" akan otomatis dibuat saat user pertama kali hapus wallet.

---

## 📈 Database Schema

```sql
-- Wallet "Others" structure
CREATE TABLE wallet (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_account(id),
    nama_dompet VARCHAR(255) NOT NULL,  -- 'Others'
    norek VARCHAR(100),                  -- NULL
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_wallet_user_id ON wallet(user_id);
CREATE INDEX idx_wallet_nama_dompet ON wallet(nama_dompet);
```

---

## ✅ Verification

### Check if User Has "Others" Wallet
```sql
SELECT 
    ua.email,
    w.nama_dompet,
    w.created_at
FROM wallet w
JOIN user_account ua ON w.user_id = ua.id
WHERE w.nama_dompet = 'Others'
ORDER BY ua.email;
```

### Check Users Without "Others" Wallet
```sql
SELECT 
    ua.email,
    ua.created_at
FROM user_account ua
WHERE NOT EXISTS (
    SELECT 1 FROM wallet w 
    WHERE w.user_id = ua.id AND w.nama_dompet = 'Others'
);
```

---

## 🚀 Future Enhancements (Optional)

### 1. **Multiple Default Wallets**
Bisa tambahkan wallet default lain saat register:
- "Cash" - untuk transaksi tunai
- "Bank" - untuk transaksi bank
- "E-Wallet" - untuk transaksi digital

### 2. **Custom Default Wallet**
User bisa pilih wallet mana yang jadi default untuk transaksi baru.

### 3. **Auto-Categorize to Wallet**
System bisa otomatis assign transaksi ke wallet berdasarkan kategori atau pattern.

---

## 📝 Summary

| Aspect | Detail |
|--------|--------|
| **Nama Wallet** | "Others" (fixed, jangan diganti) |
| **Dibuat Kapan** | Saat register, saat hapus wallet, atau manual migration |
| **Bisa Dihapus?** | ❌ Tidak (protected) |
| **Bisa Direname?** | ⚠️ Bisa, tapi tidak disarankan |
| **Fungsi** | Default wallet, fallback untuk orphan transactions |
| **Transaksi** | Bisa dipindahkan ke wallet lain secara manual |

---

**Last Updated**: 2026-01-26
