import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { setPdfTitle } from "./setPdfTitle";

const createPdf = async (title?: string): Promise<Uint8Array> => {
  const pdfDocument = await PDFDocument.create();
  pdfDocument.addPage();
  if (title) {
    pdfDocument.setTitle(title);
  }
  return await pdfDocument.save();
};

const readTitle = async (pdfBytes: Uint8Array): Promise<string | undefined> => {
  const pdfDocument = await PDFDocument.load(pdfBytes);
  return pdfDocument.getTitle();
};

describe("setPdfTitle", () => {
  it("sets the title on a PDF that has none", async () => {
    const pdfBytes = await createPdf();
    expect(await readTitle(pdfBytes)).toBeUndefined();

    const updated = await setPdfTitle(pdfBytes, "HTD Charge Codes - 2026-04-15");

    expect(await readTitle(updated)).toBe("HTD Charge Codes - 2026-04-15");
  });

  it("overwrites an existing title", async () => {
    const pdfBytes = await createPdf("Cucumber");

    const updated = await setPdfTitle(pdfBytes, "My Document");

    expect(await readTitle(updated)).toBe("My Document");
  });

  it("preserves titles containing characters that are invalid in file names", async () => {
    const pdfBytes = await createPdf();

    const updated = await setPdfTitle(pdfBytes, 'Report: Q1? "final"');

    expect(await readTitle(updated)).toBe('Report: Q1? "final"');
  });

  it("throws when the bytes are not a PDF", async () => {
    await expect(setPdfTitle(Buffer.from("not a pdf"), "Title")).rejects.toThrow();
  });
});
