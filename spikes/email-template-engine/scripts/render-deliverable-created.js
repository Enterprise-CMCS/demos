import { renderEmail, saveCompletedRender } from "../index.js";
import { deliverableCreatedData } from "../fixtures/deliverable-created-data.js";

async function main() {
  const templateId = "deliverable-created";
  const payload = await renderEmail(templateId, deliverableCreatedData);
  const filePath = saveCompletedRender(templateId, payload);

  console.log(`Rendered ${templateId} email payload to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
