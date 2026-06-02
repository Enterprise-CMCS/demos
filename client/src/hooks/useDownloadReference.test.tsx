import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLazyQuery } from "@apollo/client";

import { useDownloadReference } from "./useDownloadReference";
import { useTriggerDownload } from "./useTriggerDownload";

const mockShowError = vi.fn();

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();

  return {
    ...actual,
    useLazyQuery: vi.fn(),
  };
});

vi.mock("components/toast", () => ({
  useToast: () => ({
    showError: mockShowError,
  }),
}));

vi.mock("./useTriggerDownload", () => ({
  useTriggerDownload: vi.fn(),
}));

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;

describe("useDownloadReference", () => {
  const fetchReferenceDownloadUrl = vi.fn();
  const fetchReferenceAgreementDownloadUrl = vi.fn();
  const triggerDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTriggerDownload).mockReturnValue({ triggerDownload });
    vi.mocked(useLazyQuery)
      .mockReturnValueOnce([fetchReferenceDownloadUrl, {}] as unknown as UseLazyQueryTuple)
      .mockReturnValueOnce([
        fetchReferenceAgreementDownloadUrl,
        {},
      ] as unknown as UseLazyQueryTuple);
  });

  describe("downloadReference", () => {
    it("downloads the returned presigned reference URL", async () => {
      fetchReferenceDownloadUrl.mockResolvedValue({
        data: {
          referenceDownloadUrl: "https://example.com/reference.pdf?signature=abc123",
        },
      });

      const { result } = renderHook(() => useDownloadReference());

      await expect(
        result.current.downloadReference({
          id: "reference-123",
          acceptedAgreementId: "agreement-456",
        })
      ).resolves.toBe("https://example.com/reference.pdf?signature=abc123");

      expect(fetchReferenceDownloadUrl).toHaveBeenCalledExactlyOnceWith({
        variables: { id: "reference-123", acceptedAgreementId: "agreement-456" },
      });
      expect(triggerDownload).toHaveBeenCalledExactlyOnceWith(
        "https://example.com/reference.pdf?signature=abc123"
      );
      expect(mockShowError).not.toHaveBeenCalled();
    });

    it("shows an error when the reference URL is missing", async () => {
      fetchReferenceDownloadUrl.mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDownloadReference());

      await expect(
        result.current.downloadReference({
          id: "reference-123",
          acceptedAgreementId: "agreement-456",
        })
      ).rejects.toThrow("Unable to download reference.");

      expect(triggerDownload).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledExactlyOnceWith("Unable to download reference.");
    });

    it("shows an error when the reference query returns an error", async () => {
      fetchReferenceDownloadUrl.mockResolvedValue({
        data: {
          referenceDownloadUrl: "https://example.com/reference.pdf?signature=abc123",
        },
        error: new Error("request failed"),
      });

      const { result } = renderHook(() => useDownloadReference());

      await expect(
        result.current.downloadReference({
          id: "reference-123",
          acceptedAgreementId: "agreement-456",
        })
      ).rejects.toThrow("Unable to download reference.");

      expect(triggerDownload).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledExactlyOnceWith("Unable to download reference.");
    });
  });

  describe("downloadReferenceAgreement", () => {
    it("downloads the returned presigned reference agreement URL", async () => {
      fetchReferenceAgreementDownloadUrl.mockResolvedValue({
        data: {
          referenceAgreementDownloadUrl: "https://example.com/reference.pdf?signature=abc123",
        },
      });

      const { result } = renderHook(() => useDownloadReference());

      await expect(
        result.current.downloadReferenceAgreement({
          id: "reference-123",
        })
      ).resolves.toBe("https://example.com/reference.pdf?signature=abc123");

      expect(fetchReferenceAgreementDownloadUrl).toHaveBeenCalledExactlyOnceWith({
        variables: { id: "reference-123" },
      });
      expect(triggerDownload).toHaveBeenCalledExactlyOnceWith(
        "https://example.com/reference.pdf?signature=abc123"
      );
      expect(mockShowError).not.toHaveBeenCalled();
    });

    it("shows an error when the reference agreement URL is missing", async () => {
      fetchReferenceAgreementDownloadUrl.mockResolvedValue({ data: undefined });

      const { result } = renderHook(() => useDownloadReference());

      await expect(
        result.current.downloadReferenceAgreement({
          id: "reference-123",
        })
      ).rejects.toThrow("Unable to download reference agreement.");

      expect(triggerDownload).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledExactlyOnceWith(
        "Unable to download reference agreement."
      );
    });

    it("shows an error when the reference agreement query returns an error", async () => {
      fetchReferenceAgreementDownloadUrl.mockResolvedValue({
        data: {
          referenceAgreementDownloadUrl: "https://example.com/reference.pdf?signature=abc123",
        },
        error: new Error("request failed"),
      });

      const { result } = renderHook(() => useDownloadReference());

      await expect(
        result.current.downloadReferenceAgreement({
          id: "reference-123",
        })
      ).rejects.toThrow("Unable to download reference agreement.");

      expect(triggerDownload).not.toHaveBeenCalled();
      expect(mockShowError).toHaveBeenCalledExactlyOnceWith(
        "Unable to download reference agreement."
      );
    });
  });
});
