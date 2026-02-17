import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import {
  UpdateAmendmentDialog,
  UPDATE_AMENDMENT_MUTATION,
  UPDATE_AMENDMENT_DIALOG_QUERY,
} from "./EditAmendmentDialog";

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
const amendmentQueryMock: MockedResponse = {
  request: {
    query: UPDATE_AMENDMENT_DIALOG_QUERY,
    variables: { id: "amendment-1" },
  },
  result: {
    data: {
      amendment: {
        id: "amendment-1",
        name: "Original Amendment",
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

const amendmentQueryErrorMock: MockedResponse = {
  request: {
    query: UPDATE_AMENDMENT_DIALOG_QUERY,
    variables: { id: "amendment-1" },
  },
  error: new Error("Failed to load amendment"),
};

const updateAmendmentSuccessMock: MockedResponse = {
  request: {
    query: UPDATE_AMENDMENT_MUTATION,
    variables: {
      id: "amendment-1",
      input: {
        name: "Updated Amendment",
        description: "Updated description",
        effectiveDate: "2024-02-20",
        signatureLevel: "OCD",
        demonstrationId: "demo-1",
      },
    },
  },
  result: {
    data: {
      updateAmendment: {
        id: "amendment-1",
        name: "Updated Amendment",
        description: "Updated description",
        effectiveDate: "2024-02-20",
        signatureLevel: "OCD",
      },
    },
  },
};

const updateAmendmentErrorMock: MockedResponse = {
  request: {
    query: UPDATE_AMENDMENT_MUTATION,
    variables: {
      id: "amendment-1",
      input: {
        name: "Updated Amendment",
        description: "Original description",
        effectiveDate: "2024-01-15",
        signatureLevel: "OA",
      },
    },
  },
  error: new Error("Failed to update amendment"),
};

describe("UpdateAmendmentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = (
    props?: React.ComponentProps<typeof UpdateAmendmentDialog>,
    mocks: MockedResponse[] = []
  ) => {
    return render(
      <MockedProvider mocks={mocks}>
        <UpdateAmendmentDialog amendmentId="amendment-1" {...props} />
      </MockedProvider>
    );
  };

  it("renders dialog with correct title", async () => {
    renderDialog(undefined, [amendmentQueryMock]);

    expect(screen.getByRole("heading", { name: "Edit Details" })).toBeInTheDocument();
  });

  it("shows loading state while fetching amendment data", () => {
    renderDialog(undefined, [amendmentQueryMock]);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders form with Amendment fields after data loads", async () => {
    renderDialog(undefined, [amendmentQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Amendment Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("populates form with initial amendment data", async () => {
    renderDialog(undefined, [amendmentQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toHaveValue("Original Amendment");
    });

    expect(screen.getByLabelText(/Amendment Description/)).toHaveValue("Original description");
    expect(screen.getByLabelText(/Effective Date/)).toHaveValue("2024-01-15");
    expect(screen.getByLabelText(/Signature Level/)).toHaveValue("OA");
  });

  it("shows error message when query fails", async () => {
    renderDialog(undefined, [amendmentQueryErrorMock]);

    await waitFor(() => {
      expect(screen.getByText("Error loading Amendment")).toBeInTheDocument();
    });
  });

  it("calls mutation with correct variables on submit", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [amendmentQueryMock, updateAmendmentSuccessMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Amendment Title/));
    await user.type(screen.getByLabelText(/Amendment Title/), "Updated Amendment");
    await user.clear(screen.getByLabelText(/Amendment Description/));
    await user.type(screen.getByLabelText(/Amendment Description/), "Updated description");
    await user.clear(screen.getByLabelText(/Effective Date/));
    await user.type(screen.getByLabelText(/Effective Date/), "2024-02-20");
    await user.selectOptions(screen.getByLabelText(/Signature Level/), "OCD");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-amendment-dialog/i,
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
      expect(mockShowSuccess).toHaveBeenCalledWith("Amendment updated successfully.");
    });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles mutation error and shows error message", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [amendmentQueryMock, updateAmendmentErrorMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/Amendment Title/));
    await user.type(screen.getByLabelText(/Amendment Title/), "Updated Amendment");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-update-amendment-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to update amendment.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("closes dialog directly when cancel is clicked without form changes", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [amendmentQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog when cancel is clicked with form changes", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [amendmentQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    // Make changes to the form
    await user.clear(screen.getByLabelText(/Amendment Title/));
    await user.type(screen.getByLabelText(/Amendment Title/), "Updated Amendment");

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

    renderDialog(undefined, [amendmentQueryMock]);

    await waitFor(() => {
      expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
