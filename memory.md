# Context
Finance app — personal expense tracker, React 19 + Zustand + Vite, all data in localStorage. Two-user shared expense model. QA-first collaboration: propose approach before writing code, small reviewable changes, flag tech debt.

# Status
Active development. No backend. Design system overhaul in progress across all pages.

## Pending Debt
- `CreditCard` and `TransferCategory` types identical in types.ts — unify or keep separate
- `Paycheck.grossAmount` never populated — remove
- `.sort((a, b) => b.date.localeCompare(a.date))` inline in many places — `sortByDateDesc/Asc` helpers exist in filters.ts but not migrated
- `formatShortMonth()` exists but Dashboard/CashFlow still use inline `toLocaleString()`
- `config.minimumPayment` in localStorage is 26,500 (user's stored value), not the contractual P+I of 25,176.53 — no config UI yet to fix it (P4 roadmap item: Mortgage Config UI)

## Key Decisions (non-obvious, affects future work)
- **CreditCard type has no `limit` field** — Card Balances has no progress bar by design, not omission
- **SharedBalance shows ALL shared expenses since last settlement date** — period filter was removed intentionally (it was defaulting to current month and hiding older expenses)
- **TopBar removed globally** — sidebar toggle lives in sidebar header, dark mode toggle in sidebar footer, mobile hamburger in Layout
- **Mortgage projection uses `calcMonthlyPayment()` (contractual P+I)**, not stored `minimumPayment` — must stay consistent or payoff date breaks
- **RecurringExpense type** (store v11) — monthly/bimonthly/annual, active/paused
- **Cash Flow Model** — see dedicated section below

## Cash Flow Model (established 2026-05-04)
- **Expenses** = credit card charges (reference/informational only — not cash leaving bank)
- **Debt payments** = actual money leaving bank accounts (credit card bills paid)
- **Savings** = income − debt − investments (cash flow model, NOT income − expenses)
- Applied consistently across: Reports Sankey, Reports KPI "Net Cash Flow", CashFlow Sankey, CashFlow "Total Savings" KPI, CashFlow NET column in analysis table
- Expenses shown for reference in charts and tables but never subtracted in savings/net calculations

## Feature Gap Priorities (UX audit 2026-04-29)
1. **Monthly Budget Overview** — data exists, display-only; all category budgets vs actual in one view
2. **Recurring Transaction Templates** ✅ DONE
3. **Mortgage Config UI** — store type + CRUD pattern exist, just a form missing

## Quick Wins (not yet done)
- Cash Entry vs Settlement in-app tooltip (risk of corrupting settlement math)
- Global period state across pages (7 independent selectors, no shared context)

## Remaining Work
- P4: Custom app icon — assets in repo (mots_1.PNG = light, mots_2.PNG = dark). Wire up favicon + PWA icons.
- Net Worth, Budget stub pages (not yet built)

## Bug Fixed (2026-05-06)
- AreaChart gradient IDs cannot have spaces in SVG — keys like "Original Schedule" caused `url(#grad-Original Schedule)` to silently fail, falling back to solid black fill. Fixed by sanitizing IDs with `.replace(/\s+/g, '-')` in AreaChart.tsx.
- `recurringExpenses` was missing from JSON backup (export/import/clearData) — added to `getExportData()` in Settings.tsx, with fallback on import for old backups.
- Edit expense modal now shows the recurring checkbox (was gated to add-only) — saving an edited expense with recurring checked creates a RecurringExpense template.
