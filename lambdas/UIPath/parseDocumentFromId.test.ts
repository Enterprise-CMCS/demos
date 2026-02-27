import { beforeEach, describe, expect, it, vi } from "vitest";
const SEEDED_DOCUMENT_ID = "00000000-0000-0000-0000-000000000000";

const mocks = vi.hoisted(() => ({
  getDbPoolMock: vi.fn(),
  getDbSchemaMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock("./db", () => ({
  getDbPool: (...args: unknown[]) => mocks.getDbPoolMock(...args),
  getDbSchema: (...args: unknown[]) => mocks.getDbSchemaMock(...args),
}));

import { parseDocumentFromId, parseUiPathMessage } from "./parseDocumentFromId";

describe("parseDocumentFromId", () => {
  beforeEach(() => {
    mocks.getDbPoolMock.mockReset();
    mocks.getDbSchemaMock.mockReset();
    mocks.queryMock.mockReset();

    mocks.getDbSchemaMock.mockReturnValue("demos_app");
    mocks.getDbPoolMock.mockResolvedValue({
      query: (...args: unknown[]) => mocks.queryMock(...args),
    });
  });

  it("returns null when documentId is missing", async () => {
    const result = await parseDocumentFromId(undefined);

    expect(result).toBeNull();
    expect(mocks.getDbPoolMock).not.toHaveBeenCalled();
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it("returns key-only location when s3_path has no scheme", async () => {
    mocks.queryMock.mockResolvedValue({ rows: [{ s3_path: "app-1/document-1" }] });

    const result = await parseDocumentFromId("doc-1");

    expect(mocks.queryMock).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining("select s3_path from demos_app.document"),
      ["doc-1"]
    );
    expect(result).toEqual({ key: "app-1/document-1" });
  });

  it("returns key when s3_path uses s3:// format", async () => {
    mocks.queryMock.mockResolvedValue({ rows: [{ s3_path: "s3://clean-bucket/app-2/document-2" }] });

    const result = await parseDocumentFromId("doc-2");

    expect(result).toEqual({ key: "app-2/document-2" });
  });

  it("throws when document id is not found", async () => {
    mocks.queryMock.mockResolvedValue({ rows: [] });

    await expect(parseDocumentFromId("doc-missing")).rejects.toThrow("No document found for id doc-missing.");
  });

  it("throws when s3_path is malformed", async () => {
    mocks.queryMock.mockResolvedValue({ rows: [{ s3_path: "s3://invalid" }] });

    await expect(parseDocumentFromId("doc-bad")).rejects.toThrow(
      "Invalid document s3_path value: s3://invalid"
    );
  });
});

describe("parseUiPathMessage", () => {
  it("parses documentId-only queue payload shape", () => {
    const result = parseUiPathMessage(
      JSON.stringify({
        documentId: SEEDED_DOCUMENT_ID,
      })
    );

    expect(result).toEqual({
      documentId: SEEDED_DOCUMENT_ID,
    });
  });

  it("parses nested S3 event payload and decodes key", () => {
    const result = parseUiPathMessage(
      JSON.stringify({
        Records: [
          {
            s3: {
              bucket: { name: "clean-bucket" },
              object: { key: "folder%2Ftest+doc" },
            },
          },
        ],
      })
    );

    expect(result).toEqual({
      s3Key: "folder/test doc",
    });
  });
});
