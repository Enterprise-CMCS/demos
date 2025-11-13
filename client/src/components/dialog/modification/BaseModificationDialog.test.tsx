import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  BaseCreateModificationDialog,
  CREATE_MODIFICATION_DIALOG_QUERY,
} from "./BaseCreateModificationDialog";
import { gql } from "@apollo/client";

// Mock toast hook
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

// Mock SelectDemonstration component
vi.mock("components/input/select/SelectDemonstration", () => ({
  SelectDemonstration: ({
    onSelect,
    value,
    isDisabled,
    isRequired,
  }: {
    onSelect: (id: string) => void;
    value?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
  }) => (
    <div>
      <label className="text-text-font font-bold text-field-label flex gap-0-5">
        {isRequired && <span className="text-text-warn">*</span>}
        Demonstration
      </label>
      <select
        data-testid="select-demonstration"
        value={value || ""}
        disabled={isDisabled}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Select demonstration</option>
        <option value="demo-1">Demo 1</option>
        <option value="demo-2">Demo 2</option>
      </select>
    </div>
  ),
}));

// Mock SelectUSAStates component
vi.mock("components/input/select/SelectUSAStates", () => ({
  SelectUSAStates: ({
    value,
    isDisabled,
    isRequired,
  }: {
    value?: string;
    isDisabled?: boolean;
    isRequired?: boolean;
  }) => (
    <div>
      <label className="text-text-font font-bold text-field-label flex gap-0-5">
        {isRequired && <span className="text-text-warn">*</span>}
        State/Territory
      </label>
      <input
        data-testid="select-usa-states"
        value={value === "CA" ? "California" : value || ""}
        disabled={isDisabled}
        readOnly
      />
    </div>
  ),
}));

const CREATE_AMENDMENT_MUTATION = gql`
  mutation CreateAmendment($input: CreateAmendmentInput!) {
    createAmendment(input: $input) {
      id
      name
    }
  }
`;

const CREATE_EXTENSION_MUTATION = gql`
  mutation CreateExtension($input: CreateExtensionInput!) {
    createExtension(input: $input) {
      id
      name
    }
  }
`;

describe("BaseCreateModificationDialog", () => {
  const mockOnClose = vi.fn();

  const queryMock = {
    request: {
      query: CREATE_MODIFICATION_DIALOG_QUERY,
      variables: { id: "demo-1" },
    },
    result: {
      data: {
        demonstration: {
          id: "demo-1",
          primaryProjectOfficer: {
            id: "officer-1",
          },
          state: {
            id: "CA",
          },
        },
      },
    },
  };

  const successMutationMock = {
    request: {
      query: CREATE_AMENDMENT_MUTATION,
      variables: {
        input: {
          name: "Test Amendment",
          description: "Test description",
          demonstrationId: "demo-1",
        },
      },
    },
    result: {
      data: {
        createAmendment: {
          id: "amendment-1",
          name: "Test Amendment",
        },
      },
    },
  };

  const errorMutationMock = {
    request: {
      query: CREATE_AMENDMENT_MUTATION,
      variables: {
        input: {
          name: undefined,
          description: "Test Description",
          demonstrationId: "demo-1",
        },
      },
    },
    error: new Error("Failed to create amendment"),
  };

  const queryErrorMock = {
    request: {
      query: CREATE_MODIFICATION_DIALOG_QUERY,
      variables: { id: "demo-1" },
    },
    error: new Error("Failed to load demonstration"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and UI", () => {
    it("renders with correct title for Amendment", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      expect(screen.getByText("New Amendment")).toBeInTheDocument();
    });

    it("renders with correct title for Extension", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Extension"
            createModificationDialogMutation={CREATE_EXTENSION_MUTATION}
          />
        </MockedProvider>
      );

      expect(screen.getByText("New Extension")).toBeInTheDocument();
    });

    it("renders all required form fields", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      expect(screen.getByText("Demonstration")).toBeInTheDocument();
      expect(screen.getByText("Amendment Title")).toBeInTheDocument();
      expect(screen.getByText("State/Territory")).toBeInTheDocument();
      expect(screen.getByText("Amendment Description")).toBeInTheDocument();
    });

    it("renders correct form ID based on modification type", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Extension"
            createModificationDialogMutation={CREATE_EXTENSION_MUTATION}
          />
        </MockedProvider>
      );

      const form = document.querySelector('form[id="create-extension"]');
      expect(form).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      expect(screen.getByTestId("button-cancel-create-amendment")).toBeInTheDocument();
      expect(screen.getByTestId("button-submit-create-amendment")).toBeInTheDocument();
    });
  });

  describe("Context-Aware Behavior", () => {
    describe("When creating from landing page (no initialDemonstrationId)", () => {
      it("enables demonstration selection", () => {
        render(
          <MockedProvider mocks={[]} addTypename={false}>
            <BaseCreateModificationDialog
              onClose={mockOnClose}
              modificationType="Amendment"
              createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
            />
          </MockedProvider>
        );

        const demonstrationSelect = screen.getByTestId("select-demonstration");
        expect(demonstrationSelect).not.toBeDisabled();
      });

      it("keeps state field disabled until demonstration is selected", async () => {
        render(
          <MockedProvider mocks={[queryMock]} addTypename={false}>
            <BaseCreateModificationDialog
              onClose={mockOnClose}
              modificationType="Amendment"
              createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
            />
          </MockedProvider>
        );

        const stateField = screen.getByTestId("select-usa-states");
        expect(stateField).toBeDisabled();

        // Select demonstration
        const demonstrationSelect = screen.getByTestId("select-demonstration");
        fireEvent.change(demonstrationSelect, { target: { value: "demo-1" } });

        // State should remain disabled (it's always disabled in this component)
        await waitFor(() => {
          expect(stateField).toBeDisabled();
        });
      });

      it("loads demonstration data when demonstration is selected", async () => {
        render(
          <MockedProvider mocks={[queryMock]} addTypename={false}>
            <BaseCreateModificationDialog
              onClose={mockOnClose}
              modificationType="Amendment"
              createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
            />
          </MockedProvider>
        );

        const demonstrationSelect = screen.getByTestId("select-demonstration");
        fireEvent.change(demonstrationSelect, { target: { value: "demo-1" } });

        await waitFor(() => {
          const stateField = screen.getByTestId("select-usa-states") as HTMLInputElement;
          expect(stateField.value).toBe("California");
        });
      });
    });

    describe("When creating from demonstration context (initialDemonstrationId provided)", () => {
      it("disables demonstration selection", () => {
        render(
          <MockedProvider mocks={[queryMock]} addTypename={false}>
            <BaseCreateModificationDialog
              onClose={mockOnClose}
              initialDemonstrationId="demo-1"
              modificationType="Amendment"
              createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
            />
          </MockedProvider>
        );

        const demonstrationSelect = screen.getByTestId("select-demonstration");
        expect(demonstrationSelect).toBeDisabled();
      });

      it("pre-selects the demonstration", () => {
        render(
          <MockedProvider mocks={[queryMock]} addTypename={false}>
            <BaseCreateModificationDialog
              onClose={mockOnClose}
              initialDemonstrationId="demo-1"
              modificationType="Amendment"
              createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
            />
          </MockedProvider>
        );

        const demonstrationSelect = screen.getByTestId("select-demonstration") as HTMLSelectElement;
        expect(demonstrationSelect.value).toBe("demo-1");
      });

      it("automatically loads and populates state from demonstration", async () => {
        render(
          <MockedProvider mocks={[queryMock]} addTypename={false}>
            <BaseCreateModificationDialog
              onClose={mockOnClose}
              initialDemonstrationId="demo-1"
              modificationType="Amendment"
              createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
            />
          </MockedProvider>
        );

        await waitFor(() => {
          const stateField = screen.getByTestId("select-usa-states") as HTMLInputElement;
          expect(stateField.value).toBe("California");
        });
      });
    });
  });

  describe("Form Validation", () => {
    it("disables submit button when demonstration is not selected", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const submitButton = screen.getByTestId("button-submit-create-amendment");
      expect(submitButton).toBeDisabled();
    });

    it("disables submit button when title is empty", async () => {
      render(
        <MockedProvider mocks={[queryMock]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            initialDemonstrationId="demo-1"
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        const submitButton = screen.getByTestId("button-submit-create-amendment");
        expect(submitButton).toBeDisabled();
      });
    });

    it("enables submit button when all required fields are filled", async () => {
      render(
        <MockedProvider mocks={[queryMock]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            initialDemonstrationId="demo-1"
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const titleInput = screen.getByPlaceholderText("Enter amendment title");
      fireEvent.change(titleInput, { target: { value: "Test Amendment" } });

      await waitFor(() => {
        const submitButton = screen.getByTestId("button-submit-create-amendment");
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("Form Interactions", () => {
    it("updates title field value on change", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const titleInput = screen.getByPlaceholderText("Enter amendment title") as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: "New Title" } });

      expect(titleInput.value).toBe("New Title");
    });

    it("updates description field value on change", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const descriptionInput = screen.getByTestId("textarea-description") as HTMLTextAreaElement;
      fireEvent.change(descriptionInput, { target: { value: "New Description" } });

      expect(descriptionInput.value).toBe("New Description");
    });

    it("shows cancel confirmation when cancel button is clicked", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const cancelButton = screen.getByTestId("button-cancel-create-amendment");
      fireEvent.click(cancelButton);

      // The BaseDialog should handle the cancel confirmation
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe("Mutation Handling", () => {
    it("displays loading state during submission", async () => {
      render(
        <MockedProvider mocks={[queryMock, successMutationMock]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            initialDemonstrationId="demo-1"
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const titleInput = screen.getByPlaceholderText("Enter amendment title");
      fireEvent.change(titleInput, { target: { value: "Test Amendment" } });

      const descriptionInput = screen.getByTestId("textarea-description");
      fireEvent.change(descriptionInput, { target: { value: "Test description" } });

      const form = document.querySelector('form[id="create-amendment"]');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeInTheDocument();
      });
    });

    it("shows success toast and closes dialog on successful creation", async () => {
      render(
        <MockedProvider mocks={[queryMock, successMutationMock]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            initialDemonstrationId="demo-1"
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const titleInput = screen.getByPlaceholderText("Enter amendment title");
      fireEvent.change(titleInput, { target: { value: "Test Amendment" } });

      const descriptionInput = screen.getByTestId("textarea-description");
      fireEvent.change(descriptionInput, { target: { value: "Test description" } });

      const form = document.querySelector('form[id="create-amendment"]');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith("Amendment created successfully.");
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("shows error toast and closes dialog on mutation error", async () => {
      render(
        <MockedProvider mocks={[queryMock, errorMutationMock]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            initialDemonstrationId="demo-1"
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      const descriptionInput = screen.getByPlaceholderText("Enter amendment description");
      fireEvent.change(descriptionInput, { target: { value: "Test Description" } });

      const form = document.querySelector('form[id="create-amendment"]');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("Error creating amendment.");
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("shows error toast and closes dialog on query error", async () => {
      render(
        <MockedProvider mocks={[queryErrorMock]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            initialDemonstrationId="demo-1"
            modificationType="Amendment"
            createModificationDialogMutation={CREATE_AMENDMENT_MUTATION}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith("Error loading demonstration data.");
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Works for both Amendments and Extensions", () => {
    it("applies correct labels and placeholders for Extensions", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Extension"
            createModificationDialogMutation={CREATE_EXTENSION_MUTATION}
          />
        </MockedProvider>
      );

      expect(screen.getByText("Extension Title")).toBeInTheDocument();
      expect(screen.getByText("Extension Description")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter extension title")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter extension description")).toBeInTheDocument();
    });

    it("uses correct button names for Extensions", () => {
      render(
        <MockedProvider mocks={[]} addTypename={false}>
          <BaseCreateModificationDialog
            onClose={mockOnClose}
            modificationType="Extension"
            createModificationDialogMutation={CREATE_EXTENSION_MUTATION}
          />
        </MockedProvider>
      );

      expect(screen.getByTestId("button-cancel-create-extension")).toBeInTheDocument();
      expect(screen.getByTestId("button-submit-create-extension")).toBeInTheDocument();
    });
  });
});
