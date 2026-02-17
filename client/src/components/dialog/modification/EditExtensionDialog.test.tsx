import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import {
  UpdateExtensionDialog,
  UPDATE_EXTENSION_MUTATION,
  UPDATE_EXTENSION_DIALOG_QUERY,
} from "./EditExtensionDialog";

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

// Mock data
const extensionQueryMock: MockedResponse = {
  request: {
    query: UPDATE_EXTENSION_DIALOG_QUERY,
    variables: { id: "extension-1" },
  },
  result: {
    data: {
      extension: {
        id: "extension-1",
        name: "Original Extension",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
        demonstration: {
          id: "demo-1",
        },
      },
    },
  },
};

const extensionQueryErrorMock: MockedResponse = {
  request: {
    query: UPDATE_EXTENSION_DIALOG_QUERY,
    variables: { id: "extension-1" },
  },
  error: new Error("Failed to load extension"),
};

const updateExtensionSuccessMock: MockedResponse = {
  request: {
    query: UPDATE_EXTENSION_MUTATION,
    variables: {
      id: "extension-1",
      input: {
        name: "Updated Extension",
        description: "Updated description",
        effectiveDate: "2024-02-20",
        signatureLevel: "OCD",
        demonstrationId: "demo-1",
      },
    },
  },
  result: {
    data: {
      updateExtension: {
        id: "extension-1",
        name: "Updated Extension",
        description: "Updated description",
        effectiveDate: "2024-02-20",
        signatureLevel: "OCD",
      },
    },
  },
};

const updateExtensionErrorMock: MockedResponse = {
  request: {
    query: UPDATE_EXTENSION_MUTATION,
    variables: {
      id: "extension-1",
      input: {
        name: "Updated Extension",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
      },
    },
  },
  error: new Error("Failed to update extension"),
};

describe("UpdateExtensionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = (
    props?: React.ComponentProps<typeof UpdateExtensionDialog>,
    mocks: MockedResponse[] = []
  ) => {
    return render(
      <MockedProvider mocks={mocks}>
        <UpdateExtensionDialog extensionId="extension-1" {...props} />
      </MockedProvider>
    );
  };

  it("renders dialog with correct title", async () => {
    renderDialog(undefined, [extensionQueryMock]);

    expect(screen.getByRole("heading", { name: "Edit Details" })).toBeInTheDocument();
  });

  it("shows loading state while fetching extension data", () => {
    renderDialog(undefined, [extensionQueryMock]);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders form with Extension fields after data loads", async () => {
    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Extension Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("populates form with initial extension data", async () => {
    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toHaveValue("Original Extension");
    });

    expect(screen.getByLabelText(/Extension Description/)).toHaveValue("Original description");
    expect(screen.getByLabelText(/Effective Date/)).toHaveValue("2024-01-15");
    expect(screen.getByLabelText(/Signature Level/)).toHaveValue("OA");
  });

  it("shows error message when query fails", async () => {
    renderDialog(undefined, [extensionQueryErrorMock]);

    await waitFor(() => {
      expect(screen.getByText("Error loading Extension")).toBeInTheDocument();
    });
  });

  it("disables submit button when form has no changes", async () => {
    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-extension-dialog/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when form has valid changes", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-extension-dialog/i,
    });
    expect(submitButton).toBeDisabled();

    await user.clear(screen.getByLabelText(/Extension Title/));
    await user.type(screen.getByLabelText(/Extension Title/), "Updated Extension");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("disables submit button when name is missing", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Extension Title/));

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-extension-dialog/i,
    });

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it("calls mutation with correct variables on submit", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [extensionQueryMock, updateExtensionSuccessMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Extension Title/));
    await user.type(screen.getByLabelText(/Extension Title/), "Updated Extension");
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

    user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalled();
      expect(submitButton).toBeEnabled();
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Extension updated successfully.");
    });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles mutation error and shows error message", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [extensionQueryMock, updateExtensionErrorMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Extension Title/));
    await user.type(screen.getByLabelText(/Extension Title/), "Updated Extension");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-extension-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to update extension.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("closes dialog directly when cancel is clicked without form changes", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [extensionQueryMock]);

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

    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    // Make changes to the form
    await user.clear(screen.getByLabelText(/Extension Title/));
    await user.type(screen.getByLabelText(/Extension Title/), "Updated Extension");

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

    renderDialog(undefined, [extensionQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
