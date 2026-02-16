import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { CreateAmendmentDialog, CREATE_AMENDMENT_MUTATION } from "./CreateAmendmentDialog";

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
const createAmendmentSuccessMock: MockedResponse = {
  request: {
    query: CREATE_AMENDMENT_MUTATION,
    variables: {
      input: {
        demonstrationId: "demo-1",
        name: "Test Amendment",
        description: "Test description",
        signatureLevel: "OCD",
      },
    },
  },
  result: {
    data: {
      createAmendment: {
        demonstration: {
          id: "demo-1",
          amendments: [{ id: "ext-1" }],
        },
      },
    },
  },
};

const createAmendmentErrorMock: MockedResponse = {
  request: {
    query: CREATE_AMENDMENT_MUTATION,
    variables: {
      input: {
        demonstrationId: "demo-1",
        name: "Test Amendment",
        description: undefined,
        signatureLevel: undefined,
      },
    },
  },
  error: new Error("Failed to create amendment"),
};

describe("CreateAmendmentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDialog = (
    props?: React.ComponentProps<typeof CreateAmendmentDialog>,
    mocks: MockedResponse[] = []
  ) => {
    return render(
      <MockedProvider mocks={mocks}>
        <CreateAmendmentDialog {...props} />
      </MockedProvider>
    );
  };

  it("renders dialog with correct title", () => {
    renderDialog();

    expect(screen.getByRole("heading", { name: "Create Amendment" })).toBeInTheDocument();
  });

  it("renders form with Amendment fields", () => {
    renderDialog();

    expect(screen.getByLabelText(/Amendment Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amendment Description/)).toBeInTheDocument();
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
      name: /button-submit-create-amendment-dialog/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when form is valid", async () => {
    const user = userEvent.setup();

    renderDialog();

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-amendment-dialog/i,
    });
    expect(submitButton).toBeDisabled();

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Amendment Title/), "Test Amendment");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("calls mutation with correct variables on submit", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [createAmendmentSuccessMock]);

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

    user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalled();
      expect(submitButton).toBeEnabled();
    });

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Amendment created successfully.");
    });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("handles mutation error and shows error message", async () => {
    const user = userEvent.setup();

    renderDialog(undefined, [createAmendmentErrorMock]);

    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Amendment Title/), "Test Amendment");

    const submitButton = screen.getByRole("button", {
      name: /button-submit-create-amendment-dialog/i,
    });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to create amendment.");
      expect(mockCloseDialog).toHaveBeenCalled();
    });

    expect(mockShowSuccess).not.toHaveBeenCalled();
  });
});
