import { renderEmail, saveCompletedRender } from "../index.js";
import { systemsTestData } from "../fixtures/systems-test-data.js";

async function main() {
  const templateId = "systems-test";
  const payload = await renderEmail(templateId, systemsTestData);
  const filePath = saveCompletedRender(templateId, payload);

  console.log(`Rendered ${templateId} email payload to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
