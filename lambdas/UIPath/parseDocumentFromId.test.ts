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

import { parseDocumentFromId, parseDocumentFromS3Key, parseUiPathMessage } from "./parseDocumentFromId";

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

  it("throws when documentId is missing", async () => {
    await expect(parseDocumentFromId(undefined)).rejects.toThrow("documentId is required.");
    expect(mocks.getDbPoolMock).not.toHaveBeenCalled();
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it("returns location and IDs when s3_path has no scheme", async () => {
    mocks.queryMock.mockResolvedValue({
      rows: [{ id: "doc-1", application_id: "app-1", s3_path: "app-1/document-1" }],
    });

    const result = await parseDocumentFromId("doc-1");

    expect(mocks.queryMock).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining("select id, application_id, s3_path from demos_app.document"),
      ["doc-1"]
    );
    expect(result).toEqual({
      key: "app-1/document-1",
      documentId: "doc-1",
      applicationId: "app-1",
    });
  });

  it("returns key when s3_path uses s3:// format", async () => {
    mocks.queryMock.mockResolvedValue({
      rows: [{ id: "doc-2", application_id: "app-2", s3_path: "s3://clean-bucket/app-2/document-2" }],
    });

    const result = await parseDocumentFromId("doc-2");

    expect(result).toEqual({
      key: "app-2/document-2",
      documentId: "doc-2",
      applicationId: "app-2",
    });
  });

  it("throws when expected application id does not match the document row", async () => {
    mocks.queryMock.mockResolvedValue({
      rows: [{ id: "doc-2", application_id: "app-2", s3_path: "s3://clean-bucket/app-2/document-2" }],
    });

    await expect(parseDocumentFromId("doc-2", "app-3")).rejects.toThrow(
      "Document doc-2 is associated with application app-2, not app-3."
    );
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

describe("parseDocumentFromS3Key", () => {
  beforeEach(() => {
    mocks.getDbPoolMock.mockReset();
    mocks.getDbSchemaMock.mockReset();
    mocks.queryMock.mockReset();

    mocks.getDbSchemaMock.mockReturnValue("demos_app");
    mocks.getDbPoolMock.mockResolvedValue({
      query: (...args: unknown[]) => mocks.queryMock(...args),
    });
  });

  it("returns null when s3Key is missing", async () => {
    const result = await parseDocumentFromS3Key(undefined);
    expect(result).toBeNull();
    expect(mocks.queryMock).not.toHaveBeenCalled();
  });

  it("looks up by document id parsed from <application_id>/<document_id>", async () => {
    mocks.queryMock.mockResolvedValue({
      rows: [{ id: "doc-7", application_id: "app-7", s3_path: "app-7/doc-7" }],
    });

    const result = await parseDocumentFromS3Key("app-7/doc-7");

    expect(result).toEqual({
      key: "app-7/doc-7",
      documentId: "doc-7",
      applicationId: "app-7",
    });
  });

  it("throws when key is not in <application_id>/<document_id> format", async () => {
    await expect(parseDocumentFromS3Key("only-one-segment")).rejects.toThrow(
      "Invalid S3 key format for document lookup: only-one-segment"
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

  it("parses direct queue payload applicationId field", () => {
    const result = parseUiPathMessage(
      JSON.stringify({
        documentId: SEEDED_DOCUMENT_ID,
        applicationId: "app-1",
      })
    );

    expect(result).toEqual({
      documentId: SEEDED_DOCUMENT_ID,
      applicationId: "app-1",
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
