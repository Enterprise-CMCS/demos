import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TypesTable } from "./TypesTable";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { ApplicationStatus } from "demos-server";

const mockShowRemoveDemonstrationTypesDialog = vi.fn();
const mockShowEditDemonstrationTypeDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showRemoveDemonstrationTypesDialog: mockShowRemoveDemonstrationTypesDialog,
    showEditDemonstrationTypeDialog: mockShowEditDemonstrationTypeDialog,
  }),
}));

const mockTypes: DemonstrationDetailDemonstrationType[] = [
  {
    demonstrationTypeName: "Environmental",
    status: "Active",
    approvalStatus: "Approved",
    effectiveDate: new Date("2023-01-01"),
    expirationDate: new Date("2024-01-01"),
    createdAt: new Date("2022-12-01"),
  },
  {
    demonstrationTypeName: "Economic",
    status: "Pending",
    approvalStatus: "Unapproved",
    effectiveDate: new Date("2024-01-01"),
    expirationDate: new Date("2025-01-01"),
    createdAt: new Date("2023-06-01"),
  },
];

const MOCK_DEMONSTRATION_ID = "demo-123";
const MOCK_DEMONSTRATION = {
  id: MOCK_DEMONSTRATION_ID,
  status: "Active" as ApplicationStatus,
  demonstrationTypes: mockTypes,
};

describe("TypesTable", () => {
  it("renders required columns", async () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
    await waitFor(() => screen.getByRole("table"));

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Effective Date")).toBeInTheDocument();
    expect(screen.getByText("Expiration Date")).toBeInTheDocument();
  });

  it("renders type rows", () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);

    expect(screen.getByText("Environmental")).toBeInTheDocument();
    expect(screen.getByText("Economic (Unapproved)")).toBeInTheDocument();
  });

  it("shows empty message when no types exist", () => {
    const demonstrationWithNoTypes = {
      id: "demo-456",
      status: "Active" as ApplicationStatus,
      demonstrationTypes: [],
    };
    render(<TypesTable demonstration={demonstrationWithNoTypes} />);

    expect(screen.getByText("You have no assigned Types at this time")).toBeInTheDocument();
  });

  it("supports keyword search filtering", async () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
    const user = userEvent.setup();
    const searchInput = screen.getByLabelText(/input keyword search query/i);

    await user.type(searchInput, "Economic");

    await waitFor(() => {
      expect(screen.getByText("Economic")).toBeInTheDocument();
      expect(screen.queryByText("Environmental")).not.toBeInTheDocument();
    });
  });

  it("does not render keyword search when hideSearch is true", () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} hideSearch />);

    expect(screen.queryByLabelText(/input keyword search query/i)).not.toBeInTheDocument();
  });

  it("defaults to sorting by createdAt ascending (oldest first)", () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
    const rows = screen.getAllByRole("row").slice(1);
    const types = rows.map((row) => row.querySelectorAll("td")[1]?.textContent);

    expect(types).toEqual(["Environmental", "Economic (Unapproved)"]);
  });

  it("allows sorting by Status column", async () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
    const user = userEvent.setup();
    const statusHeader = screen.getByRole("columnheader", { name: /status/i });

    await user.click(statusHeader);

    const rows = screen.getAllByRole("row").slice(1);
    const statuses = rows.map((row) => row.querySelectorAll("td")[2]?.textContent);

    expect(statuses).toEqual(["Active", "Pending"]);
  });

  it("does not render keyword search when hideSearch is true", () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} hideSearch />);
    expect(screen.queryByTestId("input-keyword-search")).not.toBeInTheDocument();
  });

  it("disables action buttons when inputDisabled is true", () => {
    render(<TypesTable demonstration={MOCK_DEMONSTRATION} inputDisabled />);

    const addButton = screen.getByTestId("add-type");
    const editButton = screen.getByTestId("edit-type");
    const deleteButton = screen.getByTestId("delete-type");

    expect(addButton).toBeDisabled();
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  describe("delete button", () => {
    it("calls showRemoveDemonstrationTypesDialog when delete button is clicked", async () => {
      render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      await user.click(screen.getByTestId(`select-row-${mockTypes[1].demonstrationTypeName}`));

      const deleteButton = screen.getByTestId("delete-type");
      await user.click(deleteButton);

      expect(mockShowRemoveDemonstrationTypesDialog).toHaveBeenCalledWith(MOCK_DEMONSTRATION_ID, [
        "Environmental",
        "Economic",
      ]);
    });

    it("does not allow deleting all demonstration types when demonstration is approved", async () => {
      const demonstration = {
        ...MOCK_DEMONSTRATION,
        status: "Approved" as ApplicationStatus,
      };
      render(<TypesTable demonstration={demonstration} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      await user.click(screen.getByTestId(`select-row-${mockTypes[1].demonstrationTypeName}`));

      const deleteButton = screen.getByTestId("delete-type");
      expect(deleteButton).toBeDisabled();
    });

    it("allows deleting all demonstration types when demonstration is not approved", async () => {
      const demonstration = {
        ...MOCK_DEMONSTRATION,
        status: "Under Review" as ApplicationStatus,
      };
      render(<TypesTable demonstration={demonstration} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      await user.click(screen.getByTestId(`select-row-${mockTypes[1].demonstrationTypeName}`));

      const deleteButton = screen.getByTestId("delete-type");
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe("edit button", () => {
    it("calls showEditDemonstrationTypeDialog when edit button is clicked", async () => {
      render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
      const user = userEvent.setup();
      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      const editButton = screen.getByTestId("edit-type");
      await user.click(editButton);

      const expectedDemonstrationType = {
        demonstrationTypeName: mockTypes[0].demonstrationTypeName,
        status: mockTypes[0].status,
        effectiveDate: mockTypes[0].effectiveDate,
        expirationDate: mockTypes[0].expirationDate,
        approvalStatus: mockTypes[0].approvalStatus,
      };

      expect(mockShowEditDemonstrationTypeDialog).toHaveBeenCalledWith(
        MOCK_DEMONSTRATION_ID,
        expectedDemonstrationType
      );
    });

    it("disables edit button when multiple types are selected", async () => {
      render(<TypesTable demonstration={MOCK_DEMONSTRATION} />);
      const user = userEvent.setup();
      const editButton = screen.getByTestId("edit-type");
      expect(editButton).toBeDisabled();

      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      expect(editButton).toBeEnabled();

      await user.click(screen.getByTestId(`select-row-${mockTypes[1].demonstrationTypeName}`));
      expect(editButton).toBeDisabled();
    });
  });
});
