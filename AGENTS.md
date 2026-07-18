# Repository Guidelines

## Project Structure & Module Organization

Gemi Dompet is a Next.js 15 personal-finance application. Route pages and API handlers live in `src/app/`: dashboard pages use route groups such as `src/app/(dashboard)/`, while endpoints live under `src/app/api/`. Keep feature-specific UI, hooks, services, types, and utilities together in `src/features/<feature>/` (for example, `src/features/bills/`). Put shared UI in `src/components/`, reusable domain logic in `src/lib/`, common hooks in `src/hooks/`, and shared TypeScript definitions in `src/types/`.

Prisma schema and database guidance are in `prisma/`; repository SQL changes and manual migration scripts are in `migrations/` and `prisma/manual/`. Static assets belong in `public/`, and longer implementation notes belong in `docs/`.

## Build, Test, and Development Commands

- `npm install` installs dependencies.
- `npm run dev` starts the local Next.js server at `http://localhost:3000`.
- `npm run build` creates the production build and performs Next.js type validation.
- `npm run start` serves a completed production build.
- `npm test` runs `*.test.ts` files through Node's test runner with `tsx`.
- `npx prisma migrate dev` applies development schema migrations; `npx prisma studio` opens the database browser.

Use Node.js 18+ and configure `DATABASE_URL` in `.env` before database-backed work. Never commit credentials or production connection strings.

## Coding Style & Naming Conventions

Write strict TypeScript and use the `@/` alias for imports from `src/`. Follow the surrounding file's indentation (generally two spaces), single quotes, and semicolon usage. Use PascalCase for React component files and exported components (`WalletSummaryCards.tsx`), camelCase for functions and variables, and kebab-case for route directory names. Prefer feature-local code before adding to global shared directories. Tailwind utility classes are the established styling approach.

## Testing Guidelines

Place focused unit tests beside tested library code as `src/lib/<module>.test.ts`. Use `node:test` and `node:assert/strict`; name tests by observable behavior, e.g. `test('buildEqualSplitShares distributes remainder cents fairly', ...)`. Add or update tests whenever changing financial calculations, validation, or session-code behavior, then run `npm test` and `npm run build`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative messages with prefixes such as `feat:`, `fix:`, `chore:`, `config:`, and `improve:`. Keep commits focused and avoid unrelated formatting changes. Pull requests should explain the user-visible change, link the relevant issue when available, list verification commands, and include screenshots or recordings for UI changes. Call out database migrations, new environment variables, and any manual deployment steps explicitly.
