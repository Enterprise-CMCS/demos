import React from "react";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemonstrationTable } from "../tables/DemonstrationTable";

const mockRawData = [
  {
    id: 1,
    title: "Medicaid Montana Expenditure Cap Demonstration",
    demoNumber: "MT-1-2019-05-10",
    description: "...",
    evalPeriodStartDate: "2019-05-10",
    evalPeriodEndDate: "2024-05-10",
    demonstrationStatusId: 3,
    userId: 139,
    stateId: "MT",
    projectOfficer: "Qui-Gon Jinn",
    createdAt: "...",
    updatedAt: "...",
  },
  {
    id: 2,
    title: "Medicaid Florida Reproductive Health: Fertility Demonstration",
    demoNumber: "FL-2-2018-07-08",
    description: "...",
    evalPeriodStartDate: "2018-07-08",
    evalPeriodEndDate: "2023-07-08",
    demonstrationStatusId: 4,
    userId: 195,
    stateId: "FL",
    projectOfficer: "Obiwan Kenobi",
    createdAt: "...",
    updatedAt: "...",
  },
  {
    id: 3,
    title: "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration",
    demoNumber: "AK-3-2018-06-27",
    description: "...",
    evalPeriodStartDate: "2018-06-27",
    evalPeriodEndDate: "2023-06-27",
    demonstrationStatusId: 3,
    userId: 121,
    stateId: "AK",
    projectOfficer: "Ezra Bridger",
    createdAt: "...",
    updatedAt: "...",
  },
];

describe("DemonstrationTable", () => {
  beforeEach(() => {
    localStorage.clear();
    render(<DemonstrationTable data={mockRawData} />);
  });

  it("renders the keyword search input", () => {
    const keywordSearchInput = screen.getByLabelText(/Search:/i);

    expect(keywordSearchInput).toBeInTheDocument();
    expect(keywordSearchInput).toHaveValue("");
  });

  it("renders with search icon and no clear icon initially", () => {
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    const searchContainer = keywordSearchInput.closest("div");

    // Search icon should be present
    const searchIcon = (searchContainer as HTMLElement).querySelector("svg");
    expect(searchIcon).toBeInTheDocument();

    // Clear button should not be present initially
    const clearButton = screen.queryByLabelText(/clear search/i);
    expect(clearButton).not.toBeInTheDocument();
  });

  it("shows clear icon when text is typed and clears input when clicked", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type in search input
    await user.type(keywordSearchInput, "Montana");

    // Clear button should now be visible
    const clearButton = screen.getByLabelText(/clear search/i);
    expect(clearButton).toBeInTheDocument();
    expect(keywordSearchInput).toHaveValue("Montana");

    // Click clear button
    await user.click(clearButton);

    // Input should be cleared and clear button should disappear
    expect(keywordSearchInput).toHaveValue("");
    expect(screen.queryByLabelText(/clear search/i)).not.toBeInTheDocument();
  });

  it("filters table content based on search string", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type search term
    await user.type(keywordSearchInput, "Montana");

    // Wait for debounce (300ms + buffer)
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();

      // Should not show other demonstrations
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration";
        })
      ).not.toBeInTheDocument();
    }, { timeout: 500 });


  });

  it("filters table based on multiple keywords", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type multiple keywords
    await user.type(keywordSearchInput, "Medicaid Florida");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).toBeInTheDocument();

      // Should not show demonstrations that don't contain both keywords
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration";
        })
      ).not.toBeInTheDocument();
    }, { timeout: 500 });


  });

  it("highlights matching text in search results", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);

    // Type search term
    await user.type(keywordSearchInput, "Montana");

    // Wait for debounce and highlighting to apply
    await waitFor(() => {
      const highlightedText = screen.getByText("Montana");
      expect(highlightedText.tagName.toLowerCase()).toBe("mark");
      expect(highlightedText).toHaveClass("bg-yellow-200", "font-semibold");

      // Verify the full text is still present (even if split across elements)
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it("preserves existing filters when searching", async () => {
    const user = userEvent.setup();

    // First apply a column filter
    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["stateId"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "MT");

    // Verify filter is applied (only Montana demonstration visible)
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText((content, element) => {
        return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
      })
    ).not.toBeInTheDocument();

    // Now add keyword search
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.type(keywordSearchInput, "Medicaid");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Medicaid Montana Expenditure Cap Demonstration";
        })
      ).toBeInTheDocument();

      // Both filters should be active - still only Montana demonstration
      expect(
        screen.queryByText((content, element) => {
          return element?.textContent === "Medicaid Florida Reproductive Health: Fertility Demonstration";
        })
      ).not.toBeInTheDocument();
    }, { timeout: 500 });

    // Verify the column filter input still has its value
    expect(filterInput).toHaveValue("MT");
  });

  it("maintains sorting regardless of search state", async () => {
    const user = userEvent.setup();

    // Click on Title column header to sort
    const titleHeader = screen.getByText("Title");
    await user.click(titleHeader);

    // Apply keyword search
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.type(keywordSearchInput, "Medicaid");

    // Wait for debounce
    await waitFor(() => {
      const tableRows = screen.getAllByRole("row");
      const dataRows = tableRows.slice(1);

      // Extract titles from visible rows
      const visibleTitles = dataRows
        .map(row => {
          const titleCell = within(row).queryByText(/Medicaid.*Demonstration/);
          return titleCell?.textContent || "";
        })
        .filter(title => title.length > 0);

      // Verify titles are sorted alphabetically
      const sortedTitles = [...visibleTitles].sort();
      expect(visibleTitles).toEqual(sortedTitles);
    }, { timeout: 500 });

    // Clear search and verify sorting is maintained
    const clearButton = screen.getByLabelText(/clear search/i);
    await user.click(clearButton);

    const newTableRows = screen.getAllByRole("row");
    const newDataRows = newTableRows.slice(1);

    const allTitles = newDataRows
      .map(row => {
        const titleCell = within(row).queryByText(/Medicaid.*Demonstration/);
        return titleCell?.textContent || "";
      })
      .filter(title => title.length > 0);

    const allSortedTitles = [...allTitles].sort();
    expect(allTitles).toEqual(allSortedTitles);
  });

  it("renders the 'no results found' message for all demonstrations", async () => {
    const user = userEvent.setup();
    const keywordSearchInput = screen.getByLabelText(/keyword search/i);
    await user.type(keywordSearchInput, "ZZZZZZZ");

    // Wait for debounce
    await waitFor(() => {
      expect(
        screen.getByText((content) =>
          content.includes("No results were returned. Adjust your search and filter criteria.")
        )
      ).toBeInTheDocument();
    }, { timeout: 500 });
  });
});
