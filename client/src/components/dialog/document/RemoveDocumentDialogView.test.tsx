import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RemoveDocumentDialogView } from "./RemoveDocumentDialogView";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";

afterEach(() => {
  vi.clearAllMocks();
});

const CONFIRM_REMOVE_BUTTON_TEST_ID = "button-confirm-delete-document";

describe("RemoveDocumentDialogView", () => {
  const setup = (ids: string[] = ["1"], onClose = vi.fn(), onConfirm = vi.fn()) => {
    render(
      <ToastProvider>
        <RemoveDocumentDialogView documentIds={ids} onClose={onClose} onConfirm={onConfirm} />
      </ToastProvider>
    );
    return { onClose, onConfirm };
  };

  it("renders with single document", () => {
    setup(["1"]);
    expect(screen.getByText(/Remove Document/)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to remove 1 document/)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument();
    expect(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
  });

  it("renders with multiple documents", () => {
    setup(["1", "2", "3"]);
    expect(screen.getByText(/Are you sure you want to remove 3 documents/)).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const { onClose } = setup(["1"]);
    fireEvent.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows warning and closes when Remove is clicked", async () => {
    const { onClose } = setup(["1", "2"]);
    await act(async () => {
      fireEvent.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onConfirm with the selected document ids when Remove is clicked", async () => {
    const { onConfirm } = setup(["test-document-id"]);
    fireEvent.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(["test-document-id"]);
    });
  });
});
