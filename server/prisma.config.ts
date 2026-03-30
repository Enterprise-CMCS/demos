import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./src/model",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
