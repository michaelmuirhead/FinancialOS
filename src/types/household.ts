export type MemberRole = "owner" | "admin" | "member" | "viewer";

export interface Household {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  displayName: string;
  role: MemberRole;
}

export interface HouseholdRules {
  minimumCheckingBuffer: number;
  givingPercentOfGross: number;
  utilizationWarningPercent: number;
  bonusSplitDebtPercent: number;
}
