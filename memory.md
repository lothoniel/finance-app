# Context
Finance app — personal expense tracker, React 19 + Zustand + Vite, all data in localStorage. Two-user shared expense model. QA-first collaboration: propose approach before writing code, small reviewable changes, flag tech debt.

# Status
Active development. No backend. Design system overhaul complete (2026-04-30). Changes uncommitted.

## Pending Debt
- `CreditCard` and `TransferCategory` types are identical in types.ts — decide whether to unify (requires store + form updates)
- `Paycheck.grossAmount` field never populated or read — remove
- `inputClass` from src/lib/styles.ts not yet used in Mortgage.tsx and most forms — still uses inline strings
- `.sort((a, b) => b.date.localeCompare(a.date))` still called inline in many places — `sortByDateDesc/Asc` helpers exist in filters.ts but usages not yet migrated
- `formatShortMonth()` exists but Dashboard and CashFlow still use inline `toLocaleString()` for month labels

## Completed
- ✅ Excel export: replaced SheetJS → ExcelJS; Summary sheet, CashEntries, bold purple headers, MXN/date formats (2026-04-29)
- ✅ CashEntries export gap closed: Excel, XML, and JSON (2026-04-29)
- ✅ Visual refresh: violet accent (#7C3AED), KpiCard left border + gradient bg, sidebar pill active state, FAB gradient, softer chart grids, Dashboard 5-col KPI grid + accent-bar section headers (2026-04-29)
- ✅ Expenses page: tabs removed → single page; charts at top, Settlement Breakdown removed, single filter bar with result count (2026-04-29)
- ✅ Income page: tabs removed → single page; unified controls row, mini transfer breakdown row (Household/Rental/Others/Total), all sections always visible (2026-04-29)
- ✅ Sidebar: icon-only minimize mode on desktop with PanelLeftClose/Open toggle in TopBar; smooth width animation (2026-04-29)
- ✅ Design system overhaul: CSS token file (`src/styles/tokens.css`) with coral/forest/cream/peach/mint/mustard palette + full dark-mode variables; replaced violet accent (2026-04-30)
- ✅ New UI component library: `HeroBand` (full-bleed colored header), `HeroKpi` (glass KPI card for bands), `HeroAction` (ghost/primary/ghost-dark button), `SectionTitle` (label + hairline divider), `PeriodTabs` (mode tabs + nav arrows, replaces PeriodSelector in page headers), `DataTable` (generic typed table) (2026-04-30)
- ✅ All 8 pages redesigned with hero band at top carrying KPIs and period controls; body uses DataTable + SectionTitle pattern (2026-04-30)
- ✅ All 10 forms refactored and significantly slimmed down (2026-04-30)
- ✅ Design handoff package generated: `design_handoff_motsapp/` with tokens guide, HTML prototype, and CLAUDE_CODE_HANDOFF.md (2026-04-30)

## Feature Gap Priorities (UX audit 2026-04-29)
Top 3 next features by effort/impact:
1. **Monthly Budget Overview** — data exists, display-only gap; all category budgets vs actual in one view
2. **Recurring Transaction Templates** — no scheduler needed; template flag + "pending this month" prompt
3. **Mortgage Config UI** — store type + CRUD pattern exist; just a form missing

Quick wins (not yet done):
- Delete on Debt Payments (only entity without delete)
- SharedBalance period selector (locked to "since last settlement")
- Cash Entry vs Settlement in-app tooltip (risk of corrupting settlement math)
- Global period state across pages (7 independent selectors, no shared context)

## Activity Log
2026-04-29 | Init guardrails system | Full refactor audit complete, priorities documented in plan
2026-04-29 | Refactor pass 1 | sumByUser helper, styles.ts, sortByDate helpers, Dashboard settlePaidBy bug fix
2026-04-29 | Refactor pass 2 | SettlementModal component extracted (3 pages), usePeriodFilter hook applied to all 7 pages
2026-04-29 | UX gap analysis | Compared to YNAB/Mint; top gaps: budget overview, recurring templates, mortgage config UI
2026-04-29 | Excel export refactor | SheetJS → ExcelJS; 12 sheets, Summary sheet, CashEntries, formatting
2026-04-29 | Visual refresh | Violet accent, KpiCard redesign, sidebar pill nav + minimize, FAB gradient, Expenses/Income tabs removed
2026-04-30 | Design system overhaul | CSS tokens (coral/forest/cream palette), 6 new UI components (HeroBand, HeroKpi, HeroAction, SectionTitle, PeriodTabs, DataTable), all 8 pages + 10 forms redesigned, design handoff package generated
