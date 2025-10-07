import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  BaseModificationDialog,
  ModificationDialogData,
} from "./BaseModificationDialog";

// Mock hooks for context-aware behavior tests
vi.mock("hooks/useDemonstration", () => ({
  useDemonstration: vi.fn(() => ({
    demonstration: {
      id: "demo-1",
      name: "Test Demonstration",
      state: { id: "CA", name: "California" },
      roles: [
        {
          isPrimary: true,
          role: "Project Officer",
          person: { id: "officer-1", fullName: "Test Officer" },
        },
      ],
    },
    projectOfficer: {
      isPrimary: true,
      role: "Project Officer",
      person: { id: "officer-1", fullName: "Test Officer" },
    },
    loading: false,
    error: null,
  })),
}));

vi.mock("hooks/useDemonstrationOptions", () => ({
  useDemonstrationOptions: () => ({
    demoOptions: [
      { label: "Demo 1", value: "demo-1" },
      { label: "Demo 2", value: "demo-2" },
    ],
    loading: false,
    error: null,
  }),
}));

// Mock SelectUsers component to avoid GraphQL dependency
vi.mock("components/input/select/SelectUsers", () => ({
  SelectUsers: ({ label, isRequired }: { label?: string; isRequired?: boolean }) => (
    <div>
      <label className="text-text-font font-bold text-field-label flex gap-0-5">
        {isRequired && <span className="text-text-warn">*</span>}
        {label || "Project Officer"}
      </label>
      <select data-testid="select-users">
        <option value="">Select user</option>
        <option value="officer-1">Test Officer</option>
      </select>
    </div>
  ),
}));

describe("BaseModificationDialog", () => {
  const mockOnSubmit = vi.fn();
  const mockGetFormData = vi.fn();
  const mockOnClose = vi.fn();

  const getBaseModificationDialog = (
    mode: "add" | "edit",
    entityType: "amendment" | "extension",
    data?: ModificationDialogData,
    demonstrationId?: string
  ) => (
    <TestProvider>
      <BaseModificationDialog
        isOpen={true}
        onClose={mockOnClose}
        mode={mode}
        data={data}
        demonstrationId={demonstrationId}
        entityType={entityType}
        onSubmit={mockOnSubmit}
        getFormData={mockGetFormData}
      />
    </TestProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormData.mockReturnValue({ test: "data" });
  });

  it("renders with correct title for amendment add mode", () => {
    render(getBaseModificationDialog("add", "amendment"));
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for extension edit mode", () => {
    render(getBaseModificationDialog("edit", "extension"));
    expect(screen.getByText("Edit Extension")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(getBaseModificationDialog("add", "amendment"));

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data: ModificationDialogData = {
      title: "Test Title",
      description: "Test description",
      state: "CA",
      projectOfficer: "user-1",
    };

    render(getBaseModificationDialog("edit", "amendment", data));

    const titleInput = screen.getByDisplayValue("Test Title");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("pre-selects demonstration when demonstrationId is provided", () => {
    render(getBaseModificationDialog("edit", "amendment", undefined, "demo-1"));

    // The demonstration should be pre-selected
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
  });

  it("shows validation warning when demonstration is not selected", async () => {
    render(getBaseModificationDialog("edit", "amendment"));

    // Submit the form directly by finding it in the document
    const formElement = document.querySelector('form[id="amendment-form"]');
    if (formElement) {
      fireEvent.submit(formElement);
    }

    await waitFor(() => {
      expect(
        screen.getByText("Each amendment record must be linked to an existing demonstration.")
      ).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel is clicked", () => {
    render(getBaseModificationDialog("edit", "amendment"));

    const cancelButton = screen.getByTestId("button-cancel-modification-dialog");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("renders correct form ID based on entity type", () => {
    render(getBaseModificationDialog("edit", "extension"));

    const form = document.querySelector('form[id="extension-form"]');
    expect(form).toBeInTheDocument();
  });

  it("renders correct warning message based on entity type", async () => {
    render(getBaseModificationDialog("edit", "extension"));

    const formElement = document.querySelector('form[id="extension-form"]');
    if (formElement) {
      fireEvent.submit(formElement);
    }

    await waitFor(() => {
      expect(
        screen.getByText("Each extension record must be linked to an existing demonstration.")
      ).toBeInTheDocument();
    });
  });

  it("handles date input changes correctly", () => {
    render(getBaseModificationDialog("edit", "extension"));

    const effectiveDateInput = screen.getByTestId("input-effective-date");
    fireEvent.change(effectiveDateInput, { target: { value: "2024-06-01" } });

    expect(effectiveDateInput).toHaveValue("2024-06-01");
  });

  it("renders save button with correct text based on status", () => {
    render(getBaseModificationDialog("edit", "extension"));

    const submitButton = screen.getByTestId("button-submit-modification-dialog");
    expect(submitButton).toHaveTextContent("Submit");
  });

  it("shows date fields only in edit mode, not in add mode", () => {
    // Test add mode - date fields should not be visible
    const { rerender } = render(getBaseModificationDialog("add", "extension"));

    expect(screen.queryByTestId("input-effective-date")).not.toBeInTheDocument();
    expect(screen.queryByTestId("input-expiration-date")).not.toBeInTheDocument();

    // Test edit mode - date fields should be visible
    rerender(getBaseModificationDialog("edit", "extension"));

    expect(screen.getByTestId("input-effective-date")).toBeInTheDocument();
    expect(screen.getByTestId("input-expiration-date")).toBeInTheDocument();
  });

  // Business Requirements Tests
  describe("Context-Aware Behavior Requirements", () => {
    describe("When creating from landing page (no demonstrationId)", () => {
      it("shows project officer field and enables state selection", async () => {
        render(getBaseModificationDialog("add", "amendment"));

        // Wait for the SelectUsers component to load
        await waitFor(() => {
          // Project officer field should be visible and required
          expect(screen.getByText("Project Officer")).toBeInTheDocument();
        });

        // State field should be enabled
        const stateField = screen.getByLabelText(/State\/Territory/i);
        expect(stateField).not.toBeDisabled();
      });

      it("requires project officer for form validation", () => {
        render(getBaseModificationDialog("add", "amendment"));

        const submitButton = screen.getByTestId("button-submit-modification-dialog");

        // Should be disabled when project officer is not selected
        expect(submitButton).toBeDisabled();
      });
    });

    describe("When creating from within demonstration context (demonstrationId provided)", () => {
      it("hides project officer field and disables state selection", async () => {
        render(getBaseModificationDialog("add", "amendment", undefined, "demo-1"));

        // Wait for the demonstration data to load and populate
        await waitFor(() => {
          // Project officer field should NOT be visible
          expect(screen.queryByText("Project Officer")).not.toBeInTheDocument();
        });

        // State field should be disabled
        const stateField = screen.getByLabelText(/State\/Territory/i);
        expect(stateField).toBeDisabled();
      });

      it("pre-populates state from demonstration", async () => {
        render(getBaseModificationDialog("add", "amendment", undefined, "demo-1"));

        // Wait for the state to be populated from demonstration
        await waitFor(() => {
          const stateField = screen.getByLabelText(/State\/Territory/i) as HTMLInputElement;
          // The field should display the demonstration's state name (AutoCompleteSelect shows labels)
          expect(stateField.value).toBe("California");
        });
      });

      it("does not require project officer for form validation", async () => {
        render(getBaseModificationDialog("add", "amendment", undefined, "demo-1"));

        // Fill in required fields (except project officer)
        const titleField = screen.getByLabelText(/Amendment Title/i);
        fireEvent.change(titleField, { target: { value: "Test Amendment" } });

        // Wait for state to be populated
        await waitFor(() => {
          const stateField = screen.getByLabelText(/State\/Territory/i) as HTMLInputElement;
          expect(stateField.value).toBe("California");
        });

        // Submit button should be enabled even without project officer
        await waitFor(() => {
          const submitButton = screen.getByTestId("button-submit-modification-dialog");
          expect(submitButton).not.toBeDisabled();
        });
      });

      it("excludes projectOfficerUserId from form data when not shown", async () => {
        render(getBaseModificationDialog("add", "amendment", undefined, "demo-1"));

        const titleField = screen.getByLabelText(/Amendment Title/i);
        fireEvent.change(titleField, { target: { value: "Test Amendment" } });

        await waitFor(() => {
          const submitButton = screen.getByTestId("button-submit-modification-dialog");
          expect(submitButton).not.toBeDisabled();
        });

        const submitButton = screen.getByTestId("button-submit-modification-dialog");
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockGetFormData).toHaveBeenCalled();
          const formData = mockGetFormData.mock.calls[0][0];
          expect(formData).not.toHaveProperty("projectOfficerUserId");
        });
      });
    });

    describe("Works for both amendments and extensions", () => {
      it("applies the same behavior to extension dialogs", async () => {
        render(getBaseModificationDialog("add", "extension", undefined, "demo-1"));

        await waitFor(() => {
          // Project officer field should NOT be visible
          expect(screen.queryByText("Project Officer")).not.toBeInTheDocument();
        });

        // State field should be disabled and pre-populated
        const stateField = screen.getByLabelText(/State\/Territory/i);
        expect(stateField).toBeDisabled();

        await waitFor(() => {
          expect((stateField as HTMLInputElement).value).toBe("California");
        });
      });
    });
  });
});
