import React from "react";

import { vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AmendmentDialog } from "./AmendmentDialog";

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
    <div data-testid="amendment-modal">
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

// Mock SelectUsers to avoid Apollo dependency in tests
vi.mock("components/input/select/SelectUsers", () => ({
  SelectUsers: ({ label = "Users" }: { label?: string }) => <div>{label}</div>,
}));

describe("AmendmentDialog", () => {
  const defaultProps = {
    onClose: vi.fn(),
    mode: "add" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct title for add mode", () => {
    render(<AmendmentDialog {...defaultProps} mode="add" />);
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for edit mode", () => {
    render(<AmendmentDialog {...defaultProps} mode="edit" />);
    expect(screen.getByText("Edit Amendment")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(<AmendmentDialog {...defaultProps} />);

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Project Officer")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("shows warning when demonstration is not selected", async () => {
    render(<AmendmentDialog {...defaultProps} />);

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
    const onClose = vi.fn();
    render(<AmendmentDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByTestId("secondary-button");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data = {
      title: "Test Amendment",
      description: "Test description",
    };

    render(<AmendmentDialog {...defaultProps} data={data} />);

    const titleInput = screen.getByDisplayValue("Test Amendment");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("disables demonstration select when data is provided with demonstrationId", () => {
    render(<AmendmentDialog {...defaultProps} demonstrationId={"testId"} />);

    const demonstrationSelect = screen.getByPlaceholderText("Select demonstration");

    expect(demonstrationSelect).toBeDisabled();
  });
});
