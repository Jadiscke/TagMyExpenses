import { useMutation } from "@tanstack/react-query";
import { api } from "../config/api";
import { useAuth } from "../contexts/AuthContext";

interface SubmitPasswordResponse {
  success: boolean;
  count: number;
  transactions: Array<{
    id: string;
    date: string;
    merchant: string;
    amount: number;
    currency: string;
    category?: string;
  }>;
}

interface SubmitPasswordParams {
  pendingPdfId: string;
  password: string;
}

export function useSubmitPdfPassword() {
  const { session } = useAuth();

  return useMutation<SubmitPasswordResponse, Error, SubmitPasswordParams>({
    mutationFn: async ({ pendingPdfId, password }: SubmitPasswordParams) => {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`${api.baseURL}/submit-pdf-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pendingPdfId, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to submit password" }));
        throw new Error(errorData.error || errorData.message || "Failed to submit password");
      }

      return response.json();
    },
  });
}

