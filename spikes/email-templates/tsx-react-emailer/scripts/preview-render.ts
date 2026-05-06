import { saveHtmlPreview } from "../src/saveHtmlPreview.ts";

function main() {
  const renderPath = process.argv[2];

  if (!renderPath) {
    throw new Error("Render JSON path is required. Example: npm run preview -- renders/completed/systems-test.json");
  }

  const filePath = saveHtmlPreview(renderPath);

  console.log(`Wrote HTML preview to ${filePath}`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
