# Forgot Password Feature - Quick Reference

## 📁 File Structure

```
gemi-dompet/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx                    ✅ Forgot password page
│   │   │   └── reset-password/
│   │   │       └── page.tsx                    ✅ Reset password page
│   │   └── api/
│   │       └── auth/
│   │           ├── forgot-password/
│   │           │   └── route.ts                ✅ API: Send reset email
│   │           └── reset-password/
│   │               └── route.ts                ✅ API: Verify token & reset password
│   ├── features/
│   │   └── auth/
│   │       └── components/
│   │           ├── LoginForm.tsx               ✅ Updated: Added "Lupa Password?" link
│   │           ├── ForgotPasswordForm.tsx      ✅ New: Forgot password form
│   │           └── ResetPasswordForm.tsx       ✅ New: Reset password form
│   └── lib/
│       └── email-templates.ts                  ✅ New: Email HTML template
├── prisma/
│   ├── schema.prisma                           ✅ Updated: Added PasswordResetToken model
│   └── migrations/
│       └── manual_add_password_reset_token.sql ✅ SQL migration (manual execution)
├── docs/
│   └── FORGOT_PASSWORD_SETUP.md                ✅ Complete setup guide
├── .env.example                                ✅ Updated: Added Resend config
└── .env.template                               ✅ New: Template dengan instruksi
```

## 🚀 Quick Start (3 Steps)

### 1️⃣ Setup Environment Variables

Copy `.env.template` ke `.env` dan update:

```bash
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY="re_your_actual_key"
RESEND_FROM_EMAIL="onboarding@resend.dev"  # For testing
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2️⃣ Run Database Migration

**REVIEW DULU** file: `prisma/migrations/manual_add_password_reset_token.sql`

Lalu execute via database client atau:

```bash
psql -h 31.97.108.25 -U gemi_dompet_user -d gemi_dompet_db -f prisma/migrations/manual_add_password_reset_token.sql
```

### 3️⃣ Generate Prisma Client & Restart

```bash
npx prisma generate
npm run dev
```

## 🎯 User Flow

```
Login Page (/login)
    ↓ Click "Lupa Password?"
    ↓
Forgot Password (/forgot-password)
    ↓ Enter email → Submit
    ↓
Email Sent (Success screen)
    ↓
User checks email
    ↓ Click reset link
    ↓
Reset Password (/reset-password?token=xxx)
    ↓ Enter new password → Submit
    ↓
Redirect to Login
    ✓ Login with new password
```

## 🔐 Security Features

- ✅ Secure token generation (crypto.randomBytes)
- ✅ Token expiration (1 hour)
- ✅ One-time use tokens
- ✅ Email enumeration prevention
- ✅ Password hashing (bcrypt)
- ✅ Old token cleanup

## 📧 Email Service: Resend

**Why Resend?**
- ✅ Free tier: 3,000 emails/month
- ✅ Modern API (simple integration)
- ✅ Good deliverability
- ✅ Easy setup
- ✅ Dashboard untuk monitoring

**Get Started:**
1. Sign up: https://resend.com
2. Get API key: https://resend.com/api-keys
3. For testing: Use `onboarding@resend.dev` as sender
4. For production: Verify your domain

## 📝 Database Schema

```sql
CREATE TABLE "password_reset_token" (
    "id" UUID PRIMARY KEY,
    "user_id" UUID NOT NULL,           -- FK to user_account
    "token" VARCHAR(255) UNIQUE,       -- Reset token
    "expires_at" TIMESTAMP,            -- Expiration (1 hour)
    "used" BOOLEAN DEFAULT false,      -- One-time use flag
    "created_at" TIMESTAMP,
    
    FOREIGN KEY ("user_id") REFERENCES "user_account"("id") ON DELETE CASCADE
);
```

## 🎨 UI Pages

### Forgot Password Page
- Modern card design
- Email input
- Success state with instructions
- Back to login link

### Reset Password Page
- Password strength indicator
- Confirmation matching
- Show/hide password toggle
- Token validation
- Expiration handling

## 🧪 Testing Checklist

- [ ] Request reset untuk email yang terdaftar
- [ ] Request reset untuk email yang tidak terdaftar (should still show success)
- [ ] Check email terkirim (Resend dashboard)
- [ ] Click link di email
- [ ] Set password baru (min 6 chars)
- [ ] Password confirmation matching
- [ ] Login dengan password baru
- [ ] Test expired token (wait 1 hour or modify DB)
- [ ] Test reusing token (should fail)

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Lint errors | Run `npx prisma generate` |
| Email tidak terkirim | Check RESEND_API_KEY di .env |
| Token invalid | Check token belum expired/used |
| Can't import components | Restart TS server (Cmd+Shift+P → Restart TS Server) |

## 📚 Documentation

Full documentation: `docs/FORGOT_PASSWORD_SETUP.md`

---

**Need Help?** Check the full setup guide or Resend documentation.
