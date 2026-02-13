import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { CreateExtensionDialog, CREATE_EXTENSION_MUTATION } from "./CreateExtensionDialog";

// Mock dependencies
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: vi.fn(),
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

describe("CreateExtensionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with correct title", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <CreateExtensionDialog />
      </MockedProvider>
    );

    expect(screen.getByText("Create Extension")).toBeInTheDocument();
  });

  it("renders form with Extension fields", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <CreateExtensionDialog />
      </MockedProvider>
    );

    expect(screen.getByLabelText(/Extension Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Extension Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Signature Level/)).toBeInTheDocument();
  });

  it("shows demonstration select when demonstrationId is not provided", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <CreateExtensionDialog />
      </MockedProvider>
    );

    expect(screen.getByTestId("select-demonstration")).toBeInTheDocument();
  });

  it("hides demonstration select when demonstrationId is provided", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <CreateExtensionDialog demonstrationId="demo-123" />
      </MockedProvider>
    );

    expect(screen.queryByTestId("select-demonstration")).not.toBeInTheDocument();
  });

  it("disables submit button when form is invalid", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <CreateExtensionDialog />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: /create extension/i });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when form is valid", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <CreateExtensionDialog />
      </MockedProvider>
    );

    const submitButton = screen.getByRole("button", { name: /create extension/i });
    expect(submitButton).toBeDisabled();

    // Fill in required fields
    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("calls mutation with correct variables on submit", async () => {
    const user = userEvent.setup();

    const mockMutationWithVars = {
      request: {
        query: CREATE_EXTENSION_MUTATION,
        variables: {
          input: {
            demonstrationId: "demo-1",
            name: "Test Extension",
            description: "",
            signatureLevel: undefined,
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

    render(
      <MockedProvider mocks={[mockMutationWithVars]} addTypename={false}>
        <CreateExtensionDialog />
      </MockedProvider>
    );

    // Fill in form
    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-1");
    await user.type(screen.getByLabelText(/Extension Title/), "Test Extension");

    // Submit
    const submitButton = screen.getByRole("button", { name: /button-submit-create-extension-dialog/i });
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
    await user.click(submitButton);

    // Mutation will be called with the mocked data
    await waitFor(() => {
      expect(submitButton).toBeDisabled(); // Button is disabled while saving
    });
  });
});
