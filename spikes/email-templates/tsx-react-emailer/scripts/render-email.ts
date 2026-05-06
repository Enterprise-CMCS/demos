import { fixtures } from "../fixtures/index.ts";
import { renderEmail, saveCompletedRender, templates } from "../index.tsx";

async function main() {
  const templateId = process.argv[2];

  if (!templateId) {
    throw new Error(`Template id is required. Known templates: ${Object.keys(templates).join(", ")}`);
  }

  const data = fixtures[templateId as keyof typeof fixtures];

  if (!data) {
    throw new Error(`No local fixture for ${templateId}. Known fixtures: ${Object.keys(fixtures).join(", ")}`);
  }

  const payload = await renderEmail(templateId, data);
  const filePath = saveCompletedRender(templateId, payload);

  console.log(`Rendered ${templateId} email payload to ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
