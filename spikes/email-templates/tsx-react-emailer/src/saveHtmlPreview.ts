import fs from "node:fs";
import path from "node:path";

export function saveHtmlPreview(renderPath: string, options: {
  outputDir?: string;
} = {}): string {
  const outputDir = options.outputDir ?? path.join(process.cwd(), "renders", "previews");
  const payload = JSON.parse(fs.readFileSync(renderPath, "utf8")) as { html?: unknown };

  if (!payload.html || typeof payload.html !== "string") {
    throw new Error(`Render payload must include an html string: ${renderPath}`);
  }

  const fileName = `${path.basename(renderPath, ".json")}.html`;
  const filePath = path.join(outputDir, fileName);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, payload.html);

  return filePath;
}
