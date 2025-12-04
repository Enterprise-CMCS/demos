import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  AddDocumentDialog,
  DOCUMENT_POLL_INTERVAL_MS,
  tryUploadingFileToS3,
  VIRUS_SCAN_MAX_ATTEMPTS,
} from "./AddDocumentDialog";

let mockMutationFn = vi.fn();
let mockLazyQueryFn = vi.fn();
let mockRefetchQueries = vi.fn();

beforeEach(() => {
  mockMutationFn = vi.fn();
  mockLazyQueryFn = vi.fn();
  mockRefetchQueries = vi.fn();

  vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
      ...actual,
      useMutation: () => [mockMutationFn, { loading: false }],
      useLazyQuery: () => [mockLazyQueryFn, { loading: false }],
      useApolloClient: () => ({
        refetchQueries: mockRefetchQueries,
      }),
    };
  });
});

afterEach(() => {
  vi.resetModules();
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
    expect(screen.getByText("You will lose any unsaved changes in this view.")).toBeInTheDocument();
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
    fireEvent.click(screen.getByTestId("button-cc-dialog-discard"));

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

describe("virus scan polling", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("polls documentExists query after successful upload", async () => {
    mockMutationFn.mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    mockLazyQueryFn.mockResolvedValue({
      data: { documentExists: true },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);

    const onDocumentUploadSucceeded = vi.fn();

    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={vi.fn()}
          applicationId="test-app-id"
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
          documentTypeSubset={["General File"]}
        />
      </ToastProvider>
    );

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());

    const clickPromise = new Promise<void>((resolve) => {
      fireEvent.click(uploadBtn);
      // Wait for next tick to let the click handler start
      setTimeout(() => resolve(), 0);
    });

    await clickPromise;
    // Advance timer to allow polling to complete
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS);

    expect(mockLazyQueryFn).toHaveBeenCalledWith({
      variables: { documentId: "test-doc-id" },
    });
    expect(onDocumentUploadSucceeded).toHaveBeenCalled();
  });

  it("continues polling if document does not exist yet", async () => {
    mockMutationFn.mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    let callCount = 0;
    mockLazyQueryFn.mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return { data: { documentExists: false } };
      }
      return { data: { documentExists: true } };
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);

    const onDocumentUploadSucceeded = vi.fn();

    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={vi.fn()}
          applicationId="test-app-id"
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
          documentTypeSubset={["General File"]}
        />
      </ToastProvider>
    );

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());

    const clickPromise = new Promise<void>((resolve) => {
      fireEvent.click(uploadBtn);
      setTimeout(() => resolve(), 0);
    });

    await clickPromise;
    // Advance timers for each polling attempt (3 total)
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS); // 1st poll (fails)
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS); // 2nd poll (fails)
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS); // 3rd poll (succeeds)

    expect(mockLazyQueryFn).toHaveBeenCalledTimes(3);
    expect(onDocumentUploadSucceeded).toHaveBeenCalled();
  });

  it("throws error when virus scan times out", async () => {
    mockMutationFn.mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    mockLazyQueryFn.mockResolvedValue({
      data: { documentExists: false },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);

    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={vi.fn()}
          applicationId="test-app-id"
          documentTypeSubset={["General File"]}
        />
      </ToastProvider>
    );

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());

    const clickPromise = new Promise<void>((resolve) => {
      fireEvent.click(uploadBtn);
      setTimeout(() => resolve(), 0);
    });

    await clickPromise;
    // Advance timers to reach max attempts
    await vi.advanceTimersByTimeAsync(VIRUS_SCAN_MAX_ATTEMPTS * DOCUMENT_POLL_INTERVAL_MS);

    // Should reach max attempts  and throw timeout error
    expect(mockLazyQueryFn).toHaveBeenCalledTimes(VIRUS_SCAN_MAX_ATTEMPTS);
  });

  it("skips virus scan polling for localhost uploads", async () => {
    mockMutationFn.mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "http://localhost:4566/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    const onDocumentUploadSucceeded = vi.fn();

    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={vi.fn()}
          applicationId="test-app-id"
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
          documentTypeSubset={["General File"]}
        />
      </ToastProvider>
    );

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());

    const clickPromise = new Promise<void>((resolve) => {
      fireEvent.click(uploadBtn);
      setTimeout(() => resolve(), 0);
    });

    await clickPromise;
    // Advance timers (though localhost should skip polling)
    await vi.advanceTimersByTimeAsync(100);

    expect(onDocumentUploadSucceeded).toHaveBeenCalled();
    // Should not poll for virus scan in localhost mode
    expect(mockLazyQueryFn).not.toHaveBeenCalled();
  });

  it("refetches queries after successful upload when refetchQueries is provided", async () => {
    mockMutationFn.mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    mockLazyQueryFn.mockResolvedValue({
      data: { documentExists: true },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);

    const onDocumentUploadSucceeded = vi.fn();
    const refetchQueries = ["GetDocuments", "GetApplicationDocuments"];

    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={vi.fn()}
          applicationId="test-app-id"
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
          documentTypeSubset={["General File"]}
          refetchQueries={refetchQueries}
        />
      </ToastProvider>
    );

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());

    const clickPromise = new Promise<void>((resolve) => {
      fireEvent.click(uploadBtn);
      setTimeout(() => resolve(), 0);
    });

    await clickPromise;
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS);

    expect(onDocumentUploadSucceeded).toHaveBeenCalled();
    expect(mockRefetchQueries).toHaveBeenCalledWith({ include: refetchQueries });
  });

  it("does not call refetchQueries when not provided", async () => {
    mockMutationFn.mockResolvedValue({
      data: {
        uploadDocument: {
          presignedURL: "https://s3.amazonaws.com/test-bucket/test-file",
          documentId: "test-doc-id",
        },
      },
    });

    mockLazyQueryFn.mockResolvedValue({
      data: { documentExists: true },
    });

    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);

    const onDocumentUploadSucceeded = vi.fn();

    render(
      <ToastProvider>
        <AddDocumentDialog
          onClose={vi.fn()}
          applicationId="test-app-id"
          onDocumentUploadSucceeded={onDocumentUploadSucceeded}
          documentTypeSubset={["General File"]}
        />
      </ToastProvider>
    );

    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId(FILE_INPUT_TEST_ID), {
      target: { files: [file] },
    });

    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    await waitFor(() => expect(uploadBtn).toBeEnabled());

    const clickPromise = new Promise<void>((resolve) => {
      fireEvent.click(uploadBtn);
      setTimeout(() => resolve(), 0);
    });

    await clickPromise;
    await vi.advanceTimersByTimeAsync(DOCUMENT_POLL_INTERVAL_MS);

    expect(onDocumentUploadSucceeded).toHaveBeenCalled();
    expect(mockRefetchQueries).not.toHaveBeenCalled();
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
