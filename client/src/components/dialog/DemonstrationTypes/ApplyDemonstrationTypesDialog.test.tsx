import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent, { UserEvent } from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplyDemonstrationTypesDialog } from "./ApplyDemonstrationTypesDialog";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationTypeName";
import {
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
  Demonstration,
  DemonstrationType,
} from "./useApplyDemonstrationTypesDialogData";
import { DemonstrationTypeInput, Tag as DemonstrationTypeName, LocalDate } from "demos-server";

const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();
vi.mock("components/toast", () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

const mockCloseDialog = vi.fn();
vi.mock("../DialogContext", () => ({
  useDialog: () => ({
    closeDialog: mockCloseDialog,
  }),
}));

const MOCK_DEMONSTRATION_ID: string = "demo-123";
const MOCK_DEMONSTRATION_TYPE_NAMES: DemonstrationTypeName[] = [
  "Type A",
  "Type B",
  "Type C",
  "Type D",
];
const MOCK_DEMONSTRATION_TYPE_A: DemonstrationType = {
  demonstrationTypeName: "Type A",
  effectiveDate: "2024-01-01",
  expirationDate: "2024-12-31",
};
const MOCK_DEMONSTRATION_TYPE_B: DemonstrationType = {
  demonstrationTypeName: "Type B",
  effectiveDate: "2024-02-01",
  expirationDate: "2024-11-30",
};
const MOCK_DEMONSTRATION_TYPE_C: DemonstrationType = {
  demonstrationTypeName: "Type C",
  effectiveDate: "2024-03-01",
  expirationDate: "2024-10-31",
};
const MOCK_DEMONSTRATION_TYPE_D: DemonstrationType = {
  demonstrationTypeName: "Type D",
  effectiveDate: "2024-01-04",
  expirationDate: "2025-01-04",
};

const mockInitialDemonstration: Demonstration = {
  id: MOCK_DEMONSTRATION_ID,
  status: "Pre-Submission",
  demonstrationTypes: [
    MOCK_DEMONSTRATION_TYPE_A,
    MOCK_DEMONSTRATION_TYPE_B,
    MOCK_DEMONSTRATION_TYPE_C,
  ],
};

const mockDemonstrationTypesInput: DemonstrationTypeInput[] = [
  MOCK_DEMONSTRATION_TYPE_A,
  MOCK_DEMONSTRATION_TYPE_B,
  MOCK_DEMONSTRATION_TYPE_C,
  MOCK_DEMONSTRATION_TYPE_D,
].map((demonstrationType) => ({
  demonstrationTypeName: demonstrationType.demonstrationTypeName,
  demonstrationTypeDates: {
    effectiveDate: demonstrationType.effectiveDate as LocalDate,
    expirationDate: demonstrationType.expirationDate as LocalDate,
  },
}));

const selectDemonstrationTypeQueryMock: MockedResponse = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypeNames: MOCK_DEMONSTRATION_TYPE_NAMES,
    },
  },
};
const applyDemonstrationTypesDialogQueryMock: MockedResponse<{
  demonstration: Demonstration;
}> = {
  request: {
    query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
    variables: { id: MOCK_DEMONSTRATION_ID },
  },
  result: {
    data: {
      demonstration: mockInitialDemonstration,
    },
  },
};
const assignDemonstrationTypesDialogMutationMock: MockedResponse<{
  setDemonstrationTypes: Demonstration;
}> = {
  request: {
    query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
    variables: {
      input: {
        demonstrationId: MOCK_DEMONSTRATION_ID,
        demonstrationTypes: mockDemonstrationTypesInput,
      },
    },
  },
  result: {
    data: {
      setDemonstrationTypes: {
        ...mockInitialDemonstration,
        demonstrationTypes: [
          MOCK_DEMONSTRATION_TYPE_A,
          MOCK_DEMONSTRATION_TYPE_B,
          MOCK_DEMONSTRATION_TYPE_C,
          MOCK_DEMONSTRATION_TYPE_D,
        ],
      },
    },
  },
};
const assignDemonstrationTypesDialogMutationErrorMock: MockedResponse<{
  setDemonstrationTypes: Demonstration;
}> = {
  request: {
    query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
    variables: {
      input: {
        demonstrationId: MOCK_DEMONSTRATION_ID,
        demonstrationTypes: mockDemonstrationTypesInput,
      },
    },
  },
  result: {
    errors: [new Error("Failed to assign demonstration types.")],
  },
};
describe("ApplyDemonstrationTypesDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = async (mockOverrides?: MockedResponse[]) => {
    const result = render(
      <MockedProvider
        mocks={
          mockOverrides || [
            selectDemonstrationTypeQueryMock,
            applyDemonstrationTypesDialogQueryMock,
            assignDemonstrationTypesDialogMutationMock,
          ]
        }
      >
        <ApplyDemonstrationTypesDialog demonstrationId={MOCK_DEMONSTRATION_ID} />
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

  it("calls showSuccess and closeDialog on successful submit", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    await addDemonstrationTypeD(user);

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Demonstration types applied successfully.");
    });

    expect(mockCloseDialog).toHaveBeenCalledTimes(1);
  });

  it("calls showError on failed submit", async () => {
    const user = userEvent.setup();

    await renderWithProvider([
      selectDemonstrationTypeQueryMock,
      applyDemonstrationTypesDialogQueryMock,
      assignDemonstrationTypesDialogMutationErrorMock,
    ]);

    await addDemonstrationTypeD(user);

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to apply demonstration types.");
    });
    expect(mockShowSuccess).not.toHaveBeenCalled();
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

  describe("validation for approved demonstrations", () => {
    it("prevents submit when no types exist for approved demonstration", async () => {
      const user = userEvent.setup();
      const approvedDemonstration: Demonstration = {
        ...mockInitialDemonstration,
        status: "Approved",
      };
      const approvedDemonstrationQueryMock: MockedResponse<{
        demonstration: Demonstration;
      }> = {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
          variables: { id: MOCK_DEMONSTRATION_ID },
        },
        result: {
          data: {
            demonstration: approvedDemonstration,
          },
        },
      };

      await renderWithProvider([selectDemonstrationTypeQueryMock, approvedDemonstrationQueryMock]);

      const removeButtons = screen.getAllByRole("button", { name: /delete/i });
      for (const button of removeButtons) {
        await user.click(button);
      }
      expect(
        screen.queryByText(
          /at least one demonstration type is required for approved demonstrations/i
        )
      ).toBeInTheDocument();

      const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
      expect(submitButton).toBeDisabled();
    });

    it("does not prevent submit when no types exist for not-approved demonstration ", async () => {
      const user = userEvent.setup();

      const unApprovedDemonstrationQueryMock: MockedResponse<{
        demonstration: Demonstration;
      }> = {
        request: {
          query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_QUERY,
          variables: { id: MOCK_DEMONSTRATION_ID },
        },
        result: {
          data: {
            demonstration: mockInitialDemonstration,
          },
        },
      };

      await renderWithProvider([
        selectDemonstrationTypeQueryMock,
        unApprovedDemonstrationQueryMock,
      ]);

      const removeButtons = screen.getAllByRole("button", { name: /delete/i });
      for (const button of removeButtons) {
        await user.click(button);
      }
      expect(
        screen.queryByText(
          /at least one demonstration type is required for approved demonstrations/i
        )
      ).not.toBeInTheDocument();

      const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
      expect(submitButton).toBeEnabled();
    });
  });
});
