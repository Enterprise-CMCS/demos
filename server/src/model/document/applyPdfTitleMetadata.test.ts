import { describe, it, expect, vi, beforeEach } from "vitest";
import { PDFDocument } from "pdf-lib";

const mockGetCleanBucketObject = vi.fn();
const mockPutCleanBucketObject = vi.fn();

vi.mock("../../adapters", () => ({
  getS3Adapter: () => ({
    getCleanBucketObject: mockGetCleanBucketObject,
    putCleanBucketObject: mockPutCleanBucketObject,
  }),
}));

vi.mock("../../log", () => ({
  log: { error: vi.fn(), info: vi.fn() },
}));

import { applyPdfTitleMetadata } from "./applyPdfTitleMetadata";
import { log } from "../../log";

const PDF_CONTENT_TYPE = "application/pdf";
const testS3Path = "document-uuid-123";

const createPdf = async (title?: string): Promise<Uint8Array> => {
  const pdfDocument = await PDFDocument.create();
  pdfDocument.addPage();
  if (title) {
    pdfDocument.setTitle(title);
  }
  return await pdfDocument.save();
};

describe("applyPdfTitleMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes the title into the PDF and preserves the Content-Type", async () => {
    mockGetCleanBucketObject.mockResolvedValue({
      bytes: await createPdf(),
      contentType: PDF_CONTENT_TYPE,
    });

    const result = await applyPdfTitleMetadata(testS3Path, "HTD Charge Codes - 2026-04-15");

    expect(result).toBe(true);
    expect(mockPutCleanBucketObject).toHaveBeenCalledOnce();

    const [key, bytes, contentType] = mockPutCleanBucketObject.mock.calls[0];
    expect(key).toBe(testS3Path);
    expect(contentType).toBe(PDF_CONTENT_TYPE);

    const rewritten = await PDFDocument.load(bytes);
    expect(rewritten.getTitle()).toBe("HTD Charge Codes - 2026-04-15");
  });

  it("overwrites a title that is already baked into the PDF", async () => {
    mockGetCleanBucketObject.mockResolvedValue({
      bytes: await createPdf("Cucumber"),
      contentType: PDF_CONTENT_TYPE,
    });

    await applyPdfTitleMetadata(testS3Path, "My Document");

    const [, bytes] = mockPutCleanBucketObject.mock.calls[0];
    expect((await PDFDocument.load(bytes)).getTitle()).toBe("My Document");
  });

  it("skips non-PDF objects without rewriting them", async () => {
    mockGetCleanBucketObject.mockResolvedValue({
      bytes: Buffer.from("some spreadsheet"),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const result = await applyPdfTitleMetadata(testS3Path, "Quarterly Report");

    expect(result).toBe(false);
    expect(mockPutCleanBucketObject).not.toHaveBeenCalled();
  });

  it("logs and returns false when the object cannot be read", async () => {
    mockGetCleanBucketObject.mockRejectedValue(new Error("no such key"));

    const result = await applyPdfTitleMetadata(testS3Path, "Whatever");

    expect(result).toBe(false);
    expect(mockPutCleanBucketObject).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledOnce();
  });

  it("logs and returns false when the bytes are not a readable PDF", async () => {
    mockGetCleanBucketObject.mockResolvedValue({
      bytes: Buffer.from("not really a pdf"),
      contentType: PDF_CONTENT_TYPE,
    });

    const result = await applyPdfTitleMetadata(testS3Path, "Whatever");

    expect(result).toBe(false);
    expect(mockPutCleanBucketObject).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledOnce();
  });
});
