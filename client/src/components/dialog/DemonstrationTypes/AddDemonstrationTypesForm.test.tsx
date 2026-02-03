import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ADD_DEMONSTRATION_TYPES_FORM_QUERY,
  AddDemonstrationTypesForm,
} from "./AddDemonstrationTypesForm";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationTypeName";

const mockSelectDemonstrationTypeQuery: MockedResponse<{
  demonstrationTypeNames: string[];
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

const mockAddDemonstrationTypesFormQuery: MockedResponse<{
  demonstration: {
    demonstrationTypes: {
      demonstrationTypeName: string;
    }[];
  };
}> = {
  request: {
    query: ADD_DEMONSTRATION_TYPES_FORM_QUERY,
    variables: { id: "1" },
  },
  result: {
    data: {
      demonstration: {
        demonstrationTypes: [
          {
            demonstrationTypeName: "Type A",
          },
        ],
      },
    },
  },
};

describe("AddDemonstrationTypesForm", () => {
  const mockAddDemonstrationType = vi.fn();

  const renderWithProvider = async () => {
    const result = render(
      <MockedProvider
        mocks={[mockSelectDemonstrationTypeQuery, mockAddDemonstrationTypesFormQuery]}
      >
        <AddDemonstrationTypesForm
          demonstrationId="1"
          demonstrationTypeNames={["Type B"]}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
    });

    return result;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", async () => {
    await renderWithProvider();

    expect(screen.getByTestId("select-demonstration-type-name")).toBeInTheDocument();
    expect(screen.getByLabelText(/effective date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
    expect(screen.getByTestId("button-add-demonstration-type")).toBeInTheDocument();
  });

  it("has add button disabled initially", async () => {
    await renderWithProvider();

    expect(screen.getByTestId("button-add-demonstration-type")).toBeDisabled();
  });

  it("filters out existing demonstration types from select options", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const input = screen.getByRole("textbox");
    await user.click(input);

    // type A comes from demonstration query
    expect(screen.queryByText("Type A")).not.toBeInTheDocument();
    // type B comes from props
    expect(screen.queryByText("Type B")).not.toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
  });

  it("enables add button when all fields are filled", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const addButton = screen.getByTestId("button-add-demonstration-type");
    expect(addButton).toBeDisabled();

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type C"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-03");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-03");

    expect(addButton).toBeEnabled();
  });

  it("calls addDemonstrationType with form data when submitted and resets demonstration type select", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    await user.click(screen.getByRole("textbox"));
    await user.click(screen.getByText("Type C"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-03");
    await user.type(screen.getByLabelText(/expiration date/i), "2025-01-03");
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(mockAddDemonstrationType).toHaveBeenCalledWith({
      demonstrationTypeName: "Type C",
      effectiveDate: "2024-01-03",
      expirationDate: "2025-01-03",
    });
    expect(mockAddDemonstrationType).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByTestId("button-add-demonstration-type")).toBeDisabled();
  });

  it("shows loading state initially", async () => {
    renderWithProvider();
    expect(screen.getByText("Loading demonstration...")).toBeInTheDocument();
  });

  it("displays error if query fails", async () => {
    const mockAddDemonstrationTypesFormErrorQuery: MockedResponse<never> = {
      request: {
        query: ADD_DEMONSTRATION_TYPES_FORM_QUERY,
        variables: { id: "1" },
      },
      result: {
        errors: [new Error("Failed to load demonstration types.")],
      },
    };
    render(
      <MockedProvider mocks={[mockAddDemonstrationTypesFormErrorQuery]}>
        <AddDemonstrationTypesForm
          demonstrationId="1"
          demonstrationTypeNames={["Type B"]}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error loading demonstration.")).toBeInTheDocument();
    });
  });
});
