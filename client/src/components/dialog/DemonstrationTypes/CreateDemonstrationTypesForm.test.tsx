import React from "react";

import { render, screen, waitFor } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  CREATE_DEMONSTRATION_TYPES_FORM_QUERY,
  CreateDemonstrationTypesForm,
} from "./CreateDemonstrationTypesForm";

import { MockedProvider, MockedResponse } from "@apollo/client/testing";

import {
  SELECT_DEMONSTRATION_TYPE_QUERY,
  SELECT_DEMONSTRATION_TYPE_TEST_ID,
} from "components/input/select/SelectDemonstrationType";

import { Tag, TagName } from "demos-server";

describe("CreateDemonstrationTypesForm", () => {
  const mockAddDemonstrationType = vi.fn();

  const mockSelectDemonstrationTypeQuery: MockedResponse<{
    demonstrationTypeOptions: Tag[];
  }> = {
    request: {
      query: SELECT_DEMONSTRATION_TYPE_QUERY,
    },
    result: {
      data: {
        demonstrationTypeOptions: [
          { tagName: "Type A", approvalStatus: "Approved" },
          { tagName: "Type B", approvalStatus: "Unapproved" },
          { tagName: "Type C", approvalStatus: "Approved" },
        ],
      },
    },
  };

  const mockCreateDemonstrationTypesFormQuery: MockedResponse<{
    demonstrationTypeOptions: {
      tagName: TagName;
    }[];
  }> = {
    request: {
      query: CREATE_DEMONSTRATION_TYPES_FORM_QUERY,
    },
    result: {
      data: {
        demonstrationTypeOptions: [
          { tagName: "Type A" },
          { tagName: "Type B" },
          { tagName: "Type C" },
        ],
      },
    },
  };

  const renderWithProvider = async () => {
    const result = render(
      <MockedProvider
        mocks={[
          mockSelectDemonstrationTypeQuery,
          mockCreateDemonstrationTypesFormQuery,
        ]}
      >
        <CreateDemonstrationTypesForm
          demonstrationTypeNames={[]}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Type to search...")
      ).toBeInTheDocument();
    });

    return result;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", async () => {
    await renderWithProvider();

    expect(
      screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID)
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("button-create-demonstration-type")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeInTheDocument();
  });

  it("uses the Create Type placeholder", async () => {
    await renderWithProvider();

    expect(
      screen.getByPlaceholderText("Type to search...")
    ).toBeInTheDocument();

    expect(
      screen.queryByPlaceholderText("Select an option")
    ).not.toBeInTheDocument();
  });

  it("has Create Type and Add to List buttons disabled initially", async () => {
    await renderWithProvider();

    expect(screen.getByTestId("button-create-demonstration-type")).toBeDisabled();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();
  });

  it("enables Create Type when the typed value does not exactly match an existing type", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Brand New Type");

    expect(screen.getByTestId("button-create-demonstration-type")).toBeEnabled();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();
  });

  it("allows creating a new type when there are partial matches", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Type");

    expect(screen.getByTestId("button-create-demonstration-type")).toBeEnabled();

    await user.click(screen.getByTestId("button-create-demonstration-type"));

    expect(
      screen.getByTestId("unapproved-warning-banner")
    ).toBeInTheDocument();
  });

  it("disables Create Type when the typed value exactly matches an approved existing type", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Type A");

    expect(screen.getByTestId("button-create-demonstration-type")).toBeDisabled();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();
  });

  it("disables Create Type when the typed value exactly matches an unapproved existing type", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Type B");

    expect(screen.getByTestId("button-create-demonstration-type")).toBeDisabled();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();
  });

  it("treats exact matches as case-insensitive", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "type a");

    expect(screen.getByTestId("button-create-demonstration-type")).toBeDisabled();
  });

  it("creates a new type as unapproved", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Brand New Type");

    await user.click(screen.getByTestId("button-create-demonstration-type"));

    expect(
      screen.getByTestId("unapproved-warning-banner")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeEnabled();
  });

  it("shows the unapproved warning after creating a new type", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Brand New Type");

    await user.click(screen.getByTestId("button-create-demonstration-type"));

    const warning = screen.getByTestId("unapproved-warning-banner");

    expect(warning).toHaveTextContent(
      'Consult with SDG leadership and check spelling before creating a new tag/type. New tag/types are labelled "Unapproved" but can still be seen and used by others.'
    );
  });

  it("only enables Add to List after Create Type is clicked", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);
    const addButton = screen.getByTestId("button-add-demonstration-type");

    await user.type(input, "Brand New Type");

    expect(addButton).toBeDisabled();

    await user.click(screen.getByTestId("button-create-demonstration-type"));

    expect(addButton).toBeEnabled();
  });

  it("does not allow an existing unapproved type to be added to the list", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.click(input);

    await user.click(screen.getByText("Type B (Unapproved)"));

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();
  });

  it("adds a newly created type to the pending list", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Brand New Type");

    await user.click(screen.getByTestId("button-create-demonstration-type"));

    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(mockAddDemonstrationType).toHaveBeenCalledWith({
      demonstrationTypeName: "Brand New Type",
      approvalStatus: "Unapproved",
    });

    expect(mockAddDemonstrationType).toHaveBeenCalledTimes(1);
  });

  it("resets the form after adding a newly created type", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Brand New Type");

    await user.click(screen.getByTestId("button-create-demonstration-type"));

    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(input).toHaveValue("");

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();

    expect(
      screen.queryByTestId("unapproved-warning-banner")
    ).not.toBeInTheDocument();
  });

  it("allows creating and adding multiple new types", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);
    const createButton = screen.getByTestId("button-create-demonstration-type");
    const addButton = screen.getByTestId("button-add-demonstration-type");

    await user.type(input, "Brand New Type");

    await user.click(createButton);
    await user.click(addButton);

    await user.type(input, "Another New Type");

    expect(createButton).toBeEnabled();

    await user.click(createButton);
    await user.click(addButton);

    expect(mockAddDemonstrationType).toHaveBeenCalledTimes(2);

    expect(mockAddDemonstrationType).toHaveBeenNthCalledWith(1, {
      demonstrationTypeName: "Brand New Type",
      approvalStatus: "Unapproved",
    });

    expect(mockAddDemonstrationType).toHaveBeenNthCalledWith(2, {
      demonstrationTypeName: "Another New Type",
      approvalStatus: "Unapproved",
    });
  });

  it("does not allow a pending type to be added again", async () => {
    const user = userEvent.setup();

    await render(
      <MockedProvider
        mocks={[
          mockSelectDemonstrationTypeQuery,
          mockCreateDemonstrationTypesFormQuery,
        ]}
      >
        <CreateDemonstrationTypesForm
          demonstrationTypeNames={["Brand New Type"]}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Type to search...")
      ).toBeInTheDocument();
    });

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Brand New Type");

    expect(screen.getByTestId("button-create-demonstration-type")).toBeDisabled();

    expect(
      screen.getByTestId("button-add-demonstration-type")
    ).toBeDisabled();
  });

  it("displays no results message when there are no matches", async () => {
    const user = userEvent.setup();

    await renderWithProvider();

    const input = screen.getByTestId(SELECT_DEMONSTRATION_TYPE_TEST_ID);

    await user.type(input, "Completely New Type");

    expect(
      screen.getByText(
        "No results found"
      )
    ).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    render(
      <MockedProvider
        mocks={[
          mockSelectDemonstrationTypeQuery,
          mockCreateDemonstrationTypesFormQuery,
        ]}
      >
        <CreateDemonstrationTypesForm
          demonstrationTypeNames={[]}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    expect(
      screen.getByText("Loading demonstration types...")
    ).toBeInTheDocument();
  });

  it("displays error if the query fails", async () => {
    const errorQuery: MockedResponse<never> = {
      request: {
        query: CREATE_DEMONSTRATION_TYPES_FORM_QUERY,
      },
      result: {
        errors: [new Error("Failed to load demonstration types.")],
      },
    };

    render(
      <MockedProvider mocks={[errorQuery]}>
        <CreateDemonstrationTypesForm
          demonstrationTypeNames={[]}
          addDemonstrationType={mockAddDemonstrationType}
        />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Error loading demonstration types.")
      ).toBeInTheDocument();
    });
  });
});
