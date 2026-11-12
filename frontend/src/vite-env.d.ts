/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** NestJS API (catalog, auth, orders). */
  readonly VITE_API_URL?: string;
  /** ASP.NET Core service (prescription analysis). */
  readonly VITE_DOTNET_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
