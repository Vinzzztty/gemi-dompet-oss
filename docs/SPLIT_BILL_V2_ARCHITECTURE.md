# Split Bill V2 Architecture

## Context

`Split Bill v1` yang sudah ada di project ini cocok untuk kasus:

- 1 session
- 1 total tagihan
- 1 pembagian akhir

Kebutuhan produk berikutnya lebih besar dari itu:

- 1 event / trip / talangan session
- banyak pengeluaran kecil per lokasi atau per momen
- payer bisa berganti-ganti
- peserta yang ikut split pada tiap item bisa berbeda
- posisi utang harus bisa dipantau live
- session bisa difinalkan kapan saja tanpa wajib menunggu akhir perjalanan

Contoh:

- `Trip Jogja`
- Lokasi A: `Rp 300.000`, dibayar Kevin, split untuk 5 orang
- Lokasi B: `Rp 400.000`, dibayar Budi, split untuk 4 orang
- Lokasi C: `Rp 150.000`, dibayar Kevin, split untuk 2 orang
- Lalu sistem menghitung siapa talang berapa, siapa utang berapa, dan siapa perlu bayar ke siapa

## Product Direction

Untuk kebutuhan ini, istilah domain yang lebih tepat adalah:

- `Group Expense Session` untuk container event atau trip
- `Expense Item` untuk setiap talangan / pengeluaran
- `Expense Share` untuk pembagian per peserta di setiap item
- `Repayment` untuk pembayaran balik antar peserta
- `Settlement Snapshot` untuk hasil finalisasi pada titik waktu tertentu

`Split bill` tetap bisa dipakai sebagai nama fitur di UI, tetapi model datanya sebaiknya bergeser dari `single total split` menjadi `ongoing group expense tracking`.

## Main Goals

- Mendukung talangan bertahap selama session berjalan
- Mendukung payer yang berbeda-beda
- Mendukung subset peserta untuk item tertentu
- Menampilkan live summary siapa harus terima dan siapa harus bayar
- Mengizinkan finalisasi sebagian atau penuh tanpa menghapus histori item
- Tetap kompatibel dengan pola guest participant tanpa akun

## Proposed Domain Model

### 1. GroupExpenseSession

Mewakili 1 event / trip / talangan besar.

Field inti:

- `id`
- `ownerUserId`
- `sessionCode`
- `title`
- `currency`
- `status`
- `notes`
- `startedAt`
- `endedAt`
- `createdAt`
- `updatedAt`

Catatan:

- `status` tidak lagi sekadar open/closed, tapi lebih cocok untuk lifecycle session.
- `startedAt` dan `endedAt` berguna untuk event/trip nyata.

### 2. GroupExpenseParticipant

Peserta di dalam session.

Field inti:

- `id`
- `sessionId`
- `userId` nullable
- `displayName`
- `isOwner`
- `joinedViaCode`
- `createdAt`
- `updatedAt`

Catatan:

- Tetap mendukung guest member tanpa akun.
- `userId` nullable tetap dipertahankan.

### 3. GroupExpenseItem

Satu talangan / satu pengeluaran nyata.

Field inti:

- `id`
- `sessionId`
- `paidByParticipantId`
- `title`
- `locationLabel` nullable
- `amount`
- `currency`
- `incurredAt`
- `notes`
- `splitMode`
- `status`
- `createdAt`
- `updatedAt`

Catatan:

- `title` bisa berupa `Parkir Malioboro`, `Lunch Lokasi B`, `Tiket Candi`.
- `locationLabel` opsional untuk grouping cepat.
- `splitMode` berguna untuk mengetahui item ini dibuat `equal` atau `manual`.
- `status` berguna bila nanti item bisa dibatalkan tanpa hard delete.

### 4. GroupExpenseItemShare

Pembagian nominal item ke peserta tertentu.

Field inti:

- `id`
- `itemId`
- `participantId`
- `amount`
- `notes`
- `createdAt`
- `updatedAt`

Catatan:

- Semua kalkulasi utang live sebaiknya dibangun dari tabel ini.
- Untuk split rata, backend cukup generate nominal otomatis ke setiap peserta yang dipilih.
- Untuk split manual, backend simpan nominal final hasil edit.

### 5. GroupExpenseRepayment

Histori ketika seseorang sudah membayar balik ke orang lain.

Field inti:

- `id`
- `sessionId`
- `fromParticipantId`
- `toParticipantId`
- `amount`
- `currency`
- `paidAt`
- `notes`
- `createdAt`
- `updatedAt`

Catatan:

- Ini penting supaya fitur tidak berhenti di `siapa utang berapa`, tetapi juga bisa memonitor `sudah dibayar atau belum`.

### 6. GroupExpenseSettlementSnapshot

Snapshot finalisasi pada titik waktu tertentu.

Field inti:

- `id`
- `sessionId`
- `label`
- `snapshotAt`
- `notes`
- `createdByUserId`
- `createdAt`

### 7. GroupExpenseSettlementEntry

Baris hasil settlement dari snapshot.

Field inti:

- `id`
- `snapshotId`
- `participantId`
- `netAmount`
- `role`
- `createdAt`

Catatan:

- `role` bernilai `RECEIVABLE`, `PAYABLE`, atau `SETTLED`.

## Proposed Status Enums

### Session Status

- `ACTIVE`
- `FROZEN`
- `SETTLED`
- `ARCHIVED`

Makna:

- `ACTIVE`: session masih berjalan, item baru masih boleh ditambah
- `FROZEN`: sementara dikunci untuk review/finalisasi
- `SETTLED`: settlement final sudah dibuat dan session selesai
- `ARCHIVED`: histori lama, hanya read-only

### Expense Item Status

- `ACTIVE`
- `VOID`

Makna:

- `ACTIVE`: item berlaku di perhitungan
- `VOID`: item dibatalkan tapi histori tetap ada

### Split Mode

- `EQUAL`
- `MANUAL`

### Settlement Entry Role

- `RECEIVABLE`
- `PAYABLE`
- `SETTLED`

## Live Calculation Rules

Semua monitoring live dapat dihitung dari tiga sumber:

- `GroupExpenseItem.amount`
- `GroupExpenseItemShare.amount`
- `GroupExpenseRepayment.amount`

Per participant:

- `grossPaid` = total item yang dibayar participant
- `grossConsumed` = total share item milik participant
- `repaidOut` = total repayment dari participant ke participant lain
- `repaidIn` = total repayment yang diterima participant

Rumus:

`netBalance = grossPaid + repaidIn - grossConsumed - repaidOut`

Interpretasi:

- `netBalance > 0`: participant harus menerima uang
- `netBalance < 0`: participant masih berutang
- `netBalance = 0`: sudah seimbang

## Recommended Settlement Algorithm

Saat user menekan `Finalize Talangan`, backend:

1. hitung `netBalance` semua participant
2. buat daftar `creditors` (`netBalance > 0`)
3. buat daftar `debtors` (`netBalance < 0`)
4. lakukan greedy matching:
   - debtor bayar ke creditor
   - nominal transfer = `min(abs(debtor), creditor)`
   - update sisa masing-masing
5. simpan snapshot settlement

Hasil ini bisa dipakai untuk UI:

- `Budi bayar Kevin Rp 220.000`
- `Rina bayar Kevin Rp 80.000`

## API Contract Draft

### Session

- `POST /api/group-expense/sessions`
- `GET /api/group-expense/sessions`
- `GET /api/group-expense/sessions/:sessionCode`
- `PATCH /api/group-expense/sessions/:sessionCode`

### Participants

- `POST /api/group-expense/sessions/:sessionCode/participants`
- `DELETE /api/group-expense/sessions/:sessionCode/participants/:participantId`

### Expense Items

- `POST /api/group-expense/sessions/:sessionCode/items`
- `GET /api/group-expense/sessions/:sessionCode/items`
- `PUT /api/group-expense/sessions/:sessionCode/items/:itemId`
- `DELETE /api/group-expense/sessions/:sessionCode/items/:itemId`
- `POST /api/group-expense/sessions/:sessionCode/items/:itemId/shares/equal`
- `PUT /api/group-expense/sessions/:sessionCode/items/:itemId/shares/manual`

### Repayments

- `POST /api/group-expense/sessions/:sessionCode/repayments`
- `GET /api/group-expense/sessions/:sessionCode/repayments`

### Summary & Finalization

- `GET /api/group-expense/sessions/:sessionCode/summary`
- `POST /api/group-expense/sessions/:sessionCode/finalize`
- `GET /api/group-expense/sessions/:sessionCode/settlements`

## UI Direction

### Hub Page

List session seperti sekarang, tetapi summary card lebih cocok menampilkan:

- total active session
- total outstanding
- total participant across sessions

### Session Detail Page

Halaman session sebaiknya bergeser dari `single total split` menjadi beberapa blok:

1. `Overview`
   - title
   - status
   - total talangan
   - total repayment
   - outstanding summary

2. `Participants`
   - list peserta
   - live net balance per peserta

3. `Expense Items`
   - list item per lokasi / waktu
   - add/edit/void item
   - siapa talang
   - split untuk siapa

4. `Repayments`
   - siapa sudah bayar balik ke siapa

5. `Settlement`
   - rekomendasi transfer hasil finalisasi

## Why V2 Should Coexist With V1 First

Jangan langsung mengubah tabel `split_bill_session` v1 yang sekarang dipakai UI MVP.

Strategi aman:

- biarkan v1 tetap hidup
- tambahkan tabel v2 baru dengan namespace berbeda
- implement UI v2 di route baru atau lewat feature flag
- setelah stabil, baru tentukan apakah v1 akan dimigrasikan, disembunyikan, atau dipensiunkan

Alasannya:

- v1 sudah punya alur create/join/share yang berjalan
- v2 punya domain berbeda dan lebih kompleks
- migrasi sekaligus akan membuat debugging jauh lebih sulit

## Migration Strategy Recommendation

### Phase 1

- pertahankan `split_bill_*` v1
- tambahkan `group_expense_*` v2
- bangun API + UI v2 tanpa menyentuh flow lama

### Phase 2

- sediakan migration helper opsional dari `split_bill_session` ke `group_expense_session`
- setiap session v1 menjadi 1 session v2
- `totalAmount` v1 menjadi 1 synthetic item bernama `Migrated total from v1`
- share v1 menjadi `group_expense_item_share`

### Phase 3

- evaluasi apakah session baru harus selalu memakai v2
- jika iya, jadikan v2 sebagai default UX

## Prisma Draft

Draft ini belum dimasukkan ke `prisma/schema.prisma` aktif agar branch implementasi sekarang tetap stabil.

```prisma
enum GroupExpenseSessionStatus {
  ACTIVE
  FROZEN
  SETTLED
  ARCHIVED

  @@map("group_expense_session_status")
}

enum GroupExpenseItemStatus {
  ACTIVE
  VOID

  @@map("group_expense_item_status")
}

enum GroupExpenseSplitMode {
  EQUAL
  MANUAL

  @@map("group_expense_split_mode")
}

enum GroupExpenseSettlementRole {
  RECEIVABLE
  PAYABLE
  SETTLED

  @@map("group_expense_settlement_role")
}
```

Model inti:

- `GroupExpenseSession`
- `GroupExpenseParticipant`
- `GroupExpenseItem`
- `GroupExpenseItemShare`
- `GroupExpenseRepayment`
- `GroupExpenseSettlementSnapshot`
- `GroupExpenseSettlementEntry`

## Recommendation

Untuk kebutuhan produk yang kamu jelaskan, v2 sebaiknya diperlakukan sebagai fitur baru:

- `Talangan Trip / Group Expense`

Bukan sekadar evolusi kecil dari:

- `Split Bill Total`

Dengan begitu, fitur akan terasa natural untuk monitoring selama perjalanan, bukan cuma jadi form pembagian di akhir.
