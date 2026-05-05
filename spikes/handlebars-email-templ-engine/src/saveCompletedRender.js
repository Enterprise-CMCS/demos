import fs from "node:fs";
import path from "node:path";

export function saveCompletedRender(templateId, payload, options = {}) {
  const outputDir = options.outputDir || path.join(process.cwd(), "renders", "completed");
  const renderedAt = options.renderedAt || new Date();
  const fileSafeTimestamp = renderedAt.toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `${templateId}-${fileSafeTimestamp}.json`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);

  return filePath;
}
