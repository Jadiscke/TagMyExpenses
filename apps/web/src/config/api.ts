const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = {
  baseURL: API_URL,
  headers: (token?: string) => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }),
};

