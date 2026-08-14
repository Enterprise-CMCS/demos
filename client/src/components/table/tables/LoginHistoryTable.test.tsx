import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import { TestProvider } from "test-utils/TestProvider";
import { LoginHistoryUserRow } from "../columns/LoginHistoryColumns";
import { LoginHistoryTable, LOGIN_HISTORY_QUERY } from "./LoginHistoryTable";

const buildUser = (
  id: string,
  fullName: string,
  lastLogin: string | null
): LoginHistoryUserRow => ({
  id,
  lastLogin: lastLogin as unknown as LoginHistoryUserRow["lastLogin"],
  username: fullName.toLowerCase().replace(" ", "."),
  person: {
    id: `person-${id}`,
    fullName,
    email: `${fullName.toLowerCase().replace(" ", ".")}@cms.gov`,
  },
});

const TEST_USERS: LoginHistoryUserRow[] = [
  buildUser("1", "Zoe Adams", "2026-03-11T12:00:00.000Z"),
  buildUser("2", "Alice Brown", "2026-02-28T12:00:00.000Z"),
  buildUser("3", "Bob Clark", "2026-03-22T12:00:00.000Z"),
  buildUser("4", "Carol Willick", null),
  buildUser("5", "Dave Evans", "2026-04-03T12:00:00.000Z"),
];

const buildMocks = (users: LoginHistoryUserRow[]): MockedResponse[] => [
  {
    request: { query: LOGIN_HISTORY_QUERY },
    result: { data: { users } },
  },
];

const setup = (users: LoginHistoryUserRow[] = TEST_USERS) =>
  render(
    <TestProvider mocks={buildMocks(users)}>
      <LoginHistoryTable />
    </TestProvider>
  );

const getBodyRows = () => {
  const [, ...bodyRows] = screen.getAllByRole("row");
  return bodyRows;
};

const getColumnValues = (columnIndex: number) =>
  getBodyRows().map((row) => within(row).getAllByRole("cell")[columnIndex].textContent);

describe("LoginHistoryTable", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the four story columns", async () => {
    setup();

    await screen.findByRole("table");
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "Name",
      "Username",
      "Email",
      "Last Login",
    ]);
  });

  it("formats last login as MM/DD/YYYY and dashes when never logged in", async () => {
    setup();

    await screen.findByRole("table");
    expect(screen.getByText("Dave Evans").closest("tr")).toHaveTextContent("04/03/2026");
    const carolCells = within(screen.getByText("Carol Willick").closest("tr")!).getAllByRole(
      "cell"
    );
    expect(carolCells[3]).toHaveTextContent("-");
  });

  it("sorts alphabetically by name", async () => {
    setup();

    await screen.findByRole("table");
    expect(getColumnValues(0)).toEqual([
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
    await user.type(screen.getByTestId("input-keyword-search"), "Bob");

    await waitFor(() => expect(getBodyRows()).toHaveLength(1));
    expect(getColumnValues(0)).toEqual(["Bob Clark"]);
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
        "2026-01-01T12:00:00.000Z"
      )
    );
    setup(manyUsers);

    await screen.findByRole("table");
    expect(getBodyRows()).toHaveLength(10);
    expect(screen.getByText("1 – 10 of 12")).toBeInTheDocument();
  });
});
