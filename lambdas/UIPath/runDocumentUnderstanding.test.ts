import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("./getToken", () => ({
  getToken: vi.fn().mockResolvedValue("token-123"),
}));

const uploadDocumentMock = vi.fn();
const extractDocMock = vi.fn();
const fetchExtractionResultMock = vi.fn();

vi.mock("./uploadDocument", () => ({
  uploadDocument: (...args: unknown[]) => uploadDocumentMock(...args),
}));

vi.mock("./extractDoc", () => ({
  extractDoc: (...args: unknown[]) => extractDocMock(...args),
}));

vi.mock("./fetchExtractResult", () => ({
  fetchExtractionResult: (...args: unknown[]) => fetchExtractionResultMock(...args),
}));

vi.mock("./log", () => ({
  log: { info: vi.fn(), error: vi.fn() },
}));

import { runDocumentUnderstanding } from "./runDocumentUnderstanding";
import { getToken } from "./getToken";

describe("runDocumentUnderstanding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    uploadDocumentMock.mockReset();
    extractDocMock.mockReset();
    fetchExtractionResultMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("runs the DU flow and returns succeeded status", async () => {
    uploadDocumentMock.mockResolvedValue("doc-1");
    extractDocMock.mockResolvedValue("result-url");
    fetchExtractionResultMock
      .mockResolvedValueOnce({ status: "Running" })
      .mockResolvedValueOnce({ status: "Succeeded", data: { ok: true } });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      logFullResult: false,
      prompts: [
        {
          id: "prompt-1",
          question: "What is the state?",
          fieldType: "Text",
          multiValued: false,
        },
      ],
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(getToken).toHaveBeenCalled();
    expect(uploadDocumentMock).toHaveBeenCalledWith("token-123", "file.pdf");
    expect(extractDocMock).toHaveBeenCalledWith("token-123", "doc-1", [
      {
        id: "prompt-1",
        question: "What is the state?",
        fieldType: "Text",
        multiValued: false,
      },
    ]);
    expect(fetchExtractionResultMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: "Succeeded" });
  });

  it("throws if maxAttempts is exceeded", async () => {
    uploadDocumentMock.mockResolvedValue("doc-1");
    extractDocMock.mockResolvedValue("result-url");
    fetchExtractionResultMock.mockResolvedValue({ status: "Pending" });

    const promise = runDocumentUnderstanding("file.pdf", {
      pollIntervalMs: 10,
      maxAttempts: 2,
      prompts: [
        {
          id: "prompt-1",
          question: "What is the state?",
          fieldType: "Text",
          multiValued: false,
        },
      ],
    });

    const expectation = expect(promise).rejects.toThrow("did not succeed");
    await vi.runAllTimersAsync();
    await expectation;
  });
});
