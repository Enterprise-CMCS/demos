import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLazyQuery } from "@apollo/client";
import { DOWNLOAD_FAQ_QUERY, useDownloadFaq } from "./useDownloadFaq";
import { useTriggerDownload } from "hooks/useTriggerDownload";

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();

  return {
    ...actual,
    useLazyQuery: vi.fn(),
  };
});

vi.mock("hooks/useTriggerDownload", () => ({
  useTriggerDownload: vi.fn(),
}));

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;

describe("useDownloadFaq", () => {
  const fetchFaqDownloadUrl = vi.fn();
  const triggerDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLazyQuery).mockReturnValue([
      fetchFaqDownloadUrl,
      {},
    ] as unknown as UseLazyQueryTuple);

    vi.mocked(useTriggerDownload).mockReturnValue({
      triggerDownload,
    });
  });

  it("configures the FAQ query with network-only fetch policy", () => {
    renderHook(() => useDownloadFaq());

    expect(useLazyQuery).toHaveBeenCalledExactlyOnceWith(DOWNLOAD_FAQ_QUERY, {
      fetchPolicy: "network-only",
    });
  });

  it("downloads the returned presigned FAQ URL", async () => {
    fetchFaqDownloadUrl.mockResolvedValue({
      data: {
        downloadFAQ: {
          presignedDownloadUrl: "https://example.com/faq.pdf?signature=abc123",
        },
      },
    });

    const { result } = renderHook(() => useDownloadFaq());

    await expect(result.current.downloadFaq()).resolves.toBe(
      "https://example.com/faq.pdf?signature=abc123"
    );

    expect(fetchFaqDownloadUrl).toHaveBeenCalledExactlyOnceWith();
    expect(triggerDownload).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/faq.pdf?signature=abc123"
    );
  });

  it("throws when the server does not return a presigned URL", async () => {
    fetchFaqDownloadUrl.mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useDownloadFaq());

    await expect(result.current.downloadFaq()).rejects.toThrow("Unable to download FAQ.");
  });
});
