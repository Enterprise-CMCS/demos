import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import { TestProvider } from "test-utils/TestProvider";
import { DialogProvider } from "components/dialog/DialogContext";
import { ManagedUser } from "../columns/UserManagementColumns";
import {
  UserManagementTable,
  USER_MANAGEMENT_QUERY,
  EDIT_STATES_DISABLED_TOOLTIP,
  EDIT_STATES_ENABLED_TOOLTIP,
} from "./UserManagementTable";

const buildUser = (
  id: string,
  fullName: string,
  personType: ManagedUser["person"]["personType"],
  states: { id: string; name: string }[],
  lastLogin: string | null
): ManagedUser => ({
  id,
  lastLogin: lastLogin as unknown as ManagedUser["lastLogin"],
  person: {
    id: `person-${id}`,
    fullName,
    email: `${fullName.toLowerCase().replace(" ", ".")}@cms.gov`,
    personType,
    states,
  },
});

const TEST_USERS: ManagedUser[] = [
  buildUser("1", "Zoe Adams", "demos-state-user", [], "2026-03-11T12:00:00.000Z"),
  buildUser("2", "Alice Brown", "demos-cms-user", [], "2026-02-28T12:00:00.000Z"),
  buildUser(
    "3",
    "Bob Clark",
    "demos-state-user",
    [
      { id: "TX", name: "Texas" },
      { id: "AL", name: "Alabama" },
    ],
    "2026-03-22T12:00:00.000Z"
  ),
  buildUser("4", "Carol Willick", "demos-admin", [], null),
  buildUser("5", "Dave Evans", "demos-state-user", [], "2026-04-03T12:00:00.000Z"),
];

const buildMocks = (users: ManagedUser[]): MockedResponse[] => [
  {
    request: { query: USER_MANAGEMENT_QUERY },
    result: { data: { users } },
  },
];

const setup = (users: ManagedUser[] = TEST_USERS) =>
  render(
    <TestProvider mocks={buildMocks(users)}>
      <DialogProvider>
        <UserManagementTable />
      </DialogProvider>
    </TestProvider>
  );

const getBodyRows = () => {
  const [, ...bodyRows] = screen.getAllByRole("row");
  return bodyRows;
};

// Column 0 is the row-selection checkbox; data columns start at 1.
const getColumnValues = (columnIndex: number) =>
  getBodyRows().map((row) => within(row).getAllByRole("cell")[columnIndex].textContent);

const getEditButton = () => screen.getByTestId("edit-user-states");

describe("UserManagementTable", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the five story columns behind a selection column", async () => {
    setup();

    await screen.findByRole("table");
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "Select",
      "Name",
      "Email",
      "IDM User Role",
      "Assigned to State(s)",
      "Last Login",
    ]);
  });

  it("maps person type to the IDM user role label", async () => {
    setup();

    await screen.findByRole("table");
    expect(screen.getByText("Alice Brown").closest("tr")).toHaveTextContent("CMS User");
    expect(screen.getByText("Carol Willick").closest("tr")).toHaveTextContent("Admin User");
    expect(screen.getByText("Bob Clark").closest("tr")).toHaveTextContent("State User");
  });

  it("shows All States for non-state users and alphabetized states for state users", async () => {
    setup();

    await screen.findByRole("table");
    expect(screen.getByText("Alice Brown").closest("tr")).toHaveTextContent("All States");
    expect(screen.getByText("Carol Willick").closest("tr")).toHaveTextContent("All States");
    // Supplied out of order; must render alphabetically.
    expect(screen.getByText("Bob Clark").closest("tr")).toHaveTextContent("Alabama, Texas");
  });

  it("shows a dash for state users with no assigned states", async () => {
    setup();

    await screen.findByRole("table");
    const zoeCells = within(screen.getByText("Zoe Adams").closest("tr")!).getAllByRole("cell");
    expect(zoeCells[4]).toHaveTextContent("-");
  });

  it("formats last login as MM/DD/YYYY and dashes when never logged in", async () => {
    setup();

    await screen.findByRole("table");
    expect(screen.getByText("Dave Evans").closest("tr")).toHaveTextContent("04/03/2026");
    const carolCells = within(screen.getByText("Carol Willick").closest("tr")!).getAllByRole(
      "cell"
    );
    expect(carolCells[5]).toHaveTextContent("-");
  });

  it("sorts unassigned records to the top, then alphabetically by name", async () => {
    setup();

    await screen.findByRole("table");
    expect(getColumnValues(1)).toEqual([
      "Dave Evans",
      "Zoe Adams",
      "Alice Brown",
      "Bob Clark",
      "Carol Willick",
    ]);
  });

  it("sorts by name when the Name header is clicked", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.click(screen.getByRole("columnheader", { name: /Name/ }));

    expect(getColumnValues(1)).toEqual([
      "Alice Brown",
      "Bob Clark",
      "Carol Willick",
      "Dave Evans",
      "Zoe Adams",
    ]);
  });

  it("filters rows by search input across displayed columns", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.type(screen.getByTestId("input-keyword-search"), "Alabama");

    await waitFor(() => expect(getBodyRows()).toHaveLength(1));
    expect(getColumnValues(1)).toEqual(["Bob Clark"]);
  });

  it("disables Edit with the selection tooltip when no user is selected", async () => {
    setup();

    await screen.findByRole("table");
    expect(getEditButton()).toBeDisabled();
    expect(getEditButton()).toHaveAttribute("title", EDIT_STATES_DISABLED_TOOLTIP);
  });

  it("enables Edit when exactly one State user is selected", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.click(screen.getByTestId("select-row-3"));

    expect(getEditButton()).toBeEnabled();
    expect(getEditButton()).toHaveAttribute("title", EDIT_STATES_ENABLED_TOOLTIP);
  });

  it("disables Edit when the single selected user is a CMS or Admin user", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.click(screen.getByTestId("select-row-2"));
    expect(getEditButton()).toBeDisabled();

    await user.click(screen.getByTestId("select-row-2"));
    await user.click(screen.getByTestId("select-row-4"));
    expect(getEditButton()).toBeDisabled();
    expect(getEditButton()).toHaveAttribute("title", EDIT_STATES_DISABLED_TOOLTIP);
  });

  it("disables Edit when more than one State user is selected", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.click(screen.getByTestId("select-row-3"));
    await user.click(screen.getByTestId("select-row-5"));

    expect(getEditButton()).toBeDisabled();
    expect(getEditButton()).toHaveAttribute("title", EDIT_STATES_DISABLED_TOOLTIP);
  });

  it("opens the Assign to State(s) dialog for the selected State user", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.click(screen.getByTestId("select-row-3"));
    await user.click(getEditButton());

    const dialog = await screen.findByTestId("assign-states-dialog");
    expect(within(dialog).getByText("Assign to State(s)")).toBeInTheDocument();
    expect(within(dialog).getByText("Bob Clark")).toBeInTheDocument();
    expect(within(dialog).getByTestId("select-assigned-states")).toHaveValue("Alabama, Texas");
  });

  it("shows the no-results message when nothing matches the search", async () => {
    const user = userEvent.setup();
    setup();

    await screen.findByRole("table");
    await user.type(screen.getByTestId("input-keyword-search"), "nomatchhere");

    expect(await screen.findByText("No results match your search")).toBeInTheDocument();
  });

  it("paginates at 10 records per page by default", async () => {
    const manyUsers = Array.from({ length: 12 }, (_, index) =>
      buildUser(
        `bulk-${index}`,
        `User ${String(index).padStart(2, "0")}`,
        "demos-cms-user",
        [],
        "2026-01-01T12:00:00.000Z"
      )
    );
    setup(manyUsers);

    await screen.findByRole("table");
    expect(getBodyRows()).toHaveLength(10);
    expect(screen.getByText("1 – 10 of 12")).toBeInTheDocument();
  });
});
