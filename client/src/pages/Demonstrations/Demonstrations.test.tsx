import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import {
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

import { Demonstrations, DEMONSTRATIONS_TABLE_QUERY } from "./Demonstrations";
import { GET_PROJECT_OFFICERS_FOR_SELECT, GET_STATES_FOR_SELECT } from "./DemonstrationColumns";

const mockDemonstrations = [
  {
    id: "1",
    name: "Montana Medicaid Waiver",
    description: "Montana waiver demonstration",
    demonstrationStatus: { id: "1", name: "Active" },
    state: { id: "MT", stateName: "Montana", stateCode: "MT" },
    projectOfficer: { id: "1", fullName: "John Doe" },
    users: [{ id: "1", fullName: "Current User" }],
  },
  {
    id: "2",
    name: "Florida Health Innovation",
    description: "Florida innovation demonstration",
    demonstrationStatus: { id: "2", name: "Pending" },
    state: { id: "FL", stateName: "Florida", stateCode: "FL" },
    projectOfficer: { id: "2", fullName: "Jane Smith" },
    users: [{ id: "2", fullName: "Other User" }],
  },
  {
    id: "3",
    name: "Texas Reform Initiative",
    description: "Texas reform demonstration",
    demonstrationStatus: { id: "3", name: "Active" },
    state: { id: "TX", stateName: "Texas", stateCode: "TX" },
    projectOfficer: { id: "3", fullName: "Bob Johnson" },
    users: [{ id: "1", fullName: "Current User" }],
  },
];

const mocks = [
  {
    request: {
      query: DEMONSTRATIONS_TABLE_QUERY,
    },
    result: {
      data: {
        demonstrations: mockDemonstrations,
      },
    },
  },
  {
    request: {
      query: GET_STATES_FOR_SELECT,
    },
    result: {
      data: {
        states: [
          {
            stateCode: "NC",
            stateName: "North Carolina",
          },
          {
            stateCode: "CA",
            stateName: "California",
          },
          {
            stateCode: "TX",
            stateName: "Texas",
          },
          {
            stateCode: "FL",
            stateName: "Florida",
          },
          {
            stateCode: "NY",
            stateName: "New York",
          },
          {
            stateCode: "WA",
            stateName: "Washington",
          },
          {
            stateCode: "IL",
            stateName: "Illinois",
          },
          {
            stateCode: "PA",
            stateName: "Pennsylvania",
          },
          {
            stateCode: "OH",
            stateName: "Ohio",
          },
        ],
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_OFFICERS_FOR_SELECT,
    },
    result: {
      data: {
        users: [{
          id: "1",
          fullName: "John Doe",
        },
        {
          id: "2",
          fullName: "Leia Organa",
        },
        {
          id: "3",
          fullName: "Han Solo",
        },
        {
          id: "4",
          fullName: "Luke Skywalker",
        },
        {
          id: "5",
          fullName: "Darth Vader",
        }],
      },
    },
  },
];

const errorMock = [
  {
    request: {
      query: DEMONSTRATIONS_TABLE_QUERY,
    },
    error: new Error("GraphQL error occurred"),
  },
  {
    request: {
      query: GET_STATES_FOR_SELECT,
    },
    result: {
      data: {
        states: [
          {
            stateCode: "NC",
            stateName: "North Carolina",
          },
          {
            stateCode: "CA",
            stateName: "California",
          },
          {
            stateCode: "TX",
            stateName: "Texas",
          },
        ],
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_OFFICERS_FOR_SELECT,
    },
    result: {
      data: {
        users: [
          {
            id: "1",
            fullName: "John Doe",
          },
          {
            id: "2",
            fullName: "Jane Smith",
          },
        ],
      },
    },
  },
];

const emptyMocks = [
  {
    request: {
      query: DEMONSTRATIONS_TABLE_QUERY,
    },
    result: {
      data: {
        demonstrations: [],
      },
    },
  },
  {
    request: {
      query: GET_STATES_FOR_SELECT,
    },
    result: {
      data: {
        states: [
          {
            stateCode: "NC",
            stateName: "North Carolina",
          },
          {
            stateCode: "CA",
            stateName: "California",
          },
          {
            stateCode: "TX",
            stateName: "Texas",
          },
        ],
      },
    },
  },
  {
    request: {
      query: GET_PROJECT_OFFICERS_FOR_SELECT,
    },
    result: {
      data: {
        users: [
          {
            id: "1",
            fullName: "John Doe",
          },
          {
            id: "2",
            fullName: "Jane Smith",
          },
        ],
      },
    },
  },
];

describe("Demonstrations", () => {
  it("renders the page title", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    // Wait for the GraphQL query to complete and data to load
    await waitFor(() => {
      expect(screen.getByText("Demonstrations")).toBeInTheDocument();
    });
  });

  it("shows loading state initially", () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles GraphQL errors gracefully", async () => {
    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error loading demonstrations:")).toBeInTheDocument();
    });
  });

  it("renders tab navigation with correct counts", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/My Demonstrations/)).toBeInTheDocument();
      expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
    });

    // Check tab counts using regex that includes the parentheses
    expect(screen.getByText(/My Demonstrations.*\(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/All Demonstrations.*\(3\)/)).toBeInTheDocument();
  });

  it("defaults to 'My Demonstrations' tab", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      const myDemosTab = screen.getByText(/My Demonstrations/);
      expect(myDemosTab.closest("button")).toHaveAttribute("aria-selected", "true");
    });
  });

  it("switches between tabs correctly", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
    });

    // Switch to All Demonstrations tab
    const allDemosTab = screen.getByText(/All Demonstrations/);
    await user.click(allDemosTab);

    expect(allDemosTab.closest("button")).toHaveAttribute("aria-selected", "true");

    // Switch back to My Demonstrations tab
    const myDemosTab = screen.getByText(/All Demonstrations/);
    await user.click(myDemosTab);

    expect(myDemosTab.closest("button")).toHaveAttribute("aria-selected", "true");
  });

  it("passes correct empty message for My Demonstrations tab", async () => {
    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("You have no assigned demonstrations at this time.")).toBeInTheDocument();
    });
  });

  it("passes correct empty message for All Demonstrations tab", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
    });

    // Switch to All Demonstrations tab
    const allDemosTab = screen.getByText(/All Demonstrations/);
    await user.click(allDemosTab);

    expect(screen.getByText("No demonstrations are tracked.")).toBeInTheDocument();
  });

  // Table rendering tests
  it("renders table with correct demonstrations on My Demonstrations tab", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      // Should show only demonstrations assigned to current user (id: "1")
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();

      // Should not show demonstration not assigned to current user
      expect(screen.queryByText("Florida Health Innovation")).not.toBeInTheDocument();
    });
  });

  it("renders table with all demonstrations on All Demonstrations tab", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
    });

    // Switch to All Demonstrations tab
    const allDemosTab = screen.getByText(/All Demonstrations/);
    await user.click(allDemosTab);

    await waitFor(() => {
      // Should show all demonstrations
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
    });
  });

  it("renders table columns correctly", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      // Use columnheader role instead of text
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(5); // Including the checkbox column and empty column
    });

    // Then check for specific text within column headers
    expect(screen.getByRole("columnheader", { name: "Title" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "State/Territory" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Project Officer" })).toBeInTheDocument();
  });

  it("renders demonstration data correctly in table cells", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      // Check specific data is rendered
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Montana")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();

      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.getByText("Texas")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });
  });

  it("renders action buttons for each demonstration", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      // Should have View buttons for each demonstration shown (2 on My Demonstrations tab)
      const viewButtons = screen.getAllByText("View");
      expect(viewButtons).toHaveLength(2);
    });
  });

  it("includes table features (search, filter, pagination)", async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      // Check for search functionality
      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();

      // Check for filter functionality
      expect(screen.getByLabelText(/filter by:/i)).toBeInTheDocument();

      // Check for pagination (should be rendered even with few items)
      expect(screen.getByText("Items per page:")).toBeInTheDocument();
    });
  });

  it("allows searching within demonstrations", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    // Search for "Montana"
    const searchInput = screen.getByLabelText(/keyword search/i);
    await user.type(searchInput, "Montana");

    await waitFor(() => {
      // Should show only Montana demonstration
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "Montana Medicaid Waiver";
        })
      ).toBeInTheDocument();
      expect(screen.queryByText("Texas Reform Initiative")).not.toBeInTheDocument();
    });
  });

  it("allows filtering demonstrations by column", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    // Switch to All Demonstrations using regex or role-based selector
    const allDemosTab = screen.getByText(/All Demonstrations/);
    await user.click(allDemosTab);

    // Clear any existing search first
    const searchInput = screen.getByLabelText(/keyword search/i);
    await user.clear(searchInput);

    // Select state filter from column dropdown
    const columnSelect = screen.getByLabelText(/choose column to filter/i);
    await user.selectOptions(columnSelect, ["stateName"]);

    // Wait for the state filter dropdown to appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/filter state\/territory/i)).toBeInTheDocument();
    });

    // Filter by "Texas" using the state filter dropdown
    const stateFilterSelect = screen.getByPlaceholderText(/filter state\/territory/i);
    // Click to open the dropdown
    await user.click(stateFilterSelect);
    
    // Wait for the dropdown to appear within the parent container
    await waitFor(() => {
      const parentContainer = stateFilterSelect.parentElement;
      const dropdown = within(parentContainer).getByRole("list");
      expect(dropdown).toBeInTheDocument();
    });
    
    // Find and click the Texas option within the parent container
    const parentContainer = stateFilterSelect.parentElement;
    const dropdown = within(parentContainer).getByRole("list");
    const texasOption = within(dropdown).getByText("Texas");
    await user.click(texasOption);

    await waitFor(() => {
      // Should show only Texas demonstration
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.queryByText("Montana Medicaid Waiver")).not.toBeInTheDocument();
    });
  });

  it("maintains tab state when switching between tabs with data", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      // Start on My Demonstrations - should show 2 items
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.queryByText("Florida Health Innovation")).not.toBeInTheDocument();
    });

    // Switch to All Demonstrations using regex or role-based selector
    const allDemosTab = screen.getByText(/All Demonstrations/);
    await user.click(allDemosTab);

    await waitFor(() => {
      // Should now show all 3 items
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.getByText("Florida Health Innovation")).toBeInTheDocument();
    });

    // Switch back to My Demonstrations
    const myDemosTab = screen.getByText(/My Demonstrations/);
    await user.click(myDemosTab);

    await waitFor(() => {
      // Should be back to 2 items
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
      expect(screen.getByText("Texas Reform Initiative")).toBeInTheDocument();
      expect(screen.queryByText("Florida Health Innovation")).not.toBeInTheDocument();
    });
  });

  it("shows correct no results message when search returns no results", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Montana Medicaid Waiver")).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByLabelText(/keyword search/i);
    await user.type(searchInput, "NonexistentDemo");

    await waitFor(() => {
      expect(screen.getByText("No results were returned. Adjust your search and filter criteria.")).toBeInTheDocument();
    });
  });
});
