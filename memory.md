# Context
Finance app — personal expense tracker, React 19 + Zustand + Vite, all data in localStorage. Two-user shared expense model. QA-first collaboration: propose approach before writing code, small reviewable changes, flag tech debt.

# Status
Active development. No backend. P1+P2+P3 done and pushed (2026-05-01). P4 next (icon assets in repo: mots_1.PNG, mots_2.PNG).

## Pending Debt
- `CreditCard` and `TransferCategory` types identical in types.ts — unify or keep separate
- `Paycheck.grossAmount` never populated — remove
- `.sort((a, b) => b.date.localeCompare(a.date))` inline in many places — `sortByDateDesc/Asc` helpers exist in filters.ts but not migrated
- `formatShortMonth()` exists but Dashboard/CashFlow still use inline `toLocaleString()`

## Recently Completed
- ✅ P1: Mortgage button overlap fixed (flex layout), simulator tiles added (Total Paid w/o + with extra) (2026-05-01)
- ✅ P1: SharedBalance recent expenses — removed `.slice(0, 8)` cap, renamed section title (2026-05-01)
- ✅ P2: Dashboard recent activity — Date column added (2026-05-01)
- ✅ P2: Sidebar — shows backup date from store instead of today's date (2026-05-01)
- ✅ P2: CashFlow — Deposits series removed, Debt series added, colors lightened (2026-05-01)
- ✅ P3: Expenses category dot → lucide icon; Debt tiles with card icon; Transfers palette tiles + full amount (2026-05-01)
- ✅ Additional: SharedBalance period selector on shared expenses table (2026-05-01)
- ✅ Design system overhaul: CSS tokens, 6 new UI components, all 8 pages + 10 forms redesigned (2026-04-30)

## Feature Gap Priorities (UX audit 2026-04-29)
1. **Monthly Budget Overview** — data exists, display-only; all category budgets vs actual in one view
2. **Recurring Transaction Templates** — template flag + "pending this month" prompt, no scheduler needed
3. **Mortgage Config UI** — store type + CRUD pattern exist, just a form missing

## Quick Wins (not yet done)
- Cash Entry vs Settlement in-app tooltip (risk of corrupting settlement math)
- Global period state across pages (7 independent selectors, no shared context)

## Remaining Work (see plan file)
- P4: Custom app icon — assets in repo (mots_1.PNG = light, mots_2.PNG = dark). Wire up favicon + PWA icons.

## Activity Log
2026-05-01 | P1+P2+P3+Additional | All improvements done and pushed. Icon assets committed. P4 ready to wire up.
2026-04-30 | Design overhaul | CSS tokens, HeroBand/HeroKpi/HeroAction/SectionTitle/PeriodTabs/DataTable, all pages+forms redesigned
2026-04-29 | Foundation | Excel export, visual refresh, sidebar minimize, Expenses/Income tabs removed, settlement modal extracted
