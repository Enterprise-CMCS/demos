import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplyDemonstrationTypesDialog } from "./ApplyDemonstrationTypesDialog";
import type { DemonstrationType } from "./ApplyDemonstrationTypesDialog";

// Mock dependencies
const mockCloseDialog = vi.fn();
const mockShowSuccess = vi.fn();

vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
  }),
}));

vi.mock("../BaseDialog", () => ({
  BaseDialog: ({
    title,
    children,
    actionButton,
    dialogHasChanges,
  }: {
    title: string;
    children: React.ReactNode;
    actionButton: React.ReactNode;
    dialogHasChanges: boolean;
  }) => (
    <div data-testid="base-dialog">
      <h1>{title}</h1>
      <div data-testid="dialog-has-changes">{String(dialogHasChanges)}</div>
      <div data-testid="dialog-content">{children}</div>
      <div data-testid="dialog-actions">{actionButton}</div>
    </div>
  ),
}));

vi.mock("components/button/SubmitButton", () => ({
  SubmitButton: ({
    disabled,
    isSubmitting,
    onClick,
    name,
  }: {
    disabled: boolean;
    isSubmitting: boolean;
    onClick: () => void;
    name: string;
  }) => (
    <button data-testid={name} disabled={disabled} onClick={onClick} aria-busy={isSubmitting}>
      Submit
    </button>
  ),
}));

vi.mock("./DemonstrationTypesList", () => ({
  DemonstrationTypesList: ({
    demonstrationTypes,
    removeDemonstrationType,
  }: {
    demonstrationTypes: DemonstrationType[];
    removeDemonstrationType: (tag: string) => void;
  }) => (
    <div data-testid="demonstration-types-list">
      <p>List Count: {demonstrationTypes.length}</p>
      {demonstrationTypes.map((type, index) => (
        <div key={index} data-testid={`list-item-${index}`}>
          <span>{type.tag}</span>
          <button onClick={() => removeDemonstrationType(type.tag)}>Remove {type.tag}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("./AddDemonstrationTypesForm", () => ({
  AddDemonstrationTypesForm: ({
    demonstrationTypes,
    addDemonstrationType,
  }: {
    demonstrationTypes: DemonstrationType[];
    addDemonstrationType: (type: DemonstrationType) => void;
  }) => (
    <div data-testid="add-demonstration-types-form">
      <p>Form knows about {demonstrationTypes?.length || []} existing types</p>
      <button
        onClick={() =>
          addDemonstrationType({
            tag: "New Type",
            effectiveDate: "2024-06-01",
            expirationDate: "2024-12-31",
          })
        }
      >
        Add New Type
      </button>
    </div>
  ),
}));

// TODO: many of these tests are reliant on the hardcoded data returned by the mock query fetching.
// Upon integration, they will need to be updated
describe("ApplyDemonstrationTypesDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dialog with correct title", () => {
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    expect(screen.getByRole("heading", { name: "Apply Type(s)" })).toBeInTheDocument();
  });

  it("initializes with existing demonstration types from data", () => {
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    // The mock data has 2 initial types (Type A and Type B)
    expect(screen.getByText("List Count: 2")).toBeInTheDocument();
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
  });

  it("renders all child components", () => {
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    expect(screen.getByTestId("add-demonstration-types-form")).toBeInTheDocument();
    expect(screen.getByTestId("demonstration-types-list")).toBeInTheDocument();
    expect(screen.getByTestId("button-submit-demonstration-dialog")).toBeInTheDocument();
  });

  it("has submit button disabled initially when no changes", () => {
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();
  });

  it("reports no changes initially", () => {
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    expect(screen.getByTestId("dialog-has-changes")).toHaveTextContent("false");
  });

  it("enables submit button when a new type is added", async () => {
    const user = userEvent.setup();
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();

    // Add a new type
    await user.click(screen.getByText("Add New Type"));

    expect(submitButton).toBeEnabled();
    expect(screen.getByTestId("dialog-has-changes")).toHaveTextContent("true");
  });

  it("enables submit button when a type is removed", async () => {
    const user = userEvent.setup();
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();

    // Remove Type A
    await user.click(screen.getByText("Remove Type A"));

    expect(submitButton).toBeEnabled();
    expect(screen.getByTestId("dialog-has-changes")).toHaveTextContent("true");
  });

  it("adds new types to the list", async () => {
    const user = userEvent.setup();
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    expect(screen.getByText("List Count: 2")).toBeInTheDocument();

    await user.click(screen.getByText("Add New Type"));

    expect(screen.getByText("List Count: 3")).toBeInTheDocument();
    expect(screen.getByText("New Type")).toBeInTheDocument();
  });

  it("removes types from the list", async () => {
    const user = userEvent.setup();
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    expect(screen.getByText("List Count: 2")).toBeInTheDocument();
    expect(screen.getByText("Type A")).toBeInTheDocument();

    await user.click(screen.getByText("Remove Type A"));

    expect(screen.getByText("List Count: 1")).toBeInTheDocument();
    expect(screen.queryByText("Type A")).not.toBeInTheDocument();
  });

  it("calls showSuccess and closeDialog on submit", async () => {
    const user = userEvent.setup();
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    // Add a type to enable submit
    await user.click(screen.getByText("Add New Type"));

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    await user.click(submitButton);

    expect(mockShowSuccess).toHaveBeenCalledWith("Demonstration types applied successfully.");
    expect(mockCloseDialog).toHaveBeenCalledTimes(1);
  });

  it("passes current demonstration types to AddDemonstrationTypesForm", () => {
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    // The form should know about the 2 initial types
    waitFor(() =>
      expect(screen.getByText("Form knows about 2 existing types")).toBeInTheDocument()
    );
  });

  it("detects changes when adding and removing result in same count", async () => {
    const user = userEvent.setup();
    render(<ApplyDemonstrationTypesDialog demonstrationId="demo-123" />);

    // Initial: Type A, Type B (count: 2)
    expect(screen.getByTestId("dialog-has-changes")).toHaveTextContent("false");

    // Remove Type A (count: 1)
    await user.click(screen.getByText("Remove Type A"));
    expect(screen.getByTestId("dialog-has-changes")).toHaveTextContent("true");

    // Add New Type (count: 2 again, but different content)
    await user.click(screen.getByText("Add New Type"));
    expect(screen.getByTestId("dialog-has-changes")).toHaveTextContent("true");

    // Even though count is same, content changed so hasChanges should be true
    expect(screen.getByText("List Count: 2")).toBeInTheDocument();
  });
});
