import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (takes precedence), then .env
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct (unpooled) connection for migrations
    url: (process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"])!,
  },
});
