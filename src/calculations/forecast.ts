import {
  Bill,
  BillOccurrence,
  Category,
  Debt,
  Goal,
  Paycheck,
} from "@/types";

export type ForecastEntryKind =
  | "income"
  | "essential"
  | "debt"
  | "sub"
  | "transfer";

export interface ForecastEntry {
  date: string;
  description: string;
  kind: ForecastEntryKind;
  /** Signed: income positive, everything else negative. */
  amount: number;
}

export interface ForecastLedgerRow extends ForecastEntry {
  balance: number;
}

export interface ForecastInput {
  bills: Bill[];
  occurrences: BillOccurrence[];
  paychecks: Paycheck[];
  debts: Debt[];
  goals: Goal[];
  categories: Category[];
}

function iso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate + "T12:00:00");
  date.setDate(date.getDate() + days);
  return iso(date);
}

/** Day `day` clamped into the month `offset` months after the given date. */
function monthDay(from: Date, offset: number, day: number): string {
  const lastDay = new Date(
    from.getFullYear(),
    from.getMonth() + offset + 1,
    0,
  ).getDate();
  return iso(
    new Date(
      from.getFullYear(),
      from.getMonth() + offset,
      Math.min(day, lastDay),
      12,
    ),
  );
}

const FREQUENCY_STEP_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
};

/**
 * Projects every future dated money movement between today and `endIso`:
 * unpaid scheduled bill occurrences, recurrences generated from bill
 * definitions beyond their existing occurrences, recorded future paychecks
 * extended at each member's observed cadence, credit-card minimum
 * payments, and planned monthly goal contributions.
 */
export function buildForecastEntries(
  input: ForecastInput,
  endIso: string,
): ForecastEntry[] {
  const start = todayIso();
  const entries: ForecastEntry[] = [];
  const subscriptionCategoryIds = new Set(
    input.categories
      .filter((category) => category.name.toLowerCase() === "subscriptions")
      .map((category) => category.id),
  );

  const billKind = (bill: Bill | undefined): ForecastEntryKind =>
    bill?.categoryId && subscriptionCategoryIds.has(bill.categoryId)
      ? "sub"
      : "essential";

  const billById = new Map(input.bills.map((bill) => [bill.id, bill]));

  // Existing unpaid occurrences inside the window
  for (const occurrence of input.occurrences) {
    if (occurrence.status === "paid" || occurrence.status === "skipped")
      continue;
    if (occurrence.dueDate < start || occurrence.dueDate > endIso) continue;
    entries.push({
      date: occurrence.dueDate,
      description: occurrence.name,
      kind: billKind(billById.get(occurrence.billId)),
      amount: -occurrence.expectedAmount,
    });
  }

  // Recurrences beyond each bill's last known occurrence
  const now = new Date();
  for (const bill of input.bills) {
    if (!bill.isActive) continue;
    const existing = input.occurrences
      .filter((occurrence) => occurrence.billId === bill.id)
      .map((occurrence) => occurrence.dueDate)
      .sort();
    const lastKnown = existing[existing.length - 1];

    const stepDays = FREQUENCY_STEP_DAYS[bill.frequency];
    if (stepDays) {
      let date = lastKnown
        ? addDays(lastKnown, stepDays)
        : addDays(start, stepDays);
      while (date <= endIso) {
        if (date >= start) {
          entries.push({
            date,
            description: bill.name,
            kind: billKind(bill),
            amount: -bill.expectedAmount,
          });
        }
        date = addDays(date, stepDays);
      }
      continue;
    }

    const monthStep =
      bill.frequency === "quarterly" ? 3 : bill.frequency === "annually" ? 12 : 1;
    for (let offset = 0; offset <= 36; offset += monthStep) {
      const date = monthDay(now, offset, bill.dueDay);
      if (date > endIso) break;
      if (date < start) continue;
      if (lastKnown && date <= lastKnown) continue;
      entries.push({
        date,
        description: bill.name,
        kind: billKind(bill),
        amount: -bill.expectedAmount,
      });
    }
  }

  // Recorded future paychecks, then extrapolate each member's cadence
  const byMember = new Map<string, Paycheck[]>();
  for (const paycheck of input.paychecks) {
    const list = byMember.get(paycheck.memberName) ?? [];
    list.push(paycheck);
    byMember.set(paycheck.memberName, list);
  }
  for (const [member, paychecks] of byMember) {
    const sorted = [...paychecks].sort((a, b) =>
      a.payDate.localeCompare(b.payDate),
    );
    for (const paycheck of sorted) {
      if (paycheck.payDate >= start && paycheck.payDate <= endIso) {
        entries.push({
          date: paycheck.payDate,
          description: `Payroll — ${member}`,
          kind: "income",
          amount: paycheck.netAmount,
        });
      }
    }
    // Cadence from the last two checks when available, else biweekly.
    const last = sorted[sorted.length - 1];
    if (!last) continue;
    const previous = sorted[sorted.length - 2];
    let cadence = 14;
    if (previous) {
      const gap = Math.round(
        (new Date(last.payDate).getTime() -
          new Date(previous.payDate).getTime()) /
          86_400_000,
      );
      if (gap >= 6 && gap <= 32) cadence = gap;
    }
    let date = addDays(last.payDate, cadence);
    while (date <= endIso) {
      if (date >= start) {
        entries.push({
          date,
          description: `Payroll — ${member} (projected)`,
          kind: "income",
          amount: last.netAmount,
        });
      }
      date = addDays(date, cadence);
    }
  }

  // Credit-card minimum payments (loans/mortgages are already bills)
  for (const debt of input.debts) {
    if (debt.debtType !== "credit_card" || debt.minimumPayment <= 0) continue;
    for (let offset = 0; offset <= 36; offset++) {
      const date = monthDay(now, offset, debt.dueDay ?? 15);
      if (date > endIso) break;
      if (date < start) continue;
      entries.push({
        date,
        description: `${debt.name} minimum payment`,
        kind: "debt",
        amount: -debt.minimumPayment,
      });
    }
  }

  // Planned monthly goal contributions
  for (const goal of input.goals) {
    if (!goal.monthlyContribution || goal.monthlyContribution <= 0) continue;
    for (let offset = 0; offset <= 36; offset++) {
      const date = monthDay(now, offset, 25);
      if (date > endIso) break;
      if (date < start) continue;
      entries.push({
        date,
        description: `Transfer to ${goal.name}`,
        kind: "transfer",
        amount: -goal.monthlyContribution,
      });
    }
  }

  return entries.sort(
    (a, b) => a.date.localeCompare(b.date) || b.amount - a.amount,
  );
}

export function buildForecastLedger(
  startingBalance: number,
  entries: ForecastEntry[],
): ForecastLedgerRow[] {
  let balance = startingBalance;
  return entries.map((entry) => {
    balance += entry.amount;
    return { ...entry, balance };
  });
}

export interface ForecastMilestone {
  label: string;
  date: string;
  endBalance: number;
  delta: number;
  caption: string;
}

export function buildForecastMilestones(
  startingBalance: number,
  input: ForecastInput,
): ForecastMilestone[] {
  const now = new Date();
  const targets: { label: string; date: string; caption: string }[] = [
    {
      label: "30-day",
      date: addDays(todayIso(), 30),
      caption: "After bills + payroll",
    },
    {
      label: "90-day",
      date: addDays(todayIso(), 90),
      caption: "Bills, payroll & transfers",
    },
    {
      label: "Year-end",
      date: `${now.getFullYear()}-12-31`,
      caption: `Through Dec 31, ${now.getFullYear()}`,
    },
    {
      label: `End of ${now.getFullYear() + 1}`,
      date: `${now.getFullYear() + 1}-12-31`,
      caption: "Full-year run rate",
    },
    {
      label: `End of ${now.getFullYear() + 2}`,
      date: `${now.getFullYear() + 2}-12-31`,
      caption: "Two-year run rate",
    },
  ];

  // One pass over the longest horizon serves every milestone.
  const entries = buildForecastEntries(
    input,
    targets[targets.length - 1].date,
  );
  return targets
    .filter((target) => target.date > todayIso())
    .map((target) => {
      const endBalance =
        startingBalance +
        entries
          .filter((entry) => entry.date <= target.date)
          .reduce((sum, entry) => sum + entry.amount, 0);
      return {
        label: target.label,
        date: target.date,
        endBalance,
        delta: endBalance - startingBalance,
        caption: target.caption,
      };
    });
}
