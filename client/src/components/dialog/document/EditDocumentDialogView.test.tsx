import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { EditDocumentDialogView } from "./EditDocumentDialogView";
import { Document as ServerDocument } from "demos-server";

const mockCloseDialog = vi.fn();
vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

const UPLOAD_DOCUMENT_BUTTON_TEST_ID = "button-confirm-upload-document";

describe("EditDocumentDialogView", () => {
  const existingDocument: Pick<ServerDocument, "id" | "name" | "description"> = {
    id: "123",
    name: "Existing Document",
    description: "This is an existing document",
  };
  const setup = (saving = false, onSubmit = vi.fn()) => {
    render(
      <ToastProvider>
        <EditDocumentDialogView document={existingDocument} saving={saving} onSubmit={onSubmit} />
      </ToastProvider>
    );
    return { onSubmit };
  };

  it("renders dialog with correct title and fields", () => {
    setup();

    expect(screen.getByText("Edit Document")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing Document")).toBeInTheDocument();
    expect(screen.getByDisplayValue("This is an existing document")).toBeInTheDocument();
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
    setup();
    fireEvent.click(screen.getByText("Cancel"));

    await waitFor(() => {
      expect(mockCloseDialog).toHaveBeenCalled();
    });
  });

  it("calls onSubmit with the updated fields when Save Changes is clicked", async () => {
    const { onSubmit } = setup();
    const titleInput = screen.getByDisplayValue("Existing Document");
    fireEvent.change(titleInput, { target: { value: "Updated Document" } });

    const uploadBtn = await screen.findByTestId(UPLOAD_DOCUMENT_BUTTON_TEST_ID);
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Updated Document",
        description: "This is an existing document",
      });
    });
  });
});
