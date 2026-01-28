import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  SELECT_DEMONSTRATION_TYPE_QUERY,
  SelectDemonstrationTypeName,
  SelectDemonstrationTypeNameProps,
} from "./SelectDemonstrationTypeName";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { Tag as DemonstrationTypeName } from "demos-server";

const mockSelectDemonstrationTypeQuery: MockedResponse<{
  demonstrationTypeNames: DemonstrationTypeName[];
}> = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypeNames: ["Type A", "Type B", "Type C", "Type D"],
    },
  },
};

const mockSelectDemonstrationTypeQueryError: MockedResponse<{
  demonstrationTypeNames: DemonstrationTypeName[];
}> = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  error: new Error("Expected mock error."),
};

const mockSelectDemonstrationTypeQueryEmpty: MockedResponse<{
  demonstrationTypeNames: DemonstrationTypeName[];
}> = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypeNames: [],
    },
  },
};

describe("SelectDemonstrationTypes", () => {
  const mockOnSelect = vi.fn();

  const DEFAULT_PROPS: SelectDemonstrationTypeNameProps = {
    value: "",
    onSelect: mockOnSelect,
  };

  it("displays error message when query fails", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQueryError]}>
        <SelectDemonstrationTypeName {...DEFAULT_PROPS} />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("Error loading demonstration type names.")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
        <SelectDemonstrationTypeName {...DEFAULT_PROPS} />
      </MockedProvider>
    );

    expect(screen.getByPlaceholderText("Loading...")).toBeInTheDocument();
  });

  it("shows 'No types available' when no demonstration types exist", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQueryEmpty]}>
        <SelectDemonstrationTypeName {...DEFAULT_PROPS} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("No types available")).toBeInTheDocument();
    });
  });

  it("shows no types available when filter excludes all options", async () => {
    const filterFn = () => false;
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
        <SelectDemonstrationTypeName {...DEFAULT_PROPS} filter={filterFn} />
      </MockedProvider>
    );
    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    expect(screen.getByPlaceholderText("No types available")).toBeInTheDocument();
  });

  describe("loaded states", () => {
    const renderWithProvider = async (
      propOverrides?: Partial<SelectDemonstrationTypeNameProps>,
      mock: MockedResponse = mockSelectDemonstrationTypeQuery
    ) => {
      const result = render(
        <MockedProvider mocks={[mock]}>
          <SelectDemonstrationTypeName {...DEFAULT_PROPS} {...propOverrides} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
      });

      return result;
    };
    it("renders with correct label", async () => {
      await renderWithProvider();

      expect(screen.getByText("Demonstration Type")).toBeInTheDocument();
    });

    it("loads and displays demonstration types", async () => {
      await renderWithProvider();

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      expect(screen.getByText("Type A")).toBeInTheDocument();
      expect(screen.getByText("Type B")).toBeInTheDocument();
      expect(screen.getByText("Type C")).toBeInTheDocument();
      expect(screen.getByText("Type D")).toBeInTheDocument();
    });

    it("calls onSelect when option is clicked", async () => {
      await renderWithProvider();

      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Type C"));

      expect(mockOnSelect).toHaveBeenCalledWith("Type C");
    });

    it("filters demonstration types when filter prop is provided", async () => {
      const filterFn = (type: string) => type !== "Type B";
      await renderWithProvider({ filter: filterFn });

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      expect(screen.getByText("Type A")).toBeInTheDocument();
      expect(screen.queryByText("Type B")).not.toBeInTheDocument();
      expect(screen.getByText("Type C")).toBeInTheDocument();
      expect(screen.getByText("Type D")).toBeInTheDocument();
    });

    it("passes isRequired prop to AutoCompleteSelect", async () => {
      await renderWithProvider({ isRequired: true });

      const label = screen.getByText("Demonstration Type");
      const container = label.closest("label");
      expect(container?.querySelector(".text-text-warn")).toBeInTheDocument();
    });
  });
});
