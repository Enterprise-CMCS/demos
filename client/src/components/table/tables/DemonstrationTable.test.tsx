import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

const applyStateFilter = async (
  user: ReturnType<typeof userEvent.setup>,
  stateCode: string
) => {
  // Select state filter from column dropdown
  const columnSelect = screen.getByLabelText(/filter by:/i);
  await user.type(columnSelect, "State/Territory");

  // Wait for dropdown option to appear and click it
  await waitFor(() => {
    const dropdownOptions = screen.getAllByText("State/Territory");
    const dropdownOption = dropdownOptions.find(
      (el) => el.tagName === "LI" || el.closest("li")
    );
    expect(dropdownOption).toBeInTheDocument();
  });

  const stateDropdownOptions = screen.getAllByText("State/Territory");
  const stateDropdownOption = stateDropdownOptions.find(
    (el) => el.tagName === "LI" || el.closest("li")
  );
  await user.click(stateDropdownOption!);

  // Wait for the state filter input to appear
  await waitFor(() => {
    expect(
      screen.getByPlaceholderText(/filter state\/territory/i)
    ).toBeInTheDocument();
  });

  // Filter by the specified state
  const stateFilterInput = screen.getByPlaceholderText(
    /filter state\/territory/i
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
      expect(screen.getByText(/All Demonstrations.*\(3\)/)).toBeInTheDocument();
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
      expect(headers).toHaveLength(6);
      expect(
        screen.getByRole("columnheader", { name: "Title" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "State/Territory" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "Project Officer" })
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
      await user.type(columnSelect, "State/Territory");

      await waitFor(() => {
        const dropdownOptions = screen.getAllByText("State/Territory");
        const dropdownOption = dropdownOptions.find(
          (el) => el.tagName === "LI" || el.closest("li")
        );
        expect(dropdownOption).toBeInTheDocument();
      });

      const stateDropdownOptions = screen.getAllByText("State/Territory");
      const stateDropdownOption = stateDropdownOptions.find(
        (el) => el.tagName === "LI" || el.closest("li")
      );
      await user.click(stateDropdownOption!);

      // Wait for the state filter input to appear
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/filter state\/territory/i)
        ).toBeInTheDocument();
      });

      const stateFilterInput = screen.getByPlaceholderText(
        /filter state\/territory/i
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
});
