# Open-Source Release Checklist

Complete these steps before changing the GitHub repository visibility to public.

1. Rotate the database password, Resend API key, and JWT secret that were previously committed. Update deployment secrets only; never add replacements to Git.
2. Rewrite all Git history to remove `.env.local` and the prior values in `.env.example`, then force-push every affected branch and tag. Ask existing clones to re-clone.
3. Verify with a secret scanner against the complete history, not only the current branch.
4. Select and add a license. Repository visibility does not grant reuse rights without one.
5. Enable GitHub private vulnerability reporting, branch protection, required CI checks, and Dependabot alerts/security updates.
6. Decide whether to retain XLSX import support. The current `xlsx` npm package has unresolved high-severity advisories; do not process untrusted workbooks in a security-sensitive deployment until it is replaced or isolated.
7. Configure production-only secrets (`DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_APP_URL`) in the hosting provider.
