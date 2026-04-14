import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { DemonstrationDeliverableTable } from "./DemonstrationDeliverableTable";
import type { GenericDeliverableTableRow } from "pages/DeliverablesPage";

const baseDeliverable: Omit<GenericDeliverableTableRow, "id" | "name" | "dueDate" | "status"> = {
  demonstration: {
    id: "demo-1",
    name: "Demo 1",
    state: { id: "NY" },
  },
  deliverableType: "Monitoring Protocol",
  cmsOwner: {
    id: "cms-a",
    person: {
      id: "cms-a",
      fullName: "CMS A",
    },
  },
  dueDateType: "Normal",
  expectedToBeSubmitted: true,
  cmsDocuments: [],
  stateDocuments: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("DemonstrationDeliverableTable", () => {
  it("applies default deliverable ordering on first render", () => {
    render(
      <DemonstrationDeliverableTable
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
});
