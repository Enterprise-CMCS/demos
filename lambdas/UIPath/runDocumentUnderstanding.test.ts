import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadDocumentMock: vi.fn(),
  extractDocMock: vi.fn(),
  fetchExtractionResultMock: vi.fn(),
  connectMock: vi.fn(),
  releaseMock: vi.fn(),
  queryMock: vi.fn(),
  logErrorMock: vi.fn(),
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
  log: { info: vi.fn(), error: mocks.logErrorMock, warn: vi.fn() },
}));

import { runDocumentUnderstanding } from "./runDocumentUnderstanding";
import { getToken } from "./getToken";

const TEST_DOCUMENT_ID = "4cdfe542-90aa-489f-93d5-e786aaff49a2";
const TEST_APPLICATION_ID = "app-1";

function mockSuccessfulDbQueries(
  allowedTagSuggestionFieldIds: string[] = [],
  tagNames: string[] = [],
) {
  mocks.queryMock.mockImplementation((sql: string) => {
    if (sql.includes("from demos_app.tag")) {
      return Promise.resolve({ rows: tagNames.map((tag_name_id) => ({ tag_name_id })) });
    }

    if (sql.includes("application_tag_suggestion_extract_field_limit")) {
      return Promise.resolve({
        rows: allowedTagSuggestionFieldIds.map((id) => ({ id })),
      });
    }

    if (
      sql === "BEGIN" ||
      sql === "COMMIT" ||
      sql === "ROLLBACK" ||
      sql.includes("uipath_value") ||
      sql.includes("application_tag_suggestion_extract")
    ) {
      return Promise.resolve({ rows: [] });
    }

    return Promise.resolve({ rows: [{ id: "result-1" }] });
  });
}

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
    expect(mocks.queryMock.mock.calls[2]?.[0]).toContain("update demos_app.uipath_result");
    expect(mocks.queryMock.mock.calls[2]?.[1]?.[5]).toBe("Finished");
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
    expect(mocks.queryMock.mock.calls[2]?.[0]).toContain("update demos_app.uipath_result");
    expect(mocks.queryMock.mock.calls[2]?.[1]).toEqual([
      "request-doc-id",
      "project-1",
      expect.any(String),
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "Finished",
    ]);
  });

  it("returns and logs failed status if maxAttempts is exceeded", async () => {
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

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      status: "Failed",
      error: "UiPath extraction did not succeed within the configured attempts.",
      lastPolledStatus: { status: "Pending" },
    });
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message: "UiPath extraction did not succeed within the configured attempts.",
        }),
      },
      "UiPath extraction failed"
    );
    expect(mocks.queryMock).toHaveBeenCalledTimes(2);
    expect(mocks.queryMock.mock.calls[0]?.[1]?.[6]).toBe("Pending");
    expect(mocks.queryMock.mock.calls[1]?.[0]).toContain("update demos_app.uipath_result");
    expect(mocks.queryMock.mock.calls[1]?.[1]?.[5]).toBe("Failed");
  });

  it("persists top-level fields and skips non-string field values", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mockSuccessfulDbQueries();
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
    expect(mocks.queryMock).toHaveBeenCalledTimes(8);
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

  it("returns and logs failed status when result row id is not returned", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock
      .mockResolvedValueOnce({ rows: [{ id: "result-1" }] }) // pending insert
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // finished update
      .mockResolvedValueOnce({}) // ROLLBACK
      .mockResolvedValueOnce({ rows: [{ id: "failed-result-1" }] }); // failed update
    mocks.fetchExtractionResultMock.mockResolvedValue({ status: "Succeeded", Fields: [] });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-no-id",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      status: "Failed",
      error: "No existing UiPath result row found for request request-no-id.",
    });
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message: "No existing UiPath result row found for request request-no-id.",
        }),
      },
      "UiPath extraction failed"
    );
    expect(mocks.queryMock.mock.calls.map((call) => call[0])).toContain("ROLLBACK");
  });

  it("canonicalizes and persists one value per demo_type suggestion", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mockSuccessfulDbQueries(
      ["demo_type"],
      ["Substance Use Disorder (SUD)", "Basic Health Plan (BHP)"],
    );
    mocks.fetchExtractionResultMock.mockResolvedValue({
      status: "Succeeded",
      Fields: [
        {
          FieldId: "demo_type",
          FieldName: "demo_type",
          FieldType: "Text",
          Values: [
            {
              Value: "SUD",
              Confidence: 0.5224329,
              Reference: { TokenList: [{ Page: 0 }] },
            },
            {
              Value: "BHP",
              Confidence: 0.3818529,
              Reference: { TokenList: [{ Page: 1 }] },
            },
            {
              Value: "SUD",
              Confidence: 0.1225322,
              Reference: { TokenList: [{ Page: 2 }] },
            },
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

    expect(mocks.queryMock).toHaveBeenCalledTimes(12);
    expect(mocks.queryMock.mock.calls[3]?.[0]).toContain(
      "from demos_app.tag where tag_type_id = 'Application'"
    );
    const sudInsertArgs = mocks.queryMock.mock.calls[4]?.[1];
    const bhpInsertArgs = mocks.queryMock.mock.calls[5]?.[1];
    expect(sudInsertArgs).toEqual([
      expect.any(String),
      "result-1",
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "demo_type",
      "Substance Use Disorder (SUD)",
      28,
      0,
      0.5224329,
      JSON.stringify([{ Page: 0 }]),
    ]);
    expect(bhpInsertArgs).toEqual([
      expect.any(String),
      "result-1",
      TEST_DOCUMENT_ID,
      TEST_APPLICATION_ID,
      "demo_type",
      "Basic Health Plan (BHP)",
      23,
      0,
      0.3818529,
      JSON.stringify([{ Page: 1 }]),
    ]);
    expect(mocks.queryMock.mock.calls[9]?.[0]).toContain(
      "insert into demos_app.application_tag_suggestion_extract",
    );
    expect(mocks.queryMock.mock.calls[9]?.[1]).toEqual([
      sudInsertArgs?.[0],
      TEST_APPLICATION_ID,
      "demo_type",
      "Substance Use Disorder (SUD)",
      1,
      1,
    ]);
    expect(mocks.queryMock.mock.calls[10]?.[1]).toEqual([
      bhpInsertArgs?.[0],
      TEST_APPLICATION_ID,
      "demo_type",
      "Basic Health Plan (BHP)",
      2,
      2,
    ]);
  });

  it("returns and logs failed status when a tag suggestion has no token page", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mockSuccessfulDbQueries(["demo_type"], ["Substance Use Disorder (SUD)"]);
    mocks.fetchExtractionResultMock.mockResolvedValue({
      status: "Succeeded",
      Fields: [
        {
          FieldId: "demo_type",
          FieldName: "demo_type",
          FieldType: "Text",
          Values: [{ Value: "SUD", Confidence: 0.5224329 }],
        },
      ],
    });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-demo-type-missing-page",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      status: "Failed",
      error: expect.stringContaining("token_list must include numeric Page values"),
    });
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message: expect.stringContaining("token_list must include numeric Page values"),
        }),
      },
      "UiPath extraction failed"
    );

    expect(mocks.queryMock.mock.calls[5]?.[0]).toBe("COMMIT");
    expect(mocks.queryMock.mock.calls[8]?.[0]).toBe("ROLLBACK");
    expect(
      mocks.queryMock.mock.calls.some(
        (call) => Array.isArray(call[1]) && call[1][5] === "Failed"
      )
    ).toBe(true);
  });

  it("returns and logs failed status when UiPath returns failed status", async () => {
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

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toMatchObject({
      status: "Failed",
      error: "UiPath extraction returned Failed status.",
      lastPolledStatus: { status: "Failed" },
    });
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message: "UiPath extraction returned Failed status.",
        }),
      },
      "UiPath extraction failed"
    );

    expect(mocks.queryMock).toHaveBeenCalledTimes(2);
    expect(mocks.queryMock.mock.calls[0]?.[1]?.[6]).toBe("Pending");
    expect(mocks.queryMock.mock.calls[1]?.[0]).toContain("update demos_app.uipath_result");
    expect(mocks.queryMock.mock.calls[1]?.[1]?.[5]).toBe("Failed");
  });

  it("persists, returns, and logs redacted UiPath HTTP failure details", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock.mockResolvedValue({ rows: [{ id: "result-1" }] });
    const redactedError = {
      isErrorRedactedResponse: true,
      message: "Request failed with status code 401",
      fullURL: "https://govcloud.uipath.us/result",
      response: {
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: "<REDACTED>",
      },
      request: {
        baseURL: "",
        path: "https://govcloud.uipath.us/result",
        method: "get",
        data: "<REDACTED>",
      },
    };
    mocks.fetchExtractionResultMock.mockRejectedValue(redactedError);

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-redacted-failure",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual({
      status: "Failed",
      error: "Request failed with status code 401",
      errorDetails: redactedError,
    });
    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      { error: redactedError },
      "UiPath extraction failed"
    );

    const failedResponse = JSON.parse(mocks.queryMock.mock.calls[1]?.[1]?.[2]);
    expect(failedResponse).toEqual({
      error: "Request failed with status code 401",
      errorDetails: redactedError,
    });
    expect(JSON.stringify(failedResponse)).not.toContain("token-123");
  });

  it("logs and throws when failed status cannot be persisted", async () => {
    const persistError = new Error("Database unavailable");
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.queryMock
      .mockResolvedValueOnce({ rows: [{ id: "result-1" }] })
      .mockRejectedValueOnce(persistError);
    mocks.fetchExtractionResultMock.mockResolvedValue({ status: "Failed" });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      requestId: "request-persist-failure",
      documentId: TEST_DOCUMENT_ID,
      applicationId: TEST_APPLICATION_ID,
    });
    const expectation = expect(promise).rejects.toBe(persistError);

    await vi.runAllTimersAsync();
    await expectation;

    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({
          message: "UiPath extraction returned Failed status.",
        }),
        persistError,
      },
      "UiPath extraction failed and its status could not be persisted"
    );
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
