import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationDeliverableTable } from "./DemonstrationDeliverableTable";
import type { DeliverableTableRow } from "./DeliverableTable";

const showEditDeliverableDialog = vi.fn();
const showRemoveDeliverableDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({ showEditDeliverableDialog, showRemoveDeliverableDialog }),
}));

const baseDeliverable: Omit<DeliverableTableRow, "id" | "name" | "dueDate" | "status"> = {
  demonstration: {
    id: "demo-1",
    name: "Demo 1",
    state: { id: "NY" },
    demonstrationTypes: [],
  },
  deliverableType: "Monitoring Protocol",
  cmsOwner: {
    id: "cms-a",
    person: {
      id: "cms-a",
      fullName: "CMS A",
    },
  },
  demonstrationTypes: [],
  extensionRequests: [],
  deliverableActions: [],
};

describe("DemonstrationDeliverableTable", () => {
  beforeEach(() => {
    showEditDeliverableDialog.mockClear();
    showRemoveDeliverableDialog.mockClear();
  });

  it("applies default deliverable ordering on first render", () => {
    render(
      <DemonstrationDeliverableTable
        viewMode="demos-state-user"
        deliverables={[
          {
            id: "submitted-1",
            name: "Submitted Item",
            dueDate: new Date("2026-06-01"),
            status: "Submitted",
            ...baseDeliverable,
          },
          {
            id: "extension-later",
            name: "Extension Later",
            dueDate: new Date("2026-05-10"),
            status: "Upcoming",
            ...baseDeliverable,
          },
          {
            id: "past-due-1",
            name: "Past Due Item",
            dueDate: new Date("2026-05-01"),
            status: "Past Due",
            ...baseDeliverable,
          },
          {
            id: "extension-earlier",
            name: "Extension Earlier",
            dueDate: new Date("2026-04-20"),
            status: "Approved",
            ...baseDeliverable,
          },
          {
            id: "upcoming-1",
            name: "Upcoming Item",
            dueDate: new Date("2026-05-15"),
            status: "Upcoming",
            ...baseDeliverable,
          },
        ]}
      />
    );

    const rows = screen.getAllByRole("row").slice(1);
    const orderedNames = rows.map((row) => within(row).getAllByRole("cell")[1].textContent);

    expect(orderedNames).toEqual([
      "Past Due Item",
      "Extension Later",
      "Upcoming Item",
      "Submitted Item",
      "Extension Earlier",
    ]);
  });

  it("shows demo detail columns for non-state users", () => {
    render(
      <DemonstrationDeliverableTable
        viewMode="demos-cms-user"
        deliverables={[
          {
            id: "row-1",
            name: "Item",
            dueDate: new Date("2026-01-01"),
            status: "Upcoming",
            ...baseDeliverable,
          },
        ]}
      />
    );

    expect(
      screen.queryByRole("columnheader", { name: /State\/Territory/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: /Demonstration Name/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Type/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Deliverable Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /CMS Owner/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Due Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Submission Date/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Status/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /View/i })).toBeInTheDocument();

    const filterByColumn = screen.getByTestId("filter-by-column") as HTMLSelectElement;
    const optionLabels = Array.from(filterByColumn.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Select a Column...",
      "Deliverable Type",
      "Deliverable Name",
      "CMS Owner",
      "Due Date",
      "Submission Date",
      "Status",
    ]);
  });

  it("renders the latest submitted deliverable action timestamp as submission date", () => {
    render(
      <DemonstrationDeliverableTable
        viewMode="demos-cms-user"
        deliverables={[
          {
            id: "submitted-row",
            name: "Submitted Item",
            dueDate: new Date("2026-01-01"),
            status: "Submitted",
            ...baseDeliverable,
            deliverableActions: [
              {
                id: "older-submission",
                actionType: "Submitted Deliverable",
                actionTimestamp: new Date("2026-03-20T10:00:00Z"),
              },
              {
                id: "newer-submission",
                actionType: "Submitted Deliverable",
                actionTimestamp: new Date("2026-04-01T10:00:00Z"),
              },
            ],
          },
        ]}
      />
    );

    expect(screen.getByText("04/01/2026")).toBeInTheDocument();
  });

  it("shows row selection and action buttons for non-state users", async () => {
    const user = userEvent.setup();
    const deliverable = {
      id: "row-action",
      name: "Editable Item",
      dueDate: new Date("2026-01-01"),
      status: "Upcoming" as const,
      combinedStatus: "Upcoming",
      combinedStatusFilter: "Upcoming",
      ...baseDeliverable,
    };

    render(
      <DemonstrationDeliverableTable viewMode="demos-cms-user" deliverables={[deliverable]} />
    );

    expect(screen.getByTestId("select-all-rows")).toBeInTheDocument();
    await user.click(screen.getByTestId("select-row-row-action"));

    expect(screen.getByLabelText(/Edit Deliverable/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Remove Deliverable/i)).not.toBeDisabled();

    await user.click(screen.getByLabelText(/Edit Deliverable/i));
    expect(showEditDeliverableDialog).toHaveBeenCalledWith(deliverable, expect.any(Function));
  });

  it("deselects all rows after editing a deliverable", async () => {
    const user = userEvent.setup();
    const deliverable = {
      id: "row-action",
      name: "Editable Item",
      dueDate: new Date("2026-01-01"),
      status: "Upcoming" as const,
      combinedStatus: "Upcoming",
      combinedStatusFilter: "Upcoming",
      ...baseDeliverable,
    };

    render(
      <DemonstrationDeliverableTable viewMode="demos-cms-user" deliverables={[deliverable]} />
    );

    await user.click(screen.getByTestId("select-row-row-action"));
    expect(screen.getByTestId("select-row-row-action")).toBeChecked();

    await user.click(screen.getByLabelText(/Edit Deliverable/i));
    const onSubmit = showEditDeliverableDialog.mock.calls[0][1];
    onSubmit();

    await waitFor(() => {
      expect(screen.getByTestId("select-row-row-action")).not.toBeChecked();
    });
  });

  it("uses multiselect filter inputs for configured categorical fields", async () => {
    const user = userEvent.setup();

    render(
      <DemonstrationDeliverableTable
        viewMode="demos-cms-user"
        deliverables={[
          {
            id: "row-3",
            name: "Item",
            dueDate: new Date("2026-01-01"),
            status: "Upcoming",
            ...baseDeliverable,
          },
        ]}
      />
    );

    const columnSelect = screen.getByTestId("filter-by-column");

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

  it("hides scoped and CMS-only controls for state users", () => {
    render(
      <DemonstrationDeliverableTable
        viewMode="demos-state-user"
        deliverables={[
          {
            id: "row-2",
            name: "Item",
            dueDate: new Date("2026-01-01"),
            status: "Upcoming",
            ...baseDeliverable,
          },
        ]}
      />
    );

    expect(
      screen.queryByRole("columnheader", { name: /State\/Territory/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: /Demonstration Name/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("select-all-rows")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Edit Deliverable/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Remove Deliverable/i)).not.toBeInTheDocument();

    const filterByColumn = screen.getByTestId("filter-by-column") as HTMLSelectElement;
    const optionLabels = Array.from(filterByColumn.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Select a Column...",
      "Deliverable Type",
      "Deliverable Name",
      "Due Date",
      "Submission Date",
      "Status",
    ]);
  });

  it("reapplies default sort order when deliverables are reloaded", () => {
    const pastDue = {
      id: "past-due-2",
      name: "Past Due",
      dueDate: new Date("2026-05-03"),
      status: "Past Due" as const,
      ...baseDeliverable,
    };
    const upcoming = {
      id: "upcoming-2",
      name: "Upcoming",
      dueDate: new Date("2026-05-02"),
      status: "Upcoming" as const,
      ...baseDeliverable,
    };
    const submitted = {
      id: "submitted-2",
      name: "Submitted",
      dueDate: new Date("2026-05-01"),
      status: "Submitted" as const,
      ...baseDeliverable,
    };

    const getOrderedNames = () =>
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[1].textContent);

    const { rerender } = render(
      <DemonstrationDeliverableTable
        viewMode="demos-state-user"
        deliverables={[submitted, pastDue, upcoming]}
      />
    );

    expect(getOrderedNames()).toEqual(["Past Due", "Upcoming", "Submitted"]);

    rerender(
      <DemonstrationDeliverableTable
        viewMode="demos-state-user"
        deliverables={[upcoming, submitted, pastDue]}
      />
    );

    expect(getOrderedNames()).toEqual(["Past Due", "Upcoming", "Submitted"]);
  });
});
