# Context
Finance app — personal expense tracker, React 19 + Zustand + Vite, all data in localStorage. Two-user shared expense model. QA-first collaboration: propose approach before writing code, small reviewable changes, flag tech debt.

# Status
Active development. No backend. Design system overhaul in progress across all pages.

## Pending Debt
- `CreditCard` and `TransferCategory` types identical in types.ts — unify or keep separate
- `Paycheck.grossAmount` never populated — remove
- `formatShortMonth()` still inline in Reports.tsx (locale `'default'`) and a few non-`en-US` sites; CashFlow/Mortgage migrated
- `config.minimumPayment` in localStorage is 26,500 (user's stored value), not the contractual P+I of 25,176.53 — no config UI yet to fix it (P4 roadmap item: Mortgage Config UI)

## Key Decisions (non-obvious, affects future work)
- **CreditCard type has no `limit` field** — Card Balances has no progress bar by design, not omission
- **SharedBalance shows ALL shared expenses since last settlement date** — period filter was removed intentionally (it was defaulting to current month and hiding older expenses)
- **TopBar removed globally** — sidebar toggle lives in sidebar header, dark mode toggle in sidebar footer, mobile hamburger in Layout
- **Mortgage projection uses `calcMonthlyPayment()` (contractual P+I)**, not stored `minimumPayment` — must stay consistent or payoff date breaks
- **RecurringExpense type** (store v11) — monthly/bimonthly/annual, active/paused
- **Cash Flow Model** — see dedicated section below
- **Category budgets stored as monthly amounts** — `SCALE = { month: 1, quarter: 3, year: 12 }` must be applied in any page that displays budgets with a period filter (Budget.tsx, Expenses.tsx, Dashboard.tsx all do this now)
- **Dashboard `filterByPeriod` for quarter mode requires `periodValue.quarter`** — `handleTabChange` must set `{ year, quarter: Math.ceil(month/3) }` not `currentMonth()`, otherwise falls back to Q1

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

## Bugs Fixed (2026-05-07)
- **Budget period scaling missing on Expenses + Dashboard**: category budgets (stored monthly) were not scaled for quarter/year period filters. Added `SCALE = { month:1, quarter:3, year:12 }` multiplier in Expenses.tsx and Dashboard.tsx, matching existing Budget.tsx pattern.
- **Dashboard Quarterly filter always showed Q1**: `handleTabChange` was resetting `periodValue` to `{ year, month }` with no `quarter` field; `filterByPeriod` falls back to `quarter ?? 1`. Fixed by setting `{ year, quarter: Math.ceil(month/3) }` when switching to quarter mode.
- **Dashboard Spending Breakdown capped at top 5**: removed `.slice(0, 5)` — all categories for the period now display.
- **Dashboard Budget Status showed zero-spend categories**: added `.filter(item => item.spent > 0)` to hide unstarted budgets.

## Bugs Fixed (2026-05-06)
- AreaChart gradient IDs cannot have spaces in SVG — keys like "Original Schedule" caused `url(#grad-Original Schedule)` to silently fail, falling back to solid black fill. Fixed by sanitizing IDs with `.replace(/\s+/g, '-')` in AreaChart.tsx.
- `recurringExpenses` was missing from JSON backup (export/import/clearData) — added to `getExportData()` in Settings.tsx, with fallback on import for old backups.
- Edit expense modal now shows the recurring checkbox (was gated to add-only) — saving an edited expense with recurring checked creates a RecurringExpense template.

## Features Added (2026-05-08)
- **CashFlow Period Comparison syncs with main filter**: `compMode` derived from `periodMode`; switching to quarter/year resets comparison selectors and defaults. `getMetrics` uses `compMode`. Labels use `formatPeriodLabel()` helper. See CashFlow.tsx.
- **CashFlow Sankey 3-layer structure**: Paycheck + Transfers flow into middle "Income" node, then branch to Savings/Debt/Investments. Flows scaled to balance when Debt+Invest > Income. Source links colored by source (green/blue), dest links by destination. Removed `iterations={0}`.
- **SharedBalance partial settlement fix**: `lastSettlementDate` now computed via `findLastZeroBalanceDate()` — scans settlement history chronologically, advances cutoff only when balance hits zero. Partial payments no longer hide accumulated expenses.
- **Settings Recurring Expenses section**: lists all recurring templates with status badge, pause/resume toggle, and delete. No schema change.
- **Table style standardized**: DebtPayment and Mortgage Payment History updated — header text `#9297a0`, padding `py-2.5`, row dividers `border-[#f4f5f7]`. Mortgage Extra Capital color changed from orange `#e8874a` to green `#1a7a3c`, row highlight removed.
- **Portfolio buttons**: removed `+` text prefix from "Movement" and "Portfolio" action buttons (icon already conveys add action).

## Infrastructure Added (2026-05-12)
- **Docker deployment**: app is containerized and served via nginx. `npm run deploy` rebuilds image and restarts container (HTTP, port 8080). LAN IP: `192.168.0.245` (may change with DHCP — check with `ipconfig getifaddr en0`). Access at `http://192.168.0.245:8080`.
- **HTTPS deferred**: `npm run deploy:https` exists but requires `mkcert -install` (one-time Mac password prompt) + `mkcert -cert-file certs/cert.pem ...` first. nginx.conf is currently HTTP-only. HTTPS needed for SharedBalance share button (clipboard API). mkcert CA was created but not trusted in keychain yet — re-run `mkcert -install` and enter password.
- **Scripts**: `deploy` = plain rebuild; `deploy:https` = rebuild with cert generation; `certs` = generate mkcert certs for current LAN IP + localhost.

## Features Added (2026-05-07)
- **Dashboard Spending Trends chart**: now period-aware. Monthly = last 7 months ending at selected month; Quarterly = 3 months of selected quarter; Yearly = all 12 months of selected year. Top 7 categories (was 6) recalculated from visible months. Chart title updates dynamically. Section renamed "Spending Trends".

## i18n Rollout (in progress, started 2026-05-15)
- **Stack**: `react-i18next` + `i18next` + `i18next-browser-languagedetector`. Bootstrap in `src/lib/i18n.ts`, imported from `src/main.tsx` before App. Locale files at `src/locales/{en,es}.json`. Default = English; Spanish is the alternate.
- **Preferences are split**: `settings.language` ('en' | 'es') and `settings.currencyDisplay` ('MXN' | 'USD') are independent. Currency toggle is **format-only** — digits never change, only symbol/format. Store bumped to v13 with migration.
- **Translation editing model**: edit JSON files directly; Vite HMR picks up changes live. No in-app editor.
- **Helper convention**: page reads `language` + `currencyDisplay` from store. Use `formatMoneyCompact(amount, currency)` instead of `formatMXNCompact`. Pass `language` to `formatDate`/`formatShortMonth`/`formatMonthYear` (date-fns `es` locale).
- **Key reuse**: namespace by feature area, not by page (e.g. Transactions reuses `expenses.table.*`, `dashboard.recurring.paycheck`; Expenses reuses `dashboard.budget.{percentUsed,over,left}`).
- **Done so far**:
  - Phase 1: Shell — Settings (incl. new Preferences section), Sidebar (PATH_TO_LABEL_KEY map, badge interpolation), Layout, Modal chrome, `common.*` keys.
  - Phase 2: Dashboard — all strings translated, 17 `formatMXNCompact` → `formatMoneyCompact`, interpolated insight bodies, locale-aware month names. Added `formatUSDCompact`.
  - Phase 3: Expenses page + ExpenseForm + PeriodSelector. ScreenshotImportModal **deferred**.
  - Phase 4: Transactions page (reuses many `expenses.*` + `dashboard.*` keys).
- **Remaining pages**: Income (+ PaycheckForm, ManualTaxForm, TransferForm), DebtPayment (+ DebtPaymentForm), Portfolio (+ PortfolioForm), Mortgage (+ MortgagePaymentForm, MortgageContributionForm), SharedBalance (+ SettlementModal, SplitRatioModal), CashFlow, Reports, Budget, NetWorth, ScreenshotImportModal.
- **Tests**: `src/__tests__/lib/formatters.test.ts` covers `formatMoneyCompact` (MXN/USD) and Spanish-locale `formatDate`/`formatShortMonth`. 51/51 passing as of Phase 4.
- **Plan file**: `~/.claude/plans/i-want-to-implement-misty-wombat.md` holds the Phase 2 plan; Phases 3/4 followed the same pattern (incremental, one PR per page) without rewriting the plan file.
