import fs from "node:fs";
import path from "node:path";

import type { EmailPayload } from "./types.ts";

export function saveCompletedRender(templateId: string, payload: EmailPayload, options: {
  outputDir?: string;
  renderedAt?: Date;
} = {}): string {
  const outputDir = options.outputDir ?? path.join(process.cwd(), "renders", "completed");
  const renderedAt = options.renderedAt ?? new Date();
  const fileSafeTimestamp = renderedAt.toISOString().replace(/[:.]/g, "-");
  const filePath = path.join(outputDir, `${templateId}-${fileSafeTimestamp}.json`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);

  return filePath;
}
