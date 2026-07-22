export interface CategoryRule {
  id: string;
  householdId: string;
  /** Case-insensitive substring matched against the merchant name. */
  merchantPattern: string;
  categoryId: string;
}
