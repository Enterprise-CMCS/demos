import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DemonstrationDeliverableTable } from "./DemonstrationDeliverableTable";
import type { DeliverableTableRow } from "./DeliverableTable";

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
};

describe("DemonstrationDeliverableTable", () => {
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
    const orderedNames = rows.map((row) => within(row).getAllByRole("cell")[2].textContent);

    expect(orderedNames).toEqual([
      "Past Due Item",
      "Extension Later",
      "Upcoming Item",
      "Submitted Item",
      "Extension Earlier",
    ]);
  });

  it("shows state and CMS owner columns for non-state users", () => {
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

    expect(screen.getByRole("columnheader", { name: /State\/Territory/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /CMS Owner/i })).toBeInTheDocument();

    const filterByColumn = screen.getByTestId("filter-by-column") as HTMLSelectElement;
    const optionLabels = Array.from(filterByColumn.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Select a Column...",
      "State/Territory",
      "Demonstration Name",
      "Deliverable Type",
      "Deliverable Name",
      "CMS Owner",
      "Due Date",
      "Status",
    ]);
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

  it("hides state and CMS owner columns for state users", () => {
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

    expect(screen.queryByRole("columnheader", { name: /State\/Territory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /CMS Owner/i })).not.toBeInTheDocument();

    const filterByColumn = screen.getByTestId("filter-by-column") as HTMLSelectElement;
    const optionLabels = Array.from(filterByColumn.options).map((option) => option.text);

    expect(optionLabels).toEqual([
      "Select a Column...",
      "Demonstration Name",
      "Deliverable Type",
      "Deliverable Name",
      "Due Date",
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
        .map((row) => within(row).getAllByRole("cell")[2].textContent);

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
