import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = "postgresql://localhost:5432/demos?schema=demos_app";

export default defineConfig({
  schema: "./src/model",
  datasource: {
    url: databaseUrl,
  },
});
