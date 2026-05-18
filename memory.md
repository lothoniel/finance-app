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
- **Dashboard Net Flow uses Cash Flow Model** — `income − debt − investments`, NOT `income − expenses − debt`. Before 2026-05-18 it double-counted (CC charge subtracted as `expense` and again as `debt` when paid). Now aligned with CashFlow page + Reports.

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

## Features Added (2026-05-18, evening) — Manual income budgets
- **Store v14**: `AppSettings.paycheckMonthlyBudget?: number` + `TransferCategory.budget?: number` added. Both optional → no real migration body (no `version < 14` block needed since defaults are `undefined`).
- **Budget page averaging window 3 → 6 months**: `getPriorMonths(periodMode, periodValue, 6)`. `paycheckMonthlyAvg` / `transferMonthlyAvgByCategory` auto-adapt because they divide by `priorMonths.length`.
- **Manual override resolution** (Budget.tsx): `paycheckMonthly = settings.paycheckMonthlyBudget ?? paycheckMonthlyAvg`; per transfer category `monthly = tc.budget ?? avg`. `paycheckIsManual` and `transferIsManualByName` flags drive styling (bold when manual, muted when fallback).
- **`IncomePopover` component** (~140 lines, sibling to `BudgetPopover`): same shell — 6-month history bar chart, monthly input, save on Enter. Differences: green bars (`#16a34a`), reads paychecks summed per month (kind='paycheck') or transfers filtered by category name (kind='transfer'), has a "Clear (use average)" button that calls `onSave(undefined)`. Reuses `budget.popover.{history,monthlyAverage,monthlyBudgetPlaceholder,footer}` keys; new `budget.incomePopover.{receivedLastMonth,clear}` for income-specific labels.
- **Inline edit UX**: paycheck Budget cell + per-transfer Budget cells now render as buttons that open `IncomePopover`. Save handler dispatches to `settings.paycheckMonthlyBudget` or `transferCategories[i].budget` via `updateSettings`. "Total Income" row keeps simple sum-of-items semantics (no separate override).
- **Out of scope** (for next round if needed): Settings-page editing for these new fields, median averaging, per-period-mode independent targets, refactoring `BudgetPopover`/`IncomePopover` into a single generic component.

## Features Added (2026-05-18, late) — Dashboard de-duplication
- **Portfolio & Wealth section dropped**: Net Worth and Investments tiles were duplicated with the (richer) Financial Snapshot; Debt Ratio moved to sidebar. The section header + 3-tile row are gone. Main column now starts with Spending Trends.
- **Sidebar Savings Rate donut replaced with Debt Ratio donut + sparkline**: Savings Rate was already in the top KPI strip (redundant). New tile reuses the same SVG donut markup (RADIUS=28); color is `#c0392b` when `debtToIncomeRaw > 36` else `#2e7d65` (matches the existing Insights "Debt Alert" threshold). Subtitle "Debt / income", followed by the 7-month `debtRatioSparkline` (kept; `investmentSparkline` removed).
- **i18n cleanup**: removed `dashboard.portfolio.*` (8 keys) and `dashboard.savings.{title,ofIncome}` (2 keys). Added `dashboard.debtRatio.{title,subtitle}` in en + es.

## Features Added (2026-05-18, later) — Recurring paid date + Snapshot rework
- **Recurring card paid date**: when `paidThisMonth` is true, the date string now shows the matched expense's `date` (most recent if multiple) instead of `nextDate`. Computed inside `upcomingRecurring` memo as `paidDate` field.
- **Financial Snapshot fully restructured** in Dashboard right panel:
  - Removed hardcoded `'—'` Cash row (and `dashboard.snapshot.cash` key).
  - Replaced flat 4-row list with: Net Worth (focal, larger text), Assets subheader → Investments, Liabilities subheader → Mortgage (new row, uses `currentMortgageBalance`), This {period} subheader → Debt Paid (renamed from "Total Debt"; same value `periodDebt`).
  - MoM delta indicator per row via new `DeltaPill` component: `↑/↓ X.X%`, color by favorability (Investments/NetWorth up=green; Mortgage down=green; Debt Paid neutral gray). Hidden when `prev === 0`.
  - New `SnapshotRow` component for value + delta stacking.
- **MoM helpers (Dashboard.tsx)**: top-level `shiftPeriodBack(mode, val)` and `prevPeriodEnd(mode, val)` compute previous-period values. `prevInvestments` derived from `totalPortfolioBalance` minus net change of `investmentMovements` after `prevEnd` (DEPOSIT+GAIN−WITHDRAWAL; TRANSFER ignored). `prevMortgageBalance` reads the latest `mortgagePayments` entry ≤ `prevEnd`, else `mortgageConfig.principal`. `prevPeriodDebt` uses `filterByPeriod(debtPayments, activeTab, prevPeriodValue)`. `pctDelta(c, p)` returns null when `p === 0` to suppress noise.
- **i18n keys added**: `dashboard.snapshot.{assets,liabilities,mortgage,thisPeriod,debtPaid,momDelta}` (en + es). Removed: `dashboard.snapshot.{cash,totalDebt}`.

## Bugs Fixed (2026-05-18, late) — Reports + Cash Flow Sankey
- **Reports Sankey blank on tab return**: `ResizeObserver` for the Sankey was set up in a `useEffect(..., [])` on a ref inside `{tab === 'cashflow' && ...}`. Leaving and returning to the tab unmounted the ref div; the observer never re-attached and `sankeyWidth` stayed stale. Fix: change deps to `[tab]` so cleanup + re-attach happens on each switch. Same pattern + same fix on Cash Flow page where the ref lives inside `{chartView === 'sankey' && ...}` (deps changed to `[chartView]`). The Cash Flow case was worse — `chartView` defaults to `bar`, so the observer never set up at all; toggling to Sankey rendered at the initial `700px`, leaving half the card blank.
- **Cash Flow Sankey + `iterations={0}`**: copying Reports' `iterations={0}` onto Cash Flow's 3-layer Sankey (sources → Income → dests) breaks layout — the layout solver needs >0 iterations to position the middle Income node. Reports gets away with 0 because it's 2-layer. Decision: `iterations={0}` stays on Reports, **omitted** on Cash Flow (Recharts default = 32).
- **Sankey node ↔ link color mismatch** (both pages): node colors were keyed by `NODE_COLORS[index % …]` while link colors were keyed by destination name. Debt node rendered red (#ef4444) but its link was orange (#f97316); Investments node was orange but its link was purple. Replaced with a single `NODE_COLORS_BY_NAME` map per page so node color = incoming-link color. Map: Paycheck #22c55e · Transfers #3b82f6 · Income #0ea5e9 · Savings #10b981 · Debt #f97316 · Investments #8b5cf6.

## Features Added (2026-05-18, late) — Reports Spending tab layout
- **Two-column Spending grid**: left column stacks Donut card on top of Stacked Bar card; right column is the By Category list spanning the full height. Replaces the old layout (full-width donut row + 3-col grid with stacked bar 2/3 + by-cat 1/3).
- **DonutChart legend drops amount** (global): removed the trailing `formatMoneyCompact` span in the legend rows of `src/components/charts/DonutChart.tsx`; legend now shows color · name · percentage only. Center value (e.g. `$12.3k · Total`) is unchanged. Affects all 6 callers (Reports, Expenses, Portfolio, NetWorth, SharedBalance, SharedBalanceView) — accepted globally to avoid the duplicate "amount" already shown in the By Category panel on Reports.
- **Dropped now-unused imports** in DonutChart: `formatMoneyCompact` and the `useStore` currency read.

## Features Added (2026-05-18) — Dashboard polish + OCR debug panel removed
- **Dashboard Net Flow KPI fix**: was `income − expenses − debt` (double-counted CC charges); now `income − debt − investmentDeposits` to match Cash Flow Model. Same formula as `periodSavingsRate` on the same page.
- **Net Flow sparkline**: 7-month mini-bar chart under the Net Flow KPI value, color = green when current period ≥ 0 else red. Reuses existing `<Sparkline>` component. Clamps months at 0 to avoid negative bar heights.
- **MTD pace projection**: `Day X of N · projected $Y` shown under Net Flow value when `activeTab === 'month'` AND `periodValue` matches the current month. Disappears for past months, quarters, or years.
- **Upcoming Recurring card upgrade**: each row now shows the next payment date (computed from `lastDate + frequency`) under the name and a green "Paid" pill when an expense in the current month has `description.toLowerCase().trim() === r.name.toLowerCase().trim()`. Amount color dims to `#9297a0` when paid. Card now shows a subheader "Next 30 days: $X" summing items whose `nextDate` is within 30 days.
- **Paid-this-month detection caveat**: case-insensitive description == name match. False negative if user types a slightly different description (e.g., "Spotify Premium" vs recurring "Spotify"). No schema change — revisit with category+amount heuristic if false positives appear.
- **Screenshot import debug panel removed**: `<details>` showing raw Tesseract output deleted from both Review step and upload-error banner in `ScreenshotImportModal.tsx`. `debugLines` removed from `ExtractionResult` interface in `localOcr.ts`. `noTransactions` i18n message simplified (dropped `{{preview}}` interp). Dead key `screenshotImport.review.ocrDebugSummary` removed from en + es.
- **i18n keys added**: `dashboard.kpis.netFlowPace`, `dashboard.recurring.paid`, `dashboard.recurring.next30Days`.

## Features Added (2026-05-17) — Screenshot import: multi-bank + real-OCR parsing
- **Bank dropdown in ScreenshotImportModal**: Banamex / Banorte. No auto-detect. Default Banamex.
- **`localOcr.ts` fully rewritten**: dropped `parseLayout1/2/Fallback` (BBVA-era). Replaced with `parseBanamex` + `parseBanorte`, both "money line drives the row, continuation lines accumulate description, date (or next money) terminates." Switched Tesseract from `'eng'` to `'eng+spa'` for Spanish month abbreviations.
- **Per-bank OCR shape (learned from real Tesseract output, not assumed)**:
  - Banamex line shape: `DESCRIPTION $AMOUNT` on one line, then `DD Mon En proceso e` (date + status + leftover dot) on the next. Section header "Esta semana" sometimes dropped by OCR. Short-date regex must allow trailing status text (was anchored `^...$` before, broke). Logo OCR can produce a stray duplicate description line — deduped via `dedupePush()`.
  - Banorte line shape: bare `DD-MM-YYYY` header line, then `descPart1 ↗ -$amount` on a single line (arrow icon Tesseract reads as a stray `7`), then 1-3 continuation lines prefixed with icon residue (`~ RESTAURANTE`, `© HE. >`, `o >`, `> am`, `7 a=>`). `stripArrowPlaceholder()` removes the `7` only when sandwiched between text and `-$` (won't strip real digits in descriptions).
- **`cleanDescription()` shared helper**: strips known icon glyphs (`~ © ® • ↗ ↘ ↑ ↓ → ← ▪ ► ◄`), leading/trailing `>`-only OCR residue, and drops any line with fewer than 3 alphanumeric chars. Causes intentional loss of "HE..." / "am" fragments but keeps clean merchant names.
- **Credit exclusion**: Banamex `+$` or `SU ABONO|GRACIAS|PAGO RECIBIDO` heuristic → bumps `excludedCredits` counter; same for Banorte. Counter shown in Review step ("N payment/credit excluded — track those on Debt Payments").
- **OCR debug panel**: `<details>` in Review step + on upload-error banner, displays raw Tesseract `debugLines` in a scrollable `<pre>`. Surfaced because the partial-extraction case (some rows parsed, others silently dropped) was invisible before. Essential for iterating parser logic against ground truth.
- **i18n keys added** under `screenshotImport.*`: `bank.{label,banamex,banorte}`, `review.{creditsExcludedOne,creditsExcludedOther,ocrDebugSummary}`. Updated `error.noTransactions` to mention trying the other bank.
- **Tests**: new `src/__tests__/lib/localOcr.test.ts` — 8 cases using the EXACT lines captured from Caro's real OCR (Banamex 7-line fixture, Banorte 20-line fixture). Cases also cover credit exclusion, year rollover (Dec → previous year), Spanish month abbreviations, missing-date drop.
- **Open caveats**: `cleanDescription` aggressiveness drops short legit suffixes (`HE...`, `am`); user edits in Review. The `eng+spa` Tesseract pack adds ~3MB on first import (cached in IndexedDB thereafter). If a future bank's OCR shape differs, the debug panel exposes the raw output for fast iteration.

## Features Added (2026-05-15) — Budget page UX
- **Rollover tooltip restructured**: now shows `Applied to <target period>` subtitle + source-period label (`From APR 2026` for monthly rollover, `From JAN–APR 2026 (YTD)` for yearly) + base budget → effective budget → spent → remaining math chain. `rolloverTooltip` state gained `sourceLabel` + `targetLabel`, computed at mouse-enter via new `buildRolloverLabels(catRollover)` helper inside Budget.tsx that uses `format(d, 'MMM yyyy', dateFnsLocale).toUpperCase()`. YTD suffix only when source year === current year.
- **Period-aware Budget column header**: header text switches via `budgetColLabel` derived from `periodMode` → `budget.columns.{monthlyBudget,quarterlyBudget,annualBudget}`. Helps disambiguate the scaled values (a "Budget" of $60k means $5k/mo when viewing year).
- **Split Actual column per section**: global top header row removed entirely. Each section (Income, Expenses) now renders its own mini-header row inside its expanded block — Income shows "Received", Expenses shows "Spent". The mini-header uses `bg-[#fafbfc] dark:bg-[#1a1f2c]` and `text-[10px]` to stay subtle. `colHeader` constant deleted.
- **Income "Remaining" color polarity inverted**: `RemainingCell` got an optional `kind?: 'expense' | 'income'` prop (default `'expense'`). For income, `remaining > 0` (income not yet received) is red, `remaining < 0` (over-received) is green; expense polarity unchanged. `remaining === 0` stays neutral for both kinds. Applied at the 4 income call sites (Income section button, Paycheck row, Transfer category row, Total Income summary row). Five expense call sites + rollover tooltip's Remaining line untouched.
- **i18n keys touched**: added `budget.columns.{monthlyBudget,quarterlyBudget,annualBudget,received,spent}` and `budget.rollover.{appliedTo,fromPeriod,ytdSuffix,baseBudget,effectiveBudget,spent}`. Removed dead keys `budget.columns.{budget,actual}` and `budget.rollover.{fromYear,fromMonth,budget,actual}` per the "delete unused keys" rule.

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
  - Phase 5: Income page + PaycheckForm + ManualTaxForm + TransferForm. New `income.*` namespace; reuses `expenses.table.*` for shared headers (date/category/description/amount) and `expenses.form.*` for shared form labels. Plural `income.filters.transfer{One,Other}`. Chart series names translated.
  - Phase 6: DebtPayment page + DebtPaymentForm. New `debt.*` namespace; reuses `expenses.table.{date,description,amount}` and `expenses.form.{date,description}`. 5-tile KPI strip (incl. "TOP CARD" with sub-label).
  - Phase 7: Portfolio page + PortfolioForm + InvestmentMovementForm. New `portfolio.*` namespace; reuses `expenses.table.*`, `expenses.form.*`, and `expenses.sections.donutTotal` for donut center label. `portfolio.movementTypes.*` passed to `<Badge label=…>` so DEPOSIT/GAIN/WITHDRAWAL/TRANSFER pills localize. Auto-generated "Balance update" description left in English (stored data, same rule as user-entered descriptions).
  - Phase 8: Mortgage page + MortgagePaymentForm + MortgageContributionForm. New `mortgage.*` namespace. `formatDuration` moved inside component as a closure over `t()` so "yr/mo" suffixes translate. `addMonths` helper now accepts `language` and forwards to `formatMonthYear`, so projected payoff + simulator dates localize. Two `toLocaleString('en-MX', …)` calls in MortgagePaymentForm (auto extra capital, previous balance) migrated to `formatMoney(_, currency)`.
  - Phase 9: SharedBalance page + SettlementModal + SplitRatioModal. New `sharedBalance.*` namespace. `netLabel` via `t('sharedBalance.net.owes', { debtor, creditor })`. SCOPE_OPTIONS moved inside SplitRatioModal as closure over `t()`. Reused `expenses.sections.{spendingByCategory,categoryBreakdown,donutTotal}` and `expenses.filters.{all,searchPlaceholder,allCategories,expenseOne,expenseOther}`.
  - Phase 10: CashFlow page. New `cashFlow.*` namespace. Sankey label translation handled via factory pattern: `makeSankeyNodeRenderer(t, currency)` plus `NODE_NAME_TO_KEY` map keeps English keys driving SOURCE_COLORS/DEST_COLORS while display labels translate. `formatPeriodLabel(mode, val, language, t)` rewritten with `formatMonthYear` + `periodSelector.quarterShort`. Quick Insight templated sentence uses i18next interpolation with `direction` sub-keys (`increased`/`decreased`). `CurrencyDisplay` imported from `../store/types` (not formatters).
  - Phase 11: Reports page. New `reports.*` namespace. Same Sankey factory pattern, reused `cashFlow.sankey.nodes.*`. `buildChartKeys(mode, value, allDates, language, weekLabel)` accepts a week-label callback (`t('reports.bucket.week', { n })` → "W1"/"S1"). `periodSectionLabel(mode, value, language, t)` uses `formatMonthYear`/`periodSelector.{allTime,quarterShort}`. Helper `sectionTitle = (section) => t('reports.sectionInPeriod', { section, period })`. Map callback `t` → `tabItem` to avoid shadowing.
  - Phase 12: Budget + NetWorth pages. New `budget.*` and `netWorth.*` namespaces. Budget: `GROUP_KEYS` map + `displayGroup(g)` translates fixed group names (Ungrouped/Fixed/Variable/Untagged) while user-defined group strings pass through. `RemainingCell` now takes a `currency` prop. `BudgetPopover` takes `language` + `currency` props; popover history months use `format(d, 'MMM', language === 'es' ? { locale: esLocale } : undefined).toUpperCase()`. Plural `budget.unbudgeted.show` via `count`. Right-side summary panel map-callback `t` → `gt` to avoid shadowing. NetWorth: full page translated; `p.type` left untranslated (free-form `string` in Portfolio type, same rule as user-defined category names).
  - Phase 13: SharedBalanceView (public read-only snapshot URL target). Added `sharedBalance.snapshot.{invalidTitle,invalidBody,banner}` (3 new keys); everything else reused from existing `sharedBalance.*` + `expenses.*` namespaces. All 15 `formatMXN*` call sites migrated; `formatDate` calls now take `language`. Table headers converted to object-shaped array (key/label/align) to support translated `label` text.
  - Phase 14: ScreenshotImportModal (was deferred since Phase 3). New `screenshotImport.*` namespace covering modal title, dropzone, loading, errors (incl. `{{preview}}` interp for the OCR-read string), review (plural foundOne/foundOther + selectAll/none + duplicate banner), Add row / Add {{count}} selected / Import More / Done buttons, and Done step (plural addedOne/addedOther + bodies). Reuses `common.cancel`, `expenses.form.{description,amount}`, `expenses.filters.shared`. No formatter work (no money rendered in this modal). No new tests.
  - Phase 15: Chart currency-awareness + small UI polish. All 6 chart components (`AreaChart`, `BarChart`, `LineChart`, `StackedBarChart`, `DonutChart`, `Tooltip`) now read `currency` from the store internally via `useStore((s) => s.settings.currencyDisplay)` and use `formatMoney`/`formatMoneyCompact` — **no prop drilling** at the ~23 page call sites (Option A: charts are now store-aware). USD toggle now flips axis ticks, Recharts native tooltips, and the donut legend. Added `common.quickAdd.{expense,paycheck,transfer,debtPay}` (4 keys) for `QuickAdd.tsx` and `common.empty.noData` for the `DataTable.tsx` default empty state (`emptyMessage` prop now optional; falls back to `t('common.empty.noData')`).
- **Remaining i18n surface**: **none in user-facing UI.** The only `formatMXN*` callers left are inside `src/lib/formatters.ts` (definitions + `formatMoney` dispatch) and `src/__tests__/lib/formatters.test.ts`.
- **Tests**: `src/__tests__/lib/formatters.test.ts` covers `formatMoneyCompact` (MXN/USD) and Spanish-locale `formatDate`/`formatShortMonth`. 51/51 passing as of Phase 4.
- **Plan file**: `~/.claude/plans/i-want-to-implement-misty-wombat.md` holds the Phase 2 plan; Phases 3/4 followed the same pattern (incremental, one PR per page) without rewriting the plan file.
