import { runDataFixIntegration } from "./dataFix.integration.js";

test("data-fix PostgreSQL integration", async () => {
  await runDataFixIntegration();
});
