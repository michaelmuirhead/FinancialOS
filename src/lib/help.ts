/**
 * Help content for the Help Center (/help) and the contextual ? dropdown.
 * Route guides are keyed by pathname so both surfaces share one source.
 */

export interface HelpTopic {
  /** Route this guide describes. */
  path: string;
  title: string;
  /** One or two sentences on what the screen is for. */
  summary: string;
  /** Actionable, specific tips for using it well. */
  tips: string[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const gettingStarted: string[] = [
  "Add your accounts first (Accounts → Add account, or the + button). Mark your checking as “count toward safe-to-spend” so the number is accurate.",
  "Add your recurring bills (Bills & Calendar → Add bill) and your debts (Debt Payoff → Add debt).",
  "Record a paycheck (Paycheck Planner) or import recent activity — Transactions → Import CSV, or the “Import from screenshot” quick action.",
  "Set budget targets (Budget → Edit targets) and create savings goals or sinking funds.",
  "Check the Dashboard for your snapshot, the Forecast for where your balance is headed, and the Monthly Review at month-end for an action plan.",
];

export const helpTopics: HelpTopic[] = [
  {
    path: "/",
    title: "Dashboard",
    summary:
      "Your financial snapshot — the five numbers that matter, plus cash-flow, budget, bills, debt, goals, and alerts at a glance.",
    tips: [
      "“Safe to Spend” is what's left after protecting upcoming bills, planned savings, debt payments, and your minimum buffer — not just your checking balance.",
      "The cash-flow chart can switch between Actual, Forecast, and Both, and 30/60/90-day horizons.",
      "Metric cards and panels link into the detailed pages — click “View all” or a card to drill in.",
    ],
  },
  {
    path: "/forecast",
    title: "Forecast",
    summary:
      "Projects your balance day by day from scheduled bills, paychecks, minimum payments, and transfers — with milestone cards for 30/90-day, year-end, and beyond.",
    tips: [
      "The dashed red line is zero — if the projection dips below it, you get a warning with the date.",
      "Use the period selector to look further out; the day-by-day ledger shows every projected movement with a running balance.",
      "Numbers come from your bills, paychecks, debts, and goals — keep those current and the forecast stays accurate.",
    ],
  },
  {
    path: "/paychecks",
    title: "Paycheck Planner",
    summary:
      "Give every incoming paycheck a job — assign bills, giving, groceries, savings, and a buffer — and see the cash left over.",
    tips: [
      "Record a paycheck with its allocations; “cash available” updates as you assign.",
      "The planner forecasts your lowest balance before the next payday and flags overdraft risk against your buffer.",
      "It also shows how many unpaid bills fall before each check, so you can move a bill to a different paycheck if a week is tight.",
    ],
  },
  {
    path: "/bills",
    title: "Bills & Calendar",
    summary:
      "Track recurring and one-time obligations. Bills move automatically Scheduled → Due Soon → Overdue, and you mark them Paid.",
    tips: [
      "Status is derived from the due date automatically — no need to update it by hand until you pay.",
      "“Mark paid” records the payment; a materially higher-than-expected amount surfaces as an alert.",
      "Add a bill's payment account and auto-pay flag so the forecast and paycheck planner know about it.",
    ],
  },
  {
    path: "/transactions",
    title: "Transactions",
    summary:
      "Your household ledger. Import from a bank CSV, categorize once and the app remembers the merchant, and reconcile against statements.",
    tips: [
      "Import CSV auto-detects columns and flags duplicates (against the ledger and within the file).",
      "Categorizing a transaction creates a merchant rule, so future imports categorize it for you — manage these under “Rules”.",
      "Use the Pending / Posted / Reconciled filters to check off transactions as they clear your bank.",
    ],
  },
  {
    path: "/budget",
    title: "Budget",
    summary:
      "Planned vs. actual spending per category, with month-end projections and warnings at 75% / 90% / over budget.",
    tips: [
      "“Edit targets” lets you set each category's monthly amount inline.",
      "The projection estimates where you'll land by month-end at your current pace.",
      "Categories that cross a threshold also raise a dashboard alert.",
    ],
  },
  {
    path: "/debt",
    title: "Debt Payoff",
    summary:
      "Every balance plus a payoff strategy — Snowball, Avalanche, Utilization, or Custom — with a debt-free date and interest projection.",
    tips: [
      "Compare strategies side by side: months to debt-free and total interest for each.",
      "The extra-payment field shows how much sooner you finish and how much interest you save.",
      "Recommendations tell you which debt to focus and how much to pay a card to get utilization under 30%.",
    ],
  },
  {
    path: "/sinking-funds",
    title: "Sinking Funds",
    summary:
      "Save monthly for predictable non-monthly expenses (Christmas, car repairs, insurance deductibles) so they never surprise you.",
    tips: [
      "Set a goal amount and target date; the card shows the monthly contribution needed to get there.",
      "Use the inline “Add” box on a card to record a contribution.",
    ],
  },
  {
    path: "/goals",
    title: "Savings Goals",
    summary:
      "Track larger targets — emergency fund, vacation, down payment — with progress and expected completion.",
    tips: [
      "The emergency-fund card shows how many months of essential expenses you have covered.",
      "Each goal shows the monthly contribution and months remaining at your current pace.",
    ],
  },
  {
    path: "/net-worth",
    title: "Net Worth",
    summary:
      "Your monthly balance sheet — everything you own minus everything you owe — with a 12-month trend.",
    tips: [
      "“Record monthly snapshot” saves this month's value so the trend builds over time.",
      "The chart always ends at your live computed net worth from current account balances.",
    ],
  },
  {
    path: "/review",
    title: "Monthly Review",
    summary:
      "A guided month-end walkthrough that answers seven questions and generates an action plan tailored to your numbers.",
    tips: [
      "Each checklist item is green/amber/red based on your actual data.",
      "The action plan links straight into the module where you'd take each step.",
      "Run it at the end of each month, then act on the top one or two items.",
    ],
  },
  {
    path: "/tax",
    title: "Tax Center",
    summary:
      "Year-to-date income and giving totals, plus folders for the documents you'll need at tax time.",
    tips: [
      "Giving recorded under the Giving category rolls up here for deduction tracking.",
    ],
  },
  {
    path: "/reports",
    title: "Reports",
    summary:
      "Monthly summaries — income vs. expense, spending by category and merchant, and a subscription report — exportable to CSV.",
    tips: [
      "The subscription report flags recurring charges and price increases so you can cancel what you don't use.",
      "Use “Export CSV” to pull the month's transactions into a spreadsheet.",
    ],
  },
  {
    path: "/documents",
    title: "Documents",
    summary:
      "Your household filing cabinet — statements, paystubs, tax docs, policies, and receipts, organized into folders.",
    tips: [
      "Open a folder and use Upload to add a file; download or delete anytime.",
      "Files are stored privately and scoped to your household.",
    ],
  },
  {
    path: "/accounts",
    title: "Account Center",
    summary:
      "The registry of all your accounts — checking, savings, cards, loans, retirement, and more. No passwords or full account numbers are stored.",
    tips: [
      "Mark liquid accounts “count toward safe-to-spend” so that number reflects money you can actually use.",
      "“Import from screenshot” can update balances straight from a bank-app photo.",
    ],
  },
  {
    path: "/settings",
    title: "Settings",
    summary:
      "Household preferences and financial rules — your minimum checking buffer, giving target, utilization warning, and bonus split.",
    tips: [
      "The minimum buffer feeds safe-to-spend and the forecast's below-buffer warnings.",
      "Sign out from the profile menu in the top-right.",
    ],
  },
];

export const glossary: GlossaryEntry[] = [
  {
    term: "Safe to Spend",
    definition:
      "What's left after subtracting upcoming bills, planned savings transfers, debt payments, reserved funds, and your minimum checking buffer from available cash — the amount you can spend without putting an obligation at risk.",
  },
  {
    term: "Minimum buffer",
    definition:
      "A floor you never want your checking to drop below. Set it in Settings; it feeds safe-to-spend and the forecast's low-balance warnings.",
  },
  {
    term: "Sinking fund",
    definition:
      "Money set aside a little each month for a known, non-monthly expense (Christmas, car repairs, property taxes) so it doesn't blow your budget when it arrives.",
  },
  {
    term: "Emergency fund",
    definition:
      "Savings for unexpected events, usually measured in months of essential expenses. Three months is a common first target.",
  },
  {
    term: "Credit utilization",
    definition:
      "A credit card's balance divided by its limit, as a percentage. Keeping it under 30% generally helps your credit score.",
  },
  {
    term: "Snowball",
    definition:
      "A debt payoff order that targets the smallest balance first for quick wins, rolling each freed-up payment into the next debt.",
  },
  {
    term: "Avalanche",
    definition:
      "A debt payoff order that targets the highest interest rate first, which minimizes total interest paid.",
  },
  {
    term: "Reconciliation",
    definition:
      "Confirming each recorded transaction against your bank statement and marking it Reconciled, so your ledger matches reality.",
  },
  {
    term: "Net worth",
    definition:
      "Total assets (cash, savings, investments, home, vehicles) minus total liabilities (cards, loans, mortgage). The single best measure of long-term progress.",
  },
  {
    term: "Bill status",
    definition:
      "Scheduled → Due Soon (within 3 days) → Overdue, derived automatically from the due date until you mark the bill Paid.",
  },
];

export function helpForPath(pathname: string): HelpTopic | undefined {
  return helpTopics.find((topic) => topic.path === pathname);
}
