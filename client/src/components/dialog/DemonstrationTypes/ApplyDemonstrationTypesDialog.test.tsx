import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApplyDemonstrationTypesDialog,
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
} from "./ApplyDemonstrationTypesDialog";
import type { Demonstration } from "./ApplyDemonstrationTypesDialog";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationTypeName";

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

const mockDemonstrationTypes = [
  {
    demonstrationTypeName: "Type A",
    effectiveDate: "2024-01-01",
    expirationDate: "2025-01-01",
  },
  {
    demonstrationTypeName: "Type B",
    effectiveDate: "2024-01-02",
    expirationDate: "2025-01-02",
  },
  {
    demonstrationTypeName: "Type C",
    effectiveDate: "2024-01-03",
    expirationDate: "2025-01-03",
  },
];
const mockDemonstrationTypeNames = ["Type A", "Type B", "Type C", "Type D"];
const mockDemonstrationId = "demo-123";
const mockDemonstration: Demonstration = {
  id: mockDemonstrationId,
  demonstrationTypes: mockDemonstrationTypes,
};
const mockApplyDemonstrationTypesDialogQuery: MockedResponse = {
  request: {
    query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
    variables: { id: mockDemonstrationId },
  },
  result: {
    data: {
      demonstration: mockDemonstration,
    },
  },
};

const mockSelectDemonstrationTypeQuery: MockedResponse = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypes: mockDemonstrationTypeNames,
    },
  },
};

describe("ApplyDemonstrationTypesDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = async () => {
    const result = render(
      <MockedProvider
        mocks={[mockApplyDemonstrationTypesDialogQuery, mockSelectDemonstrationTypeQuery]}
      >
        <ApplyDemonstrationTypesDialog demonstrationId={mockDemonstrationId} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Demonstration Type")).toBeInTheDocument();
    });

    return result;
  };

  async function addDemonstrationTypeD(user: UserEvent) {
    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(screen.getByText("Type D"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-04");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-04");
    await user.click(screen.getByTestId("button-add-demonstration-type"));
  }

  async function removeDemonstrationTypeA(user: UserEvent) {
    const typeAItem = screen.getByText("Type A").closest("li");
    const removeTypeAButton = within(typeAItem!).getByRole("button", { name: /delete/i });
    await user.click(removeTypeAButton);
  }

  it("renders dialog with correct title", () => {
    renderWithProvider();
    expect(screen.getByRole("heading", { name: "Apply Type(s)" })).toBeInTheDocument();
  });

  it("initializes with existing demonstration types from data", async () => {
    await renderWithProvider();

    expect(screen.getByText("Types to be added (3)")).toBeInTheDocument();
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
  });

  it("has submit button disabled initially when no changes", () => {
    renderWithProvider();

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when a new type is added", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(screen.getByText("Type D"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(submitButton).toBeEnabled();
  });

  it("enables submit button when a type is removed", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();

    await removeDemonstrationTypeA(user);
    expect(submitButton).toBeEnabled();
  });

  it("adds new types to the list", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    expect(screen.getByText("Types to be added (3)")).toBeInTheDocument();
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();

    await addDemonstrationTypeD(user);

    expect(screen.getByText("Types to be added (4)")).toBeInTheDocument();
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
    expect(screen.getByText("Type D")).toBeInTheDocument();
    expect(screen.getByText(/effective: 01\/04\/2024/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 01\/04\/2025/i)).toBeInTheDocument();
  });

  it("removes types from the list", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    expect(screen.getByText("Types to be added (3)")).toBeInTheDocument();
    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();

    await removeDemonstrationTypeA(user);

    expect(screen.getByText("Types to be added (2)")).toBeInTheDocument();
    expect(screen.queryByText("Type A")).not.toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
  });

  it("calls showSuccess and closeDialog on submit", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    await addDemonstrationTypeD(user);

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    await user.click(submitButton);

    expect(mockShowSuccess).toHaveBeenCalledWith("Demonstration types applied successfully.");
    expect(mockCloseDialog).toHaveBeenCalledTimes(1);
  });

  it("detects changes when adding and removing result in same count", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();
    expect(screen.getByText("Types to be added (3)")).toBeInTheDocument();

    await removeDemonstrationTypeA(user);

    expect(submitButton).toBeEnabled();
    expect(screen.getByText("Types to be added (2)")).toBeInTheDocument();

    await addDemonstrationTypeD(user);

    expect(submitButton).toBeEnabled();
    expect(screen.getByText("Types to be added (3)")).toBeInTheDocument();
  });
});
