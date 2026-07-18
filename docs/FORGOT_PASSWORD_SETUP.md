# Setup Forgot Password Feature

Fitur forgot password telah ditambahkan ke aplikasi Gemi Dompet. Berikut adalah langkah-langkah untuk mengaktifkannya.

## 📋 Prerequisites

1. **Resend API Key** - Dapatkan dari [resend.com](https://resend.com)
   - Sign up gratis (3,000 emails/bulan)
   - Verifikasi domain atau gunakan sandbox mode untuk testing

## 🔧 Setup Instructions

### 1. Update Environment Variables

Tambahkan variable berikut ke file `.env` Anda:

```env
# Resend Email Configuration
RESEND_API_KEY="re_your_actual_api_key_here"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Application URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # Ganti dengan domain production saat deploy
```

**Catatan:**
- `RESEND_API_KEY`: API key dari Resend dashboard
- `RESEND_FROM_EMAIL`: Email pengirim (harus verified domain, atau gunakan `onboarding@resend.dev` untuk testing)
- `NEXT_PUBLIC_APP_URL`: URL aplikasi Anda (untuk generate reset link)

### 2. Run Database Migration

**⚠️ PENTING: Karena menggunakan SharedDB, review SQL migration terlebih dahulu!**

File migration ada di: `prisma/migrations/manual_add_password_reset_token.sql`

**Opsi A: Via Prisma Migrate (Recommended jika punya akses penuh)**
```bash
npx prisma migrate deploy
```

**Opsi B: Manual SQL Execution (Untuk SharedDB)**
1. Buka file `prisma/migrations/manual_add_password_reset_token.sql`
2. Review SQL query
3. Execute via database client (pgAdmin, DBeaver, atau psql):
   ```bash
   psql -h your_host -U your_user -d gemi_dompet_db -f prisma/migrations/manual_add_password_reset_token.sql
   ```

### 3. Regenerate Prisma Client

Setelah migration berhasil, regenerate Prisma client:

```bash
npx prisma generate
```

### 4. Restart Development Server

```bash
npm run dev
```

## 🧪 Testing

### 1. Test Forgot Password Flow

1. Buka `http://localhost:3000/login`
2. Klik "Lupa Password?"
3. Masukkan email yang terdaftar
4. Check email inbox (atau Resend dashboard untuk logs)
5. Klik link di email
6. Set password baru
7. Login dengan password baru

### 2. Test Email Delivery

Jika menggunakan sandbox mode Resend:
- Email hanya akan terkirim ke email yang verified di Resend dashboard
- Check Resend dashboard > Emails untuk melihat email yang terkirim

## 🎨 Features Included

✅ **Forgot Password Page** (`/forgot-password`)
- Modern UI matching login design
- Email validation
- Success state with instructions

✅ **Reset Password Page** (`/reset-password?token=xxx`)
- Token validation
- Password strength indicator
- Confirmation matching
- Expiration handling (1 hour)

✅ **Security Features**
- Secure random token generation (32 bytes)
- Token expiration (1 hour)
- One-time use tokens
- Email enumeration prevention
- Password hashing with bcrypt

✅ **Email Template**
- Professional HTML email
- Responsive design
- Clear CTA button
- Security warnings
- Fallback plain link

## 🔐 Security Considerations

1. **Token Expiration**: Tokens expire after 1 hour
2. **One-time Use**: Tokens can only be used once
3. **Secure Generation**: Uses crypto.randomBytes for token generation
4. **Email Enumeration Prevention**: Always returns success message regardless of email existence
5. **Old Token Cleanup**: Deletes previous unused tokens when new request is made

## 📱 User Flow

```
1. User clicks "Lupa Password?" on login page
   ↓
2. User enters email address
   ↓
3. System generates secure token and sends email
   ↓
4. User receives email with reset link
   ↓
5. User clicks link (valid for 1 hour)
   ↓
6. User enters new password (min 6 chars)
   ↓
7. System validates token and updates password
   ↓
8. User redirected to login with new password
```

## 🚀 Production Deployment

Saat deploy ke production:

1. **Update Environment Variables**:
   ```env
   RESEND_API_KEY="re_production_key"
   RESEND_FROM_EMAIL="noreply@yourdomain.com"  # Must be verified domain
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

2. **Verify Domain di Resend**:
   - Add domain di Resend dashboard
   - Add DNS records (SPF, DKIM, DMARC)
   - Wait for verification

3. **Test Email Delivery**:
   - Test dengan real email addresses
   - Check spam folder
   - Monitor Resend dashboard for delivery status

## 🆘 Troubleshooting

### Email tidak terkirim
- Check Resend API key valid
- Check `RESEND_FROM_EMAIL` format benar
- Check Resend dashboard untuk error logs
- Pastikan domain sudah verified (untuk production)

### Token invalid/expired
- Token hanya valid 1 jam
- Token hanya bisa digunakan sekali
- Request reset password baru jika expired

### Lint errors
- Run `npx prisma generate` setelah migration
- Restart TypeScript server di VS Code

## 📚 API Endpoints

### POST `/api/auth/forgot-password`
Request password reset email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Link reset password telah dikirim ke email Anda"
}
```

### POST `/api/auth/reset-password`
Reset password with token

**Request:**
```json
{
  "token": "abc123...",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password berhasil direset. Silakan login dengan password baru."
}
```

## 🎯 Alternative Solutions (Tanpa Email)

Jika tidak ingin pakai email SMTP, alternatif lain:

1. **SMS OTP** - Pakai Twilio/Vonage (berbayar)
2. **WhatsApp Business API** - Lebih kompleks setup
3. **Admin Reset** - Admin manually reset password via dashboard
4. **Security Questions** - Pertanyaan keamanan (less secure)

Namun, **email SMTP dengan Resend tetap recommended** karena:
- Free tier generous (3,000 emails/bulan)
- Setup mudah
- Professional
- Industry standard
- Good deliverability

---

**Created:** 2026-02-04  
**Author:** Gemi Dompet Development Team
