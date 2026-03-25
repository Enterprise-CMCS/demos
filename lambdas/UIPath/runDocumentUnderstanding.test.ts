import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadDocumentMock: vi.fn(),
  extractDocMock: vi.fn(),
  fetchExtractionResultMock: vi.fn(),
  connectMock: vi.fn(),
  releaseMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock("./getToken", () => ({
  getToken: vi.fn().mockResolvedValue("token-123"),
}));
vi.mock("./getProjectId", () => ({
  getProjectIdByName: vi.fn().mockResolvedValue("project-1"),
}));

vi.mock("./uploadDocument", () => ({
  uploadDocument: (...args: unknown[]) => mocks.uploadDocumentMock(...args),
}));

vi.mock("./extractDoc", () => ({
  extractDoc: (...args: unknown[]) => mocks.extractDocMock(...args),
}));

vi.mock("./fetchExtractResult", () => ({
  fetchExtractionResult: (...args: unknown[]) => mocks.fetchExtractionResultMock(...args),
}));

vi.mock("./db", () => ({
  getDbPool: vi.fn().mockResolvedValue({
    connect: mocks.connectMock,
  }),
  getDbSchema: () => "demos_app",
}));

vi.mock("./log", () => ({
  log: { info: vi.fn(), error: vi.fn() },
}));

import { runDocumentUnderstanding } from "./runDocumentUnderstanding";
import { getToken } from "./getToken";

const TEST_DOCUMENT_ID = "4cdfe542-90aa-489f-93d5-e786aaff49a2";
const TEST_APPLICATION_ID = "app-1";

describe("runDocumentUnderstanding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.uploadDocumentMock.mockReset();
    mocks.extractDocMock.mockReset();
    mocks.fetchExtractionResultMock.mockReset();
    mocks.connectMock
      .mockReset()
      .mockResolvedValue({ release: mocks.releaseMock, query: mocks.queryMock });
    mocks.queryMock.mockReset();
    mocks.releaseMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("runs the DU flow and returns succeeded status", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock
      .mockResolvedValueOnce({ status: "Running" })
      .mockResolvedValueOnce({ status: "Succeeded", data: { ok: true } });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-1",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(getToken).toHaveBeenCalled();
    expect(mocks.uploadDocumentMock).toHaveBeenCalledWith(
      "token-123",
      "file.pdf",
      "project-1",
      undefined
    );
    expect(mocks.extractDocMock).toHaveBeenCalledWith("token-123", "doc-1", "project-1");
    expect(mocks.fetchExtractionResultMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: "Succeeded" });
    expect(mocks.queryMock).toHaveBeenCalledTimes(4);
    expect(mocks.queryMock.mock.calls[1]?.[0]).toBe("BEGIN");
    expect(mocks.queryMock.mock.calls[3]?.[0]).toBe("COMMIT");
    expect(mocks.queryMock.mock.calls[0]?.[1]?.[6]).toBe("Pending");
    expect(mocks.queryMock.mock.calls[2]?.[1]?.[6]).toBe("Finished");
    expect(mocks.releaseMock).toHaveBeenCalled();
  });

  it("passes fileNameWithExtension through uploadDocument", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock.mockResolvedValue({
      status: "Succeeded",
      Fields: [],
    });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-file-name",
      fileNameWithExtension: "my_file.docx",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(mocks.uploadDocumentMock).toHaveBeenCalledWith(
      "token-123",
      "file.pdf",
      "project-1",
      "my_file.docx"
    );
  });

  it("persists documentId when provided", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock.mockResolvedValue({
      status: "Succeeded",
      Fields: [],
    });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-doc-id",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(mocks.queryMock).toHaveBeenCalledTimes(4);
    expect(mocks.queryMock.mock.calls[0]?.[0]).toContain("document_id");
    expect(mocks.queryMock.mock.calls[0]?.[1]).toEqual([
      expect.any(String),
      "request-doc-id",
      "project-1",
      expect.any(String),
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "Pending",
    ]);
    expect(mocks.queryMock.mock.calls[2]?.[1]).toEqual([
      expect.any(String),
      "request-doc-id",
      "project-1",
      expect.any(String),
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "Finished",
    ]);
  });

  it("throws if maxAttempts is exceeded", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock.mockResolvedValue({ status: "Pending" });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      maxAttempts: 2,
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    const expectation = expect(promise).rejects.toThrow("did not succeed");
    await vi.runAllTimersAsync();
    await expectation;
    expect(mocks.queryMock).toHaveBeenCalledTimes(2);
    expect(mocks.queryMock.mock.calls[0]?.[1]?.[6]).toBe("Pending");
    expect(mocks.queryMock.mock.calls[1]?.[1]?.[6]).toBe("Failed");
  });

  it("persists top-level fields and skips non-string field values", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock.mockResolvedValue({
      status: "Succeeded",
      Fields: [
        {
          FieldId: "field-1",
          FieldName: "Field One",
          Values: [{ Value: 123 }, { Value: "abc", Reference: { TextLength: 3 } }],
        },
      ],
    });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-fields",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({ status: "Succeeded" });
    expect(mocks.queryMock).toHaveBeenCalledTimes(5);
    expect(mocks.queryMock.mock.calls[3]?.[1]).toEqual([
      expect.any(String),
      "result-1",
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "field-1",
      "abc",
      3,
      0,
      0,
      "[]",
    ]);
  });

  it("throws when result row id is not returned", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock
      .mockResolvedValueOnce({ rows: [{ id: "result-1" }] }) // pending upsert
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // finished upsert
      .mockResolvedValueOnce({}) // ROLLBACK
      .mockResolvedValueOnce({ rows: [{ id: "failed-result-1" }] }); // failed upsert
    mocks.fetchExtractionResultMock.mockResolvedValue({ status: "Succeeded", Fields: [] });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-no-id",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    const expectation = expect(promise).rejects.toThrow("Failed to persist UiPath result row.");
    await vi.runAllTimersAsync();
    await expectation;
    expect(mocks.queryMock.mock.calls.map((call) => call[0])).toContain("ROLLBACK");
  });

  it("deduplicates multi-value demo_type and persists combined value", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock.mockResolvedValue({
      status: "Succeeded",
      Fields: [
        {
          FieldId: "demo_type",
          FieldName: "demo_type",
          FieldType: "Text",
          Values: [
            { Value: "SUD", Confidence: 0.5224329 },
            { Value: "BHP", Confidence: 0.3818529 },
            { Value: "SUD", Confidence: 0.1225322 },
          ],
        },
      ],
    });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-demo-type",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(mocks.queryMock).toHaveBeenCalledTimes(5);
    const fieldInsertArgs = mocks.queryMock.mock.calls[3]?.[1];
    expect(fieldInsertArgs).toEqual([
      expect.any(String),
      "result-1",
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "demo_type",
      "SUD, BHP",
      8,
      0,
      0.5224329,
      "[]",
    ]);
  });

  it("marks result as failed when UiPath returns failed status", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    mocks.fetchExtractionResultMock.mockResolvedValue({ status: "Failed" });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-failed-status",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    const expectation = expect(promise).rejects.toThrow("UiPath extraction returned Failed status.");
    await vi.runAllTimersAsync();
    await expectation;

    expect(mocks.queryMock).toHaveBeenCalledTimes(2);
    expect(mocks.queryMock.mock.calls[0]?.[1]?.[6]).toBe("Pending");
    expect(mocks.queryMock.mock.calls[1]?.[1]?.[6]).toBe("Failed");
  });

  it("throws when document context is missing", async () => {
    await expect(runDocumentUnderstanding("file.pdf", { documentId: TEST_DOCUMENT_ID })).rejects.toThrow(
      "documentId and applicationId are required to persist UiPath results."
    );
    expect(mocks.fetchExtractionResultMock).not.toHaveBeenCalled();
  });

  it("throws when extraction startup data is incomplete", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("");

    await expect(
      runDocumentUnderstanding("file.pdf", {
        documentId: TEST_DOCUMENT_ID,
        applicationId: TEST_APPLICATION_ID,
      })
    ).rejects.toThrow("Failed to initiate document understanding due to missing information.");
    expect(mocks.fetchExtractionResultMock).not.toHaveBeenCalled();
  });
});
