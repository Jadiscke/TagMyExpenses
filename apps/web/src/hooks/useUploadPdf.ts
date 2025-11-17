import { useMutation } from "@tanstack/react-query";
import { api } from "../config/api";
import { useAuth } from "../contexts/AuthContext";

interface UploadPdfResponse {
  success: boolean;
  needsPassword?: boolean;
  pendingPdfId?: string;
  message?: string;
  count?: number;
  transactions?: Array<{
    id: string;
    date: string;
    merchant: string;
    amount: number;
    currency: string;
    category?: string;
  }>;
}

interface UploadPdfParams {
  file: File;
}

export function useUploadPdf() {
  const { session } = useAuth();

  return useMutation<UploadPdfResponse, Error, UploadPdfParams>({
    mutationFn: async ({ file }: UploadPdfParams) => {
      if (!session) {
        throw new Error("Not authenticated: No session");
      }
      
      const token = session.access_token;
      if (!token) {
        console.error("Session exists but no access_token:", session);
        throw new Error("Not authenticated: No access token");
      }

      console.log("Uploading PDF with token (first 20 chars):", token.substring(0, 20));

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${api.baseURL}/upload-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to upload PDF" }));
        throw new Error(errorData.error || errorData.message || "Failed to upload PDF");
      }

      return response.json();
    },
  });
}

