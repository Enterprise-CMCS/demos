import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApolloError } from "@apollo/client";
import { BaseEditModificationDialog } from "./BaseEditModificationDialog";

// Mock dependencies
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

// Mock hook that returns query and mutation
const mockUseModification = vi.fn();

describe("BaseEditModificationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = (
    modificationType: "Amendment" | "Extension",
    mockHookReturnValue: ReturnType<typeof mockUseModification>
  ) => {
    mockUseModification.mockReturnValue(mockHookReturnValue);

    return render(
      <BaseEditModificationDialog
        modificationType={modificationType}
        useModification={mockUseModification}
      />
    );
  };

  it("renders dialog with correct title", async () => {
    renderDialog("Amendment", {
      modification: {
        id: "modification-1",
        name: "Test",
        description: "Test description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Edit Details" })).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching modification data", () => {
    renderDialog("Extension", {
      modification: undefined,
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders form with Amendment fields after data loads", async () => {
    renderDialog("Amendment", {
      modification: {
        id: "modification-1",
        name: "Test Amendment",
        description: "Test description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Amendment Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("renders form with Extension fields after data loads", async () => {
    renderDialog("Extension", {
      modification: {
        id: "modification-1",
        name: "Test Extension",
        description: "Test description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Extension Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("populates form with initial modification data", async () => {
    renderDialog("Amendment", {
      modification: {
        id: "modification-1",
        name: "Original Name",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toHaveValue("Original Name");
    });

    expect(screen.getByLabelText(/Amendment Description/)).toHaveValue("Original description");
    expect(screen.getByLabelText(/Effective Date/)).toHaveValue("2024-01-15");
    expect(screen.getByLabelText(/Signature Level/)).toHaveValue("OA");
  });

  it("shows error message when query fails", async () => {
    renderDialog("Amendment", {
      modification: undefined,
      error: new ApolloError({ errorMessage: "Failed to load" }),
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByText("Error loading Amendment")).toBeInTheDocument();
    });
  });

  it("calls save hook with correct data on submit", async () => {
    const mockSave = vi.fn().mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();

    renderDialog("Extension", {
      modification: {
        id: "modification-1",
        name: "Original Name",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: mockSave,
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Extension Title/));
    await user.type(screen.getByLabelText(/Extension Title/), "Updated Name");
    await user.clear(screen.getByLabelText(/Extension Description/));
    await user.type(screen.getByLabelText(/Extension Description/), "Updated description");
    await user.clear(screen.getByLabelText(/Effective Date/));
    await user.type(screen.getByLabelText(/Effective Date/), "2024-02-20");
    await user.selectOptions(screen.getByLabelText(/Signature Level/), "OCD");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-extension-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({
        name: "Updated Name",
        description: "Updated description",
        effectiveDate: "2024-02-20",
        signatureLevel: "OCD",
        demonstrationId: "demo-1",
      });
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Extension updated successfully.");
    });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles save error and shows error message", async () => {
    const mockSave = vi.fn().mockRejectedValue(new Error("Failed to save"));
    const user = userEvent.setup();

    renderDialog("Amendment", {
      modification: {
        id: "modification-1",
        name: "Original Name",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: mockSave,
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Amendment Title/));
    await user.type(screen.getByLabelText(/Amendment Title/), "Updated Name");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-amendment-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to update amendment.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("closes dialog directly when cancel is clicked without form changes", async () => {
    const user = userEvent.setup();

    renderDialog("Extension", {
      modification: {
        id: "modification-1",
        name: "Original Name",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog when cancel is clicked with form changes", async () => {
    const user = userEvent.setup();

    renderDialog("Amendment", {
      modification: {
        id: "modification-1",
        name: "Original Name",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    // Make changes to the form
    await user.clear(screen.getByLabelText(/Amendment Title/));
    await user.type(screen.getByLabelText(/Amendment Title/), "Updated Name");

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

    renderDialog("Extension", {
      modification: {
        id: "modification-1",
        name: "Original Name",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: { id: "demo-1" },
      },
      error: undefined,
      save: vi.fn(),
      saving: false,
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
