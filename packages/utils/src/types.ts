export interface Transaction {
  id?: string;
  userId: string;
  date: string; // ISO date string
  merchant: string;
  normalizedMerchant?: string;
  amount: number;
  currency: string;
  rawDescription: string;
  category?: string;
  createdAt?: string;
}

export interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  rawDescription: string;
}

export interface CategorizationRule {
  pattern: RegExp | string;
  category: string;
  priority?: number;
}

