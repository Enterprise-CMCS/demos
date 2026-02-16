import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { CreateExtensionDialog, CREATE_EXTENSION_MUTATION } from "./CreateExtensionDialog";

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

// Mock data
const createExtensionSuccessMock: MockedResponse = {
  request: {
    query: CREATE_EXTENSION_MUTATION,
    variables: {
      input: {
        demonstrationId: "demo-1",
        name: "Test Extension",
        description: "Test description",
        signatureLevel: "OCD",
      },
    },
  },
  result: {
    data: {
      createExtension: {
        demonstration: {
          id: "demo-1",
          extensions: [{ id: "ext-1" }],
        },
      },
    },
  },
};

const createExtensionErrorMock: MockedResponse = {
  request: {
    query: CREATE_EXTENSION_MUTATION,
    variables: {
      input: {
        demonstrationId: "demo-1",
        name: "Test Extension",
        description: undefined,
        signatureLevel: undefined,
      },
    },
  },
  error: new Error("Failed to create extension"),
};

describe("CreateExtensionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = (
    props?: React.ComponentProps<typeof CreateExtensionDialog>,
    mocks: MockedResponse[] = []
  ) => {
    return render(
      <MockedProvider mocks={mocks}>
        <CreateExtensionDialog {...props} />
      </MockedProvider>
    );
  };

  it("renders dialog with correct title", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "Add Extension" })).toBeInTheDocument();
  });

  it("renders form with Extension fields", () => {
    renderDialog();

    expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Extension Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("shows demonstration select when demonstrationId is not provided", () => {
    renderDialog();

    expect(screen.getByTestId("select-demonstration")).toBeInTheDocument();
  });

  it("hides demonstration select when demonstrationId is provided", () => {
    renderDialog({ demonstrationId: "demo-123" });

    expect(screen.queryByTestId("select-demonstration")).not.toBeInTheDocument();
  });

  it("disables submit button when form is invalid", () => {
    renderDialog();

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-extension-dialog/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when form is valid", async () => {
    const user = userEvent.setup();

    renderDialog();

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-extension-dialog/i,
    });
    expect(submitButton).toBeDisabled();

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("calls mutation with correct variables on submit", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [createExtensionSuccessMock]);

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");
    await user.type(screen.getByLabelText(/Extension Description/), "Test description");
    await user.selectOptions(screen.getByTestId("signature-level-select"), "OCD");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-extension-dialog/i,
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
      expect(mockShowSuccess).toHaveBeenCalledWith("Extension created successfully.");
    });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles mutation error and shows error message", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [createExtensionErrorMock]);

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-extension-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to create extension.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("closes dialog directly when cancel is clicked without form changes", async () => {
    const user = userEvent.setup();

    renderDialog({ demonstrationId: "demo-123" });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });

  it("shows confirmation dialog when cancel is clicked with form changes", async () => {
    const user = userEvent.setup();

    renderDialog({ demonstrationId: "demo-123" });

    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");

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

    renderDialog({ demonstrationId: "demo-123" });

    const closeButton = screen.getByLabelText("Close dialog");
    await user.click(closeButton);

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
