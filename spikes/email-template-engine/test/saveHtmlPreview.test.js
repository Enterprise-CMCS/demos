import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { saveHtmlPreview } from "../src/saveHtmlPreview.js";

test("writes an html preview from a completed render payload", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "email-preview-"));
  const renderPath = path.join(tempDir, "systems-test.json");
  const outputDir = path.join(tempDir, "previews");

  fs.writeFileSync(
    renderPath,
    JSON.stringify({
      to: ["test@example.com"],
      subject: "Test",
      text: "Hello",
      html: "<p>Hello</p>",
    }),
  );

  const previewPath = saveHtmlPreview(renderPath, { outputDir });

  assert.equal(previewPath, path.join(outputDir, "systems-test.html"));
  assert.equal(fs.readFileSync(previewPath, "utf8"), "<p>Hello</p>");
});

test("reports a completed render payload without html", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "email-preview-"));
  const renderPath = path.join(tempDir, "missing-html.json");

  fs.writeFileSync(renderPath, JSON.stringify({ text: "Hello" }));

  assert.throws(() => saveHtmlPreview(renderPath), /Render payload must include an html string/);
});
