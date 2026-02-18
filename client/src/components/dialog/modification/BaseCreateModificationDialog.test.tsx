import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { BaseCreateModificationDialog } from "./BaseCreateModificationDialog";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
const mockCloseDialog = vi.fn();

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

vi.mock("components/input/select/SelectDemonstration", () => ({
  SelectDemonstration: ({
    onSelect,
    value,
    isRequired,
  }: {
    isRequired?: boolean;
    onSelect: (id: string) => void;
    value: string;
  }) => (
    <select
      data-testid="select-demonstration"
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      required={isRequired}
    >
      <option value="">Select demonstration</option>
      <option value="demo-1">Demo 1</option>
      <option value="demo-2">Demo 2</option>
    </select>
  ),
}));

const mockSave = vi.fn();
const mockUseModification = vi.fn(() => ({
  save: mockSave,
  saving: false,
}));

describe("BaseCreateModificationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSave.mockClear();
    mockUseModification.mockReturnValue({
      save: mockSave,
      saving: false,
    });
  });

  const renderDialog = (
    modificationType: "Amendment" | "Extension" = "Amendment",
    demonstrationId?: string,
    mocks: MockedResponse[] = []
  ) => {
    return render(
      <MockedProvider mocks={mocks}>
        <BaseCreateModificationDialog
          modificationType={modificationType}
          useModification={mockUseModification}
          demonstrationId={demonstrationId}
        />
      </MockedProvider>
    );
  };

  it("renders dialog with correct title for Amendment", () => {
    renderDialog("Amendment");

    expect(screen.getByRole("heading", { name: "Add Amendment" })).toBeInTheDocument();
  });

  it("renders dialog with correct title for Extension", () => {
    renderDialog("Extension");

    expect(screen.getByRole("heading", { name: "Add Extension" })).toBeInTheDocument();
  });

  it("renders form with modification type fields", () => {
    renderDialog("Amendment");

    expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amendment Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("shows demonstration select when demonstrationId is not provided", () => {
    renderDialog("Amendment");

    expect(screen.getByTestId("select-demonstration")).toBeInTheDocument();
  });

  it("hides demonstration select when demonstrationId is provided", () => {
    renderDialog("Amendment", "demo-123");

    expect(screen.queryByTestId("select-demonstration")).not.toBeInTheDocument();
  });

  it("calls save hook with correct data on submit", async () => {
    const user = userEvent.setup();
    mockSave.mockResolvedValue(undefined);

    renderDialog("Amendment");

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Amendment Title/), "Test Amendment");
    await user.type(screen.getByLabelText(/Amendment Description/), "Test description");
    await user.selectOptions(screen.getByTestId("signature-level-select"), "OCD");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-amendment-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({
        demonstrationId: "demo-1",
        name: "Test Amendment",
        description: "Test description",
        signatureLevel: "OCD",
      });
      expect(mockShowSuccess).toHaveBeenCalledWith("Amendment created successfully.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles save error and shows error message", async () => {
    const user = userEvent.setup();
    mockSave.mockRejectedValue(new Error("Failed to save"));

    renderDialog("Extension");

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-extension-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to create extension.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("closes dialog directly when cancel is clicked without form changes", async () => {
    const user = userEvent.setup();

    renderDialog("Amendment", "demo-123");

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog when cancel is clicked with form changes", async () => {
    const user = userEvent.setup();

    renderDialog("Amendment", "demo-123");

    await user.type(screen.getByLabelText(/Amendment Title/), "Test Amendment");

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      expect(screen.getByText(/You will lose any unsaved changes/i)).toBeInTheDocument();
    });

    expect(mockCloseDialog).not.toHaveBeenCalled();
  });

  it("closes dialog when close button (X) is clicked", async () => {
    const user = userEvent.setup();

    renderDialog("Amendment", "demo-123");

    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
