import { useQuery } from "@tanstack/react-query";
import { api } from "../config/api";
import { useAuth } from "../contexts/AuthContext";

interface TransactionsResponse {
  transactions: Array<{
    id: string;
    date: string;
    merchant: string;
    normalized_merchant?: string;
    amount: number;
    currency: string;
    category?: string;
    raw_description?: string;
  }>;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  totalAmount: number;
}

interface UseTransactionsParams {
  page?: number;
  pageSize?: number;
  category?: string;
  merchant?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useTransactions(params: UseTransactionsParams = {}) {
  const { session } = useAuth();
  const { page = 1, pageSize = 20, category, merchant, search, startDate, endDate } = params;

  return useQuery<TransactionsResponse>({
    queryKey: ["transactions", page, pageSize, category, merchant, search, startDate, endDate],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const searchParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (category) searchParams.append("category", category);
      if (merchant) searchParams.append("merchant", merchant);
      if (search) searchParams.append("search", search);
      if (startDate) searchParams.append("startDate", startDate);
      if (endDate) searchParams.append("endDate", endDate);

      const response = await fetch(`${api.baseURL}/transactions?${searchParams}`, {
        headers: api.headers(token),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      return response.json();
    },
    enabled: !!session,
  });
}

// Transform API response to match TransactionTable component format
export function transformTransactions(
  transactions: Array<{
    id: string;
    date: string;
    merchant: string;
    normalized_merchant?: string;
    amount: number;
    currency: string;
    category?: string;
    raw_description?: string;
  }>
) {
  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    merchant: t.merchant,
    normalizedMerchant: t.normalized_merchant,
    amount: t.amount,
    currency: t.currency,
    category: t.category,
    rawDescription: t.raw_description,
  }));
}

