import "dotenv/config";
import { defineConfig } from "prisma/config";

const fallbackDatabaseUrl = "postgresql://localhost:5432/demos?schema=demos_app";
const argv = process.argv.join(" ");
const isGenerateCommand = /\bprisma\b.*\bgenerate\b/.test(argv) || /\bgenerate\b/.test(argv);

if (!process.env.DATABASE_URL && !isGenerateCommand) {
  throw new Error("DATABASE_URL must be set for Prisma commands other than `prisma generate`.");
}

const databaseUrl = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

export default defineConfig({
  schema: "./src/model",
  datasource: {
    url: databaseUrl,
  },
});
