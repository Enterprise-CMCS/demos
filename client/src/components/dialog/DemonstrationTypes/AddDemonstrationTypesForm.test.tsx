import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { SELECT_DEMONSTRATION_TYPE_QUERY } from "components/input/select/SelectDemonstrationTypeName";
import { DemonstrationType } from "./useApplyDemonstrationTypesDialogData";

const mockSelectDemonstrationTypeQuery: MockedResponse = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypes: ["Type A", "Type B", "Type C", "Type D"],
    },
  },
};

describe("AddDemonstrationTypesForm", () => {
  const mockAddDemonstrationType = vi.fn();

  const renderWithProvider = async (
    demonstrationTypes: DemonstrationType[] = [
      {
        demonstrationTypeName: "Type A",
        effectiveDate: "2024-01-01",
        expirationDate: "2024-12-31",
      },
    ]
  ) => {
    const result = render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
        <AddDemonstrationTypesForm
          demonstrationTypes={demonstrationTypes}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Select")).toBeInTheDocument();
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

    expect(screen.queryByText("Type A")).not.toBeInTheDocument();
    expect(screen.getByText("Type B")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
  });

  it("enables add button when all fields are filled", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const addButton = screen.getByTestId("button-add-demonstration-type");
    expect(addButton).toBeDisabled();

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");

    expect(addButton).toBeEnabled();
  });

  it("calls addDemonstrationType with form data when submitted", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");

    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(mockAddDemonstrationType).toHaveBeenCalledWith({
      demonstrationTypeName: "Type B",
      effectiveDate: "2024-01-15",
      expirationDate: "2024-12-31",
    });
    expect(mockAddDemonstrationType).toHaveBeenCalledTimes(1);
  });

  it("resets tag field after submission", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");
    await user.click(screen.getByRole("button", { name: /button-add-demonstration-type/i }));

    expect(input).toHaveValue("");
  });

  it("disables button after submission until new tag is selected", async () => {
    const user = userEvent.setup();
    await renderWithProvider();

    const addButton = screen.getByRole("button", { name: /button-add-demonstration-type/i });

    const input = screen.getByRole("textbox");
    await user.click(input);
    await user.click(screen.getByText("Type B"));
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");
    await user.click(addButton);

    expect(addButton).toBeDisabled();
  });
});
