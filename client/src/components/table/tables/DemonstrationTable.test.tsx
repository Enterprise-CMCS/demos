import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { demonstrationMocks } from "mock-data/demonstrationMocks";
import { userMocks } from "mock-data/userMocks";
import { stateMocks } from "mock-data/stateMocks";
import { demonstrationStatusMocks } from "mock-data/demonstrationStatusMocks";
import { DemonstrationTable } from "./DemonstrationTable";
import { DEMONSTRATION_TABLE_QUERY } from "queries/demonstrationQueries";

const standardMocks = [
  ...demonstrationMocks,
  ...userMocks,
  ...stateMocks,
  ...demonstrationStatusMocks,
];

const emptyDemonstrationsMock = {
  request: {
    query: DEMONSTRATION_TABLE_QUERY,
  },
  result: {
    data: {
      demonstrations: [],
    },
  },
};

// Helper functions
const renderDemonstrations = (mocks = standardMocks) => {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <DemonstrationTable />
    </MockedProvider>
  );
};

const waitForTableData = async () => {
  await waitFor(() => {
    expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
  });
};

const switchToAllDemonstrationsTab = async (
  user: ReturnType<typeof userEvent.setup>
) => {
  const allDemosTab = screen.getByText(/All Demonstrations/);
  await user.click(allDemosTab);
};

const switchToMyDemonstrationsTab = async (
  user: ReturnType<typeof userEvent.setup>
) => {
  const myDemosTab = screen.getByText(/My Demonstrations/);
  await user.click(myDemosTab);
};

const clearSearchInput = async (user: ReturnType<typeof userEvent.setup>) => {
  const searchInput = screen.getByLabelText(/keyword search/i);
  await user.clear(searchInput);
};

const searchForText = async (
  user: ReturnType<typeof userEvent.setup>,
  searchText: string
) => {
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
    expect(
      screen.getByPlaceholderText(/select project officer/i)
    ).toBeInTheDocument();
  });

  // Filter by the specified project officer
  const officerFilterInput = screen.getByPlaceholderText(
    /select project officer/i
  );
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
  const officerOptionToClick = officerOptions.find(
    (el) => el.tagName === "LI" || el.closest("li")
  );
  await user.click(officerOptionToClick!);
};

const applyStateFilter = async (
  user: ReturnType<typeof userEvent.setup>,
  stateCode: string
) => {
  // Select state filter from column dropdown
  const columnSelect = screen.getByLabelText(/filter by:/i);
  await user.selectOptions(columnSelect, ["State/Territory"]);

  // Wait for the state filter input to appear
  await waitFor(() => {
    expect(
      screen.getByPlaceholderText(/select state\/territory/i)
    ).toBeInTheDocument();
  });

  // Filter by the specified state
  const stateFilterInput = screen.getByPlaceholderText(
    /select state\/territory/i
  );
  await user.type(stateFilterInput, stateCode);

  // Wait for dropdown and select state
  await waitFor(() => {
    const stateOptions = screen.getAllByText(stateCode);
    const stateDropdownOption = stateOptions.find(
      (el) => el.tagName === "LI" || el.closest("li")
    );
    expect(stateDropdownOption).toBeInTheDocument();
  });

  const stateOptions = screen.getAllByText(stateCode);
  const stateOptionToClick = stateOptions.find(
    (el) => el.tagName === "LI" || el.closest("li")
  );
  await user.click(stateOptionToClick!);
};

const expectMyDemonstrationResults = () => {
  expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
  expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
  expect(
    screen.queryByText("Florida Health Innovation")
  ).not.toBeInTheDocument();
};

const expectAllDemonstrationResults = () => {
  expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
  expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
  expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
};

describe("Demonstrations", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("Basic rendering", () => {
    it("shows loading state initially", () => {
      renderDemonstrations();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("handles GraphQL errors gracefully", async () => {
      renderDemonstrations([
        ...userMocks,
        ...stateMocks,
        ...demonstrationStatusMocks,
      ]);
      await waitFor(() => {
        expect(
          screen.getByText("Error loading demonstrations")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Tab navigation", () => {
    beforeEach(async () => {
      renderDemonstrations();
      await waitForTableData();
    });

    it("renders tab navigation with correct counts", () => {
      expect(screen.getByText(/My Demonstrations/)).toBeInTheDocument();
      expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
      expect(screen.getByText(/My Demonstrations.*\(2\)/)).toBeInTheDocument();
      expect(
        screen.getByText(/All Demonstrations.*\(14\)/)
      ).toBeInTheDocument();
    });

    it("defaults to 'My Demonstrations' tab", () => {
      const myDemosTab = screen.getByText(/My Demonstrations/);
      expect(myDemosTab.closest("button")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("switches between tabs correctly", async () => {
      await switchToAllDemonstrationsTab(user);
      const allDemosTab = screen.getByText(/All Demonstrations/);
      expect(allDemosTab.closest("button")).toHaveAttribute(
        "aria-selected",
        "true"
      );

      await switchToMyDemonstrationsTab(user);
      const myDemosTab = screen.getByText(/My Demonstrations/);
      expect(myDemosTab.closest("button")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("maintains tab state when switching between tabs with data", async () => {
      await waitForTableData();
      expectMyDemonstrationResults();

      await switchToAllDemonstrationsTab(user);
      await waitFor(() => expectAllDemonstrationResults());

      await switchToMyDemonstrationsTab(user);
      await waitFor(() => expectMyDemonstrationResults());
    });
  });

  describe("Empty states", () => {
    const emptyMocks = [
      emptyDemonstrationsMock,
      ...userMocks,
      ...stateMocks,
      ...demonstrationStatusMocks,
    ];

    it("passes correct empty message for My Demonstrations tab", async () => {
      renderDemonstrations(emptyMocks);
      await waitFor(() => {
        expect(
          screen.getByText("You have no assigned demonstrations at this time.")
        ).toBeInTheDocument();
      });
    });

    it("passes correct empty message for All Demonstrations tab", async () => {
      renderDemonstrations(emptyMocks);
      await waitFor(() => {
        expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
      });

      await switchToAllDemonstrationsTab(user);
      expect(
        screen.getByText("No demonstrations are tracked.")
      ).toBeInTheDocument();
    });
  });

  describe("Table rendering", () => {
    beforeEach(async () => {
      renderDemonstrations();
      await waitForTableData();
    });

    it("renders table with correct demonstrations on My Demonstrations tab", () => {
      expectMyDemonstrationResults();
    });

    it("renders table with all demonstrations on All Demonstrations tab", async () => {
      await switchToAllDemonstrationsTab(user);
      await waitFor(() => expectAllDemonstrationResults());
    });

    it("renders table columns correctly", () => {
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(8);
      expect(
        screen.getByRole("columnheader", { name: "Title" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "State/Territory" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Project Officer" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Applications" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Status" })
      ).toBeInTheDocument();
    });

    it("renders demonstration data correctly in table cells", () => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Montana")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.getByText("Texas")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });

    it("renders action buttons for each demonstration", () => {
      const viewButtons = screen.getAllByText("View");
      expect(viewButtons).toHaveLength(2);
    });
  });

  describe("Table features", () => {
    beforeEach(async () => {
      renderDemonstrations();
      await waitForTableData();
    });

    it("includes table features (search, filter, pagination)", () => {
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();
      expect(screen.getByText("Items per page:")).toBeInTheDocument();
    });

    it("allows searching within demonstrations", async () => {
      await searchForText(user, "Montana");
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.textContent === "Montana Medicaid Waiver";
          })
        ).toBeInTheDocument();
        expect(
          screen.queryByText("Texas Reform Initiative")
        ).not.toBeInTheDocument();
      });
    });

    it("shows correct no results message when search returns no results", async () => {
      await searchForText(user, "NonexistentDemo");
      await waitFor(() => {
        expect(
          screen.getByText(
            "No results were returned. Adjust your search and filter criteria."
          )
        ).toBeInTheDocument();
      });
    });

    it("allows filtering demonstrations by column", async () => {
      await switchToAllDemonstrationsTab(user);
      await clearSearchInput(user);
      await applyStateFilter(user, "TX");

      await waitFor(() => {
        expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
        expect(
          screen.queryByText("Montana Medicaid Waiver")
        ).not.toBeInTheDocument();
      });
    });

    it("allows filtering demonstrations by multiple selected options in a multiselect filter", async () => {
      await switchToAllDemonstrationsTab(user);
      await clearSearchInput(user);

      // Open the column filter dropdown and select "State/Territory"
      const columnSelect = screen.getByLabelText(/filter by:/i);
      await user.selectOptions(columnSelect, ["State/Territory"]);

      // Wait for the state filter input to appear
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/select state\/territory/i)
        ).toBeInTheDocument();
      });

      const stateFilterInput = screen.getByPlaceholderText(
        /select state\/territory/i
      );
      await user.click(stateFilterInput);

      // Select "Montana"
      await user.type(stateFilterInput, "MT");
      await waitFor(() => {
        const mtOptions = screen.getAllByText("MT");
        const mtDropdownOption = mtOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(mtDropdownOption).toBeInTheDocument();
        user.click(mtDropdownOption!);
      });

      // Select "Texas"
      await user.clear(stateFilterInput);
      await user.type(stateFilterInput, "TX");
      await waitFor(() => {
        const txOptions = screen.getAllByText("TX");
        const txDropdownOption = txOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(txDropdownOption).toBeInTheDocument();
        user.click(txDropdownOption!);
      });

      // Table should show rows for both Montana and Texas
      await waitFor(() => {
        expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
        expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
        expect(
          screen.queryByText("Florida Health Innovation")
        ).not.toBeInTheDocument();
      });
    });
  });
  describe("Applications column", () => {
    beforeEach(async () => {
      renderDemonstrations();
      await waitForTableData();
    });

    it("displays the 'Applications' column for both My Demonstrations and All Demonstrations tabs", async () => {
      // My Demonstrations tab
      expect(
        screen.getByRole("columnheader", { name: "Applications" })
      ).toBeInTheDocument();

      // Switch to All Demonstrations tab
      await switchToAllDemonstrationsTab(user);
      expect(
        screen.getByRole("columnheader", { name: "Applications" })
      ).toBeInTheDocument();
    });

    it("displays correct values for 'Applications' column for new demonstration, amendment, and extension", async () => {
      // For a new demonstration row
      const montanaRow = screen
        .getByText("Montana Medicaid Waiver")
        .closest("tr");
      expect(montanaRow).toHaveTextContent(/Amendments \(2\)/);
      expect(montanaRow).toHaveTextContent(/Extensions \(1\)/);
    });

    it("displays (0) for amendments and extensions if there are no associated records", () => {
      // Find a demonstration with no amendments/extensions
      const floridaRow = screen
        .getByText("Texas Reform Initiative")
        .closest("tr");
      expect(floridaRow).toHaveTextContent(/Amendments \(0\)/);
      expect(floridaRow).toHaveTextContent(/Extensions \(0\)/);
    });

    it("disables sorting for the 'Applications' column", () => {
      const applicationsHeader = screen.getByRole("columnheader", {
        name: "Applications",
      });
      // Check that the header does not have a sort button or aria-sort attribute
      expect(applicationsHeader).not.toHaveAttribute("aria-sort");
      expect(
        applicationsHeader.querySelector("button[aria-label*='sort']")
      ).toBeNull();
    });
  });

  describe("Nested view and row expansion for amendments and extensions", () => {
    beforeEach(async () => {
      renderDemonstrations();
      await waitForTableData();
    });

    it("displays amendment and extension records in a nested view under their parent demonstration", async () => {
      // Expand the demonstration row
      const montanaRow = screen
        .getByText("Montana Medicaid Waiver")
        .closest("tr");
      const expandButton = within(montanaRow!).getByRole("button", {
        name: /expand/i,
      });
      await user.click(expandButton);

      // Check for nested amendment and extension rows
      expect(
        screen.getByText("Amendment 1 - Montana Medicaid Waiver")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Extension 1 - Montana Medicaid Waiver")
      ).toBeInTheDocument();
    });

    it("shows an expand option only for demonstrations with amendments or extensions", () => {
      // Demonstration with children
      const montanaRow = screen
        .getByText("Montana Medicaid Waiver")
        .closest("tr");
      expect(
        within(montanaRow!).getByRole("button", { name: /expand/i })
      ).toBeInTheDocument();

      // Demonstration with no children
      const texasRow = screen
        .getByText("Texas Reform Initiative")
        .closest("tr");
      expect(
        within(texasRow!).queryByRole("button", { name: /expand/i })
      ).toBeNull();
    });

    it("shows all demonstration rows collapsed by default", () => {
      // No child rows should be visible initially
      expect(screen.queryByText("Amendment")).not.toBeInTheDocument();
      expect(screen.queryByText("Extension")).not.toBeInTheDocument();
    });

    it("shows amendment/extension details with correct columns when expanded", async () => {
      const montanaRow = screen
        .getByText("Montana Medicaid Waiver")
        .closest("tr");
      const expandButton = within(montanaRow!).getByRole("button", {
        name: /expand/i,
      });
      await user.click(expandButton);

      // Check for child row columns (adjust as needed)
      expect(
        screen.getByText("Amendment 1 - Montana Medicaid Waiver")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Extension 1 - Montana Medicaid Waiver")
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("cell", { name: /John Doe/i }).length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("cell", { name: /Approved/i }).length
      ).toBeGreaterThan(0);
    });

    it("pagination applies only to demonstration records, not to nested amendments/extensions", async () => {
      // Switch to All Demonstrations tab
      await switchToAllDemonstrationsTab(user);

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
      expect(visibleDemos.length).toBe(10);

      // Expand and check all children are visible
      const expandButton = within(visibleDemos[0]).getByRole("button", {
        name: "expand",
      });
      await user.click(expandButton);
      expect(
        screen.getByText("Amendment 1 - Montana Medicaid Waiver")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Extension 1 - Montana Medicaid Waiver")
      ).toBeInTheDocument();
    });

    it("sorting applies only to demonstration records, not to nested amendments/extensions", async () => {
      // Switch to All Demonstrations tab
      await switchToAllDemonstrationsTab(user);

      // Click to sort by Title
      const titleHeader = screen.getByRole("columnheader", { name: "Title" });
      await user.click(titleHeader);

      // Find all demonstration titles in the table
      const demoTitles = [
        "Montana Medicaid Waiver",
        "Texas Reform Initiative",
        "Florida Health Innovation",
      ];

      // Get all rows in the table body
      const allRows = screen.getAllByRole("row");

      // Filter rows that contain a demonstration title
      const demoRows = allRows.filter((row) =>
        demoTitles.some((title) =>
          within(row).queryByText(title, { exact: false })
        )
      );

      // Get the title from the first demonstration row
      const firstDemoRow = demoRows[1];
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
        expect(
          within(firstDemoRow.parentElement!).queryByText(
            "Amendment 1 - Montana Medicaid Waiver"
          )
        ).toBeInTheDocument();
      }
    });

    it("search applies to all records, but always displays parent demonstration with matching children", async () => {
      // Switch to All Demonstrations tab
      await switchToAllDemonstrationsTab(user);

      // Search for a unique amendment name
      await searchForText(user, "Jim");
      await waitFor(() => {
        // Parent demonstration is visible
        expect(
          screen.getByText("Florida Health Innovation")
        ).toBeInTheDocument();
        // Only the matching amendment is visible
        expect(
          screen.getByText("Amendment 2 - Florida Health Innovation")
        ).toBeInTheDocument();
        // Other amendments/extensions for this demo are not visible
        expect(screen.queryByText("Amendment 3")).not.toBeInTheDocument();
      });
    });

    // Replace applyStateFilter with applyProjectOfficerFilter in your filtering tests, e.g.:
    it("filtering applies to all records, but always displays parent demonstration with matching children", async () => {
      // Switch to All Demonstrations tab
      await switchToAllDemonstrationsTab(user);

      // Apply a filter that matches only one amendment
      await applyProjectOfficerFilter(user, "Jim Smith"); // Adjust officer name as needed for your data

      await waitFor(() => {
        // Parent demonstration is visible
        expect(
          screen.getByText("Florida Health Innovation")
        ).toBeInTheDocument();
        // Only the matching amendment is visible
        expect(
          screen.getByText("Amendment 2 - Florida Health Innovation")
        ).toBeInTheDocument();
        // Other amendments/extensions for this demo are not visible
        expect(screen.queryByText("Amendment 3")).not.toBeInTheDocument();
      });
    });
  });
});
