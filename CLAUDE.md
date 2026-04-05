# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Type-check + Vite build
npm run lint         # ESLint
npm run test         # Run tests once (vitest run)
npm run test:watch   # Watch mode
npm run test:coverage
```

Run a single test file:
```bash
npx vitest run src/__tests__/lib/settlement.test.ts
```

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Zustand + React Router v7 + Recharts

**State:** Single Zustand store (`src/store/index.ts`) with `persist` middleware — all data is stored in `localStorage` under the key `finance-app-v1`. The store is initialized from `src/data/seed.ts`. Types are in `src/store/types.ts`.

**Routing:** All pages are nested under `<Layout>` (sidebar + topbar). Routes live in `src/App.tsx`.

**Pages:**
- `Dashboard` — KPI overview
- `CashFlow` — monthly cash flow charts
- `Income` — paychecks + manual taxes
- `Expenses` — expense list with filtering
- `DebtPayment` — credit card payments
- `Portfolio` — investment portfolios + movements
- `SharedBalance` — two-user shared expense settlement
- `Settings` — app settings, categories, export/import

**Two-user model:** Expenses have `paidBy: 'user1' | 'user2'` and `shared: boolean`. The `SharedBalance` page uses `calculateSettlement()` (`src/lib/settlement.ts`) to compute who owes whom since the last settlement record.

**ID generation:** Always use `generateId()` from `src/lib/id.ts` — never `crypto.randomUUID()` directly (crashes on non-HTTPS contexts like iPhone over LAN).

**Charts:** Custom wrappers around Recharts in `src/components/charts/`. Each chart accepts pre-processed data.

**Forms:** One file per form type in `src/components/forms/`, used inside `<Modal>` from `src/components/ui/Modal.tsx`.

**Utilities:**
- `src/lib/formatters.ts` — MXN currency formatting, date formatting
- `src/lib/filters.ts` — expense/period filtering helpers
- `src/lib/settlement.ts` — shared balance calculation logic (unit tested)

**Tests:** Vitest + jsdom + Testing Library. Tests are in `src/__tests__/` and cover pure utility functions (`settlement`, `filters`, `formatters`). Setup file: `src/test/setup.ts`.
