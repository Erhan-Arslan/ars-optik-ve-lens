import axios from "axios";
import { useAuthStore } from "@/store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

/** Exchanges the refresh token for a new pair; concurrent callers share one request. */
export function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, user, logout } = useAuthStore.getState();
  if (!refreshToken || !user) {
    logout();
    return Promise.resolve(null);
  }

  refreshPromise ??= api
    .post("/auth/refresh", { refreshToken })
    .then((res) => {
      setSession(user, { accessToken: res.data.accessToken, refreshToken: res.data.refreshToken });
      return res.data.accessToken as string;
    })
    .catch(() => {
      logout();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

const EXPIRY_MARGIN_SECONDS = 30;

function secondsUntilExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return (payload.exp ?? 0) - Date.now() / 1000;
  } catch {
    return 0;
  }
}

/**
 * Access token for connections that cannot go through the 401-retry interceptor below
 * (e.g. the SignalR hub): refreshed up front when it is about to expire.
 */
export async function getFreshAccessToken(): Promise<string | null> {
  const token = useAuthStore.getState().accessToken;
  if (token && secondsUntilExpiry(token) > EXPIRY_MARGIN_SECONDS) return token;
  return refreshAccessToken();
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === "string") return message;
  }
  return fallback;
}
