import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * URL for the Prisma CLI (migrate/seed), not the app: the app connects through PrismaService.
 * `migrate deploy` holds a Postgres advisory lock, which Neon's PgBouncer pooler (transaction
 * mode) cannot keep, so migrations must use a direct connection. DIRECT_DATABASE_URL wins; for
 * a Neon pooler URL the direct host is the same host without the "-pooler" suffix.
 */
function migrationDatabaseUrl(): string {
  const direct = process.env.DIRECT_DATABASE_URL;
  if (direct) return direct;

  const url = new URL(env("DATABASE_URL"));
  if (url.hostname.endsWith(".neon.tech")) {
    url.hostname = url.hostname.replace(/-pooler(?=\.)/, "");
  }
  return url.toString();
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationDatabaseUrl(),
  },
});
