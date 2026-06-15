import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeliverableTable, formatDeliverableStatus } from "./DeliverableTable";
import { DELIVERABLE_CANT_DELETE_HAS_FILES } from "./DeliverableActionButtons";
import { sortDeliverablesByDefault } from "util/sortDeliverables";
import type { DeliverableTableRow } from "./DeliverableTable";
import { MOCK_DELIVERABLE_TABLE_ROW } from "mock-data/deliverableMocks";

const showEditDeliverableDialog = vi.fn();
const showRemoveDeliverableDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({ showEditDeliverableDialog, showRemoveDeliverableDialog }),
}));

const MOCK_DELIVERABLE_TABLE_ROWS = [
  MOCK_DELIVERABLE_TABLE_ROW,
  { ...MOCK_DELIVERABLE_TABLE_ROW, id: "2", name: "Another Deliverable" },
];

const sortedDeliverables = sortDeliverablesByDefault(MOCK_DELIVERABLE_TABLE_ROWS);
const sortedFirstPageIds = sortedDeliverables.slice(0, 10).map((deliverable) => deliverable.id);

describe("DeliverableTable", () => {
  beforeEach(async () => {
    showEditDeliverableDialog.mockClear();
    showRemoveDeliverableDialog.mockClear();
    render(
      <DeliverableTable deliverables={MOCK_DELIVERABLE_TABLE_ROWS} viewMode="demos-cms-user" />
    );
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  it("renders all deliverable names initially", () => {
    sortedDeliverables.slice(0, 10).forEach((deliverable) => {
      expect(screen.getByText(deliverable.name)).toBeInTheDocument();
    });
  });

  it("applies default deliverable ordering on first render", () => {
    const renderedRowIds = screen
      .getAllByTestId(/^select-row-/)
      .map((checkbox) => checkbox.getAttribute("data-testid")?.replace("select-row-", ""));

    expect(renderedRowIds).toEqual(sortedFirstPageIds);
  });

  it("shows empty state when no deliverables provided", async () => {
    render(<DeliverableTable deliverables={[]} viewMode="demos-cms-user" />);

    await waitFor(() => {
      expect(
        screen.getByText("There are no assigned Deliverables at this time")
      ).toBeInTheDocument();
    });
  });

  it("supports custom empty state message", async () => {
    render(
      <DeliverableTable
        deliverables={[]}
        emptyRowsMessage="You have no assigned Deliverables at this time"
        viewMode="demos-cms-user"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("You have no assigned Deliverables at this time")
      ).toBeInTheDocument();
    });
  });

  it("renders action buttons (edit/remove)", () => {
    expect(screen.getByLabelText(/Edit Deliverable/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Remove Deliverable/i)).toBeInTheDocument();
  });

  it("disables Edit and Remove when nothing selected", () => {
    const editBtn = screen.getByTestId("edit-deliverable");
    const removeBtn = screen.getByTestId("remove-deliverable");

    expect(editBtn).toBeDisabled();
    expect(removeBtn).toBeDisabled();
    expect(removeBtn).toHaveAttribute("title", "Select a Deliverable to Delete");
  });

  it("enables Edit for exactly one selected row", async () => {
    const user = userEvent.setup();

    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`));

    const editBtn = screen.getByTestId("edit-deliverable");
    expect(editBtn).not.toBeDisabled();
  });

  it("disables Edit when multiple rows selected", async () => {
    const user = userEvent.setup();

    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`));
    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[1]}`));

    const editBtn = screen.getByTestId("edit-deliverable");
    expect(editBtn).toBeDisabled();
  });

  it("enables Remove when at least one row selected", async () => {
    const user = userEvent.setup();

    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`));

    const removeBtn = screen.getByTestId("remove-deliverable");
    expect(removeBtn).not.toBeDisabled();
    expect(removeBtn).toHaveAttribute("title", "Delete");
  });

  it("opens the remove deliverable dialog for selected rows", async () => {
    const user = userEvent.setup();

    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`));
    await user.click(screen.getByTestId("remove-deliverable"));

    expect(showRemoveDeliverableDialog).toHaveBeenCalledWith(
      [sortedFirstPageIds[0]],
      expect.any(Function)
    );
  });

  it("clears selected rows after selected deliverables are deleted", async () => {
    const user = userEvent.setup();

    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`));
    await user.click(screen.getByTestId("remove-deliverable"));

    const onDeleted = showRemoveDeliverableDialog.mock.calls[0][1];
    act(() => {
      onDeleted();
    });

    expect(screen.getByTestId(`select-row-${sortedFirstPageIds[0]}`)).not.toBeChecked();
    expect(screen.getByTestId("remove-deliverable")).toBeDisabled();

    await user.click(screen.getByTestId(`select-row-${sortedFirstPageIds[1]}`));

    expect(screen.getByTestId("remove-deliverable")).not.toBeDisabled();
  });

  describe("Keyword Search functionality", () => {
    it("renders search input", () => {
      const searchInput = screen.getByLabelText(/search:/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("filters deliverables by keyword", async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, MOCK_DELIVERABLE_TABLE_ROWS[0].name);

      await waitFor(() => {
        expect(screen.getByText(MOCK_DELIVERABLE_TABLE_ROWS[0].name)).toBeInTheDocument();
      });
    });

    it("shows no results message if nothing matches", async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, "notarealkeyword");

      await waitFor(() => {
        expect(screen.getByText(/No deliverables match your search\./i)).toBeInTheDocument();
      });
    });

    it("clears search and restores rows", async () => {
      const user = userEvent.setup();
      const searchInput = screen.getByLabelText(/search:/i);

      await user.type(searchInput, MOCK_DELIVERABLE_TABLE_ROWS[0].name);

      await waitFor(() => {
        expect(screen.getByText(MOCK_DELIVERABLE_TABLE_ROWS[0].name)).toBeInTheDocument();
      });

      const clearBtn = screen.getByRole("button", { name: /clear search/i });
      await user.click(clearBtn);

      expect(searchInput).toHaveValue("");

      sortedDeliverables.slice(0, 10).forEach((deliverable) => {
        expect(screen.getByText(deliverable.name)).toBeInTheDocument();
      });
    });
  });

  it("renders finalized statuses as-is", () => {
    expect(
      formatDeliverableStatus({
        status: "Accepted",
        deliverableActions: [],
        extensionRequests: [],
      })
    ).toBe("Accepted");

    expect(
      formatDeliverableStatus({
        status: "Approved",
        deliverableActions: [],
        extensionRequests: [
          {
            id: "1",
            status: "Requested",
          },
        ],
      })
    ).toBe("Approved");

    expect(
      formatDeliverableStatus({
        status: "Received and Filed",
        deliverableActions: [
          {
            id: "1",
            actionType: "Requested Resubmission",
          },
        ],
        extensionRequests: [
          {
            id: "1",
            status: "Requested",
          },
        ],
      })
    ).toBe("Received and Filed");
  });

  it("renders base status when there are no resubmissions or open extension requests", () => {
    expect(
      formatDeliverableStatus({
        status: "Submitted",
        deliverableActions: [],
        extensionRequests: [],
      })
    ).toBe("Submitted");
  });

  it("renders extension requested suffix when an extension request is open", () => {
    expect(
      formatDeliverableStatus({
        status: "Submitted",
        deliverableActions: [],
        extensionRequests: [
          {
            id: "1",
            status: "Requested",
          },
        ],
      })
    ).toBe("Submitted - Extension Requested");
  });

  it("renders resubmission count when resubmissions have been requested", () => {
    expect(
      formatDeliverableStatus({
        status: "Submitted",
        deliverableActions: [
          {
            id: "1",
            actionType: "Requested Resubmission",
          },
          {
            id: "2",
            actionType: "Requested Resubmission",
          },
        ],
        extensionRequests: [],
      })
    ).toBe("Submitted (2)");
  });

  it("renders both resubmission count and extension requested suffix", () => {
    expect(
      formatDeliverableStatus({
        status: "Under CMS Review",
        deliverableActions: [
          {
            id: "1",
            actionType: "Requested Resubmission",
          },
        ],
        extensionRequests: [
          {
            id: "1",
            status: "Requested",
          },
        ],
      })
    ).toBe("Under CMS Review (1) - Extension Requested");
  });

  it("ignores non-requested extension request statuses", () => {
    expect(
      formatDeliverableStatus({
        status: "Submitted",
        deliverableActions: [],
        extensionRequests: [
          {
            id: "1",
            status: "Approved",
          },
        ],
      })
    ).toBe("Submitted");
  });

  it("ignores non-resubmission deliverable actions", () => {
    expect(
      formatDeliverableStatus({
        status: "Submitted",
        deliverableActions: [
          {
            id: "1",
            actionType: "Created Deliverable Slot",
          },
        ],
        extensionRequests: [],
      })
    ).toBe("Submitted");
  });

  it("renders column filter dropdown", () => {
    expect(screen.getByTestId("filter-by-column")).toBeInTheDocument();
  });

  it("uses multiselect filter inputs for configured categorical fields", async () => {
    const user = userEvent.setup();
    const columnSelect = screen.getByTestId("filter-by-column");

    await user.selectOptions(columnSelect, "Demonstration Name");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Select Demonstration Name")).toBeInTheDocument();
    });

    await user.selectOptions(columnSelect, "Deliverable Type");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Select Deliverable Type")).toBeInTheDocument();
    });

    await user.selectOptions(columnSelect, "CMS Owner");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Select CMS Owner")).toBeInTheDocument();
    });

    await user.selectOptions(columnSelect, "Status");
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Select Status")).toBeInTheDocument();
    });
  });

  it("shows filter options aligned to visible CMS-user columns", () => {
    const filterByColumn = screen.getByTestId("filter-by-column") as HTMLSelectElement;
    const optionLabels = Array.from(filterByColumn.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Select a Column...",
      "State/\u200BTerritory",
      "Demonstration Name",
      "Deliverable Type",
      "Deliverable Name",
      "CMS Owner",
      "Due Date",
      "Submission Date",
      "Status",
    ]);
  });

  it("keeps applied sorting after a column filter is cleared", async () => {
    const user = userEvent.setup();
    const getVisibleDeliverableOrder = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .flatMap((row) => {
          if (within(row).queryByText("Another Deliverable")) {
            return ["Another Deliverable"];
          }
          if (within(row).queryByText("Budget Neutrality Report")) {
            return ["Budget Neutrality Report"];
          }
          return [];
        });

    await user.click(screen.getByRole("columnheader", { name: /Deliverable Name/i }));

    let sortedOrderBeforeFiltering: string[] = [];
    await waitFor(() => {
      sortedOrderBeforeFiltering = getVisibleDeliverableOrder();
      expect(sortedOrderBeforeFiltering).toHaveLength(2);
    });

    const filterByColumn = screen.getByTestId("filter-by-column");
    await user.selectOptions(filterByColumn, "Deliverable Name");

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Filter Deliverable Name/i)).toBeInTheDocument();
    });

    const nameFilter = screen.getByPlaceholderText(/Filter Deliverable Name/i);
    await user.type(nameFilter, "Another");

    await waitFor(() => {
      expect(screen.getByText("Another Deliverable")).toBeInTheDocument();
      expect(screen.queryByText("Budget Neutrality Report")).not.toBeInTheDocument();
    });

    await user.clear(nameFilter);

    await waitFor(() => {
      expect(getVisibleDeliverableOrder()).toEqual(sortedOrderBeforeFiltering);
    });
  });

  it("renders pagination controls", () => {
    expect(screen.getByText(/Items per page/i)).toBeInTheDocument();
  });
});

describe("DeliverableTable demos-state-user view mode", () => {
  it("renders the state-user column set and hides state/CMS owner", async () => {
    render(
      <DeliverableTable deliverables={MOCK_DELIVERABLE_TABLE_ROWS} viewMode="demos-state-user" />
    );

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: /Demonstration Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Due Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();

    expect(
      screen.queryByRole("columnheader", { name: /State\/Territory/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
  });

  it("hides row action buttons in state-user mode", () => {
    render(
      <DeliverableTable deliverables={MOCK_DELIVERABLE_TABLE_ROWS} viewMode="demos-state-user" />
    );

    expect(screen.queryByLabelText(/Edit Deliverable/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Remove Deliverable/i)).not.toBeInTheDocument();
  });

  it("shows filter options aligned to visible state-user columns", async () => {
    render(
      <DeliverableTable deliverables={MOCK_DELIVERABLE_TABLE_ROWS} viewMode="demos-state-user" />
    );

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    const filterByColumn = screen.getByTestId("filter-by-column") as HTMLSelectElement;
    const optionLabels = Array.from(filterByColumn.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Select a Column...",
      "Demonstration Name",
      "Deliverable Type",
      "Deliverable Name",
      "Due Date",
      "Submission Date",
      "Status",
    ]);
  });
});

describe("DeliverableTable Remove action", () => {
  const FINALIZED_ROWS: DeliverableTableRow[] = [
    { ...MOCK_DELIVERABLE_TABLE_ROW, id: "active", status: "Upcoming" },
    { ...MOCK_DELIVERABLE_TABLE_ROW, id: "approved", status: "Approved" },
    { ...MOCK_DELIVERABLE_TABLE_ROW, id: "accepted", status: "Accepted" },
  ];

  it("disables Remove when the only selected row is finalized", async () => {
    render(<DeliverableTable deliverables={FINALIZED_ROWS} viewMode="demos-cms-user" />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-approved"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("disables Remove when any of multiple selected rows is finalized", async () => {
    render(<DeliverableTable deliverables={FINALIZED_ROWS} viewMode="demos-cms-user" />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-active"));
    await user.click(screen.getByTestId("select-row-accepted"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("enables Remove when the selected row is Upcoming", async () => {
    render(<DeliverableTable deliverables={FINALIZED_ROWS} viewMode="demos-cms-user" />);
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-active"));

    expect(screen.getByTestId("remove-deliverable")).not.toBeDisabled();
  });

  it("enables Remove when the selected row is Past Due", async () => {
    render(
      <DeliverableTable
        deliverables={[{ ...MOCK_DELIVERABLE_TABLE_ROW, id: "past-due", status: "Past Due" }]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-past-due"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).not.toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("disables Remove when a selected row has a non-deletable non-final status", async () => {
    render(
      <DeliverableTable
        deliverables={[{ ...MOCK_DELIVERABLE_TABLE_ROW, id: "submitted", status: "Submitted" }]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-submitted"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("enables Remove when selected rows are Upcoming and Past Due", async () => {
    render(
      <DeliverableTable
        deliverables={[
          { ...MOCK_DELIVERABLE_TABLE_ROW, id: "upcoming", status: "Upcoming" },
          { ...MOCK_DELIVERABLE_TABLE_ROW, id: "past-due", status: "Past Due" },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-upcoming"));
    await user.click(screen.getByTestId("select-row-past-due"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).not.toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("disables Remove when one of multiple selected rows has a non-deletable status", async () => {
    render(
      <DeliverableTable
        deliverables={[
          { ...MOCK_DELIVERABLE_TABLE_ROW, id: "upcoming", status: "Upcoming" },
          { ...MOCK_DELIVERABLE_TABLE_ROW, id: "submitted", status: "Submitted" },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-upcoming"));
    await user.click(screen.getByTestId("select-row-submitted"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("disables Remove when a selected row has files", async () => {
    render(
      <DeliverableTable
        deliverables={[
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "has-file",
            status: "Upcoming",
            cmsDocuments: [{ id: "doc-1" }],
          },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-has-file"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", DELIVERABLE_CANT_DELETE_HAS_FILES);
  });

  it("disables Remove when a selected row has comments", async () => {
    render(
      <DeliverableTable
        deliverables={[
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "has-comment",
            status: "Past Due",
            publicComments: [{ id: "comment-1" }],
          },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-has-comment"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", DELIVERABLE_CANT_DELETE_HAS_FILES);
  });

  it("disables Remove when one of multiple selected rows has files or comments", async () => {
    render(
      <DeliverableTable
        deliverables={[
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "delete-ready",
            status: "Upcoming",
            cmsDocuments: [],
            publicComments: [],
          },
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "has-comment",
            status: "Upcoming",
            publicComments: [{ id: "comment-1" }],
          },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-delete-ready"));
    await user.click(screen.getByTestId("select-row-has-comment"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", DELIVERABLE_CANT_DELETE_HAS_FILES);
  });

  it("enables Remove after the selected row with files or comments is deselected", async () => {
    render(
      <DeliverableTable
        deliverables={[
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "delete-ready",
            status: "Upcoming",
            cmsDocuments: [],
            publicComments: [],
          },
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "has-file",
            status: "Upcoming",
            cmsDocuments: [{ id: "doc-1" }],
          },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-delete-ready"));
    await user.click(screen.getByTestId("select-row-has-file"));

    expect(screen.getByTestId("remove-deliverable")).toBeDisabled();

    await user.click(screen.getByTestId("select-row-has-file"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).not.toBeDisabled();
    expect(removeButton).toHaveAttribute("title", "Delete");
  });

  it("disables Remove when multiple selected rows all have files or comments", async () => {
    render(
      <DeliverableTable
        deliverables={[
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "has-file",
            status: "Upcoming",
            cmsDocuments: [{ id: "doc-1" }],
          },
          {
            ...MOCK_DELIVERABLE_TABLE_ROW,
            id: "has-comment",
            status: "Upcoming",
            publicComments: [{ id: "comment-1" }],
          },
        ]}
        viewMode="demos-cms-user"
      />
    );
    const user = userEvent.setup();

    await user.click(screen.getByTestId("select-row-has-file"));
    await user.click(screen.getByTestId("select-row-has-comment"));

    const removeButton = screen.getByTestId("remove-deliverable");
    expect(removeButton).toBeDisabled();
    expect(removeButton).toHaveAttribute("title", DELIVERABLE_CANT_DELETE_HAS_FILES);
  });
});

describe("DeliverableTable default sorting behavior", () => {
  it("reapplies default sort order when the table data is reloaded", async () => {
    const base = MOCK_DELIVERABLE_TABLE_ROWS[0] as DeliverableTableRow;
    const createDeliverable = (
      id: string,
      name: string,
      status: DeliverableTableRow["status"],
      dueDate: string
    ): DeliverableTableRow => ({
      ...base,
      id,
      name,
      status,
      dueDate: new Date(dueDate),
    });

    const pastDue = createDeliverable("past-due", "Past Due", "Past Due", "2026-05-03");
    const upcoming = createDeliverable("upcoming", "Upcoming", "Upcoming", "2026-05-02");
    const submitted = createDeliverable("submitted", "Submitted", "Submitted", "2026-05-01");

    const getRenderedRowIds = () =>
      screen
        .getAllByTestId(/^select-row-/)
        .map((checkbox) => checkbox.getAttribute("data-testid")?.replace("select-row-", ""));

    const { rerender } = render(
      <DeliverableTable deliverables={[submitted, pastDue, upcoming]} viewMode="demos-cms-user" />
    );

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    expect(getRenderedRowIds()).toEqual(["past-due", "upcoming", "submitted"]);

    rerender(
      <DeliverableTable deliverables={[upcoming, submitted, pastDue]} viewMode="demos-cms-user" />
    );

    expect(getRenderedRowIds()).toEqual(["past-due", "upcoming", "submitted"]);
  });
});
