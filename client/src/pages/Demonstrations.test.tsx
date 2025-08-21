import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DemosApolloProvider } from "router/DemosApolloProvider";
import { Demonstrations, DEMONSTRATIONS_PAGE_QUERY } from "./Demonstrations";
import { stateOptions } from "mock-data/stateMocks";
import { userOptions } from "mock-data/userMocks";
import { demonstrationStatusOptions } from "mock-data/demonstrationStatusMocks";
import { MockedProvider } from "@apollo/client/testing";

describe("Tab navigation", () => {
  beforeEach(async () => {
    render(
      <DemosApolloProvider>
        <Demonstrations />
      </DemosApolloProvider>
    );
  });

  it("renders tab navigation with correct counts", () => {
    waitFor(() => {
      expect(screen.getByText(/My Demonstrations/)).toBeInTheDocument();
      expect(screen.getByText(/All Demonstrations/)).toBeInTheDocument();
      expect(screen.getByText(/My Demonstrations.*\(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/All Demonstrations.*\(14\)/)).toBeInTheDocument();
    });
  });

  it("defaults to 'My Demonstrations' tab", async () => {
    await waitFor(() => {
      screen.getByRole("table");
    });
    const myDemosTab = screen.getByText(/My Demonstrations/);
    expect(myDemosTab.closest("button")).toHaveAttribute("aria-selected", "true");

    const allDemosTab = screen.getByText(/All Demonstrations/);
    expect(allDemosTab.closest("button")).not.toHaveAttribute("aria-selected", "true");
  });

  it("switches between tabs correctly", async () => {
    await waitFor(() => {
      screen.getByRole("table");
    });

    const allDemosTab = screen.getByText(/All Demonstrations/);
    await userEvent.click(allDemosTab);
    expect(allDemosTab.closest("button")).toHaveAttribute("aria-selected", "true");

    const myDemosTab = screen.getByText(/My Demonstrations/);
    await userEvent.click(myDemosTab);
    expect(myDemosTab.closest("button")).toHaveAttribute("aria-selected", "true");
  });

  it("maintains tab state when switching between tabs with data", async () => {
    await waitFor(() => {
      screen.getByRole("table");
    });

    expect(screen.queryByText("Montana Medicaid Waiver")).toBeInTheDocument();
    expect(screen.queryByText("Florida Health Innovation")).not.toBeInTheDocument();

    const allDemosTab = screen.getByText(/All Demonstrations/);
    await userEvent.click(allDemosTab);

    expect(screen.queryByText("Montana Medicaid Waiver")).toBeInTheDocument();
    expect(screen.queryByText("Florida Health Innovation")).toBeInTheDocument();
  });
});

describe("Empty table states", () => {
  const emptyDemonstrationMock = [
    {
      request: { query: DEMONSTRATIONS_PAGE_QUERY },
      result: {
        data: {
          stateOptions: stateOptions,
          projectOfficerOptions: userOptions,
          statusOptions: demonstrationStatusOptions,
          demonstrations: [],
        },
      },
    },
  ];

  beforeEach(async () => {
    render(
      <MockedProvider mocks={emptyDemonstrationMock} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );
  });

  it("displays correct message for no demonstrations", async () => {
    await waitFor(() => {
      screen.getByRole("table");
    });

    expect(
      screen.getByText("You have no assigned demonstrations at this time.")
    ).toBeInTheDocument();

    const allDemosTab = screen.getByText(/All Demonstrations/);
    await userEvent.click(allDemosTab);

    expect(screen.getByText("No demonstrations are tracked.")).toBeInTheDocument();
  });
});

describe("Graphql loading states", () => {
  it("displays loading state initially", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays error state on graphql error", async () => {
    const errorMock = [
      {
        request: { query: DEMONSTRATIONS_PAGE_QUERY },
        error: new Error("An error occurred"),
      },
    ];

    render(
      <MockedProvider mocks={errorMock} addTypename={false}>
        <Demonstrations />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error loading demonstrations.")).toBeInTheDocument();
    });
  });
});
