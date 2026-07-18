# Security Policy

## Supported Version

Security fixes are applied to the latest code on the default branch.

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability or exposed credential.
Use [GitHub private vulnerability reporting](https://github.com/Vinzzztty/gemi_dompet/security/advisories/new) and include reproduction steps, impact, and any suggested mitigation. We will acknowledge reports within seven days and coordinate a fix before public disclosure.

## Handling Credentials

Never commit `.env`, `.env.local`, API keys, passwords, tokens, or database exports. Copy `.env.example` to `.env.local` and use independently generated local credentials. If a secret is exposed, revoke it at the provider immediately and remove it from Git history before publishing the repository.
