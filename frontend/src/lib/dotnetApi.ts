import axios from "axios";

/**
 * Client for the ASP.NET Core service. Kept separate from `api` (NestJS): its endpoints used here
 * are public, and its outages must not trigger the NestJS token-refresh/logout flow.
 */
export const dotnetApi = axios.create({
  baseURL: import.meta.env.VITE_DOTNET_API_URL ?? "http://localhost:5000",
  timeout: 15_000,
});
