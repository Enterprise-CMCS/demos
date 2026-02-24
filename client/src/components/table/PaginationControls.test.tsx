import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { PaginationControls } from "./PaginationControls";

interface TestData {
  id: number;
  name: string;
}

// Create test data with 100 rows
const createTestData = (count: number): TestData[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));
};

const columnHelper = createColumnHelper<TestData>();
const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("name", { header: "Name" }),
];

// Wrapper component to test PaginationControls with a real table instance
const TestWrapper = ({ data, perPageChoices }: { data: TestData[]; perPageChoices?: number[] }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      <table>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} data-testid="table-row">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{cell.renderValue() as React.ReactNode}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <PaginationControls table={table} perPageChoices={perPageChoices} />
    </div>
  );
};

describe("PaginationControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Page size selection", () => {
    it("allows changing page size to 10 items per page", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(10);

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      await userEvent.selectOptions(select, "20");

      expect(screen.getByText("1 – 20 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(20);

      await userEvent.selectOptions(select, "10");
      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(10);
    });

    it("allows changing page size to 20 items per page", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(10);

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      await userEvent.selectOptions(select, "20");

      expect(screen.getByText("1 – 20 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(20);
    });

    it("allows changing page size to 50 items per page", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(10);

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      await userEvent.selectOptions(select, "50");

      expect(screen.getByText("1 – 50 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(50);
    });

    it("allows changing page size to All items", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(10);

      const select = screen.getByRole("combobox", { name: "Items per page:" });
      await userEvent.selectOptions(select, "-1");

      expect(screen.getByText("1 – 100 of 100")).toBeInTheDocument();
      expect(screen.getAllByTestId("table-row")).toHaveLength(100);
      expect(select).toHaveValue("-1");
      expect(screen.getByDisplayValue("All")).toBeInTheDocument();
    });
  });

  describe("Next and Previous navigation", () => {
    it("navigates to next page when Next button is clicked", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();

      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton);

      expect(screen.getByText("11 – 20 of 100")).toBeInTheDocument();
    });

    it("navigates to previous page when Prev button is clicked", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      // Go to page 2 first
      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton);
      expect(screen.getByText("11 – 20 of 100")).toBeInTheDocument();

      // Go back to page 1
      const prevButton = screen.getByRole("button", { name: /Go to previous page/i });
      await userEvent.click(prevButton);
      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
    });

    it("disables Prev button on first page", () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      const prevButton = screen.getByRole("button", { name: /Go to previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it("disables Next button on last page", async () => {
      const data = createTestData(25);
      render(<TestWrapper data={data} />);

      // Navigate to last page (page 3)
      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton); // Page 2
      await userEvent.click(nextButton); // Page 3

      expect(screen.getByText("21 – 25 of 25")).toBeInTheDocument();
      expect(nextButton).toBeDisabled();
    });
  });

  describe("First and Last page navigation", () => {
    it("navigates to first page when first page button is clicked", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      // Go to page 3
      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      expect(screen.getByText("21 – 30 of 100")).toBeInTheDocument();

      // Click first page button
      const firstPageButton = screen.getByRole("button", { name: "Go to page 1" });
      await userEvent.click(firstPageButton);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
    });

    it("navigates to last page when last page button is clicked", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();

      // Click last page button (page 10)
      const lastPageButton = screen.getByRole("button", { name: "Go to page 10" });
      await userEvent.click(lastPageButton);

      expect(screen.getByText("91 – 100 of 100")).toBeInTheDocument();
    });
  });

  describe("Page button navigation", () => {
    it("navigates forward a page through page button", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();

      // Click page 2 button
      const page2Button = screen.getByRole("button", { name: "Go to page 2" });
      await userEvent.click(page2Button);

      expect(screen.getByText("11 – 20 of 100")).toBeInTheDocument();
    });

    it("navigates backward a page through page button", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      // Go to page 3
      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      expect(screen.getByText("21 – 30 of 100")).toBeInTheDocument();

      // Click page 2 button to go back
      const page2Button = screen.getByRole("button", { name: "Go to page 2" });
      await userEvent.click(page2Button);

      expect(screen.getByText("11 – 20 of 100")).toBeInTheDocument();
    });

    it("highlights current page button", () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      const currentPageButton = screen.getByRole("button", { name: "Go to page 1" });
      expect(currentPageButton).toBeInTheDocument();
      expect(currentPageButton).toHaveClass("bg-action");
    });
  });

  describe("Display information", () => {
    it("displays correct row count on first page", () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("1 – 10 of 100")).toBeInTheDocument();
    });

    it("displays correct row count on middle page", async () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton);

      expect(screen.getByText("11 – 20 of 100")).toBeInTheDocument();
    });

    it("displays correct row count on last page with partial results", async () => {
      const data = createTestData(25);
      render(<TestWrapper data={data} />);

      // Navigate to last page
      const nextButton = screen.getByRole("button", { name: /Go to next page/i });
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);

      expect(screen.getByText("21 – 25 of 25")).toBeInTheDocument();
    });

    it("displays 0 of 0 when there is no data", () => {
      const data = createTestData(0);
      render(<TestWrapper data={data} />);

      expect(screen.getByText("0 of 0")).toBeInTheDocument();
    });
  });

  describe("Ellipsis display", () => {
    it("shows ellipsis when there are many pages", () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} />);

      const ellipses = screen.getAllByText("…");
      expect(ellipses.length).toBeGreaterThan(0);
    });
  });

  describe("Custom per page choices", () => {
    it("renders custom page size options", () => {
      const data = createTestData(100);
      render(<TestWrapper data={data} perPageChoices={[5, 15, 25]} />);

      expect(screen.getByText("Items per page:")).toBeInTheDocument();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveValue("5");
      expect(options[1]).toHaveValue("15");
      expect(options[2]).toHaveValue("25");
    });
  });
});
