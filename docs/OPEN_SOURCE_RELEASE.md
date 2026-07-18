# Open-Source Release Checklist

Use this checklist when preparing a public release or deployment.

1. Keep production secrets only in the hosting provider: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL`.
2. Use `.env.example` only as a placeholder template. Scan the complete Git history before migration or publication, and rotate any exposed credential immediately.
3. Keep the MIT license, `SECURITY.md`, contribution guidance, issue forms, and pull-request template up to date.
4. Keep GitHub private vulnerability reporting, Dependabot, secret scanning, and branch protection enabled. Pull requests to `main` must pass CI.
5. Run `npm test` and `npm run build` before every release.
6. Review dependency alerts before deployment. The `xlsx` package has unresolved advisories; do not process untrusted workbooks in a security-sensitive deployment until it is replaced or isolated.
