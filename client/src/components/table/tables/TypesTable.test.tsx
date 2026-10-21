import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToastContainer } from "components/toast/ToastContainer";

import { TypesTable } from "./TypesTable";
import { DemonstrationDetailDemonstrationType } from "pages/DemonstrationDetail/DemonstrationTab";
import { ApplicationStatus } from "demos-server";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser, readonlyMockUser } from "mock-data/userMocks";
import { exportTypeTagRecords } from "util/exportTypeTagRecords";
import {
  buildAssociatedRecordRows,
  sortAssociatedRecordsByDefault,
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
} from "./TypeTagAssociatedRecordsTable";
import { MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION } from "mock-data/demonstrationMocks";

const mockShowRemoveDemonstrationTypesDialog = vi.fn();
const mockShowEditDemonstrationTypeDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showRemoveDemonstrationTypesDialog: mockShowRemoveDemonstrationTypesDialog,
    showEditDemonstrationTypeDialog: mockShowEditDemonstrationTypeDialog,
  }),
}));

vi.mock("util/exportTypeTagRecords", () => ({ exportTypeTagRecords: vi.fn() }));

const mockTypes: DemonstrationDetailDemonstrationType[] = [
  {
    demonstrationTypeName: "Environmental",
    status: "Active",
    approvalStatus: "Approved",
    effectivePlainDate: "2023-01-01",
    expirationPlainDate: "2024-01-01",
    createdAt: new Date("2022-12-01"),
  },
  {
    demonstrationTypeName: "Economic",
    status: "Pending",
    approvalStatus: "Unapproved",
    effectivePlainDate: "2024-01-01",
    expirationPlainDate: "2025-01-01",
    createdAt: new Date("2023-06-01"),
  },
];

const MOCK_DEMONSTRATION_ID = "demo-123";
const MOCK_DEMONSTRATION = {
  id: MOCK_DEMONSTRATION_ID,
  status: "Active" as ApplicationStatus,
  demonstrationTypes: mockTypes,
};
const ASSOCIATED_TYPE_NAME =
  MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION.demonstrationTypes[0].demonstrationTypeName;

const renderTypesTable = (
  props: Partial<React.ComponentProps<typeof TypesTable>> = {},
  currentUser = cmsMockUser
) => {
  return render(
    <TestProvider
      currentUser={currentUser}
      mocks={Array.from({ length: 2 }, () => ({
        request: { query: TYPE_TAG_ASSOCIATED_RECORDS_QUERY },
        result: { data: { demonstrations: [MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION] } },
      }))}
    >
      <TypesTable demonstration={MOCK_DEMONSTRATION} {...props} />
      <ToastContainer />
    </TestProvider>
  );
};

const MOCK_DEMONSTRATION_WITH_DELIVERABLE = {
  ...MOCK_DEMONSTRATION,
  deliverables: [
    {
      id: "deliverable-1",
      demonstrationTypes: [{ tagName: "Environmental" }],
    },
  ],
};

describe("TypesTable", () => {
  beforeEach(() => {
    vi.mocked(exportTypeTagRecords).mockReset().mockResolvedValue(undefined);
    mockShowRemoveDemonstrationTypesDialog.mockClear();
    mockShowEditDemonstrationTypeDialog.mockClear();
  });

  it("exports associated records for the filtered types", async () => {
    renderTypesTable({
      demonstration: {
        ...MOCK_DEMONSTRATION,
        demonstrationTypes: [{ ...mockTypes[1], demonstrationTypeName: ASSOCIATED_TYPE_NAME }],
      },
    });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/input keyword search query/i), ASSOCIATED_TYPE_NAME);
    await user.click(screen.getByTestId("export-type-excel"));

    await waitFor(() =>
      expect(exportTypeTagRecords).toHaveBeenCalledWith(
        sortAssociatedRecordsByDefault(
          buildAssociatedRecordRows(
            [MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION],
            ASSOCIATED_TYPE_NAME
          )
        )
      )
    );
    await waitFor(() => expect(screen.getByTestId("export-type-excel")).toBeEnabled());
  });

  it("does not download an empty associated-record export", async () => {
    renderTypesTable();
    const user = userEvent.setup();

    await user.click(screen.getByTestId("export-type-excel"));

    await waitFor(() =>
      expect(screen.getByText("No associated records are available to export.")).toBeInTheDocument()
    );
    expect(exportTypeTagRecords).not.toHaveBeenCalled();
  });

  it("disables export while pending and reports failures before allowing a retry", async () => {
    let rejectExport!: (error: Error) => void;
    vi.mocked(exportTypeTagRecords).mockReturnValueOnce(
      new Promise<void>((_resolve, reject) => {
        rejectExport = reject;
      })
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderTypesTable({
        demonstration: {
          ...MOCK_DEMONSTRATION,
          demonstrationTypes: [{ ...mockTypes[0], demonstrationTypeName: ASSOCIATED_TYPE_NAME }],
        },
      });
      const user = userEvent.setup();
      const button = screen.getByTestId("export-type-excel");
      await user.click(button);
      await waitFor(() => expect(exportTypeTagRecords).toHaveBeenCalledOnce());
      expect(button).toBeDisabled();

      const error = new Error("Export failed");
      await act(async () => rejectExport(error));
      expect(button).toBeEnabled();
      expect(
        screen.getByText("Unable to export associated records. Please try again.")
      ).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith("Unable to export associated records", error);
      await user.click(button);
      await waitFor(() => expect(exportTypeTagRecords).toHaveBeenCalledTimes(2));
    } finally {
      consoleError.mockRestore();
    }
  });

  it("renders required columns", async () => {
    renderTypesTable();
    await waitFor(() => screen.getByRole("table"));

    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Economic (Unapproved)")).toBeInTheDocument();
    expect(screen.getByText("Expiration Date")).toBeInTheDocument();
  });

  it("renders type rows", () => {
    renderTypesTable();

    expect(screen.getByText("Environmental")).toBeInTheDocument();
    expect(screen.getByText("Economic (Unapproved)")).toBeInTheDocument();
  });

  it("shows empty message when no types exist", () => {
    renderTypesTable({
      demonstration: {
        id: "demo-456",
        status: "Active" as ApplicationStatus,
        demonstrationTypes: [],
      },
    });

    expect(screen.getByText("You have no assigned Types at this time")).toBeInTheDocument();
  });

  it("supports keyword search filtering", async () => {
    renderTypesTable();
    const user = userEvent.setup();
    const searchInput = screen.getByLabelText(/input keyword search query/i);

    await user.type(searchInput, "Economic");

    await waitFor(() => {
      expect(screen.getByText("Economic")).toBeInTheDocument();
      expect(screen.queryByText("Environmental")).not.toBeInTheDocument();
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

    expect(types).toEqual(["Environmental", "Economic (Unapproved)"]);
  });

  it("allows sorting by Status column", async () => {
    renderTypesTable();
    const user = userEvent.setup();
    const statusHeader = screen.getByRole("columnheader", { name: /status/i });

    await user.click(statusHeader);

    const rows = screen.getAllByRole("row").slice(1);
    const statuses = rows.map((row) => row.querySelectorAll("td")[2]?.textContent);

    expect(statuses).toEqual(["Active", "Pending"]);
  });

  it("does not render keyword search when hideSearch is true", () => {
    render(
      <TestProvider currentUser={cmsMockUser}>
        <TypesTable demonstration={MOCK_DEMONSTRATION} hideSearch />
      </TestProvider>
    );
    expect(screen.queryByTestId("input-keyword-search")).not.toBeInTheDocument();
  });

  it("disables action buttons when inputDisabled is true", () => {
    renderTypesTable({ inputDisabled: true });

    const editButton = screen.getByTestId("edit-type");
    const deleteButton = screen.getByTestId("delete-type");

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  describe("delete button", () => {
    it("calls showRemoveDemonstrationTypesDialog when delete button is clicked", async () => {
      renderTypesTable();
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
      renderTypesTable({ demonstration });
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
      renderTypesTable({ demonstration });
      const user = userEvent.setup();
      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      await user.click(screen.getByTestId(`select-row-${mockTypes[1].demonstrationTypeName}`));

      const deleteButton = screen.getByTestId("delete-type");
      expect(deleteButton).not.toBeDisabled();
    });

    it("disables delete when a selected demonstration type is linked to a deliverable", async () => {
      render(
        <TestProvider currentUser={cmsMockUser}>
          <TypesTable demonstration={MOCK_DEMONSTRATION_WITH_DELIVERABLE} />
        </TestProvider>
      );

      const user = userEvent.setup();

      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));

      const deleteButton = screen.getByTestId("delete-type");

      expect(deleteButton).toBeDisabled();
    });
  });

  describe("edit button", () => {
    it("calls showEditDemonstrationTypeDialog when edit button is clicked", async () => {
      renderTypesTable();
      const user = userEvent.setup();
      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      const editButton = screen.getByTestId("edit-type");
      await user.click(editButton);

      const expectedDemonstrationType = {
        demonstrationTypeName: mockTypes[0].demonstrationTypeName,
        status: mockTypes[0].status,
        effectivePlainDate: mockTypes[0].effectivePlainDate,
        expirationPlainDate: mockTypes[0].expirationPlainDate,
        approvalStatus: mockTypes[0].approvalStatus,
      };

      expect(mockShowEditDemonstrationTypeDialog).toHaveBeenCalledWith(
        MOCK_DEMONSTRATION_ID,
        expectedDemonstrationType
      );
    });

    it("disables edit button when multiple types are selected", async () => {
      renderTypesTable();
      const user = userEvent.setup();
      const editButton = screen.getByTestId("edit-type");
      expect(editButton).toBeDisabled();

      await user.click(screen.getByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`));
      expect(editButton).toBeEnabled();

      await user.click(screen.getByTestId(`select-row-${mockTypes[1].demonstrationTypeName}`));
      expect(editButton).toBeDisabled();
    });
  });

  it("hides action buttons and row select for readonly users", async () => {
    renderTypesTable(undefined, readonlyMockUser);

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/Edit Type/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Delete Type/i)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`select-row-${mockTypes[0].demonstrationTypeName}`)
    ).not.toBeInTheDocument();
  });
});
