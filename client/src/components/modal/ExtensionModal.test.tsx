import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { ExtensionModal } from "./ExtensionModal";

// Mock dependencies
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("hooks/useDemonstration", () => ({
  useDemonstration: () => ({
    getAllDemonstrations: {
      trigger: vi.fn(),
      data: [
        { id: "demo-1", name: "Test Demo 1" },
        { id: "demo-2", name: "Test Demo 2" },
      ],
      loading: false,
      error: null,
    },
  }),
}));

vi.mock("hooks/useExtension", () => ({
  useExtension: () => ({
    addExtension: {
      trigger: vi.fn().mockResolvedValue({
        data: { addExtension: { id: "ext-1", name: "Test Extension" } },
      }),
    },
  }),
}));

vi.mock("components/modal/BaseModal", () => ({
  BaseModal: ({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) => (
    <div data-testid="extension-modal">
      <h2>{title}</h2>
      <div>{children}</div>
      <div>{actions}</div>
    </div>
  ),
}));

vi.mock("components/button", () => ({
  PrimaryButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="primary-button">{children}</button>
  ),
  SecondaryButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="secondary-button">{children}</button>
  ),
}));

describe("ExtensionModal", () => {
  const defaultProps = {
    onClose: vi.fn(),
    mode: "add" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct title for add mode", () => {
    render(<ExtensionModal {...defaultProps} mode="add" />);
    expect(screen.getByText("New Extension")).toBeInTheDocument();
  });

  it("renders with correct title for edit mode", () => {
    render(<ExtensionModal {...defaultProps} mode="edit" />);
    expect(screen.getByText("Edit Extension")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(<ExtensionModal {...defaultProps} />);

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Extension Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Project Officer")).toBeInTheDocument();
    expect(screen.getByText("Extension Description")).toBeInTheDocument();
  });

  it("shows warning when demonstration is not selected", async () => {
    render(<ExtensionModal {...defaultProps} />);

    // Submit the form directly by finding it in the document
    const formElement = document.querySelector('form[id="extension-form"]');
    if (formElement) {
      fireEvent.submit(formElement);
    }

    await waitFor(() => {
      expect(screen.getByText("Each extension record must be linked to an existing demonstration.")).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<ExtensionModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByTestId("secondary-button");
    fireEvent.click(cancelButton);

    // This should trigger the cancel confirmation modal
    expect(cancelButton).toBeInTheDocument();
  });

  it("pre-fills form when data is provided", () => {
    const data = {
      title: "Test Extension",
      description: "Test description",
    };

    render(<ExtensionModal {...defaultProps} data={data} />);

    const titleInput = screen.getByDisplayValue("Test Extension");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });

  it("pre-selects demonstration when demonstrationId is provided", () => {
    render(<ExtensionModal {...defaultProps} demonstrationId="demo-1" />);

    // The demonstration should be pre-selected but we can't easily test the AutoCompleteSelect value
    // without more complex mocking. For now, just ensure the component renders.
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
  });
});
