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

## Recently Completed
- ✅ CashFlow + Investments + NetWorth updates (2026-05-04 session 2): CashFlow: removed Expense Mix donut, area chart split into 4 series (Paychecks/Transfers/Expenses/Debt), income/expense breakdown panels changed from pill badges to progress-bar rows. Investments (Portfolio.tsx): HeroBand removed, inline header + 4-tile KPI strip (Total Value, Yield, Deposits, Portfolios count), Asset Allocation + Holdings in two cards, holding cards redesigned (balance top-right, colored bottom bar, all existing data preserved), distinct portfolio colors. NetWorth.tsx: built from stub — KPI strip (Net Worth/Assets/Liabilities), Assets donut + Liabilities mortgage card with progress bar, Portfolio Holdings table (dot, name, type, APY, balance, allocation bar). Both pages use same distinct color palette: ['#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6'].
- ✅ CashFlow page redesign (2026-05-04): Bar Chart / Sankey Diagram toggle. Inline header + PeriodSelector. KPI strip (Income, Expenses ref, Total Savings = income−debt−investments, Savings Rate). Bar Chart view: area chart (Income/Expenses/Debt) + income breakdown (Paychecks/Transfers colored chips) + expenses breakdown (category chips). Sankey view: Sankey (no Expenses node, cash flow model) + Cash Flow Analysis table (NET = income−debt). Period Comparison kept, Expense Mix donut removed in later session.
- ✅ Income page redesign (2026-05-04): Removed HeroBand. Inline header + PeriodSelector + 3 action buttons. KPI card (Gross Income, Net Income w/ tax sub-label, Transfers). New "Income Trend — Last 7 Months" area chart (Paycheck + Transfers). Kept all existing charts (Income vs Taxes bar, USD/MXN Rate Trend), tables (Paychecks, Manual Taxes, Transfers). Hover-reveal edit/delete on all rows.
- ✅ Expenses page redesign + Recurring Transactions (2026-05-04): Full page redesign matching design system (inline header, KPI strip, donut+breakdown, budget grid, Transactions/Recurring bottom tabs). Added RecurringExpense type (monthly/bimonthly/annual, active/paused). Store v11 with migration. Seed data (8 recurring templates). ExpenseForm updated with recurring toggle + frequency/status fields + edit-recurring mode. Recurring tab with next-date calculation, edit/delete.
- ✅ Reports page logic fixes (2026-05-04): Sankey now shows Savings/Debt/Investments only (no Expenses node). KPI renamed to "Card Charges" then back to "Expenses" (reference) and "Net Cash Flow". Outflow chart uses debt only. Expenses shown as reference-only column in summary table and series in area chart. Removed "new" badge from Reports sidebar.
- ✅ Reports page built (2026-05-04): Full 3-tab page (Cash Flow / Spending / Income). KPI strip (Total Income, Expenses, Net Income, Savings Rate). Period filter using existing PeriodSelector — All Time / Monthly / Quarterly / Yearly, all charts respond. Cash Flow: recharts Sankey with custom node/link renderers + colors, area chart (Income/Expenses/Debt), summary table with savings rate bar. Spending: donut chart, stacked bar, by-category panel. Income: area chart (Paycheck/Transfers), area chart (Income/Outflow). Area charts drill down: Monthly→week-by-week, Quarterly→3 months, Yearly→12 months, All Time→all months. Empty states on all charts.
- ✅ TopBar removed (2026-05-04): Global header bar (page title + buttons) removed from all pages. Sidebar toggle moved to sidebar header (right of logo/MyFinance). Dark mode toggle moved to sidebar footer (right of user info). Mobile floating hamburger button added to Layout for small screens.
- ✅ Sidebar + Dashboard redesign (2026-05-04): Sidebar restructured into 4 sections (Overview/Money/Planning/System), Portfolio renamed Investments, NEW badges on Net Worth/Budget/Transactions stub pages, over-budget count badge on Expenses. Dashboard: dark green HeroBand removed, new layout with period toggle (Monthly/Quarterly/Yearly), KPI strip with separators + color coding, Portfolio & Wealth full-width (Net Worth/Investments/Debt Ratio), stacked bar chart (Category Breakdown last 7 months), right panel (Financial Snapshot + Savings Rate donut + Upcoming Recurring mocked), Budget Status grid, Insights with colored backgrounds (red/green/amber).
- ✅ Mortgage projected payoff date fix (2026-05-01): bug was timezone parsing + Math.round vs Math.ceil + wrong anchor date. Fixed addMonths() to use pure month arithmetic + Math.ceil. Fixed all projection math to use calcMonthlyPayment() (contractual P+I) instead of stored minimumPayment, so results match bank document (May 2041).

## Cash Flow Model (established 2026-05-04)
- **Expenses** = credit card charges (reference/informational only — not cash leaving bank)
- **Debt payments** = actual money leaving bank accounts (credit card bills paid)
- **Savings** = income − debt − investments (cash flow model, NOT income − expenses)
- Applied consistently across: Reports Sankey, Reports KPI "Net Cash Flow", CashFlow Sankey, CashFlow "Total Savings" KPI, CashFlow NET column in analysis table
- Expenses shown for reference in charts and tables but never subtracted in savings/net calculations

## Store Version History
- v11 (2026-05-04): Added recurringExpenses: RecurringExpense[]
- v10: mortgageConfig fixes (minimumPayment = 25176.53, correct startDate)
- v9: mortgageContributions seed data
- Earlier: creditCards, transferCategories, cashEntries, mortgageConfig, mortgageContributions migrations

## Feature Gap Priorities (UX audit 2026-04-29)
1. **Monthly Budget Overview** — data exists, display-only; all category budgets vs actual in one view
2. **Recurring Transaction Templates** ✅ DONE — added as ExpenseForm toggle + Recurring tab on Expenses page
3. **Mortgage Config UI** — store type + CRUD pattern exist, just a form missing

## Quick Wins (not yet done)
- Cash Entry vs Settlement in-app tooltip (risk of corrupting settlement math)
- Global period state across pages (7 independent selectors, no shared context)

## Remaining Work
- P4: Custom app icon — assets in repo (mots_1.PNG = light, mots_2.PNG = dark). Wire up favicon + PWA icons.
- Net Worth, Budget, Transactions stub pages (have NEW badges, not yet built)

## Activity Log
2026-05-04 | Investments redesign + NetWorth built + CashFlow polish | Investments: HeroBand→inline header, 4-tile KPI strip, Holdings card layout, colored bottom bar, distinct palette. NetWorth: KPI strip, Assets donut, Liabilities mortgage card, Portfolio Holdings table. CashFlow: Expense Mix removed, area chart split to 4 series (Paychecks/Transfers/Expenses/Debt), breakdown panels changed from pills to progress bars.
2026-05-04 | CashFlow + Income + Expenses redesign + Recurring system | CashFlow: Bar/Sankey toggle, inline header, cash flow model KPIs, colored chip breakdown panels, Period Comparison kept. Income: HeroBand removed, KPI card, Income Trend chart added, all existing sections kept. Expenses: full redesign, RecurringExpense type (store v11), ExpenseForm toggle, Recurring tab. Reports: Sankey/KPI logic fixed (cash flow model), expenses shown as reference only.
2026-05-04 | Reports page + TopBar removal | Full Reports page built: 3 tabs (Cash Flow/Spending/Income), Sankey chart, period filter (All Time/Monthly/Quarterly/Yearly) drives all charts, area chart drill-down by sub-period. TopBar removed globally; sidebar toggle moved to sidebar header, dark mode toggle moved to sidebar footer, mobile floating hamburger added.
2026-05-04 | Sidebar + Dashboard redesign | Full sidebar restructure (4 sections, NEW badges, over-budget count). Dashboard redesigned: no HeroBand, KPI strip with separators + colors, Portfolio & Wealth, stacked bar chart, right panel, Budget Status, colored Insights. 4 stub pages added (Net Worth, Reports, Budget, Transactions).
2026-05-04 | UI polish | Monthly Trend chart colors made distinct (green/red/orange/blue). Settings user names header removed.
2026-05-01 | Mortgage payoff date + simulator fixes | Fixed addMonths timezone+rounding bug, projection now uses contractualPayment, simulator Total Paid tile shows lifetime totals.
2026-05-01 | P1+P2+P3+Additional | All improvements done and pushed. Icon assets committed. P4 ready to wire up.
2026-04-30 | Design overhaul | CSS tokens, HeroBand/HeroKpi/HeroAction/SectionTitle/PeriodTabs/DataTable, all pages+forms redesigned
2026-04-29 | Foundation | Excel export, visual refresh, sidebar minimize, Expenses/Income tabs removed, settlement modal extracted
