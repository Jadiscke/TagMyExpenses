import { useMutation } from "@tanstack/react-query";
import { api } from "../config/api";
import { useAuth } from "../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

interface UpdateTransactionParams {
  id: string;
  category?: string;
  merchant?: string;
  normalizedMerchant?: string;
}

interface UpdateTransactionResponse {
  success: boolean;
  transaction: {
    id: string;
    date: string;
    merchant: string;
    amount: number;
    currency: string;
    category?: string;
  };
}

export function useUpdateTransaction() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<UpdateTransactionResponse, Error, UpdateTransactionParams>({
    mutationFn: async (params: UpdateTransactionParams) => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const { id, ...updateData } = params;

      const response = await fetch(`${api.baseURL}/transaction/${id}`, {
        method: "PATCH",
        headers: api.headers(token),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Failed to update transaction" }));
        throw new Error(error.message || "Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate transactions query to refetch
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

