# HomeVault — Financial OS

A private household financial command center, built as a mobile-first React
PWA. It doesn't just record what happened — it helps decide what should
happen next: safe-to-spend, paycheck planning, bill tracking, debt payoff
strategies, sinking funds, and net-worth trends in one place.

## Modules

| Module | What it does |
| --- | --- |
| Dashboard | Total cash, monthly income, bills paid, safe-to-spend, net worth, cash-flow forecast, alerts |
| Forecast | Balance milestones (30/90-day, year-end, multi-year) and a day-by-day projected ledger |
| Paycheck Planner | Assigns every paycheck a job and shows cash remaining per check |
| Bills & Calendar | Recurring obligations moving through Scheduled → Due Soon → Paid |
| Transactions | The household ledger with CSV import, learned merchant rules, search, and reconciliation |
| Budget | Planned vs. actual by category with month-end projections and 75%/90% warnings |
| Debt Payoff | Snowball, avalanche, utilization, and custom strategies with payoff projections |
| Sinking Funds | Christmas, car repairs, school clothes — predictable non-monthly expenses |
| Savings Goals | Emergency-fund coverage and progress toward larger targets |
| Net Worth | Monthly balance sheet: assets minus liabilities, with a 12-month trend |
| Monthly Review | Guided month-end checklist with a generated, linked action plan |
| Tax Center | Year-to-date income and giving, with document folders |
| Reports | Income/expense summaries, category and merchant breakdowns, CSV export |
| Documents | Household filing cabinet — uploads into folders (IndexedDB in demo, Supabase Storage connected) |
| Account Center | Registry of all accounts — no passwords or credentials stored |
| Settings | Household rules: checking buffer, giving target, utilization warnings |

## Tech stack

- **Frontend:** React 18 + TypeScript, Vite, React Router, TanStack Query,
  React Hook Form + Zod, Recharts, Lucide icons
- **PWA:** vite-plugin-pwa (installable, offline app shell)
- **Backend:** Firebase — Firestore (household-scoped data), Firebase Auth
  (email/password + Google), Cloud Storage (documents), Cloud Functions
  (AI screenshot extraction); security rules in `firestore.rules` and
  `storage.rules`
- **Hosting:** Firebase Hosting (`firebase.json`) or Vercel (`vercel.json`)

## Getting started

```bash
npm install
npm run dev
```

The **Firebase web config is baked into the app**
(`src/services/firebase.ts`), so a plain `npm run build` connects to the
configured Firebase project with no env-var setup on the host. To explore
the UI without touching live data, set `VITE_DEMO_MODE=true` to run against
the local sample dataset (persisted in localStorage — reset it from
Settings).

### Firebase setup

The web config is already in the code; you only need the project itself
provisioned:

1. In the Firebase console, enable **Authentication** (Email/Password and
   Google — and add your deploy domain under Authentication → Settings →
   Authorized domains so Google sign-in works), **Firestore**, and
   **Storage**.
2. Deploy the security rules:
   `firebase deploy --only firestore:rules,storage`
3. Open the app and create an account — your household, membership, and
   default budget categories are created automatically on first sign-in.

To point a build at a **different** Firebase project, set the
`VITE_FIREBASE_*` env vars (see `.env.example`); they override the baked-in
defaults.

The Firebase web config values are public client keys — safe to ship in the
bundle. Access control is enforced by the security rules, which restrict
every document under `households/{id}/…` to that household's members. Data
lives in Firestore subcollections (accounts, bills, billOccurrences,
transactions, debts, goals, paychecks, netWorthSnapshots, categoryRules,
documents), and uploaded files live in Cloud Storage under
`documents/{householdId}/`.

### Screenshot import (AI extraction)

The "Import from screenshot" quick action reads balances, upcoming bills,
and transactions out of a screenshot (banking app, bill, statement) and
applies them — after your review — to accounts, bills, and the ledger, which
updates the Forecast automatically. Extraction runs through a Firebase
Cloud Function so the Anthropic API key never reaches the browser:

```bash
cd functions && npm install && cd ..
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy --only functions
```

The function uses Claude (vision + structured outputs) and costs roughly
1–4 cents per screenshot. Full account numbers are never extracted — only
names, last-four digits, and amounts. In demo mode the modal explains the
setup and offers a sample-data preview of the flow.

#### Deploy the Cloud Function from the browser (no computer needed)

If you only have an iPad or phone, the
`.github/workflows/deploy-functions.yml` GitHub Action deploys the function
for you. It runs automatically whenever anything under `functions/` lands on
`main`, and you can also run it by hand from the repo's **Actions** tab →
**Deploy Cloud Function** → **Run workflow**. It writes your Anthropic key
into Secret Manager and deploys the function, so you never touch a terminal.

One-time setup, all from the GitHub and Google Cloud websites:

1. **Upgrade Firebase to the Blaze plan** (Firebase console → ⚙️ → Usage and
   billing). Cloud Functions require Blaze; the free tier still covers light
   personal use.
2. **Create a deploy service account** (Google Cloud console → IAM & Admin →
   Service Accounts → Create). Grant it these roles: **Cloud Functions
   Admin**, **Cloud Run Admin**, **Secret Manager Admin**, **Service Account
   User**, and **Firebase Admin**. Then open the account → **Keys** → **Add
   key** → **JSON** and download the file.
3. **Add two repository secrets** (GitHub repo → Settings → Secrets and
   variables → Actions → New repository secret):
   - `FIREBASE_SERVICE_ACCOUNT` — paste the entire contents of the JSON key.
   - `ANTHROPIC_API_KEY` — your Anthropic API key (`sk-ant-…`).
4. **Run the workflow** from the Actions tab (or push any change under
   `functions/`). When it turns green, screenshot import is live.

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
├── services/       Firebase client, auth, data access, dashboard aggregation
├── styles/         Design tokens, global styles, responsive rules
└── types/          Shared domain types
functions/          Firebase Cloud Functions (screenshot extraction)
firestore.rules     Household-membership security rules
storage.rules       Document storage rules
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
4. **Intelligence (done):** spending anomaly detection against trailing
   three-month averages, subscription discovery with price-increase flags,
   possible-duplicate-charge alerts, debt payoff recommendations with
   extra-payment sensitivity, cash-flow chart with actual/forecast modes
   and 30/60/90-day horizons, and the guided Monthly Review page with an
   auto-generated action plan
5. **Advanced:** bank-data integration, push notifications, tax projection
