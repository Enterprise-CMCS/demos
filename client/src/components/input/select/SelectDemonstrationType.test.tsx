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
import { TagName, Tag } from "demos-server";

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
        { tagName: "Type B", approvalStatus: "Approved" },
        { tagName: "Type C", approvalStatus: "Unapproved" },
        { tagName: "Type D", approvalStatus: "Unapproved" },
      ],
    },
  },
};

const mockSelectDemonstrationTypeQueryUnsorted: MockedResponse<{
  demonstrationTypeOptions: Tag[];
}> = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  result: {
    data: {
      demonstrationTypeOptions: [
        { tagName: "Type D", approvalStatus: "Unapproved" },
        { tagName: "Type B", approvalStatus: "Approved" },
        { tagName: "Type A", approvalStatus: "Approved" },
        { tagName: "Type C", approvalStatus: "Unapproved" },
      ],
    },
  },
};

const mockSelectDemonstrationTypeQueryError: MockedResponse<{
  demonstrationTypeNames: TagName[];
}> = {
  request: {
    query: SELECT_DEMONSTRATION_TYPE_QUERY,
  },
  error: new Error("Expected mock error."),
};

const mockSelectDemonstrationTypeQueryEmpty: MockedResponse<{
  demonstrationTypeNames: TagName[];
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
      expect(screen.getByText("Error loading demonstration type options.")).toBeInTheDocument();
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

  it("shows 'No types available' when no demonstration types exist", async () => {
    render(
      <MockedProvider mocks={[mockSelectDemonstrationTypeQueryEmpty]}>
        <SelectDemonstrationType {...DEFAULT_PROPS} />
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
        <SelectDemonstrationType {...DEFAULT_PROPS} filter={filterFn} />
      </MockedProvider>
    );
    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    expect(screen.getByPlaceholderText("No types available")).toBeInTheDocument();
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
        expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
      });

      return result;
    };
    it("renders with correct label", async () => {
      await renderWithProvider();

      expect(screen.getByText("Demonstration Type")).toBeInTheDocument();
    });

    it("loads and displays demonstration types with approval status", async () => {
      await renderWithProvider();

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      expect(screen.getByText("Type A")).toBeInTheDocument();
      expect(screen.getByText("Type B")).toBeInTheDocument();
      expect(screen.getByText("Type C (Unapproved)")).toBeInTheDocument();
      expect(screen.getByText("Type D (Unapproved)")).toBeInTheDocument();
    });

    it("calls onSelect when option is clicked", async () => {
      await renderWithProvider();

      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Type C (Unapproved)"));

      expect(mockOnSelect).toHaveBeenCalledWith({
        tagName: "Type C",
        approvalStatus: "Unapproved",
      });
    });

    it("filters demonstration types when filter prop is provided", async () => {
      const filterFn = (type: string) => type !== "Type B";
      await renderWithProvider({ filter: filterFn });

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      expect(screen.getByText("Type A")).toBeInTheDocument();
      expect(screen.queryByText("Type B")).not.toBeInTheDocument();
      expect(screen.getByText("Type C (Unapproved)")).toBeInTheDocument();
      expect(screen.getByText("Type D (Unapproved)")).toBeInTheDocument();
    });

    it("passes isRequired prop to AutoCompleteSelect", async () => {
      await renderWithProvider({ isRequired: true });

      const label = screen.getByText("Demonstration Type");
      const container = label.closest("label");
      expect(container?.querySelector(".text-text-warn")).toBeInTheDocument();
    });

    it("sorts options alphabetically by tagName", async () => {
      await renderWithProvider({}, mockSelectDemonstrationTypeQueryUnsorted);

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      const optionLabels = screen
        .getAllByRole("button")
        .map((button) => button.textContent?.trim());

      expect(optionLabels).toEqual([
        "Type A",
        "Type B",
        "Type C (Unapproved)",
        "Type D (Unapproved)",
      ]);
    });
  });

  describe("allowCreateNew", () => {
    const renderWithCreateNew = async () => {
      const result = render(
        <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
          <SelectDemonstrationType value="" onSelect={mockOnSelect} allowCreateNew />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
      });

      return result;
    };

    it("shows 'Entry not found' message when no matches and allowCreateNew is true", async () => {
      await renderWithCreateNew();

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Nonexistent Type");

      expect(
        screen.getByText(
          "Entry not found. New tags remain unapproved until admin review. Ensure accuracy before adding."
        )
      ).toBeInTheDocument();
    });

    it("shows default 'No matches found' when allowCreateNew is false", async () => {
      render(
        <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
          <SelectDemonstrationType value="" onSelect={mockOnSelect} />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
      });

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Nonexistent Type");

      expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
    });

    it("keeps input enabled even when no options match and allowCreateNew is true", async () => {
      await renderWithCreateNew();

      const input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();
    });
  });

  describe("onFilterChange", () => {
    it("passes onFilterChange callback through to AutoCompleteSelect", async () => {
      const mockFilterChange = vi.fn();
      render(
        <MockedProvider mocks={[mockSelectDemonstrationTypeQuery]}>
          <SelectDemonstrationType
            value=""
            onSelect={mockOnSelect}
            onFilterChange={mockFilterChange}
          />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Select an option")).toBeInTheDocument();
      });

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "zzz");

      expect(mockFilterChange).toHaveBeenLastCalledWith("zzz", false);
    });
  });
});
