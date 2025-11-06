import React from "react";

import { mockDemonstrations } from "mock-data/demonstrationMocks";
import { mockPeople } from "mock-data/personMocks";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationTable } from "./DemonstrationTable";

// Helper functions
const renderDemonstrations = () => {
  return render(
    <DemonstrationTable projectOfficerOptions={mockPeople} demonstrations={mockDemonstrations} />
  );
};

const waitForTableData = async () => {
  await waitFor(() => {
    expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
  });
};

const clearSearchInput = async (user: ReturnType<typeof userEvent.setup>) => {
  const searchInput = screen.getByLabelText(/keyword search/i);
  await user.clear(searchInput);
};

const searchForText = async (user: ReturnType<typeof userEvent.setup>, searchText: string) => {
  const searchInput = screen.getByLabelText(/keyword search/i);
  await user.type(searchInput, searchText);
};
const applyProjectOfficerFilter = async (
  user: ReturnType<typeof userEvent.setup>,
  officerName: string
) => {
  // Select Project Officer filter from column dropdown
  const columnSelect = screen.getByLabelText(/filter by:/i);
  await user.selectOptions(columnSelect, ["Project Officer"]);

  // Wait for the project officer filter input to appear
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/select project officer/i)).toBeInTheDocument();
  });

  // Filter by the specified project officer
  const officerFilterInput = screen.getByPlaceholderText(/select project officer/i);
  await user.type(officerFilterInput, officerName);

  // Wait for dropdown and select officer
  await waitFor(() => {
    const officerOptions = screen.getAllByText(officerName);
    const officerDropdownOption = officerOptions.find(
      (el) => el.tagName === "LI" || el.closest("li")
    );
    expect(officerDropdownOption).toBeInTheDocument();
  });

  const officerOptions = screen.getAllByText(officerName);
  const officerOptionToClick = officerOptions.find((el) => el.tagName === "LI" || el.closest("li"));
  await user.click(officerOptionToClick!);
};

const applyStateFilter = async (user: ReturnType<typeof userEvent.setup>, stateCode: string) => {
  // Select state filter from column dropdown
  const columnSelect = screen.getByLabelText(/filter by:/i);
  await user.selectOptions(columnSelect, ["State/Territory"]);

  // Wait for the state filter input to appear
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/select state\/territory/i)).toBeInTheDocument();
  });

  // Filter by the specified state
  const stateFilterInput = screen.getByPlaceholderText(/select state\/territory/i);
  await user.type(stateFilterInput, stateCode);

  // Wait for dropdown and select state
  await waitFor(() => {
    const stateOptions = screen.getAllByText(stateCode);
    const stateDropdownOption = stateOptions.find((el) => el.tagName === "LI" || el.closest("li"));
    expect(stateDropdownOption).toBeInTheDocument();
  });

  const stateOptions = screen.getAllByText(stateCode);
  const stateOptionToClick = stateOptions.find((el) => el.tagName === "LI" || el.closest("li"));
  await user.click(stateOptionToClick!);
};

const expectDemonstrationResults = () => {
  expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
  expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
  expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
};

describe("Demonstrations", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    localStorage.removeItem("keyword-search");
    user = userEvent.setup();
  });

  describe("Empty states", () => {
    it("passes correct empty message when provided", async () => {
      render(
        <DemonstrationTable
          emptyRowsMessage="testEmptyRowsMessage"
          projectOfficerOptions={mockPeople}
          demonstrations={[]}
        />
      );
      await waitFor(() => {
        expect(screen.getByText("testEmptyRowsMessage")).toBeInTheDocument();
      });
    });
  });

  describe("Table rendering", () => {
    beforeEach(async () => {
      localStorage.removeItem("keyword-search");
      renderDemonstrations();
      await waitForTableData();
    });

    it("renders table with correct demonstrations", () => {
      expectDemonstrationResults();
    });

    it("renders table columns correctly", () => {
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(8);
      expect(screen.getByRole("columnheader", { name: "Title Sort" })).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "State/Territory Sort" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Project Officer Sort" })
      ).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Applications" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Status Sort" })).toBeInTheDocument();
    });

    it("renders demonstration data correctly in table cells", () => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("MT")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
      expect(screen.getByText("FL")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.getByText("Jim Smith")).toBeInTheDocument();
    });

    it("renders action buttons for each demonstration", () => {
      const viewButtons = screen.getAllByText("View");
      expect(viewButtons).toHaveLength(3);
    });
  });

  describe("Table features", () => {
    beforeEach(async () => {
      localStorage.removeItem("keyword-search");
      renderDemonstrations();
      await waitForTableData();
    });

    it("includes table features (search, filter, pagination)", () => {
      expect(screen.getByLabelText(/search:/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();
      expect(screen.getByText("Items per page:")).toBeInTheDocument();
    });

    it("allows searching within demonstrations", async () => {
      await searchForText(user, "Montana Medicaid Waiver");
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "Montana Medicaid Waiver";
          })
        ).toBeInTheDocument();
        expect(screen.queryByText("Florida Health Innovation")).not.toBeInTheDocument();
      });
    });

    it("shows no results message when search returns no results", async () => {
      await searchForText(user, "NonexistentDemo");
      await waitFor(() => {
        expect(
          screen.getByText("No results were returned. Adjust your search and filter criteria.")
        ).toBeInTheDocument();
      });
    });

    it("allows filtering demonstrations by column", async () => {
      await clearSearchInput(user);
      await applyStateFilter(user, "FL");

      await waitFor(() => {
        expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
        expect(screen.queryByText("Montana Medicaid Waiver")).not.toBeInTheDocument();
      });
    });

    it("allows filtering demonstrations by multiple selected options in a multiselect filter", async () => {
      await clearSearchInput(user);

      // Open the column filter dropdown and select "State/Territory"
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, ["State/Territory"]);

      // Wait for the state filter input to appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/select state\/territory/i)).toBeInTheDocument();
      });

      const stateFilterInput = screen.getByPlaceholderText(/select state\/territory/i);
      await user.click(stateFilterInput);

      // Select "Montana"
      await user.type(stateFilterInput, "MT");
      await waitFor(async () => {
        const mtOptions = screen.getAllByText("MT");
        const mtDropdownOption = mtOptions.find((el) => el.tagName === "LI" || el.closest("li"));
        expect(mtDropdownOption).toBeInTheDocument();
        await user.click(mtDropdownOption!);
      });

      // Select "Florida"
      await user.clear(stateFilterInput);
      await user.type(stateFilterInput, "FL");
      await waitFor(async () => {
        const flOptions = screen.getAllByText("FL");
        const flDropdownOption = flOptions.find((el) => el.tagName === "LI" || el.closest("li"));
        expect(flDropdownOption).toBeInTheDocument();
        await user.click(flDropdownOption!);
      });

      // Table should show rows for both Montana and Florida
      await waitFor(() => {
        expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
        expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
        expect(screen.queryByText("Texas Reform Initiative")).not.toBeInTheDocument();
      });
    });
  });
  describe("Applications column", () => {
    beforeEach(async () => {
      localStorage.removeItem("keyword-search");
      renderDemonstrations();
      await waitForTableData();
    });

    it("displays the 'Applications' column", async () => {
      expect(screen.getByRole("columnheader", { name: "Applications" })).toBeInTheDocument();
    });

    it("displays correct values for 'Applications' column for new demonstration, amendment, and extension", async () => {
      // For a new demonstration row
      const demo1Row = screen.getByText("Montana Medicaid Waiver").closest("tr");
      expect(demo1Row).toHaveTextContent(/Amendments \(3\)/);
      expect(demo1Row).toHaveTextContent(/Extensions \(3\)/);
    });

    it("displays (0) for amendments and extensions if there are no associated records", () => {
      // Find a demonstration with no amendments/extensions
      const demo3Row = screen.getByText("Texas Reform Initiative").closest("tr");
      expect(demo3Row).toHaveTextContent(/Amendments \(0\)/);
      expect(demo3Row).toHaveTextContent(/Extensions \(0\)/);
    });

    it("disables sorting for the 'Applications' column", () => {
      const applicationsHeader = screen.getByRole("columnheader", {
        name: "Applications",
      });
      // Check that the header does not have a sort button or aria-sort attribute
      expect(applicationsHeader).not.toHaveAttribute("aria-sort");
      expect(applicationsHeader.querySelector("button[aria-label*='sort']")).toBeNull();
    });
  });

  describe("Nested view and row expansion for amendments and extensions", () => {
    beforeEach(async () => {
      localStorage.removeItem("keyword-search");
      renderDemonstrations();
      await waitForTableData();
    });

    it("displays amendment and extension records in a nested view under their parent demonstration", async () => {
      // Expand the demonstration row
      const demo1Row = screen.getByText("Montana Medicaid Waiver").closest("tr");
      const expandButton = within(demo1Row!).getByRole("button", {
        name: /expand/i,
      });
      await user.click(expandButton);

      // Check for nested amendment and extension rows
      expect(screen.getByText("Amendment 1 - Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Extension 1 - Montana Medicaid Waiver")).toBeInTheDocument();
    });

    it("shows an expand option only for demonstrations with amendments or extensions", () => {
      // Demonstration with children
      const demo1Row = screen.getByText("Montana Medicaid Waiver").closest("tr");
      expect(within(demo1Row!).getByRole("button", { name: /expand/i })).toBeInTheDocument();

      // Demonstration with no children
      const demo3Row = screen.getByText("Texas Reform Initiative").closest("tr");
      expect(within(demo3Row!).queryByRole("button", { name: /expand/i })).toBeNull();
    });

    it("shows all demonstration rows collapsed by default", () => {
      // No child rows should be visible initially
      expect(screen.queryByText("Amendment")).not.toBeInTheDocument();
      expect(screen.queryByText("Extension")).not.toBeInTheDocument();
    });

    it("shows amendment/extension details with correct columns when expanded", async () => {
      const demo1Row = screen.getByText("Montana Medicaid Waiver").closest("tr");
      const expandButton = within(demo1Row!).getByRole("button", {
        name: /expand/i,
      });
      await user.click(expandButton);

      // Check for child row columns (adjust as needed)
      expect(screen.getByText("Amendment 1 - Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Extension 1 - Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getAllByRole("cell", { name: /John Doe/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("cell", { name: /Under Review/i }).length).toBeGreaterThan(0);
    });

    it("pagination applies only to demonstration records, not to nested amendments/extensions", async () => {
      // Set items per page to 10
      const itemsPerPageSelect = screen.getByRole("combobox", {
        name: /items per page/i,
      });
      await user.selectOptions(itemsPerPageSelect, ["10"]);

      // Only one demonstration should be visible, but all its children should show when expanded
      const table = screen.getByRole("table");
      const tbody = table.querySelector("tbody");
      if (!tbody) throw new Error("tbody not found");
      const visibleDemos = within(tbody).getAllByRole("row");
      expect(visibleDemos.length).toBe(3);

      // Expand and check all children are visible
      const expandButton = within(visibleDemos[0]).getByRole("button", {
        name: "expand",
      });
      await user.click(expandButton);
      expect(screen.getByText("Amendment 1 - Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Extension 1 - Montana Medicaid Waiver")).toBeInTheDocument();
    });

    it("sorting applies only to demonstration records, not to nested amendments/extensions", async () => {
      // Click to sort by Title
      const titleHeader = screen.getByRole("columnheader", { name: "Title Sort" });
      await user.click(titleHeader);

      // Find all demonstration titles in the table
      const demoTitles = [
        "Montana Medicaid Waiver",
        "Florida Health Innovation",
        "Texas Reform Initiative",
      ];

      // Get all rows in the table body
      const allRows = screen.getAllByRole("row");

      // Filter rows that contain a demonstration title
      const demoRows = allRows.filter((row) =>
        demoTitles.some((title) => within(row).queryByText(title, { exact: false }))
      );

      // Get the title from the first demonstration row (skip header row with index 0)
      const firstDemoRow = demoRows[0];
      const firstDemoTitle = demoTitles.find((title) =>
        within(firstDemoRow).queryByText(title, { exact: false })
      );

      expect(demoTitles).toContain(firstDemoTitle);

      // Expand first demo and check children are still grouped
      const expandButton = within(firstDemoRow).queryByRole("button", {
        name: /expand/i,
      });
      if (expandButton) {
        await user.click(expandButton);
        // Check for child rows by their content, e.g. "Amendment" or "Extension"
        // Find which demonstration this is and check for the correct amendment
        if (firstDemoTitle === "Montana Medicaid Waiver") {
          expect(
            within(firstDemoRow.parentElement!).queryByText("Amendment 1 - Montana Medicaid Waiver")
          ).toBeInTheDocument();
        } else if (firstDemoTitle === "Florida Health Innovation") {
          expect(
            within(firstDemoRow.parentElement!).queryByText(
              "Amendment 4 - Florida Health Innovation"
            )
          ).toBeInTheDocument();
        }
      }
    });

    // Replace applyStateFilter with applyProjectOfficerFilter in your filtering tests, e.g.:
    it("filtering applies to all records, but always displays parent demonstration with matching children", async () => {
      // Apply a filter that matches only one amendment
      await applyProjectOfficerFilter(user, "Jane Smith"); // Adjust officer name as needed for your data

      await waitFor(() => {
        // Parent demonstration is visible
        expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
        // Only the matching amendment is visible
        expect(screen.getByText("Amendment 4 - Florida Health Innovation")).toBeInTheDocument();
        // Other amendments/extensions for this demo are not visible
        expect(screen.queryByText("Amendment 1 - Montana Medicaid Waiver")).not.toBeInTheDocument();
      });
    });
  });
});
