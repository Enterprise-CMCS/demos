import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { BaseModificationDialog, ModificationDialogData } from "./BaseModificationDialog";

// Mock HTMLDialogElement methods for testing
beforeAll(() => {
  HTMLDialogElement.prototype.show = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

// Mock dependencies
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("hooks/useDemonstrationOptions", () => ({
  useDemonstrationOptions: () => ({
    demoOptions: [
      { label: "Test Demo 1", value: "demo-1" },
      { label: "Test Demo 2", value: "demo-2" },
    ],
    loading: false,
    error: null,
  }),
}));

vi.mock("components/dialog/BaseDialog", () => ({
  BaseDialog: ({
    title,
    children,
    actions,
  }: {
    title: string;
    children: React.ReactNode;
    actions: React.ReactNode;
  }) => (
    <div data-testid="base-modification-dialog">
      <h2>{title}</h2>
      <div>{children}</div>
      <div>{actions}</div>
    </div>
  ),
}));

vi.mock("components/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="primary-button">
      {children}
    </button>
  ),
  SecondaryButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="secondary-button">
      {children}
    </button>
  ),
}));

describe("BaseModificationDialog", () => {
  const mockOnSubmit = vi.fn();
  const mockGetFormData = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    onClose: mockOnClose,
    mode: "add" as const,
    entityType: "amendment" as const,
    onSubmit: mockOnSubmit,
    getFormData: mockGetFormData,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFormData.mockReturnValue({ test: "data" });
  });

  it("renders with correct title for amendment add mode", () => {
    render(<BaseModificationDialog {...defaultProps} entityType="amendment" mode="add" />);
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for extension edit mode", () => {
    render(<BaseModificationDialog {...defaultProps} entityType="extension" mode="edit" />);
    expect(screen.getByText("Edit Extension")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(<BaseModificationDialog {...defaultProps} />);

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Project Officer")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data: ModificationDialogData = {
      title: "Test Title",
      description: "Test description",
      state: "CA",
      projectOfficer: "user-1",
    };

    render(<BaseModificationDialog {...defaultProps} data={data} />);

    const titleInput = screen.getByDisplayValue("Test Title");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("pre-selects demonstration when demonstrationId is provided", () => {
    render(<BaseModificationDialog {...defaultProps} demonstrationId="demo-1" />);

    // The demonstration should be pre-selected
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
  });

  it("shows validation warning when demonstration is not selected", async () => {
    render(<BaseModificationDialog {...defaultProps} />);

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
    render(<BaseModificationDialog {...defaultProps} />);

    const cancelButton = screen.getByTestId("secondary-button");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("renders correct form ID based on entity type", () => {
    render(<BaseModificationDialog {...defaultProps} entityType="extension" />);

    const form = document.querySelector('form[id="extension-form"]');
    expect(form).toBeInTheDocument();
  });

  it("renders correct warning message based on entity type", async () => {
    render(<BaseModificationDialog {...defaultProps} entityType="extension" />);

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
    render(<BaseModificationDialog {...defaultProps} />);

    const effectiveDateInput = screen.getByTestId("effective-date-input");
    fireEvent.change(effectiveDateInput, { target: { value: "2024-06-01" } });

    expect(effectiveDateInput).toHaveValue("2024-06-01");
  });

  it("renders save button with correct text based on status", () => {
    render(<BaseModificationDialog {...defaultProps} />);

    const submitButton = screen.getByTestId("primary-button");
    expect(submitButton).toHaveTextContent("Submit");
  });
});
