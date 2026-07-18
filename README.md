<h1 align="center">Gemi Dompet</h1>
<h6 align="center">A personal finance app for tracking, understanding, and sharing expenses.</h6>

<p align="center">
  <img src="https://github.com/Vinzzztty/gemi-dompet-oss/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  <img src="https://img.shields.io/github/languages/top/Vinzzztty/gemi-dompet-oss" alt="language" />
  <img src="https://img.shields.io/github/languages/code-size/Vinzzztty/gemi-dompet-oss" alt="size" />
  <img src="https://img.shields.io/github/last-commit/Vinzzztty/gemi-dompet-oss" alt="last commit" />
  <img src="https://img.shields.io/github/license/Vinzzztty/gemi-dompet-oss" alt="license" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" />
</p>

## About

Gemi Dompet is a web app for managing personal finances in one place. Track income and expenses, manage multiple wallets, monitor recurring bills, view reports, and settle shared costs with friends or groups.

## Features

- **Multiple wallets** — manage bank, e-wallet, and cash balances.
- **Transactions and categories** — record income, expenses, and transfers between wallets.
- **Financial reports** — review balance summaries, monthly comparisons, and category spending.
- **Bills** — manage one-off and recurring bills with reminders.
- **Split bills and group expenses** — create shared-expense sessions, add participants, and view settlement recommendations.
- **Accounts and security** — cookie-based authentication, password reset, and wallet-balance validation.

## Tech Stack

- [Next.js](https://nextjs.org/) 15 and React 19
- TypeScript and Tailwind CSS
- Prisma and PostgreSQL
- Radix UI, Lucide, and Font Awesome

## Run Locally

### Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL

### Installation

```bash
git clone https://github.com/Vinzzztty/gemi-dompet-oss.git
cd gemi-dompet-oss
npm ci
cp .env.example .env.local
```

Set your PostgreSQL connection and local secrets in `.env.local`. Never commit environment files.

```bash
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL. |
| `JWT_SECRET` | A random secret with at least 32 characters used to sign sessions. |
| `RESEND_API_KEY` | Resend API key for password-reset emails. |
| `RESEND_FROM_EMAIL` | A verified sender email address. |
| `NEXT_PUBLIC_APP_URL` | Public app URL used in password-reset links. |

## Development Commands

```bash
npm run dev       # Start the development server
npm test          # Run unit tests
npm run build     # Create and validate the production build
npm run start     # Start the production build
npx prisma studio # Open Prisma Studio
```

`npm ci` runs `prisma generate` automatically. After changing the schema, create the appropriate Prisma migration and include it in the pull request.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, pull request standards, and verification commands. Report vulnerabilities through [SECURITY.md](./SECURITY.md), not a public issue.

## Security Status

Before deployment, use newly rotated secrets for the database, Resend, and JWT. See the [Open-Source Release Checklist](./docs/OPEN_SOURCE_RELEASE.md) for configuration details and release requirements.

## License

Gemi Dompet is licensed under the [MIT License](./LICENSE).
