# Fix: Orphan Transactions & Wallet Balance Consistency

## 🐛 Masalah yang Ditemukan

### 1. Inkonsistensi Total Saldo
- **Total Saldo** dihitung dari `summary.balance` (semua transaksi tanpa filter wallet)
- **Balance per Wallet** dihitung hanya dari transaksi yang memiliki `walletId`
- Jika ada transaksi dengan `walletId = null`, maka Total Saldo ≠ Sum(Wallet Balances)

### 2. Transaksi Orphan
Transaksi dengan `walletId = null` menyebabkan:
- ✅ Dihitung di **Total Saldo**
- ❌ TIDAK dihitung di **Balance Wallet**
- ❌ Tidak terlihat di mana wallet transaksi tersebut

### 3. Wallet yang Dihapus
Ketika wallet dihapus, transaksinya menjadi orphan (walletId = null atau referensi ke wallet yang tidak ada)

---

## ✅ Solusi yang Diimplementasikan

### 1. **Total Saldo = Sum(Wallet Balances)** ✅
**File**: `src/components/dashboard/BalanceCard.tsx`

```typescript
// Calculate total balance from all wallets
const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance ?? 0), 0);
```

Sekarang Total Saldo konsisten dengan jumlah balance semua wallet.

---

### 2. **Auto-Migration saat Wallet Dihapus** ✅
**File**: `src/app/api/wallets/route.ts`

Ketika wallet dihapus:
1. Cari atau buat wallet "Others"
2. Pindahkan semua transaksi dari wallet yang dihapus ke "Others"
3. Baru hapus wallet

```typescript
// Prevent deletion of "Others" wallet
if (existingWallet.namaDompet === 'Others') {
    return NextResponse.json(
        { error: 'Cannot delete "Others" wallet. This wallet is used for orphan transactions.' },
        { status: 400 }
    );
}

// Migrate transactions before deletion
await prisma.$transaction([
    prisma.incomeTransaction.updateMany({ ... }),
    prisma.expenseTransaction.updateMany({ ... }),
    prisma.wallet.delete({ ... })
]);
```

**Fitur**:
- ✅ Transaksi tidak hilang saat wallet dihapus
- ✅ Wallet "Others" tidak bisa dihapus (protected)
- ✅ Atomic operation (semua atau tidak sama sekali)

---

### 3. **API Endpoint untuk Migrasi Transaksi Orphan** ✅
**File**: `src/app/api/migrate/orphan-transactions/route.ts`

Endpoint untuk memperbaiki transaksi orphan yang sudah ada:

```bash
POST /api/migrate/orphan-transactions
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Orphan transactions migrated successfully",
  "data": {
    "walletsCreated": 1,
    "incomeTransactionsMigrated": 150,
    "expenseTransactionsMigrated": 200,
    "totalTransactionsMigrated": 350
  }
}
```

---

## 🚀 Cara Menggunakan

### Untuk Memperbaiki Data yang Sudah Ada

#### Opsi 1: Menggunakan API Endpoint (Recommended)
```bash
# Dapatkan token dari localStorage atau cookie
curl -X POST http://localhost:3000/api/migrate/orphan-transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

#### Opsi 2: Menggunakan Browser Console
```javascript
// Jalankan di browser console saat sudah login
fetch('/api/migrate/orphan-transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 📊 Logika Bisnis Sekarang

### Total Saldo
- **Sumber**: Sum dari balance semua wallet
- **Perhitungan**: `Sum(wallet.balance)` untuk semua wallet user
- **Konsisten dengan**: Data wallet yang ditampilkan

### Balance per Wallet
- **Sumber**: `/api/wallets`
- **Perhitungan**: `Income - Expense` untuk transaksi dengan `walletId` tertentu
- **Periode**: Semua waktu

### Pemasukan & Pengeluaran
- **Sumber**: `/api/summary`
- **Perhitungan**: Total semua transaksi income/expense
- **Catatan**: Masih menghitung SEMUA transaksi (untuk statistik global)

---

## 🔒 Proteksi

### 1. Wallet "Others" Tidak Bisa Dihapus
```typescript
if (existingWallet.namaDompet === 'Others') {
    return NextResponse.json(
        { error: 'Cannot delete "Others" wallet...' },
        { status: 400 }
    );
}
```

### 2. Transaksi Otomatis Dipindahkan
Saat wallet dihapus, transaksinya otomatis dipindahkan ke "Others"

### 3. Atomic Transaction
Semua operasi migration menggunakan `prisma.$transaction()` untuk memastikan konsistensi data

---

## 📝 Catatan Penting

1. **Wallet "Others"** akan otomatis dibuat saat:
   - Menghapus wallet pertama kali
   - Menjalankan migration endpoint

2. **Transaksi Lama**: Jika ada transaksi lama dengan `walletId = null`, jalankan migration endpoint untuk memperbaikinya

3. **Setup Ulang**: Jika ingin setup ulang dengan data bersih:
   - Hapus semua wallet (transaksi akan dipindahkan ke "Others")
   - Atau jalankan migration endpoint terlebih dahulu
   - Buat wallet baru sesuai kebutuhan

---

## 🧪 Testing

### Test Case 1: Hapus Wallet dengan Transaksi
1. Buat wallet "Test"
2. Tambahkan beberapa transaksi ke wallet "Test"
3. Hapus wallet "Test"
4. ✅ Transaksi dipindahkan ke "Others"
5. ✅ Total Saldo tetap sama

### Test Case 2: Migration Orphan Transactions
1. Pastikan ada transaksi dengan `walletId = null`
2. Jalankan `POST /api/migrate/orphan-transactions`
3. ✅ Wallet "Others" dibuat
4. ✅ Semua transaksi orphan dipindahkan
5. ✅ Total Saldo sekarang konsisten

### Test Case 3: Coba Hapus Wallet "Others"
1. Coba hapus wallet "Others"
2. ✅ Error: "Cannot delete Others wallet"

---

## 📂 File yang Diubah

1. ✅ `src/components/dashboard/BalanceCard.tsx` - Total Saldo dari sum wallet balances
2. ✅ `src/app/api/wallets/route.ts` - Auto-migration saat delete wallet
3. ✅ `src/app/api/migrate/orphan-transactions/route.ts` - Endpoint migration (NEW)
4. ✅ `scripts/migrate-orphan-transactions.ts` - Script migration (untuk referensi)
5. ✅ `docs/ORPHAN_TRANSACTIONS_FIX.md` - Dokumentasi ini

---

## 🎯 Next Steps (Opsional)

### 1. Tambahkan UI untuk Migration
Buat tombol di Settings untuk menjalankan migration:
```typescript
<Button onClick={handleMigrateOrphanTransactions}>
  Perbaiki Transaksi Orphan
</Button>
```

### 2. Tambahkan Notifikasi
Tampilkan notifikasi jika ada transaksi orphan yang perlu diperbaiki

### 3. Tambahkan Validasi
Pastikan setiap transaksi baru HARUS memiliki `walletId`

---

## ❓ FAQ

**Q: Kenapa Total Saldo saya Rp 0 tapi Pemasukan/Pengeluaran ada angkanya?**
A: Kemungkinan ada transaksi orphan (walletId = null). Jalankan migration endpoint untuk memperbaikinya.

**Q: Apakah aman menjalankan migration berkali-kali?**
A: Ya, aman. Script akan skip jika tidak ada transaksi orphan.

**Q: Apakah wallet "Others" bisa diganti nama?**
A: Bisa, tapi tidak disarankan karena akan mempengaruhi logika proteksi.

**Q: Bagaimana jika saya ingin hapus semua data dan mulai fresh?**
A: Hapus semua transaksi dari database, lalu hapus semua wallet kecuali "Others".
