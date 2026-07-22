# HomeVault — Financial OS

A private household financial command center, built as a mobile-first React
PWA. It doesn't just record what happened — it helps decide what should
happen next: safe-to-spend, paycheck planning, bill tracking, debt payoff
strategies, sinking funds, and net-worth trends in one place.

## Modules

| Module | What it does |
| --- | --- |
| Dashboard | Total cash, monthly income, bills paid, safe-to-spend, net worth, cash-flow forecast, alerts |
| Paycheck Planner | Assigns every paycheck a job and shows cash remaining per check |
| Bills & Calendar | Recurring obligations moving through Scheduled → Due Soon → Paid |
| Transactions | The household ledger with CSV import, learned merchant rules, search, and reconciliation |
| Budget | Planned vs. actual by category with month-end projections and 75%/90% warnings |
| Debt Payoff | Snowball, avalanche, utilization, and custom strategies with payoff projections |
| Sinking Funds | Christmas, car repairs, school clothes — predictable non-monthly expenses |
| Savings Goals | Emergency-fund coverage and progress toward larger targets |
| Net Worth | Monthly balance sheet: assets minus liabilities, with a 12-month trend |
| Tax Center | Year-to-date income and giving, with document folders |
| Reports | Income/expense summaries, category and merchant breakdowns, CSV export |
| Documents | Household filing cabinet — uploads into folders (IndexedDB in demo, Supabase Storage connected) |
| Account Center | Registry of all accounts — no passwords or credentials stored |
| Settings | Household rules: checking buffer, giving target, utilization warnings |

## Tech stack

- **Frontend:** React 18 + TypeScript, Vite, React Router, TanStack Query,
  React Hook Form + Zod, Recharts, Lucide icons
- **PWA:** vite-plugin-pwa (installable, offline app shell)
- **Backend:** Supabase (PostgreSQL + Auth + Storage) with Row Level
  Security — schema in `supabase/migrations/`
- **Hosting:** Vercel (SPA rewrites in `vercel.json`)

## Getting started

```bash
npm install
npm run dev
```

With no configuration the app runs in **demo mode** against a sample
household dataset (persisted in localStorage — reset it from Settings).

### Connecting Supabase

1. Create a Supabase project and run `supabase/migrations/0001_initial_schema.sql`,
   then `supabase/seed.sql`.
2. After your first sign-in, add your user to `household_members` (see the
   comment in `seed.sql`).
3. Copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Never commit service-role keys or put them in frontend env vars. Row Level
Security restricts every table to members of the record's household.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck + production build (`dist/`) |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
├── app/            App, router, providers
├── calculations/   Pure financial logic (safe-to-spend, debt payoff, cash flow…)
├── components/     layout, dashboard panels, forms, ui primitives
├── data/           Demo dataset + local demo store
├── hooks/          TanStack Query hooks
├── pages/          One page per module
├── services/       Supabase client, data access, dashboard aggregation
├── styles/         Design tokens, global styles, responsive rules
└── types/          Shared domain types
supabase/
├── migrations/     Postgres schema with RLS policies
└── seed.sql        Starter household + categories
```

## Construction phases

1. **Foundation (done):** shell, dashboard, accounts, bills, transactions,
   goals, calculations, PWA, demo mode, Supabase schema
2. **Planning tools (done):** record paychecks with allocations and
   overdraft forecasting, editable budget targets, goal contributions,
   generated alert engine (utilization, overdue/due-soon bills, budget
   thresholds, low buffer, emergency-fund coverage, bill variance),
   automatic bill status transitions, debt strategy comparison, net-worth
   snapshots
3. **Imports & documents (done):** CSV transaction import with column
   auto-detection, duplicate flagging (against the ledger and within the
   file), and rule-applied categories; merchant→category rules that learn
   as you categorize; transaction reconciliation workflow; document
   uploads into folders with download/delete
4. **Intelligence:** anomaly alerts, cash-flow forecasts, monthly review
5. **Advanced:** bank-data integration, push notifications, tax projection
