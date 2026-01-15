import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SelectTag } from "./SelectTag";

describe("SelectTag", () => {
  const mockOnSelect = vi.fn();
  const mockTags = ["Tag A", "Tag B", "Tag C"];
  const mockLabel = "Select Tag";
  // TODO: this will need to be further fleshed out when real data fetching is implemented
  const createMockHook = (overrides = {}) => {
    return () => ({
      loading: false,
      error: undefined,
      data: { tags: mockTags },
      ...overrides,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with placeholder when not loading", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );
      expect(screen.getByPlaceholderText("Select")).toBeInTheDocument();
    });

    it("renders loading placeholder when loading", () => {
      const useTagQuery = createMockHook({ loading: true, data: undefined });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );
      expect(screen.getByPlaceholderText("Loading...")).toBeInTheDocument();
    });

    it("renders error placeholder when error occurs", () => {
      const useTagQuery = createMockHook({ error: "Failed to load", data: undefined });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );
      expect(screen.getByPlaceholderText("Error loading types")).toBeInTheDocument();
    });

    it("renders 'No types available' when no tags returned", () => {
      const useTagQuery = createMockHook({ data: { tags: [] } });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );
      expect(screen.getByPlaceholderText("No types available")).toBeInTheDocument();
    });

    it("displays label", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );
      expect(screen.getByText(mockLabel)).toBeInTheDocument();
    });

    it("displays required indicator when isRequired is true", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag
          label={mockLabel}
          useTagQuery={useTagQuery}
          value=""
          onSelect={mockOnSelect}
          isRequired
        />
      );
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("renders with selected value", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag
          label={mockLabel}
          useTagQuery={useTagQuery}
          value="Tag B"
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByDisplayValue("Tag B")).toBeInTheDocument();
    });
  });

  describe("Dropdown Interaction", () => {
    it("displays all tags when dropdown is opened", async () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText("Tag A")).toBeInTheDocument();
        expect(screen.getByText("Tag B")).toBeInTheDocument();
        expect(screen.getByText("Tag C")).toBeInTheDocument();
      });
    });

    it("calls onSelect when a tag is selected", async () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Tag B"));

      expect(mockOnSelect).toHaveBeenCalledWith("Tag B");
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it("filters options based on user input", async () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      await userEvent.type(input, "Tag A");

      await waitFor(() => {
        expect(screen.getByText("Tag A")).toBeInTheDocument();
        expect(screen.queryByText("Tag B")).not.toBeInTheDocument();
        expect(screen.queryByText("Tag C")).not.toBeInTheDocument();
      });
    });
  });

  describe("Filter Function", () => {
    it("applies filter function to exclude specific tags", async () => {
      const useTagQuery = createMockHook();
      const filterFn = (tag: string) => tag !== "Tag B";

      render(
        <SelectTag
          label={mockLabel}
          useTagQuery={useTagQuery}
          value=""
          onSelect={mockOnSelect}
          filter={filterFn}
        />
      );

      const input = screen.getByRole("textbox");
      await userEvent.click(input);

      await waitFor(() => {
        expect(screen.getByText("Tag A")).toBeInTheDocument();
        expect(screen.queryByText("Tag B")).not.toBeInTheDocument();
        expect(screen.getByText("Tag C")).toBeInTheDocument();
      });
    });

    it("shows no options when filter excludes all tags", async () => {
      const useTagQuery = createMockHook();
      const filterFn = () => false;

      render(
        <SelectTag
          label={mockLabel}
          useTagQuery={useTagQuery}
          value=""
          onSelect={mockOnSelect}
          filter={filterFn}
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
      expect(screen.getByPlaceholderText("No types available")).toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("disables input when no tags are available", () => {
      const useTagQuery = createMockHook({ data: { tags: [] } });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("disables input when loading", () => {
      const useTagQuery = createMockHook({ loading: true, data: undefined });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("disables input when error occurs", () => {
      const useTagQuery = createMockHook({ error: "Error", data: undefined });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("disables input when all tags are filtered out", () => {
      const useTagQuery = createMockHook();
      const filterFn = () => false;

      render(
        <SelectTag
          label={mockLabel}
          useTagQuery={useTagQuery}
          value=""
          onSelect={mockOnSelect}
          filter={filterFn}
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined data gracefully", () => {
      const useTagQuery = createMockHook({ data: undefined });
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      expect(screen.getByPlaceholderText("No types available")).toBeInTheDocument();
    });

    it("handles empty string value", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
    });
  });

  describe("Required Field Behavior", () => {
    it("renders without required indicator by default", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag label={mockLabel} useTagQuery={useTagQuery} value="" onSelect={mockOnSelect} />
      );

      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("renders with required indicator when isRequired is true", () => {
      const useTagQuery = createMockHook();
      render(
        <SelectTag
          label={mockLabel}
          useTagQuery={useTagQuery}
          value=""
          onSelect={mockOnSelect}
          isRequired
        />
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });
});
