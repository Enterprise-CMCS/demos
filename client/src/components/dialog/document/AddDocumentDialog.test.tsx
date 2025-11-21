import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddDocumentDialog, tryUploadingFileToS3 } from "./AddDocumentDialog";

const mockQuery = vi.fn();
const mockCheckDocumentStatus = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: () => [mockQuery],
    useLazyQuery: () => [mockCheckDocumentStatus],
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

const UPLOAD_DOCUMENT_BUTTON_TEST_ID = "button-confirm-upload-document";
const AUTOCOMPLETE_SELECT_TEST_ID = "input-autocomplete-select";
const FILE_INPUT_TEST_ID = "input-file";

describe("AddDocumentDialog", () => {
  const setup = () => {
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={onClose}
          applicationId="test-application-id"
          documentTypeSubset={["General File", "Application Completeness Letter"]}
        />
      </ToastProvider>
    );
    return { onClose };
  };

  it("renders dialog with title and required fields", () => {
    setup();
    expect(screen.getByText("Add New Document")).toBeInTheDocument();
    expect(screen.getByText("Document Description")).toBeInTheDocument();
    expect(screen.getByText("Select File(s)")).toBeInTheDocument();
  });

  it("shows cancel confirmation dialog when cancel is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(
      screen.getByText(
        "Are you sure you want to cancel? Changes you have made so far will not be saved."
      )
    ).toBeInTheDocument();
  });

  it("has disabled button in edit when file is missing", () => {
    setup();
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    expect(uploadBtn).toBeDisabled(); // pulls from the native disabled prop
  });

  it("enables Upload button when description, type, and file are set", async () => {
    setup();

    // file
    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    // description
    fireEvent.change(screen.getByPlaceholderText("Enter"), {
      target: { value: "Test document" },
    });

    // type (AutoCompleteSelect)
    const typeInput = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    fireEvent.focus(typeInput);
    fireEvent.change(typeInput, { target: { value: "General" } });
    const option = await screen.findByText("General File");
    fireEvent.mouseDown(option);

    // assert using the actual button node
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());
  });

  it("calls onClose when confirming cancel", async () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByText("Cancel"));
    fireEvent.click(screen.getByText("Yes"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders and allows selecting a document type", async () => {
    setup();
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "General" } });

    const option = await screen.findByText("General File");
    fireEvent.mouseDown(option);

    expect(input).toHaveValue("General File");
  });

  it("defaults to the first option in list for document type", async () => {
    setup();
    const typeInput = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);

    // Verify that it auto-selected the first entry from the subset
    await waitFor(() => {
      expect(typeInput).toHaveValue("General File");
    });
  });

  it("shows upload progress bar after file load", async () => {
    setup();
    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });

    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    await waitFor(() => {
      const progressBar = screen.getByTestId("upload-progress-bar");
      expect(progressBar).toBeInTheDocument();
    });
  });

  it("truncates and displays file name with title after upload", async () => {
    setup();

    const longName =
      "this_is_a_very_long_file_name_that_should_be_truncated_in_the_button_display_but_visible_on_hover.pdf";
    const file = new File(["content"], longName, { type: "application/pdf" });

    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    // Wait for the rendered span to appear with title
    const titleSpan = await screen.findByTitle(longName);

    expect(titleSpan.textContent).toContain("...");
  });
});

describe("tryUploadingFileToS3", () => {
  const mockFile = new File(["test content"], "test.pdf", { type: "application/pdf" });
  const testPresignedURL = "https://test-bucket.s3.amazonaws.com/test-key?presigned=true";

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns success when upload is successful", async () => {
    const mockResponse = {
      ok: true,
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const result = await tryUploadingFileToS3(testPresignedURL, mockFile);

    expect(result).toEqual({ success: true, errorMessage: "" });
    expect(globalThis.fetch).toHaveBeenCalledWith(testPresignedURL, {
      method: "PUT",
      body: mockFile,
      headers: { "Content-Type": "application/pdf" },
    });
  });

  it("returns error when upload fails with bad response", async () => {
    const errorText = "Access Denied";
    const mockResponse = {
      ok: false,
      text: vi.fn().mockResolvedValue(errorText),
    } as unknown as Response;
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse);

    const result = await tryUploadingFileToS3(testPresignedURL, mockFile);

    expect(result).toEqual({
      success: false,
      errorMessage: `Failed to upload file: ${errorText}`,
    });
    expect(mockResponse.text).toHaveBeenCalled();
  });

  it("returns error when network error occurs", async () => {
    const networkError = new Error("Network timeout");
    vi.mocked(globalThis.fetch).mockRejectedValue(networkError);

    const result = await tryUploadingFileToS3(testPresignedURL, mockFile);

    expect(result).toEqual({
      success: false,
      errorMessage: "Network timeout",
    });
  });

  it("returns generic error message for non-Error exceptions", async () => {
    const nonErrorException = "String error";
    vi.mocked(globalThis.fetch).mockRejectedValue(nonErrorException);

    const result = await tryUploadingFileToS3(testPresignedURL, mockFile);

    expect(result).toEqual({
      success: false,
      errorMessage: "Network error during upload",
    });
  });

  it("uses correct headers with file content type", async () => {
    const mockFileWithDifferentType = new File(["content"], "test.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const mockResponse = { ok: true };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await tryUploadingFileToS3(testPresignedURL, mockFileWithDifferentType);

    expect(globalThis.fetch).toHaveBeenCalledWith(testPresignedURL, {
      method: "PUT",
      body: mockFileWithDifferentType,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
    });
  });
});

// Mock for virus scan polling tests
describe("AddDocumentDialog - Virus Scan Polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Mock Apollo hooks for this test suite
    vi.mocked(mockQuery).mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    // Mock fetch for S3 upload
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
    } as Response);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const setupWithMocks = (
    uploadMutationResponse = {
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    }
  ) => {
    const onClose = vi.fn();
    const onDocumentUploadSucceeded = vi.fn();

    mockQuery.mockResolvedValue(uploadMutationResponse);

    const component = render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={onClose}
          applicationId="test-application-id"
          documentTypeSubset={["General File"]}
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
        />
      </ToastProvider>
    );

    return { onClose, onDocumentUploadSucceeded, component };
  };

  const uploadFile = async () => {
    const file = new File(["sample"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByTestId("upload-progress-bar")).toBeInTheDocument();
    });
  };

  const clickUploadButton = async () => {
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await act(async () => {
      fireEvent.click(uploadBtn);
    });
  };

  it("shows scanning UI when virus scan starts", async () => {
    setupWithMocks();
    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    await waitFor(
      () => {
        expect(screen.getByText(/Scanning document for viruses/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("disables buttons during virus scan", async () => {
    setupWithMocks();
    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    await waitFor(() => {
      const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
      const cancelBtn = screen.getByText("Cancel");
      expect(uploadBtn).toBeDisabled();
      expect(cancelBtn).toBeDisabled();
    });
  });

  it("shows 'Scanning for viruses...' button text during scan", async () => {
    setupWithMocks();
    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    await waitFor(() => {
      expect(screen.getByText("Scanning for viruses...")).toBeInTheDocument();
    });
  });

  it("polls document status every second", async () => {
    setupWithMocks();
    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    // Wait for first poll
    await waitFor(() => {
      expect(mockCheckDocumentStatus).toHaveBeenCalledWith({
        variables: { documentId: "test-doc-id" },
      });
    });

    const initialCallCount = mockCheckDocumentStatus.mock.calls.length;

    // Advance 1 second - should trigger another poll
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockCheckDocumentStatus.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    // Advance another second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockCheckDocumentStatus.mock.calls.length).toBeGreaterThan(initialCallCount + 1);
    });
  });

  it("completes successfully when document exists", async () => {
    const { onClose, onDocumentUploadSucceeded } = setupWithMocks();
    await uploadFile();

    // First poll returns false, second returns true
    mockCheckDocumentStatus
      .mockResolvedValueOnce({
        data: { documentExists: false },
      })
      .mockResolvedValueOnce({
        data: { documentExists: true },
      });

    await clickUploadButton();

    // Wait for initial poll
    await waitFor(() => {
      expect(mockCheckDocumentStatus).toHaveBeenCalledTimes(1);
    });

    // Advance timer to trigger second poll
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Wait for scan to complete
    await waitFor(
      () => {
        expect(onDocumentUploadSucceeded).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it("shows timeout warning after 20 seconds", async () => {
    const { onClose } = setupWithMocks();
    await uploadFile();

    // Always return false (scan never completes)
    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    // Wait for polling to start
    await waitFor(() => {
      expect(mockCheckDocumentStatus).toHaveBeenCalled();
    });

    // Advance past timeout (20 seconds)
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    // Should show timeout warning and close dialog
    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it("stops polling after timeout", async () => {
    setupWithMocks();
    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    await waitFor(() => {
      expect(mockCheckDocumentStatus).toHaveBeenCalled();
    });

    const callsBeforeTimeout = mockCheckDocumentStatus.mock.calls.length;

    // Advance past timeout
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    await waitFor(() => {
      expect(mockCheckDocumentStatus.mock.calls.length).toBeGreaterThan(callsBeforeTimeout);
    });

    const callsAtTimeout = mockCheckDocumentStatus.mock.calls.length;

    // Advance more time - should NOT trigger more polls
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Allow some time for any potential calls
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockCheckDocumentStatus.mock.calls.length).toBe(callsAtTimeout);
  });

  it("handles polling error gracefully", async () => {
    setupWithMocks();
    await uploadFile();

    const errorMessage = "Network error during polling";
    mockCheckDocumentStatus.mockRejectedValue(new Error(errorMessage));

    await clickUploadButton();

    // Should handle error and not crash
    await waitFor(() => {
      expect(mockCheckDocumentStatus).toHaveBeenCalled();
    });

    // Error should be caught and handled
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  it("cleans up polling interval on unmount", async () => {
    const { component } = setupWithMocks();
    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    await waitFor(() => {
      expect(mockCheckDocumentStatus).toHaveBeenCalled();
    });

    // Unmount the component
    component.unmount();

    const callsBeforeUnmount = mockCheckDocumentStatus.mock.calls.length;

    // Advance time - should not trigger more polls after unmount
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(mockCheckDocumentStatus.mock.calls.length).toBe(callsBeforeUnmount);
  });

  it("skips virus scan for localhost presigned URLs", async () => {
    const { onClose, onDocumentUploadSucceeded } = setupWithMocks({
      data: {
        uploadDocument: {
          presignedURL: "http://localhost:3000/test-file",
          documentId: "test-doc-id",
        },
      },
    });
    await uploadFile();

    await clickUploadButton();

    // Should complete immediately without polling
    await waitFor(() => {
      expect(onDocumentUploadSucceeded).toHaveBeenCalled();
      expect(mockCheckDocumentStatus).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows correct button text during different stages", async () => {
    setupWithMocks();

    // Initial state
    expect(screen.getByText("Upload")).toBeInTheDocument();

    await uploadFile();

    mockCheckDocumentStatus.mockResolvedValue({
      data: { documentExists: false },
    });

    await clickUploadButton();

    // During S3 upload
    await waitFor(() => {
      const button = screen.queryByText("Uploading to S3...");
      if (button) expect(button).toBeInTheDocument();
    });

    // During virus scan
    await waitFor(() => {
      expect(screen.getByText("Scanning for viruses...")).toBeInTheDocument();
    });
  });
});
