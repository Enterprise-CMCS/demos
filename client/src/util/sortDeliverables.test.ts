import { describe, expect, it } from "vitest";

import { sortDeliverablesByDefault } from "./sortDeliverables";

describe("sortDeliverablesByDefault", () => {
  it("sorts extension-requested rows to the top, then sorts by status and due date", () => {
    const sorted = sortDeliverablesByDefault([
      {
        id: "under-review",
        status: "Under CMS Review",
        dueDate: "2026-05-05",
        extensionRequested: false,
      },
      {
        id: "ext-late",
        status: "Received and Filed",
        dueDate: "2026-05-10",
        extensionRequested: true,
      },
      {
        id: "submitted",
        status: "Submitted",
        dueDate: "2026-05-03",
        extensionRequested: false,
      },
      {
        id: "ext-early",
        status: "Approved",
        dueDate: "2026-05-01",
        extensionRequested: true,
      },
      {
        id: "upcoming",
        status: "Upcoming",
        dueDate: "2026-05-02",
        extensionRequested: false,
      },
      {
        id: "past-due",
        status: "Past Due",
        dueDate: "2026-05-04",
        extensionRequested: false,
      },
    ]);

    expect(sorted.map((row) => row.id)).toEqual([
      "ext-early",
      "ext-late",
      "past-due",
      "upcoming",
      "submitted",
      "under-review",
    ]);
  });
});
