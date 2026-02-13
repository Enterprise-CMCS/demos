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
      logFullResult: false,
      requestId: "request-1",
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
    expect(mocks.queryMock).toHaveBeenCalledTimes(1);
    expect(mocks.releaseMock).toHaveBeenCalled();
  });

  it("throws if maxAttempts is exceeded", async () => {
    mocks.uploadDocumentMock.mockResolvedValue("doc-1");
    mocks.extractDocMock.mockResolvedValue("result-url");
    mocks.fetchExtractionResultMock.mockResolvedValue({ status: "Pending" });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      maxAttempts: 2,
    });

    const expectation = expect(promise).rejects.toThrow("did not succeed");
    await vi.runAllTimersAsync();
    await expectation;
  });
});
