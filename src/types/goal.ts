export type GoalType = "savings" | "sinking_fund" | "emergency_fund";

export interface Goal {
  id: string;
  householdId: string;
  name: string;
  goalType: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  monthlyContribution?: number;
  accountId?: string;
}
