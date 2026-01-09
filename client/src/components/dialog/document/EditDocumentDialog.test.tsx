import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { DocumentDialogFields, EditDocumentDialog } from "./";

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

describe("EditDocumentDialog", () => {
  const existingDocument: DocumentDialogFields = {
    id: "123",
    name: "Existing Document",
    description: "This is an existing document",
    documentType: "General File",
    file: null,
  };
  const setup = () => {
    const onClose = vi.fn();
    render(
      <ToastProvider>
        <EditDocumentDialog initialDocument={existingDocument} onClose={onClose} />
      </ToastProvider>
    );
    return { onClose };
  };

  it("renders dialog with correct title and fields", () => {
    setup();

    expect(screen.getByText("Edit Document")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Document")).toBeInTheDocument(); // Title
    expect(screen.getByDisplayValue("This is an existing document")).toBeInTheDocument(); // Description
    const documentTypeInput = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    expect(documentTypeInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("General File")).toBeInTheDocument(); // Document Type
  });

  it("enables 'Save Changes' button after a field is changed", async () => {
    setup();
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    expect(uploadBtn).toBeDisabled();

    const titleInput = screen.getByDisplayValue("Existing Document");
    fireEvent.change(titleInput, { target: { value: "Updated Document" } });

    await waitFor(() => expect(uploadBtn).toBeEnabled());
    expect(uploadBtn).toHaveTextContent("Save Changes");
  });

  it("disables 'Save Changes' button when title is cleared", () => {
    setup();
    const titleInput = screen.getByDisplayValue("Existing Document");
    fireEvent.change(titleInput, { target: { value: "Updated Document" } });
    fireEvent.change(titleInput, { target: { value: "" } });
    const uploadBtn = screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    expect(uploadBtn).toBeDisabled();
  });

  it("does not render file upload controls in edit mode", () => {
    setup();

    expect(screen.queryByTestId("input-file")).not.toBeInTheDocument();
    expect(screen.getByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID)).toHaveTextContent("Save Changes");
  });

  it("calls onClose when cancel is confirmed", async () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
