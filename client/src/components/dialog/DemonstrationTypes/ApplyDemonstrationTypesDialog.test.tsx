import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ApplyDemonstrationTypesDialog,
  ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
} from "./ApplyDemonstrationTypesDialog";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationTypeName";
import { Tag as DemonstrationTypeName, LocalDate } from "demos-server";
import { ADD_DEMONSTRATION_TYPES_FORM_QUERY } from "./AddDemonstrationTypesForm";

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
const selectDemonstrationTypeQueryMock: MockedResponse<{
  demonstrationTypeNames: DemonstrationTypeName[];
}> = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypeNames: ["Type A", "Type B", "Type C"],
    },
  },
};
const addDemonstrationTypesFormQueryMock: MockedResponse<{
  demonstration: {
    id: string;
    demonstrationTypes: {
      demonstrationTypeName: DemonstrationTypeName;
    }[];
  };
}> = {
  request: {
    query: ADD_DEMONSTRATION_TYPES_FORM_QUERY,
    variables: { id: MOCK_DEMONSTRATION_ID },
  },
  result: {
    data: {
      demonstration: {
        id: MOCK_DEMONSTRATION_ID,
        demonstrationTypes: [
          {
            demonstrationTypeName: "Type A",
          },
        ],
      },
    },
  },
};
const assignDemonstrationTypesDialogMutationMock: MockedResponse<{
  setDemonstrationTypes: {
    id: string;
    demonstrationTypes: {
      demonstrationTypeName: DemonstrationTypeName;
    }[];
  };
}> = {
  request: {
    query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
    variables: {
      input: {
        demonstrationId: MOCK_DEMONSTRATION_ID,
        demonstrationTypes: [
          {
            demonstrationTypeName: "Type B",
            demonstrationTypeDates: {
              effectiveDate: "2024-01-02" as LocalDate,
              expirationDate: "2025-01-02" as LocalDate,
            },
          },
        ],
      },
    },
  },
  result: {
    data: {
      setDemonstrationTypes: {
        id: MOCK_DEMONSTRATION_ID,
        demonstrationTypes: [
          {
            demonstrationTypeName: "Type B",
          },
        ],
      },
    },
  },
};

const assignDemonstrationTypesDialogMutationErrorMock: MockedResponse<never> = {
  request: {
    query: ASSIGN_DEMONSTRATION_TYPES_DIALOG_MUTATION,
    variables: {
      input: {
        demonstrationId: MOCK_DEMONSTRATION_ID,
        demonstrationTypes: [
          {
            demonstrationTypeName: "Type B",
            demonstrationTypeDates: {
              effectiveDate: "2024-01-02" as LocalDate,
              expirationDate: "2025-01-02" as LocalDate,
            },
          },
        ],
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

  const renderWithProvider = async () => {
    const result = render(
      <MockedProvider
        mocks={[
          selectDemonstrationTypeQueryMock,
          addDemonstrationTypesFormQueryMock,
          assignDemonstrationTypesDialogMutationMock,
        ]}
      >
        <ApplyDemonstrationTypesDialog demonstrationId={MOCK_DEMONSTRATION_ID} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Demonstration Type")).toBeInTheDocument();
    });

    return result;
  };

  it("renders dialog elements with correct titles", () => {
    renderWithProvider();
    expect(screen.getByRole("heading", { name: "Apply Type(s)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button-dialog-cancel" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "button-submit-demonstration-dialog" })
    ).toBeInTheDocument();
  });

  it("renders AddDemonstrationTypesForm component", async () => {
    await renderWithProvider();
    expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
    expect(screen.getByLabelText(/effective date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
    expect(screen.getByTestId("button-add-demonstration-type")).toBeInTheDocument();
  });

  it("enables and disables submit button based on types list", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-02");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-02");
    await user.click(screen.getByTestId("button-add-demonstration-type"));
    expect(submitButton).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(submitButton).toBeDisabled();
  });

  it("adds to and removes from the list", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-02");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-02");
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(screen.getByText("Types to be added (1)")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText(/effective: 01\/02\/2024/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 01\/02\/2025/i)).toBeInTheDocument();

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type C"));
    await user.clear(screen.getByLabelText(/effective date/i));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-03");
    await user.clear(screen.getByLabelText(/expiration date/i));
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-03");
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(screen.getByText("Types to be added (2)")).toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText(/effective: 01\/02\/2024/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 01\/02\/2025/i)).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
    expect(screen.getByText(/effective: 01\/03\/2024/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 01\/03\/2025/i)).toBeInTheDocument();

    const typeBItem = screen.getByText("Type B").closest("li");
    const removeTypeBButton = within(typeBItem!).getByRole("button", { name: "Delete" });
    await user.click(removeTypeBButton);

    expect(screen.getByText("Types to be added (1)")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
    expect(screen.getByText(/effective: 01\/03\/2024/i)).toBeInTheDocument();
    expect(screen.getByText(/expires: 01\/03\/2025/i)).toBeInTheDocument();
  });

  it("calls showSuccess and closeDialog on successful submit", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-02");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-02");
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith("Demonstration types applied successfully.");
    });
    expect(mockShowError).not.toHaveBeenCalled();
    expect(mockCloseDialog).toHaveBeenCalledTimes(1);
  });

  it("calls showError and closeDialog on failed submit", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider
        mocks={[
          selectDemonstrationTypeQueryMock,
          addDemonstrationTypesFormQueryMock,
          assignDemonstrationTypesDialogMutationErrorMock,
        ]}
      >
        <ApplyDemonstrationTypesDialog demonstrationId={MOCK_DEMONSTRATION_ID} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Demonstration Type")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-02");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-02");
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    const submitButton = screen.getByTestId("button-submit-demonstration-dialog");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith("Failed to apply demonstration types.");
    });
    expect(mockShowSuccess).not.toHaveBeenCalled();
    expect(mockCloseDialog).toHaveBeenCalledTimes(1);
  });
});
