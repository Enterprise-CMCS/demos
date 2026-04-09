import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { DemonstrationDeliverableTable } from "./DemonstrationDeliverableTable";

describe("DemonstrationDeliverableTable", () => {
  it("applies default deliverable ordering on first render", () => {
    render(
      <DemonstrationDeliverableTable
        deliverables={[
          {
            id: "submitted-1",
            deliverableName: "Submitted Item",
            demonstrationName: "Demo 1",
            deliverableType: "Monitoring Protocol",
            cmsOwner: "CMS A",
            dueDate: "2026-06-01",
            status: "Submitted",
            extensionRequested: false,
            state: { id: "NY" },
          },
          {
            id: "extension-later",
            deliverableName: "Extension Later",
            demonstrationName: "Demo 1",
            deliverableType: "Monitoring Protocol",
            cmsOwner: "CMS A",
            dueDate: "2026-05-10",
            status: "Upcoming",
            extensionRequested: true,
            state: { id: "NY" },
          },
          {
            id: "past-due-1",
            deliverableName: "Past Due Item",
            demonstrationName: "Demo 1",
            deliverableType: "Monitoring Protocol",
            cmsOwner: "CMS A",
            dueDate: "2026-05-01",
            status: "Past Due",
            extensionRequested: false,
            state: { id: "NY" },
          },
          {
            id: "extension-earlier",
            deliverableName: "Extension Earlier",
            demonstrationName: "Demo 1",
            deliverableType: "Monitoring Protocol",
            cmsOwner: "CMS A",
            dueDate: "2026-04-20",
            status: "Approved",
            extensionRequested: true,
            state: { id: "NY" },
          },
          {
            id: "upcoming-1",
            deliverableName: "Upcoming Item",
            demonstrationName: "Demo 1",
            deliverableType: "Monitoring Protocol",
            cmsOwner: "CMS A",
            dueDate: "2026-05-15",
            status: "Upcoming",
            extensionRequested: false,
            state: { id: "NY" },
          },
        ]}
      />
    );

    const rows = screen.getAllByRole("row").slice(1);
    const orderedNames = rows.map((row) => within(row).getAllByRole("cell")[1].textContent);

    expect(orderedNames).toEqual([
      "Extension Earlier",
      "Extension Later",
      "Past Due Item",
      "Upcoming Item",
      "Submitted Item",
    ]);
  });
});
