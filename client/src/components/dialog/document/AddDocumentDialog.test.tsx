import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddDocumentDialog, tryUploadingFileToS3 } from "./AddDocumentDialog";

const mockQuery = vi.fn();

beforeEach(() => {
  vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
      ...actual,
      useMutation: () => [mockQuery],
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
