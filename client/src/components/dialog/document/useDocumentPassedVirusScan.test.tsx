import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLazyQuery } from "@apollo/client";
import {
  DOCUMENT_EXISTS_QUERY,
  DOCUMENT_POLL_INTERVAL_MS,
  VIRUS_SCAN_MAX_ATTEMPTS,
  useDocumentPassedVirusScan,
} from "./useDocumentPassedVirusScan";

vi.mock("@apollo/client", () => ({
  useLazyQuery: vi.fn(),
}));

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;

describe("useDocumentPassedVirusScan", () => {
  const checkDocumentExists = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useLazyQuery).mockReturnValue([
      checkDocumentExists,
      {},
    ] as unknown as UseLazyQueryTuple);
  });

  it("configures the document exists query with network-only fetch policy", () => {
    renderHook(() => useDocumentPassedVirusScan());

    expect(useLazyQuery).toHaveBeenCalledExactlyOnceWith(DOCUMENT_EXISTS_QUERY, {
      fetchPolicy: "network-only",
    });
  });

  it("polls until the document exists", async () => {
    checkDocumentExists
      .mockResolvedValueOnce({ data: { documentExists: false } })
      .mockResolvedValueOnce({ data: { documentExists: false } })
      .mockResolvedValueOnce({ data: { documentExists: true } });

    const { result } = renderHook(() => useDocumentPassedVirusScan());

    const pollPromise = result.current.documentPassedVirusScan("doc-456");

    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS);
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS);

    await expect(pollPromise).resolves.toBe(true);
    expect(checkDocumentExists).toHaveBeenCalledTimes(3);
    expect(checkDocumentExists).toHaveBeenNthCalledWith(1, {
      variables: { documentId: "doc-456" },
    });
    expect(checkDocumentExists).toHaveBeenNthCalledWith(2, {
      variables: { documentId: "doc-456" },
    });
    expect(checkDocumentExists).toHaveBeenNthCalledWith(3, {
      variables: { documentId: "doc-456" },
    });
  });

  it("returns false after the maximum number of attempts", async () => {
    checkDocumentExists.mockResolvedValue({
      data: { documentExists: false },
    });

    const { result } = renderHook(() => useDocumentPassedVirusScan());

    const pollPromise = result.current.documentPassedVirusScan("doc-789");

    await vi.advanceTimersByTimeAsync(VIRUS_SCAN_MAX_ATTEMPTS * DOCUMENT_POLL_INTERVAL_MS);

    await expect(pollPromise).resolves.toBe(false);
    expect(checkDocumentExists).toHaveBeenCalledTimes(VIRUS_SCAN_MAX_ATTEMPTS);
  });
});
