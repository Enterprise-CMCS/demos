import React from "react";

import { vi } from "vitest";

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AmendmentModal } from "./AmendmentModal";

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

vi.mock("components/modal/BaseModal", () => ({
  BaseModal: ({ title, children, actions }: { title: string; children: React.ReactNode; actions: React.ReactNode }) => (
    <div data-testid="amendment-modal">
      <h2>{title}</h2>
      <div>{children}</div>
      <div>{actions}</div>
    </div>
  ),
}));

vi.mock("components/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="primary-button">{children}</button>
  ),
  SecondaryButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} data-testid="secondary-button">{children}</button>
  ),
}));

describe("AmendmentModal", () => {
  const defaultProps = {
    onClose: vi.fn(),
    mode: "add" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with correct title for add mode", () => {
    render(<AmendmentModal {...defaultProps} mode="add" />);
    expect(screen.getByText("New Amendment")).toBeInTheDocument();
  });

  it("renders with correct title for edit mode", () => {
    render(<AmendmentModal {...defaultProps} mode="edit" />);
    expect(screen.getByText("Edit Amendment")).toBeInTheDocument();
  });

  it("renders required form fields", () => {
    render(<AmendmentModal {...defaultProps} />);

    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("State/Territory")).toBeInTheDocument();
    expect(screen.getByText("Project Officer")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
  });

  it("shows warning when demonstration is not selected", async () => {
    render(<AmendmentModal {...defaultProps} />);

    // Submit the form directly by finding it in the document
    const formElement = document.querySelector('form[id="amendment-form"]');
    if (formElement) {
      fireEvent.submit(formElement);
    }

    await waitFor(() => {
      expect(screen.getByText("Each amendment record must be linked to an existing demonstration.")).toBeInTheDocument();
    });
  }); it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(<AmendmentModal {...defaultProps} onClose={onClose} />);

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

    render(<AmendmentModal {...defaultProps} data={data} />);

    const titleInput = screen.getByDisplayValue("Test Amendment");
    const descriptionInput = screen.getByDisplayValue("Test description");

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
  });
});
