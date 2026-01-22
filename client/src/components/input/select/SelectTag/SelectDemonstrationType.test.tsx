import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  SELECT_DEMONSTRATION_TYPE_QUERY,
  SelectDemonstrationType,
  SelectDemonstrationTypeProps,
} from "./SelectDemonstrationType";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";

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

const mockSelectDemonstrationTypeQueryError: MockedResponse = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  error: new Error("Expected mock error."),
};

const mockSelectDemonstrationTypeQueryEmpty: MockedResponse = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypes: [],
    },
  },
};

describe("SelectDemonstrationTypes", () => {
  const mockOnSelect = vi.fn();

  const DEFAULT_PROPS: SelectDemonstrationTypeProps = {
    value: "",
    onSelect: mockOnSelect,
  };

  it("displays error message when query fails", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQueryError]}>
        <SelectDemonstrationType {...DEFAULT_PROPS} />
      </MockedProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("Error loading tags.")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
        <SelectDemonstrationType {...DEFAULT_PROPS} />
      </MockedProvider>
    );

    expect(screen.getByPlaceholderText("Loading...")).toBeInTheDocument();
  });

  it("shows 'No tags available' when no demonstration types exist", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQueryEmpty]}>
        <SelectDemonstrationType {...DEFAULT_PROPS} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("No tags available")).toBeInTheDocument();
    });
  });

  it("shows no tags available when filter excludes all options", async () => {
    const filterFn = () => false;
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
        <SelectDemonstrationType {...DEFAULT_PROPS} filter={filterFn} />
      </MockedProvider>
    );
    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    expect(screen.getByPlaceholderText("No tags available")).toBeInTheDocument();
  });

  describe("loaded states", () => {
    const renderWithProvider = async (
      propOverrides?: Partial<SelectDemonstrationTypeProps>,
      mock: MockedResponse = mockSelectDemonstrationTypeQuery
    ) => {
      const result = render(
        <MockedProvider mocks={[mock]}>
          <SelectDemonstrationType {...DEFAULT_PROPS} {...propOverrides} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Select")).toBeInTheDocument();
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
