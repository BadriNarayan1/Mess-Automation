// Load .env only if DATABASE_URL is not already set in the environment.
// This allows shell env vars (DATABASE_URL=... npx prisma ...) to take priority.
import { config } from "dotenv";
if (!process.env.DATABASE_URL) {
  config();
}
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] as string,
  },
});
