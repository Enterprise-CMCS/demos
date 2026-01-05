import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi } from "vitest";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RemoveDocumentDialog } from "./RemoveDocumentDialog";
import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";

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

const CONFIRM_REMOVE_BUTTON_TEST_ID = "button-confirm-delete-document";

describe("RemoveDocumentDialog", () => {
  const setup = (ids: string[] = ["1"], onClose = vi.fn()) => {
    render(
      <ToastProvider>
        <RemoveDocumentDialog documentIds={ids} onClose={onClose} />
      </ToastProvider>
    );
    return { onClose };
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

  it("calls deleteDocumentsTrigger when Remove is clicked", async () => {
    setup(["test-document-id"]);
    fireEvent.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));
    await waitFor(() => {
      expect(mockQuery).toHaveBeenCalledWith({
        variables: { ids: ["test-document-id"] },
        refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
      });
    });
  });
});
