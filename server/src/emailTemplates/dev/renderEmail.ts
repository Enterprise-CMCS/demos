import fs from "node:fs";
import path from "node:path";

import { renderEmail } from "../renderEmail";
import { templates } from "../templates";
import { emailTemplateFixtures } from "./fixtures";

async function main() {
  const templateId = process.argv[2];
  const knownTemplates = Object.keys(templates).join(", ");

  if (!templateId) {
    throw new Error(`Template id is required. Known templates: ${knownTemplates}`);
  }

  const fixture = emailTemplateFixtures[templateId];

  if (!fixture) {
    const knownFixtures = Object.keys(emailTemplateFixtures).join(", ");
    throw new Error(
      `No local fixture found for ${templateId}. Known fixtures: ${knownFixtures}`,
    );
  }

  const payload = await renderEmail(templateId, fixture);
  const outputDir = path.join(process.cwd(), "rendered-emails");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(outputDir, `${templateId}-${timestamp}.json`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

  console.log(`Rendered ${templateId} email payload to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
