# Handoff: MotsApp Finance Tracker — Full UI Redesign

## Overview
Complete UI redesign of MotsApp, a personal finance tracker with 9 screens: Dashboard, Cash Flow, Income, Expenses, Debt, Mortgage, Portfolio, Shared Balance, and Settings. The redesign applies the **Airtable editorial design system** — clean, professional, trust-focused — replacing the original purple-accent UI with a near-black primary, full-bleed colored hero bands, and a white sidebar navigation.

---

## About the Design Files

The files in this bundle are **design references created in HTML** — high-fidelity interactive prototypes showing intended look and behavior. They are **not production code to copy directly**.

Your task is to **recreate these HTML designs in the existing React codebase** (`https://github.com/lothoniel/finance-app`) using its established patterns, components, and libraries. Apply the design tokens, layout structure, and component patterns documented here to the existing app.

---

## Fidelity

**High-fidelity.** These are pixel-accurate mockups with:
- Final colors (exact hex values from the Airtable design system)
- Typography hierarchy (sizes, weights, line heights)
- Spacing and padding values
- Component patterns (hero bands, KPI cards, insight cards, data tables)
- Interactive states (hover, active, period tab switching)
- All 9 pages fully populated with realistic mock data

Recreate the UI **pixel-accurately** using the existing codebase's libraries and patterns.

---

## Design System Tokens

### Colors

```css
:root {
  /* Core */
  --primary:         #181d26;   /* Near-black — buttons, headings */
  --primary-active:  #0d1218;   /* Pressed state */
  --ink:             #181d26;   /* Strongest text */
  --body:            #333840;   /* Default body text */
  --muted:           #41454d;   /* Captions, meta */
  --hairline:        #e8e8e8;   /* 1px borders, dividers */
  --canvas:          #ffffff;   /* Card backgrounds */
  --surface-soft:    #f8fafc;   /* Page background */
  --surface-mid:     #f0f2f5;   /* Progress tracks, empty states */

  /* Signature Colors (Hero Bands & Accents) */
  --sig-coral:       #aa2d00;   /* Dashboard hero, Expenses, Cash Flow */
  --sig-forest:      #0a2e0e;   /* Dashboard hero band */
  --sig-cream:       #f5e9d4;   /* Shared Balance hero */
  --sig-peach:       #fcab79;   /* Mortgage hero */
  --sig-mint:        #a8d8c4;   /* Income, Portfolio hero bands */
  --sig-mint-dark:   #2e7d65;   /* Mint text, icon color */
  --sig-mustard:     #c8912a;   /* Debt hero */
  --sig-coral-light: #fff1ec;   /* Coral chip bg */
  --sig-mint-light:  #eef8f4;   /* Mint chip bg */
  --sig-mustard-light: #fdf6e3; /* Mustard chip bg */

  /* Semantic */
  --success:         #1a7a3c;   /* Positive values */
  --success-bg:      #e8f5ee;
  --danger:          #c0392b;   /* Negative values */
  --danger-bg:       #fdecea;
}
```

### Typography

Font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif`

| Role | Size | Weight | Use |
|---|---|---|---|
| Hero value | 28–32px | 400 | KPI numbers in hero bands |
| Section display | 26px | 400 | Page title in Settings hero |
| Card value | 28px | 400 | kpi-card values in page body |
| Section title | 14px | 600 | Section headings with rule line |
| Card title | 13px | 600 | Card section labels |
| Body | 13–14px | 400 | Table rows, descriptions |
| Label (uppercase) | 11px | 600 | KPI labels, chip text |
| Meta / caption | 11–12px | 400–500 | Dates, subtitles |

### Spacing

```
4px   — gap between small inline elements
8px   — tight padding (tags, chips)
12px  — grid gap in dense areas
16px  — hero KPI card padding, default card padding
20px  — hero band actions top offset, standard card padding
24px  — sidebar padding, section spacing
28–40px — hero band padding
36px  — page body padding (top)
40px  — hero band horizontal padding
48px  — page body bottom padding
```

### Border Radius

```
6px   — input fields
8px   — buttons, insight cards, debt cards
10px  — hero KPI cards, kpi-card, main cards, portfolio cards
12px  — hero bands
```

---

## App Shell

### Sidebar (220px fixed width)

- **Background:** `--canvas` (#ffffff)
- **Border right:** 1px `--hairline`
- **Logo:** 36×36px rounded-10 dark block + "FinanceApp" text (15px/600)
- **Nav groups:** "Main" (Dashboard–Debt), "Assets" (Mortgage–Shared Balance), "System" (Settings)
- **Group labels:** 10px/600 uppercase, `--muted` at 0.6 opacity
- **Nav items:** 10px 12px padding, 8px radius, 13px/500, `--body` color
  - Hover: `--surface-soft` background
  - Active: `--surface-soft` background + `--ink` color + weight 600
- **Icons:** 15×15px custom SVG per page (see prototype). Active = `#181d26`, inactive = `#9297a0`
- **User footer:** 32px circular avatar (initial "L"), name + date below divider

### Page Background

`--surface-soft` (#f8fafc) — gives cards an elevated feel.

---

## Screens

### 1. Dashboard

**Hero band color:** `--sig-forest` (#0a2e0e) — white text  
**Hero KPIs:** Net Flow · Income · Expenses · Debt Paid  
**Hero action button:** `+ Add Transaction` (ghost style)

**Page body sections:**
1. **Portfolio & Wealth** — 3-column grid of `kpi-card` with sparkline bars:
   - Investments (mint chip) / Debt Ratio (coral chip) / Savings Rate (mustard chip)
2. **Spending Breakdown** — 2-column:
   - Left: horizontal CSS bar chart (5 categories, coral bars)
   - Right: Recent Activity table (name + category, amount colored green/red)
3. **Insights** — stacked `insight-item` cards (coral/mint/mustard left border variants)

---

### 2. Cash Flow

**Hero band color:** `--sig-coral` (#aa2d00) — white text  
**Hero KPIs:** Total Income · Total Expenses · Debt Payments · Net Flow  
**Hero action:** `Export` (ghost)

**Page body sections:**
1. **Monthly Trend** — grouped bar chart (6 months × 3 series: income/expenses/debt). Each month has 3 bars (12px wide, 2px gap). Legend below.
2. **Cash Flow Analysis** — table: Month / Income / Expenses / Debt / Net. Income = `--success`, Expenses = `--danger`, Net = `--success`/bold.

---

### 3. Income

**Hero band color:** `--sig-mint-dark` (#2e7d65) — white text  
**Hero KPIs:** Gross Income · Net Income (with tax subtitle) · Transfers Received  
**Hero actions:** `+ Add Transfer` (ghost) · `+ Add Paycheck` (primary white)

**Page body sections:**
1. **Paychecks** — table: Date / USD / Rate / MXN. MXN column bold.
2. **Transfers Received** — 3-column kpi-card grid (Household / Rental / Others) with colored dots.

---

### 4. Expenses

**Hero band color:** `--sig-coral` (#aa2d00) — white text  
**Hero KPIs:** Total Expenses · Avg Per Month · Top Category  
**Hero actions:** `Import` (ghost) · `+ Add Expense` (primary white)

**Page body sections:**
1. **Spending by Category** — 2-column:
   - Left: horizontal CSS bar chart
   - Right: transactions table with PERSONAL/SHARED tags (mint/mustard bg)

---

### 5. Debt

**Hero band color:** `--sig-mustard` (#c8912a) — white text  
**Hero KPIs:** Total Paid · Remaining Debt · Debt Ratio  
**Hero action:** `+ Record Payment` (primary white)

**Page body sections:**
1. **Card Balances** — 3-column grid of `debt-card`:
   - Card name (15px/600) + balance (22px/400) + progress bar (6px track) + "X% of $Y limit"
   - Each card has a unique color for the progress fill
2. **Recent Payments** — table: Date / Card / Description / Amount (green)

---

### 6. Mortgage

**Hero band color:** `#e8874a` (peach-orange) — white text  
**Hero KPIs:** Current Balance (with "8.8% paid off") · Time Saved · Projected Payoff · Interest Saved  
**Hero actions:** `+ Add Contribution` (ghost) · `+ Add Payment` (primary white)

**Page body sections:**
1. **Payment History** — table: Date / Total Paid / Extra Capital (green/bold) / Balance After

---

### 7. Portfolio

**Hero band color:** `--sig-mint-dark` (#2e7d65) — white text  
**Hero KPIs:** Total Net Worth · Total Yield · Total Deposits  
**Hero actions:** `+ Add Movement` (ghost) · `+ Add Portfolio` (primary white)

**Page body sections:**
1. **Holdings** — 2-column `portfolio-card`:
   - Name + type + portfolio % subtitle
   - APY badge (mint-light or coral-light bg, colored text)
   - Value (28px/400) + last gain (green)
   - Progress bar showing allocation %
2. **Transaction History** — table with GAIN/DEPOSIT/WITHDRAWAL tags (colored bg/text)

---

### 8. Shared Balance

**Hero band color:** `--sig-cream` (#f5e9d4) — dark text (`--ink`)  
**Hero KPIs:** Total Shared · Per Person · Net Settlement (coral value)  
**Hero actions:** `+ Cash` (ghost-dark) · `+ Record Settlement` (primary dark)  
**Note:** Period tabs use `dark` variant (dark border/text, not white)

**Page body sections:**
1. **Individual Ledgers** — 2-column `ledger-card`:
   - Name (15px/600) + rows: Total Paid / Share / Is Owed or Still Owes
   - Green for "Is Owed", red for "Still Owes"
2. **Recent Shared Expenses** — table: Date / Description / Paid By / Amount (red)

---

### 9. Settings

**Hero band color:** `--primary` (#181d26) — white text  
**No period tabs, no action buttons**

**Page body sections:**
1. **User Names** — 2-column input grid + "Save Names" dark button
2. **Transaction Categories** — scrollable list with colored dot + name + "Budget" chip
3. **Data Management** — button row: Export JSON / Export Excel / Export XML / Import JSON / Clear All Data (danger style)

---

## Component Specs

### Hero Band

```css
.hero-band {
  padding: 36px 40px;
  position: relative;
  overflow: visible;
}
```

Each color variant is a background-color class. Hero KPI cards sit in a flex row with `gap: 12px`.

### Hero KPI Card

```css
.hero-kpi {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 10px;
  padding: 16px 20px;
  min-width: 150px;
}
/* Dark variant (cream band): */
.hero-kpi.dark-bg {
  background: rgba(0,0,0,0.06);
  border-color: rgba(0,0,0,0.1);
}
```

- Label: 11px/600 uppercase, 0.4 letter-spacing, 0.75 opacity
- Value: 28px/400, line-height 1.1
- Sub: 12px, 0.7 opacity, margin-top 5px

### Hero Action Buttons

Positioned `absolute` top-right of hero band (top: 28px, right: 40px).

```css
/* Primary (white bg, dark text) */
.hero-btn.primary { background: white; color: #181d26; }
/* Ghost (on dark bands) */
.hero-btn.ghost { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); }
/* Ghost dark (on cream band) */
.hero-btn.ghost-dark { background: rgba(0,0,0,0.07); color: #181d26; border: 1px solid rgba(0,0,0,0.12); }
```

All buttons: `padding: 8px 16px`, `border-radius: 8px`, `font-size: 13px`, `font-weight: 500`.

### Period Tabs

Pill-shaped toggle inside hero band. Active = white bg + dark text. Inactive = transparent + white text at 0.8 opacity. Options: Month / Quarter / Year / All Time.

### KPI Card (page body)

```css
.kpi-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 20px;
}
```

Contains: colored chip (badge) → value (28px/400) → label (12px muted) → optional sparkline.

### Section Title

```css
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #181d26;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e8e8e8;
}
```

### Data Table

```css
th: 11px/600 uppercase, muted color, 8px 12px padding, hairline border-bottom
td: 13px, body color, 11px 12px padding, hairline border-bottom (last row: none)
td:last-child: text-align right, font-weight 500
```

### Insight Card

```css
.insight-item {
  background: white;
  border: 1px solid #e8e8e8;
  border-left: 3px solid <accent>;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  gap: 12px;
}
```

Variants: `.coral` (`#aa2d00`), `.mint` (`#2e7d65`), `.mustard` (`#c8912a`)

### Debt Card

```css
.debt-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 18px;
}
```

Contains: name (14px/600) → balance (22px/400) → 6px progress bar → sub text (11px muted).

### Tags / Chips

```css
/* Inline table badge */
.tag { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
.tag.shared   { background: #eef8f4; color: #2e7d65; }
.tag.personal { background: #fdf6e3; color: #c8912a; }
/* GAIN/DEPOSIT/WITHDRAWAL */
GAIN:       background #e8f5ee, color #1a7a3c
DEPOSIT:    background #eef8f4, color #2e7d65
WITHDRAWAL: background #fdecea, color #c0392b
```

---

## Interactions & Behavior

- **Sidebar navigation:** Clicking a nav item switches the active page. Active item: `--surface-soft` bg + `--ink` color + weight 600 + dark icon. All other items: muted color + gray icon.
- **Period tabs:** Clicking Month/Quarter/Year/All Time updates the active tab state. This should re-fetch or re-filter dashboard data.
- **Action buttons:** `+ Add X` buttons open the existing modal/form for that record type. `Export` triggers file download. `Import` opens file picker.
- **Progress bars:** Animate from 0 to target width on page load (`transition: width 0.6s ease`).
- **Sparklines:** 7-bar mini bar chart per KPI card. Last bar uses full color, previous bars use 33% opacity.
- **Responsive:** Sidebar hidden on mobile (< 768px). All grids collapse to single column. Hero band padding reduces to 24px.

---

## SVG Icons (Sidebar)

Each nav item uses a 15×15 custom SVG icon. The active color is `#181d26`, inactive is `#9297a0`. See the prototype file for exact SVG paths. Icons used:

| Page | Icon description |
|---|---|
| Dashboard | 4-square grid |
| Cash Flow | Trending line with arrow |
| Income | Upward arrow |
| Expenses | Credit card |
| Debt | Building outline |
| Mortgage | House outline |
| Portfolio | 3-bar ascending chart |
| Shared Balance | Two overlapping people |
| Settings | Gear/cog |

---

## Files in This Bundle

| File | Purpose |
|---|---|
| `FinanceApp Colorful Multi-Page Prototype.html` | Full interactive prototype — all 9 pages, live navigation, real data |
| `design-tokens.css` | All CSS variables ready to copy into the project |
| `CLAUDE_CODE_HANDOFF.md` | Extended developer notes, API data shapes, migration checklist |
| `Design-Tokens-Guide.html` | Visual color/component reference |

---

## Getting Started in VS Code with Claude Code

1. **Open your project** in VS Code (`code /path/to/finance-app`)
2. **Open Claude Code** (Cmd+Shift+P → "Claude Code")
3. **Paste this prompt to Claude Code:**

```
I have a design handoff for a full UI redesign of this app. 
Please read the file `design_handoff_motsapp/README.md` for complete 
specifications. Then open `design_handoff_motsapp/FinanceApp Colorful 
Multi-Page Prototype.html` in a browser to see the target design.

Start by:
1. Creating `src/styles/tokens.css` with all design tokens from the README
2. Refactoring the sidebar component to match the new design
3. Then tackle the Dashboard page hero band and KPI cards

Follow the component specs exactly — colors, spacing, border radius, typography.
```

4. **Iterate page by page** — Claude Code will read the README and match the prototype.

---

## Implementation Order (Recommended)

1. `tokens.css` — Set up all CSS variables first
2. `Sidebar` — Navigation shell, logo, user footer, SVG icons
3. `HeroBand` component — Reusable across all pages (color prop + children)
4. `HeroKPI` component — Frosted card inside hero band
5. `PeriodTabs` component — Month/Quarter/Year/All Time toggle
6. `HeroActionButton` — primary / ghost / ghost-dark variants
7. `SectionTitle` — With rule line
8. `KPICard` — Body card with chip, value, sparkline
9. `InsightCard` — Left-border accent variant
10. `DataTable` — Reusable table with th/td styles
11. Individual pages in order: Dashboard → Cash Flow → Income → Expenses → Debt → Mortgage → Portfolio → Shared Balance → Settings

---

## Key Rules (Don't Break These)

- ✅ Primary button = near-black (`#181d26`), never purple or blue
- ✅ Hero bands are full-bleed colored sections at the top — no card border, no shadow
- ✅ Hero KPI cards use frosted glass style (`rgba(255,255,255,0.12)`)
- ✅ Page background is `#f8fafc` (soft gray), not pure white
- ✅ Sidebar is white, not dark
- ✅ No gradients anywhere
- ✅ Positive values = `#1a7a3c` (green), Negative = `#c0392b` (red)
- ✅ Section titles use flex with `::after` rule line
- ✅ Tables: last column right-aligned, bold

---

*Handoff prepared by AI Design Assistant · April 30, 2026*  
*Design system: Airtable Editorial · App: MotsApp Finance Tracker*
