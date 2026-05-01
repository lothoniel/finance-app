# FinanceApp Dashboard Redesign — Claude Code Handoff

**Date:** April 30, 2026  
**Project:** MotsApp (Finance Tracker)  
**Design System:** Airtable Editorial (Professional, minimal, trust-focused)  
**Status:** Ready for implementation

---

## Executive Summary

The current FinanceApp UI suffers from:
1. **Inconsistent typography** — no clear hierarchy
2. **Visual clutter** — too many competing elements
3. **Poor information architecture** — metrics and charts fight for attention
4. **Color confusion** — purple accent doesn't align with a trustworthy finance brand

**Solution:** Apply Airtable's editorial design system (near-black primary, Haas Grotesk typography, signature cards, whitespace) to create a calm, professional dashboard. Three variations were explored; **Option B (Flow-Focused)** is recommended as the primary direction, with Options A and C available as alternates.

---

## Design System: Airtable Tokens

### Colors

```css
:root {
  /* Primary & Neutrals */
  --primary: #181d26;              /* Near-black, primary CTA + h1/h2 */
  --primary-active: #0d1218;       /* Pressed state on buttons */
  --ink: #181d26;                  /* Body text, highest contrast */
  --body: #333840;                 /* Secondary body text */
  --muted: #41454d;                /* Meta text, captions, footers */
  --hairline: #dddddd;             /* 1px borders, dividers */
  --canvas: #ffffff;               /* Page background */
  --surface-soft: #f8fafc;         /* Light card backgrounds */
  --surface-strong: #e0e2e6;       /* Light gray CTA band */
  --surface-dark: #181d26;         /* Dark card backgrounds */

  /* Signature Cards (Brand Voltage) */
  --sig-coral: #aa2d00;            /* Income, positive metrics */
  --sig-forest: #0a2e0e;           /* Cash flow hero, savings */
  --sig-cream: #f5e9d4;            /* Callout cards, insights */
  --sig-peach: #fcab79;            /* Secondary metrics */
  --sig-mint: #a8d8c4;             /* Investments, assets */
  --sig-yellow: #f4d35e;           /* Warnings, highlights */
  --sig-mustard: #d9a441;          /* Recommendations */

  /* Semantic */
  --link: #1b61c9;                 /* Inline links */
  --success: #006400;              /* Positive values, gains */
  --danger: #d32f2f;               /* Negative values, expenses */
}
```

**Key Rules:**
- Primary button is **near-black** (`#181d26`), NOT purple or blue
- Signature cards (`coral`, `forest`, `cream`) are the brand's "voltage moments" — use sparingly
- Secondary buttons are white with hairline outline
- Whitespace is a design tool; hero sections should feel calm, not crowded

### Typography

**Font Stack:** `"Haas Grotesk", "Inter", system-ui, sans-serif`  
**Fallback:** If Haas unavailable, use Inter Display (variable)

| Token | Size | Weight | Use |
|---|---|---|---|
| `display-lg` | 40px | 400 | Page h1 hero |
| `display-md` | 32px | 400 | Section headlines |
| `title-lg` | 24px | 400 | Card titles |
| `title-md` | 20px | 400 | Sub-titles |
| `title-sm` | 18px | 500 | Article/card titles |
| `label-md` | 16px | 500 | Button text, labels |
| `body-md` | 14px | 400 | Running text |
| `caption` | 14px | 500 | Meta text, captions |

**Key Rules:**
- Display type is **weight 400**, never bold
- Emphasis comes from size and color contrast, not weight
- Body copy stays 14px / 400 throughout

### Spacing

All spacing snaps to 4px multiples:
- `xxs: 4px` · `xs: 8px` · `sm: 12px` · `md: 16px` · `lg: 24px` · `xl: 32px` · `xxl: 48px`
- **Section padding (vertical):** 96px top + bottom (universal rhythm)
- **Card padding:** 32px (feature cards) or 24px (demo cards) or 48px (signature cards)
- **Gutters:** 24px between cards in grids

### Rounding

- `xs: 2px` — Legal buttons only
- `sm: 6px` — Input fields
- `md: 10px` — Content cards, article cards
- `lg: 12px` — Primary CTAs, signature cards
- `pill: 9999px` — Pricing buttons only (separate sub-system)

---

## Recommended Direction: Option B (Flow-Focused)

### Why Option B?

1. **Narrative Structure** — Tells a story: "Here's your money this month" → breakdown → insights
2. **Signature Card Hero** — Forest green band (`#0a2e0e`) conveys trust and growth
3. **Balanced Hierarchy** — KPIs live in context (secondary) rather than dominating
4. **Actionable Insights** — Cream callout cards (`#f5e9d4`) guide users toward next steps
5. **Scalable** — Works well across all dashboard screens (Income, Expenses, Debt, Portfolio, etc.)

### Structure

```
Hero Band (Signature Card — Forest)
├── "Your Money This Month"
├── 3-up grid: Net Flow / Income / Outflows
└── Brief metadata

Where Your Money Went
├── Left: Spending by Category chart
└── Right: Summary table (category list)

Key Insights
├── Spending Alert (Cream callout)
├── Investment Growth (Mint callout)
└── Portfolio Rebalance (Mustard callout)

Key Metrics
├── 3-column grid of KPIs (mint, forest, coral)
```

### Implementation Notes

1. **Hero Band** — Use `background: #0a2e0e; color: white;` with 32px padding. Typography stays Haas (no custom font needed).

2. **Insight Cards** — Cream background with left border accent. Use different colors (coral, mint, mustard) to visually differentiate card types:
   ```jsx
   <div style={{
     background: '#f5e9d4',
     borderLeft: '4px solid #d9a441',  // mustard for recommendations
     padding: '20px',
     borderRadius: '8px'
   }}>
   ```

3. **Metric Cards** — Left border accent, no shadow. Example:
   ```jsx
   <div style={{
     border: '1px solid #dddddd',
     borderLeft: '4px solid #a8d8c4',  // mint for investments
     padding: '24px',
     borderRadius: '8px'
   }}>
   ```

4. **Charts** — Use placeholder divs with monospace text during development:
   ```jsx
   <div style={{
     height: '200px',
     background: 'linear-gradient(135deg, rgba(24,29,38,0.03) 0%, rgba(24,29,38,0.06) 100%)',
     borderRadius: '6px',
     display: 'flex',
     alignItems: 'center',
     justifyContent: 'center',
     fontFamily: 'monospace',
     color: '#41454d'
   }}>
     [Income vs Debt Pay Chart]
   </div>
   ```
   Replace with real Chart.js or Recharts components in production.

---

## Component Architecture

### React Components to Build

```
Dashboard
├── DashboardHeader
│   ├── Title (h1)
│   └── Period selector (Month/Quarter/Year dropdown)
├── HeroSection (Option B: Signature Forest Band)
│   ├── Headline ("Your Money This Month")
│   ├── Subheadline (metadata)
│   └── 3-column KPI grid
├── Section "Where Your Money Went"
│   ├── Chart (left, 50%)
│   │   └── ChartPlaceholder (to be replaced with Recharts)
│   └── SummaryTable (right, 50%)
│       └── Row[] with category labels + values
├── Section "Key Insights"
│   └── InsightCard[]
│       ├── Label (uppercase, bold)
│       ├── Text
│       └── Icon/emoji (optional)
├── Section "Key Metrics"
│   └── MetricCard[] (3-column grid)
│       ├── Label
│       ├── Value (large)
│       └── Caption
└── Footer (if needed)
```

### State Management

**Minimal state needed:**
```js
const [period, setPeriod] = useState('month');  // 'month' | 'quarter' | 'year'
const [currency, setCurrency] = useState('USD'); // For international support
```

**Data flow:**
```
API: GET /api/dashboard?period=month
  ↓
State: { income, expenses, debt, investments, insights[] }
  ↓
Re-render dashboard with new values
```

### Key Files to Create/Modify

1. **Dashboard.jsx** — Main component (use Option B structure above)
2. **components/MetricCard.jsx** — Reusable KPI card
3. **components/InsightCard.jsx** — Reusable insight callout
4. **components/SummaryTable.jsx** — Reusable summary table
5. **styles/tokens.css** — All Airtable color + typography tokens
6. **styles/dashboard.css** — Layout-specific styles (grid, spacing)

---

## Migration Path from Current UI

### Current Pain Points → Solution

| Issue | Current | Redesign |
|---|---|---|
| **Typography chaos** | Mix of weights/sizes | Haas Grotesk, strict hierarchy (40/32/24/18/14/13px) |
| **Clutter** | 10+ elements competing | Whitespace-first, hero band + 3 sections max |
| **Metric visibility** | Small cards in 5-column grid | Vary grid (hero 3-up, sections 2-up) |
| **Color trust** | Purple accent | Near-black primary + signature cards |
| **Navigation** | Sidebar is okay | Keep as-is; apply same color system |
| **Chart readability** | Small, dense | Larger, breathing room |

### Phase 1: Dashboard Only (This Handoff)
- [ ] Implement Option B hero section
- [ ] Refactor metric cards (left border accent, new padding)
- [ ] Build insight cards component
- [ ] Typography token stylesheet
- [ ] Test responsive (tablet/mobile) grid collapsing

### Phase 2: Other Screens (Future)
- [ ] Cash Flow page (use same hero structure)
- [ ] Income page (feature Option C narrative approach)
- [ ] Expenses page (keep current structure but apply typography + colors)
- [ ] Settings (dark surface cards)

### Phase 3: Polish
- [ ] Replace chart placeholders with Recharts
- [ ] Add micro-interactions (hover states per Airtable system)
- [ ] Accessibility audit (WCAG AA)

---

## CSS-in-JS vs. CSS Modules vs. Stylesheet

**Recommendation:** Create a single `tokens.css` file with CSS variables, then use inline styles or CSS modules for components. This keeps tokens centralized and easy to update.

```css
/* tokens.css */
:root {
  --primary: #181d26;
  --sig-forest: #0a2e0e;
  /* ... all tokens ... */
  --font-display: "Haas Grotesk", "Inter", system-ui, sans-serif;
  --font-body: "Haas Grotesk", "Inter", system-ui, sans-serif;
}

/* dashboard.css */
.dashboard {
  background: var(--canvas);
  font-family: var(--font-body);
}

.metric-card {
  border: 1px solid var(--hairline);
  border-left: 4px solid var(--sig-mint);
  padding: 24px;
  border-radius: 8px;
}
```

Then in React:
```jsx
<div style={{
  background: 'var(--sig-forest)',
  padding: '32px',
  color: 'white',
  borderRadius: '8px'
}}>
```

---

## Data Shape & API Integration

### Expected API Response

```json
{
  "period": "month",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "metrics": {
    "netFlow": 98362.98,
    "income": 84948.30,
    "expenses": 76438.97,
    "debtPayments": 67008.84,
    "investments": 6700000.00,
    "debtRatio": 0.405
  },
  "breakdown": {
    "byCategory": [
      { "name": "Salidas", "amount": 715, "percent": 36.9 },
      { "name": "Agua", "amount": 433, "percent": 22.3 },
      { "name": "Personal", "amount": 341, "percent": 17.6 },
      { "name": "Other", "amount": 287, "percent": 23.2 }
    ]
  },
  "insights": [
    {
      "type": "warning",
      "label": "↑ Spending Alert",
      "text": "Salidas increased 34.6% month-over-month.",
      "accentColor": "sig-coral"
    },
    {
      "type": "success",
      "label": "✓ Investment Growth",
      "text": "Portfolio gained $21.5k this month.",
      "accentColor": "sig-mint"
    }
  ]
}
```

---

## Responsive Breakpoints

Follow Airtable's guidance:

| Breakpoint | Width | Changes |
|---|---|---|
| Mobile | < 768px | Single column; hero card stacks vertically |
| Tablet | 768–1024px | 2-column grids; charts maintain aspect |
| Desktop | > 1024px | Full 3-column layout as designed |

```css
/* Tablet */
@media (max-width: 1024px) {
  .grid-3 { grid-template-columns: 1fr 1fr; }
}

/* Mobile */
@media (max-width: 768px) {
  .grid-3, .grid-2 { grid-template-columns: 1fr; }
  .hero-band h2 { font-size: 28px; }
  .dashboard-content { padding: 16px; }
}
```

---

## Common Gotchas & Solutions

### 1. **"Why not purple anymore?"**
Purple is energetic but reads as trendy/uncertain in finance. Near-black conveys trust and professionalism. Reserve accent colors (coral, mint, mustard) for specific, intentional moments (KPIs, insights).

### 2. **"The hero band feels too dark."**
It's intentional. Dark cards break monotony; the white canvas resets between sections. This rhythm creates visual pacing. See Airtable's homepage for reference.

### 3. **"My data has X metric you didn't show."**
Use the MetricCard component (left-border accent, 24px padding). If it's a secondary metric, put it in a "More Metrics" collapsible or a separate "Advanced View" toggle.

### 4. **"Charts feel empty/placeholder-y."**
Correct. Replace `<ChartPlaceholder>` with Recharts, Chart.js, or Visx once data is wired. The design supports both small (150px) and large (300px) charts; prefer large.

### 5. **"Do I need Haas font?"**
No. Inter or system-ui works. Haas is licensed; if you can access it, great. If not, the fallback stack is sufficient and looks professional.

---

## Handoff Checklist

Before marking complete:
- [ ] All Airtable color tokens defined in CSS/JS
- [ ] Typography hierarchy applied (no orphaned font sizes)
- [ ] Metric cards have left-border accent (not shadow)
- [ ] Hero band is signature forest color (#0a2e0e)
- [ ] Insight cards are cream with colored left border
- [ ] Whitespace respected (96px section padding, 24px card gutters)
- [ ] Responsive grids collapse to single-column on mobile
- [ ] Chart placeholders are ready for Recharts integration
- [ ] Button primary is near-black (#181d26), not purple
- [ ] No shadows except on hover/active states
- [ ] Footer/nav uses same color system

---

## Questions for Developer Handoff

1. **Data source?** Is the dashboard wired to a real API, or mocked data?
2. **Chart library?** Preference for Recharts, Chart.js, or Visx?
3. **Dark mode?** Should the design support a dark theme? (Airtable's system doesn't specify.)
4. **Localization?** Currency/language needs?
5. **Historic data?** Can users drill into previous months/quarters?

---

## References

- **Airtable Design System:** See `Design System Airtable.md` for full spec
- **Current Screens:** `uploads/` folder contains screenshots of all pages
- **Design Variations:** `FinanceApp Redesign — Dashboard.html` has interactive prototypes (A, B, C)

---

## Next Steps

1. **Developer imports this handoff** and sets up tokens stylesheet
2. **Build Dashboard.jsx** using Option B structure
3. **Integrate real data** from API
4. **Replace chart placeholders** with Recharts components
5. **Test responsive** on tablet/mobile
6. **Apply system to other screens** (Cash Flow, Income, Expenses, etc.) using same tokens

Good luck! 🎨

---

*Handoff prepared by AI Design Assistant · April 30, 2026*