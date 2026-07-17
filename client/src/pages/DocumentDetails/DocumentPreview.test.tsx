import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DocumentPreview } from "./DocumentPreview";

// Mock file-type
vi.mock("file-type", () => ({
  fileTypeFromBlob: vi.fn(),
}));

// Mock Button component
vi.mock("components/button", () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props}>{children}</button>
  ),
}));

describe("DocumentPreview", () => {
  const mockPresignedUrl = "https://example.com/file.pdf";
  const mockFilename = "test-document.pdf";

  beforeEach(() => {
    // Mock URL.createObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    // Mock fetch to never resolve
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as typeof fetch;

    render(<DocumentPreview presignedDownloadUrl={mockPresignedUrl} filename={mockFilename} />);

    expect(screen.getByText("Loading file...")).toBeInTheDocument();
  });

  it("displays error when fetch fails", async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error("Network error"))) as typeof fetch;

    render(<DocumentPreview presignedDownloadUrl={mockPresignedUrl} filename={mockFilename} />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading file: Network error/)).toBeInTheDocument();
    });
  });

  it("displays error when response is not ok", async () => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: "Not Found",
      } as Response)
    ) as typeof fetch;

    render(<DocumentPreview presignedDownloadUrl={mockPresignedUrl} filename={mockFilename} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Error loading file: Failed to download file: Not Found/)
      ).toBeInTheDocument();
    });
  });

  it("renders PDF embed when file type is application/pdf", async () => {
    const mockBlob = new Blob(["fake pdf content"], { type: "application/pdf" });

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response)
    ) as typeof fetch;

    const { fileTypeFromBlob } = await import("file-type");
    vi.mocked(fileTypeFromBlob).mockResolvedValue({
      ext: "pdf",
      mime: "application/pdf",
    });

    render(<DocumentPreview presignedDownloadUrl={mockPresignedUrl} filename={mockFilename} />);

    await waitFor(() => {
      const embed = document.querySelector("embed");
      expect(embed).toBeInTheDocument();
      expect(embed).toHaveClass("w-full", "h-full");
      // PDFs embed the presigned URL directly so the native viewer can read the
      // document title from its Content-Disposition header (not a blob UUID).
      expect(embed?.getAttribute("src")).toBe(mockPresignedUrl);
    });
  });

  it("renders download button for non-PDF files", async () => {
    const mockBlob = new Blob(["fake content"], { type: "image/png" });

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response)
    ) as typeof fetch;

    const { fileTypeFromBlob } = await import("file-type");
    vi.mocked(fileTypeFromBlob).mockResolvedValue({
      ext: "png",
      mime: "image/png",
    });

    // The download uses the document title verbatim, consistent with what's
    // stored and displayed elsewhere (no extension appended/slugified).
    render(
      <DocumentPreview
        presignedDownloadUrl={mockPresignedUrl}
        filename="Budget Neutrality Workbook Ohio"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Download File")).toBeInTheDocument();
      const link = screen.getByText("Download File").closest("a");
      expect(link).toHaveAttribute("href", "blob:mock-url");
      expect(link).toHaveAttribute("download", "Budget Neutrality Workbook Ohio");
    });
  });

  it("handles file type detection returning null", async () => {
    const mockBlob = new Blob(["unknown content"], { type: "application/octet-stream" });

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response)
    ) as typeof fetch;

    const { fileTypeFromBlob } = await import("file-type");
    vi.mocked(fileTypeFromBlob).mockResolvedValue(undefined);

    render(<DocumentPreview presignedDownloadUrl={mockPresignedUrl} filename={mockFilename} />);

    await waitFor(() => {
      expect(screen.getByText("Download File")).toBeInTheDocument();
    });
  });

  it("creates File object with correct filename", async () => {
    const mockBlob = new Blob(["content"], { type: "application/pdf" });
    const fileConstructorSpy = vi.spyOn(globalThis, "File");

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as Response)
    ) as typeof fetch;

    const { fileTypeFromBlob } = await import("file-type");
    vi.mocked(fileTypeFromBlob).mockResolvedValue({
      ext: "pdf",
      mime: "application/pdf",
    });

    render(<DocumentPreview presignedDownloadUrl={mockPresignedUrl} filename={mockFilename} />);

    await waitFor(() => {
      expect(fileConstructorSpy).toHaveBeenCalledWith([mockBlob], mockFilename, {
        type: mockBlob.type,
      });
    });
  });
});
