import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToastContainer } from "components/toast/ToastContainer";

import { TypesTable } from "./TypesTable";
import { TypesTableActionButtons } from "./TypesTableActionButtons";
import { ApplicationStatus } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";
import { MOCK_DEMONSTRATION } from "mock-data/demonstrationMocks";

vi.mock("./TypesTableActionButtons", () => ({
  TypesTableActionButtons: vi.fn(() => <div data-testid="mock-types-table-action-buttons" />),
}));

const renderTypesTable = (
  props: Partial<React.ComponentProps<typeof TypesTable>> = {},
  currentUser = cmsMockUser
) => {
  return render(
    <TestProvider currentUser={currentUser}>
      <TypesTable
        demonstration={MOCK_DEMONSTRATION}
        applicationSection="ApplicationWorkflow"
        {...props}
      />
      <ToastContainer />
    </TestProvider>
  );
};

describe("TypesTable", () => {
  beforeEach(() => {
    vi.mocked(TypesTableActionButtons).mockClear();
  });

  it("renders required columns", () => {
    renderTypesTable();

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Effective Date")).toBeInTheDocument();
    expect(screen.getByText("Expiration Date")).toBeInTheDocument();
  });

  it("renders type rows", () => {
    renderTypesTable();

    expect(screen.getByText("Aggregate Cap")).toBeInTheDocument();
    expect(screen.getByText("Annual Limits (Unapproved)")).toBeInTheDocument();
    expect(screen.getByText("Basic Health Plan (BHP) (Unapproved)")).toBeInTheDocument();
  });

  it("shows empty message when no types exist", () => {
    renderTypesTable({
      demonstration: { ...MOCK_DEMONSTRATION, demonstrationTypes: [] },
    });

    expect(screen.getByText("You have no assigned Types at this time")).toBeInTheDocument();
  });

  it("shows a notice when the demonstration is approved", () => {
    renderTypesTable({
      demonstration: { ...MOCK_DEMONSTRATION, status: "Approved" as ApplicationStatus },
    });

    expect(
      screen.getByText("At least one demonstration type is required for approved demonstrations.")
    ).toBeInTheDocument();
  });

  it("does not show the notice when the demonstration is not approved", () => {
    renderTypesTable({
      demonstration: { ...MOCK_DEMONSTRATION, status: "Under Review" as ApplicationStatus },
    });

    expect(
      screen.queryByText("At least one demonstration type is required for approved demonstrations.")
    ).not.toBeInTheDocument();
  });

  it("supports keyword search filtering", async () => {
    renderTypesTable();
    const user = userEvent.setup();
    const searchInput = screen.getByLabelText(/input keyword search query/i);

    await user.type(searchInput, "Aggregate Cap");

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Aggregate Cap" })).toBeInTheDocument();
      expect(
        screen.queryByRole("cell", { name: "Annual Limits (Unapproved)" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("cell", { name: "Basic Health Plan (BHP) (Unapproved)" })
      ).not.toBeInTheDocument();
    });
  });

  it("does not render keyword search when hideSearch is true", () => {
    renderTypesTable({ hideSearch: true });

    expect(screen.queryByLabelText(/input keyword search query/i)).not.toBeInTheDocument();
  });

  it("defaults to sorting by createdAt ascending (oldest first)", () => {
    renderTypesTable();
    const rows = screen.getAllByRole("row").slice(1);
    const types = rows.map((row) => row.querySelectorAll("td")[1]?.textContent);

    expect(types).toEqual([
      "Aggregate Cap",
      "Annual Limits (Unapproved)",
      "Basic Health Plan (BHP) (Unapproved)",
    ]);
  });

  it("allows sorting by Status column", async () => {
    renderTypesTable();
    const user = userEvent.setup();
    const statusHeader = screen.getByRole("columnheader", { name: /status/i });

    await user.click(statusHeader);
    const rows = screen.getAllByRole("row").slice(1);
    const statuses = rows.map((row) => row.querySelectorAll("td")[2]?.textContent);
    expect(statuses).toEqual(["Active", "Pending", "Pending"]);

    await user.click(statusHeader);
    const rowsDesc = screen.getAllByRole("row").slice(1);
    const statusesDesc = rowsDesc.map((row) => row.querySelectorAll("td")[2]?.textContent);
    expect(statusesDesc).toEqual(["Pending", "Pending", "Active"]);
  });

  it("passes demonstrationId and inputDisabled through to TypesTableActionButtons", () => {
    renderTypesTable({ inputDisabled: true });

    expect(TypesTableActionButtons).toHaveBeenLastCalledWith(
      {
        rows: [
          expect.objectContaining({ typeLabel: "Aggregate Cap" }),
          expect.objectContaining({ typeLabel: "Annual Limits" }),
          expect.objectContaining({ typeLabel: "Basic Health Plan (BHP)" }),
        ],
        selectedRows: [],
        demonstrationId: MOCK_DEMONSTRATION.id,
        inputDisabled: true,
      },
      undefined
    );
  });

  it("passes all visible type rows and no selected rows by default", () => {
    renderTypesTable();

    expect(TypesTableActionButtons).toHaveBeenLastCalledWith(
      {
        rows: [
          expect.objectContaining({ typeLabel: "Aggregate Cap" }),
          expect.objectContaining({ typeLabel: "Annual Limits" }),
          expect.objectContaining({ typeLabel: "Basic Health Plan (BHP)" }),
        ],
        selectedRows: [],
        demonstrationId: MOCK_DEMONSTRATION.id,
        inputDisabled: false,
      },
      undefined
    );
  });

  it("passes the selected row through to TypesTableActionButtons when a row is selected", async () => {
    renderTypesTable();
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-Aggregate Cap"));

    expect(TypesTableActionButtons).toHaveBeenLastCalledWith(
      {
        rows: [
          expect.objectContaining({ typeLabel: "Aggregate Cap" }),
          expect.objectContaining({ typeLabel: "Annual Limits" }),
          expect.objectContaining({ typeLabel: "Basic Health Plan (BHP)" }),
        ],
        selectedRows: [expect.objectContaining({ typeLabel: "Aggregate Cap" })],
        demonstrationId: MOCK_DEMONSTRATION.id,
        inputDisabled: false,
      },
      undefined
    );
  });

  it("hides action buttons and row select for readonly users", () => {
    renderTypesTable(undefined, readonlyMockUser);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-types-table-action-buttons")).not.toBeInTheDocument();
    expect(TypesTableActionButtons).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId(
        `select-row-${MOCK_DEMONSTRATION.demonstrationTypes[0].demonstrationTypeName}`
      )
    ).not.toBeInTheDocument();
  });
});
