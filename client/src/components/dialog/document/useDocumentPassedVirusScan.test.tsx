import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLazyQuery, useMutation } from "@apollo/client";
import {
  APPLY_DOCUMENT_TITLE_METADATA_MUTATION,
  DOCUMENT_EXISTS_QUERY,
  DOCUMENT_POLL_INTERVAL_MS,
  VIRUS_SCAN_MAX_ATTEMPTS,
  useDocumentPassedVirusScan,
} from "./useDocumentPassedVirusScan";

vi.mock("@apollo/client", () => ({
  useLazyQuery: vi.fn(),
  useMutation: vi.fn(),
}));

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;
type UseMutationTuple = ReturnType<typeof useMutation>;

describe("useDocumentPassedVirusScan", () => {
  const checkDocumentExists = vi.fn();
  const applyDocumentTitleMetadata = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(useLazyQuery).mockReturnValue([
      checkDocumentExists,
      {},
    ] as unknown as UseLazyQueryTuple);
    applyDocumentTitleMetadata.mockResolvedValue({ data: {} });
    vi.mocked(useMutation).mockReturnValue([
      applyDocumentTitleMetadata,
      {},
    ] as unknown as UseMutationTuple);
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
    expect(applyDocumentTitleMetadata).toHaveBeenCalledExactlyOnceWith({
      variables: { documentId: "doc-456" },
    });
  });

  it("configures the title metadata mutation", () => {
    renderHook(() => useDocumentPassedVirusScan());

    expect(useMutation).toHaveBeenCalledExactlyOnceWith(APPLY_DOCUMENT_TITLE_METADATA_MUTATION);
  });

  it("still reports success when applying title metadata fails", async () => {
    checkDocumentExists.mockResolvedValueOnce({ data: { documentExists: true } });
    applyDocumentTitleMetadata.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useDocumentPassedVirusScan());

    await expect(result.current.documentPassedVirusScan("doc-999")).resolves.toBe(true);
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
    expect(applyDocumentTitleMetadata).not.toHaveBeenCalled();
  });
});
