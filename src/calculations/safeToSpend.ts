export interface SafeToSpendInput {
  availableChecking: number;
  unpaidBillsBeforeNextPayday: number;
  plannedDebtPayments: number;
  plannedSavingsTransfers: number;
  reservedFunds: number;
  minimumBuffer: number;
}

export function calculateSafeToSpend({
  availableChecking,
  unpaidBillsBeforeNextPayday,
  plannedDebtPayments,
  plannedSavingsTransfers,
  reservedFunds,
  minimumBuffer,
}: SafeToSpendInput): number {
  const amount =
    availableChecking -
    unpaidBillsBeforeNextPayday -
    plannedDebtPayments -
    plannedSavingsTransfers -
    reservedFunds -
    minimumBuffer;
  return Math.max(0, amount);
}

export function dailySafeToSpend(
  safeToSpend: number,
  daysUntilNextPayday: number,
): number {
  if (daysUntilNextPayday <= 0) return safeToSpend;
  return safeToSpend / daysUntilNextPayday;
}
