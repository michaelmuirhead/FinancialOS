export const DOCUMENT_FOLDERS = [
  "Bank statements",
  "Credit-card statements",
  "Paystubs",
  "Bills",
  "Tax documents",
  "Insurance policies",
  "Loan agreements",
  "Vehicle documents",
  "Medical bills",
  "Receipts",
  "Warranties",
  "Annual reviews",
] as const;

export type DocumentFolder = (typeof DOCUMENT_FOLDERS)[number];

export interface DocumentRecord {
  id: string;
  householdId: string;
  folder: DocumentFolder;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Supabase Storage object path; demo mode stores blobs in IndexedDB by id. */
  storagePath?: string;
  uploadedAt: string;
}
