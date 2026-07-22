import { Paycheck } from "@/types";

export function paycheckCashRemaining(paycheck: Paycheck): number {
  const allocated = paycheck.allocations.reduce(
    (sum, allocation) => sum + allocation.amount,
    0,
  );
  return paycheck.startingBalance + paycheck.netAmount - allocated;
}

export function daysUntil(dateIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateIso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
