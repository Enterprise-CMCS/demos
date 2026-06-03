import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";
import { ToastContainer, ToastProvider } from "components/toast";
import {
  DELETE_DELIVERABLE_MUTATION,
  DELETE_DELIVERABLE_ERROR_MESSAGE,
  DELIVERABLE_DELETED_MESSAGE,
  RemoveDeliverableDialog,
  REMOVE_DELIVERABLE_CONFIRM_MESSAGE,
} from "./RemoveDeliverableDialog";

const { mockDeleteDeliverable, mockUseMutation } = vi.hoisted(() => ({
  mockDeleteDeliverable: vi.fn(),
  mockUseMutation: vi.fn(),
}));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>("@apollo/client");
  return {
    ...actual,
    useMutation: mockUseMutation,
  };
});

const CONFIRM_REMOVE_BUTTON_TEST_ID = "button-confirm-delete-deliverable";

describe("RemoveDeliverableDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteDeliverable.mockResolvedValue({});
    mockUseMutation.mockReturnValue([mockDeleteDeliverable]);
  });

  const setup = (
    ids: string[] = ["deliverable-1"],
    onClose = vi.fn(),
    onDeleted = vi.fn()
  ) => {
    render(
      <ToastProvider>
        <RemoveDeliverableDialog deliverableIds={ids} onClose={onClose} onDeleted={onDeleted} />
        <ToastContainer />
      </ToastProvider>
    );
    return { onClose, onDeleted };
  };

  it("renders the confirmation message and actions", () => {
    setup();

    expect(screen.getByText("Remove Deliverable")).toBeInTheDocument();
    expect(screen.getByText(REMOVE_DELIVERABLE_CONFIRM_MESSAGE)).toBeInTheDocument();
    expect(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID)).toHaveTextContent("Remove");
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toHaveTextContent("Cancel");
  });

  it("calls onClose when Cancel is clicked", () => {
    const { onClose } = setup();

    fireEvent.click(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME));

    expect(onClose).toHaveBeenCalled();
  });

  it("deletes selected deliverables, refetches deliverables, and shows a success message", async () => {
    const { onClose, onDeleted } = setup(["deliverable-1", "deliverable-2"]);

    expect(mockUseMutation).toHaveBeenCalledWith(DELETE_DELIVERABLE_MUTATION, {
      refetchQueries: ["GetDeliverablesPage"],
      awaitRefetchQueries: true,
    });

    fireEvent.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));

    await waitFor(() => {
      expect(mockDeleteDeliverable).toHaveBeenCalledWith({
        variables: { id: "deliverable-1" },
      });
      expect(mockDeleteDeliverable).toHaveBeenCalledWith({
        variables: { id: "deliverable-2" },
      });
      expect(onDeleted).toHaveBeenCalled();
      expect(screen.getByText(DELIVERABLE_DELETED_MESSAGE)).toBeInTheDocument();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows an error message when deletion fails", async () => {
    mockDeleteDeliverable.mockRejectedValueOnce(new Error("Delete failed"));
    const { onClose, onDeleted } = setup(["deliverable-1"]);

    fireEvent.click(screen.getByTestId(CONFIRM_REMOVE_BUTTON_TEST_ID));

    await waitFor(() => {
      expect(screen.getByText(DELETE_DELIVERABLE_ERROR_MESSAGE)).toBeInTheDocument();
      expect(onDeleted).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
